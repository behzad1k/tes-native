import { apiClient } from '@/src/services/api/apiClient';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ReduxStorage, ImageStorage, TokenStorage } from '../persistence';
import { Sign, SignImage } from '@/src/types/models';
import { SYNC_STATUS } from '@/src/constants/global';

interface SignState {
  signs: Sign[];
  backendImages: Record<string, string>; // imageId -> url
  isLoading: boolean;
  lastFetched: number | null;
}

const initialState: SignState = {
  signs: [],
  backendImages: {},
  isLoading: false,
  lastFetched: null,
};

// Auto-save helper
const saveSignsToStorage = async (state: SignState) => {
  await ReduxStorage.saveState('signs_data', {
    signs: state.signs,
    backendImages: state.backendImages,
    lastFetched: state.lastFetched,
  });
};

// Fetch signs from backend when online
export const fetchSigns = createAsyncThunk(
  'signs/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const token = await TokenStorage.getToken();
      if (!token) return rejectWithValue('No token');

      const response = await apiClient.get('/signs', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const signs: Sign[] = response.data.map((sign: any) => ({
        ...sign,
        isNew: false,
        status: SYNC_STATUS.SYNCED,
        images: sign.images.map((img: any) => ({
          ...img,
          isNew: false,
          status: SYNC_STATUS.SYNCED,
        })),
      }));

      // Extract backend images
      const backendImages: Record<string, string> = {};
      signs.forEach(sign => {
        sign.images.forEach(img => {
          if (img.imageId) {
            backendImages[img.imageId] = img.uri;
          }
        });
      });

      return { signs, backendImages };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const signsSlice = createSlice({
  name: 'signs',
  initialState,
  reducers: {
    // CREATE - Add new sign (offline)
    addSign: (state, action: PayloadAction<Omit<Sign, 'id' | 'status' | 'isNew' | 'images'>>) => {
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newSign: Sign = {
        ...action.payload,
        id: localId,
        localId,
        isNew: true,
        status: SYNC_STATUS.NOT_SYNCED,
        images: [],
      };

      state.signs.push(newSign);
      saveSignsToStorage(state);
    },

    // UPDATE - Modify existing sign
    updateSign: (state, action: PayloadAction<{
      id: string;
      updates: Partial<Sign>;
      isNewImage?: boolean;
    }>) => {
      const { id, updates, isNewImage } = action.payload;
      const signIndex = state.signs.findIndex(s => s.id === id);

      if (signIndex !== -1) {
        const sign = state.signs[signIndex];

        // If sign was synced before, mark as not synced
        const status = sign.status === SYNC_STATUS.SYNCED &&
        (isNewImage || Object.keys(updates).length > 0)
          ? SYNC_STATUS.NOT_SYNCED
          : sign.status;

        state.signs[signIndex] = {
          ...sign,
          ...updates,
          status,
        };

        saveSignsToStorage(state);
      }
    },

    // Add image to sign
    addImageToSign: (state, action: PayloadAction<{
      signId: string;
      imageUri: string;
      isNew: boolean;
    }>) => {
      const { signId, imageUri, isNew } = action.payload;
      const signIndex = state.signs.findIndex(s => s.id === signId);

      if (signIndex !== -1) {
        const sign = state.signs[signIndex];
        const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const newImage: SignImage = {
          uri: imageUri,
          signId,
          isNew,
          status: SYNC_STATUS.NOT_SYNCED,
          imageId: isNew ? undefined : imageId,
        };

        // Save image locally if it's new
        if (isNew) {
          ImageStorage.saveImage(imageUri, signId, imageId).then(localPath => {
            newImage.localPath = localPath;
          });
        }

        sign.images.push(newImage);

        // Mark sign as not synced
        sign.status = SYNC_STATUS.NOT_SYNCED;

        saveSignsToStorage(state);
      }
    },

    // Remove image
    removeImage: (state, action: PayloadAction<{ signId: string; imageId: string }>) => {
      const { signId, imageId } = action.payload;
      const signIndex = state.signs.findIndex(s => s.id === signId);

      if (signIndex !== -1) {
        const sign = state.signs[signIndex];
        const imageIndex = sign.images.findIndex(img =>
          img.imageId === imageId || img.uri.includes(imageId)
        );

        if (imageIndex !== -1) {
          sign.images.splice(imageIndex, 1);
          sign.status = SYNC_STATUS.NOT_SYNCED;
          saveSignsToStorage(state);
        }
      }
    },

    // DELETE - Mark for deletion (soft delete)
    markSignForDeletion: (state, action: PayloadAction<string>) => {
      const signIndex = state.signs.findIndex(s => s.id === action.payload);

      if (signIndex !== -1) {
        const sign = state.signs[signIndex];

        if (sign.status === SYNC_STATUS.SYNCED) {
          // Mark for server deletion
          sign.status = SYNC_STATUS.NOT_SYNCED;
          sign.isNew = false; // It's not new, but needs deletion sync
        } else {
          // Remove locally if not yet synced
          state.signs.splice(signIndex, 1);
        }

        saveSignsToStorage(state);
      }
    },

    // Load saved signs from storage
    loadSavedSigns: (state, action: PayloadAction<{
      signs: Sign[];
      backendImages: Record<string, string>;
      lastFetched: number | null;
    }>) => {
      state.signs = action.payload.signs;
      state.backendImages = action.payload.backendImages;
      state.lastFetched = action.payload.lastFetched;
    },

    // Update after sync
    updateAfterSync: (state, action: PayloadAction<{
      localId: string;
      serverId: string;
      imageUpdates: Array<{ localImageId: string; serverImageId: string }>;
    }>) => {
      const { localId, serverId, imageUpdates } = action.payload;
      const signIndex = state.signs.findIndex(s => s.localId === localId);

      if (signIndex !== -1) {
        const sign = state.signs[signIndex];

        // Update sign ID
        sign.id = serverId;
        sign.serverId = serverId;
        delete sign.localId;
        sign.status = SYNC_STATUS.SYNCED;
        sign.isNew = false;

        // Update image IDs
        sign.images.forEach((img, idx) => {
          const update = imageUpdates.find(u =>
            img.uri.includes(u.localImageId) || img.localPath?.includes(u.localImageId)
          );
          if (update) {
            img.imageId = update.serverImageId;
            img.status = SYNC_STATUS.SYNCED;
            img.isNew = false;

            // Update backend images cache
            if (img.uri.startsWith('http')) {
              state.backendImages[update.serverImageId] = img.uri;
            }
          }
        });

        saveSignsToStorage(state);
      }
    },
  },
  extraReducers: (builder) => {
    builder
    .addCase(fetchSigns.pending, (state) => {
      state.isLoading = true;
    })
    .addCase(fetchSigns.fulfilled, (state, action) => {
      state.signs = action.payload.signs;
      state.backendImages = action.payload.backendImages;
      state.lastFetched = Date.now();
      state.isLoading = false;
      saveSignsToStorage(state);
    })
    .addCase(fetchSigns.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export const {
  addSign,
  updateSign,
  addImageToSign,
  removeImage,
  markSignForDeletion,
  loadSavedSigns,
  updateAfterSync,
} = signsSlice.actions;

export default signsSlice.reducer;