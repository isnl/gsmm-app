// 成果展示数据 stores
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { UniStorage } from './storage';
import type { Survey } from './survey_list';

interface ResultFilesInfo {
  number: number;
  size: number;
}

export const useSyncResultStore = defineStore(
  'sync_result',
  () => {
    const syncResultFileInfo = ref<ResultFilesInfo>();
    const setSyncResultFileInfo = (info: ResultFilesInfo) => {
      syncResultFileInfo.value = info;
    };

    const syncResultList = ref<Survey[]>([]);

    const addSyncResult = (r: Survey) => {
      syncResultList.value.push(r);
    };

    const clearSyncResult = () => {
      syncResultList.value = [];
    };

    const getResultSurveyDataById = (id: string) => {
      return syncResultList.value.find(item => item.id === id);
    };

    return {
      syncResultList,
      syncResultFileInfo,
      addSyncResult,
      clearSyncResult,
      setSyncResultFileInfo,
      getResultSurveyDataById,
    };
  },
  {
    persist: {
      storage: UniStorage,
      key: 'tree_sync_result',
    },
  },
);
