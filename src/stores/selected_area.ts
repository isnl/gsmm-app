import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSelectedAreaStore = defineStore('selectedArea', () => {
  // 当前选中的区域ID
  const selectedAreaId = ref<string | number | null>(null);

  // 设置选中的区域ID
  const setSelectedAreaId = (areaId: string | number | null) => {
    selectedAreaId.value = areaId;
  };

  // 清除选中的区域ID
  const clearSelectedAreaId = () => {
    selectedAreaId.value = null;
  };

  return {
    selectedAreaId,
    setSelectedAreaId,
    clearSelectedAreaId,
  };
});
