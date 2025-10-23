import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UniStorage } from './storage';

export const usePointLogoStore = defineStore(
  'point_logo',
  () => {
    // 当前选择的标识方式，默认为古树编号
    const currentPointLogoType = ref('treeCode');
    const pointLogoState = ref(true);

    // 设置点位标识方式
    const setPointLogoType = (mode: any) => {
      currentPointLogoType.value = mode;
    };
    const setPointLogoState = (mode: boolean) => {
      pointLogoState.value = mode;
    };

    return {
      currentPointLogoType,
      pointLogoState,
      setPointLogoType,
      setPointLogoState,
    };
  },
  {
    persist: {
      storage: UniStorage,
      key: 'tree_point_logo_settings',
    },
  },
);
