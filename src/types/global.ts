import { SYNC_STATUS } from '@/src/constants/global';

export type SyncStatus = typeof SYNC_STATUS[keyof typeof SYNC_STATUS];
