import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateSign } from '@/src/modules/signs/hooks/useCreateSign';
import { signOfflineService } from '@/src/modules/signs/services/SignOfflineService';
import { mockSignData, mockUser } from '@/tests/utils/mock-data';
import React from 'react';

jest.mock('@/src/modules/signs/services/SignOfflineService');
jest.mock('@/src/store/auth', () => ({
  useAuthStore: jest.fn(() => ({ user: mockUser })),
}));
jest.mock('@/src/store/sync', () => ({
  useSyncStore: jest.fn(() => ({ isOnline: true })),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: any) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useCreateSign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create sign successfully', async () => {
    const mockSign = { id: 'sign-123', status: 'pending', ...mockSignData };
    (signOfflineService.createSign as jest.Mock).mockResolvedValue(mockSign);

    const { result } = renderHook(() => useCreateSign(), { wrapper });

    result.current.mutate(mockSignData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(signOfflineService.createSign).toHaveBeenCalledWith(
      mockSignData,
      mockUser.id
    );
  });

  it('should handle errors', async () => {
    (signOfflineService.createSign as jest.Mock).mockRejectedValue(
      new Error('Failed to create')
    );

    const { result } = renderHook(() => useCreateSign(), { wrapper });

    result.current.mutate(mockSignData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
