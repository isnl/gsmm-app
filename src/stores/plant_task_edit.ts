import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UniStorage } from './storage';
import type { PlantTask } from './plant_task';
// 当前编辑的调查数据store
export const usePlantTaskEditStore = defineStore(
  'plantTask_list_edit',
  () => {
    const currentEditData = ref<PlantTask | null>(null);

    const setCurrentEditData = (data: PlantTask | null) => {
      currentEditData.value = data ? { ...data } : null;
      console.log(currentEditData.value )
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
      key: 'tree_plantTask_list_edit',
    },
  }
);
