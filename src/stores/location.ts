import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UniStorage } from './storage';

// 定位方式枚举
export enum LocationMode {
  AMAP_ONLINE = 'amap_online', // 高德在线定位
  SYSTEM = 'system', // 系统定位
  OFFLINE = 'offline' // 离线定位
}

export const useLocationStore = defineStore(
  'location',
  () => {
    // 当前选择的定位方式，默认为高德在线定位
    const currentLocationMode = ref<LocationMode>(LocationMode.AMAP_ONLINE);

    // 设置定位方式
    const setLocationMode = (mode: LocationMode) => {
      currentLocationMode.value = mode;
    };

    // 获取定位方式显示名称
    const getLocationModeName = (mode: LocationMode): string => {
      switch (mode) {
        case LocationMode.AMAP_ONLINE:
          return '高德在线定位';
        case LocationMode.SYSTEM:
          return '系统定位';
        case LocationMode.OFFLINE:
          return '离线定位';
        default:
          return '未知定位方式';
      }
    };

    // 获取当前定位方式显示名称
    const getCurrentLocationModeName = (): string => {
      return getLocationModeName(currentLocationMode.value);
    };

    return {
      currentLocationMode,
      setLocationMode,
      getLocationModeName,
      getCurrentLocationModeName,
      LocationMode
    };
  },
  {
    persist: {
      storage: UniStorage,
      key: 'tree_location_settings',
    },
  },
);
