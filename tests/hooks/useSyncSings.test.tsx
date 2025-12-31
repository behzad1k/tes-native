import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSyncSigns } from '@/src/features/signs/hooks/useSyncSigns';
import { signOfflineService } from '@/src/features/signs/services/SignOfflineService';
import { signApiService } from '@/src/features/signs/services/SignApiService';
import React from 'react';

jest.mock('@/src/features/signs/services/SignOfflineService');
jest.mock('@/src/features/signs/services/SignApiService');
jest.mock('@/src/store/sync', () => ({
  useSyncStore: jest.fn(() => ({
    setSyncing: jest.fn(),
    setLastSyncTime: jest.fn(),
    setPendingCount: jest.fn(),
  })),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: any) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useSyncSigns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sync pending signs', async () => {
    const pendingSigns = [
      { id: 'sign-1', signType: 'stop', status: 'pending' },
    ];

    (signOfflineService.getPendingSigns as jest.Mock).mockResolvedValue(
      pendingSigns
    );
    (signApiService.createSign as jest.Mock).mockResolvedValue({
      id: 'server-1',
    });

    const { result } = renderHook(() => useSyncSigns(), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(signOfflineService.markAsSynced).toHaveBeenCalledWith(
      'sign-1',
      'server-1'
    );
  });

  it('should handle sync failures', async () => {
    const pendingSigns = [
      { id: 'sign-1', signType: 'stop', status: 'pending' },
    ];

    (signOfflineService.getPendingSigns as jest.Mock).mockResolvedValue(
      pendingSigns
    );
    (signApiService.createSign as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useSyncSigns(), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(signOfflineService.markAsFailed).toHaveBeenCalledWith('sign-1');
  });
});
