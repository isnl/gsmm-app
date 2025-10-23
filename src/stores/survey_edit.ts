import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UniStorage } from './storage';
import type { Survey } from './survey_list';
// 当前编辑的调查数据store
export const useSurveyEditStore = defineStore(
  'survey_edit',
  () => {
    const currentEditData = ref<Survey | null>(null);

    const setCurrentEditData = (data: Survey | null) => {
      currentEditData.value = data ? { ...data } : null;
    };

    const clearCurrentEditData = () => {
      currentEditData.value = null;
    };

    return {
      currentEditData,
      setCurrentEditData,
      clearCurrentEditData,
    };
  },
  {
    persist: {
      storage: UniStorage,
      key: 'tree_survey_edit',
    },
  }
);
