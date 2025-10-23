import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UniStorage } from './storage';

// 图层数据类型定义
export interface LayerItem {
  id: number;
  name: string;
  path: string;
  crs: number;
  geomType: string | null;
  createdAt: string;
  projectId: number;
  state: number;
  size: number;
  isPublish: number;
  description: string | null;
  dictionaryId: number | null;
  publishNum: number;
  progress: number;
  isActive?: boolean; // 是否激活
  isLoading?: boolean; // 是否加载中
  featureData?: any; // 要素数据
}

export const useLayerStore = defineStore('layer', () => {
  // 图层列表
  const layerList = ref<LayerItem[]>([]);

  // 设置图层列表
  const setLayerList = (list: LayerItem[]) => {
    layerList.value = list.map(item => ({
      ...item,
      isActive: false,
      isLoading: false,
    }));
  };

  // 更新图层列表（保留已有的激活状态）
  const updateLayerList = (list: LayerItem[]) => {
    const activeIds = new Set(layerList.value.filter(l => l.isActive).map(l => l.id));

    layerList.value = list.map(item => {
      const existingLayer = layerList.value.find(l => l.id === item.id);
      return {
        ...item,
        isActive: activeIds.has(item.id),
        isLoading: false,
        featureData: existingLayer?.featureData,
      };
    });
  };

  // 切换图层激活状态
  const toggleLayerActive = (id: number, isActive: boolean) => {
    const layer = layerList.value.find(l => l.id === id);
    if (layer) {
      layer.isActive = isActive;
    }
  };

  // 设置图层加载状态
  const setLayerLoading = (id: number, isLoading: boolean) => {
    const layer = layerList.value.find(l => l.id === id);
    if (layer) {
      layer.isLoading = isLoading;
    }
  };

  // 设置图层要素数据
  const setLayerFeatureData = (id: number, data: any) => {
    const layer = layerList.value.find(l => l.id === id);
    if (layer) {
      layer.featureData = data;
    }
  };

  // 获取激活的图层列表
  const getActiveLayers = () => {
    return layerList.value.filter(l => l.isActive);
  };

  // 清空所有图层状态
  const clearAllLayers = () => {
    layerList.value.forEach(layer => {
      layer.isActive = false;
      layer.isLoading = false;
    });
  };

  return {
    layerList,
    setLayerList,
    updateLayerList,
    toggleLayerActive,
    setLayerLoading,
    setLayerFeatureData,
    getActiveLayers,
    clearAllLayers,
  };
});
