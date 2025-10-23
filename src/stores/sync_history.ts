import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UniStorage } from './storage';

export interface SyncHistory {
  id: string;
  createdAt: number;
  type: 'DOWNLOAD' | 'UPLOAD';
  success: boolean;
  uploadType?: 'ANCIENT_TREE' | 'GERMPLASM_RESOURCES'; // 上传类型：古树调查、种质资源调查
}
export const useSyncHistoryStore = defineStore(
  'sync_history',
  () => {
    const syncHistory = ref<SyncHistory[]>([]);

    const addSyncHistory = (data: SyncHistory) => {
      syncHistory.value.push(data);
    };

    return {
      syncHistory,
      addSyncHistory,
    };
  },
  {
    persist: {
      storage: UniStorage,
      key: 'tree_sync_history',
    },
  },
);
