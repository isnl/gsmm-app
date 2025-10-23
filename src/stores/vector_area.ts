import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { UniStorage } from './storage';
import { useSurveyTokenStore } from './token';

export interface VectorArea {
  id: string;
  code: string;
  name: string;
  description: string;
  geom: {
    type: string;
    coordinates: number[][][];
  };
  layerGroupName?: string | null;
  cacheStatus: 'loading' | 'loaded' | 'error';
}

// 用于列表展示的轻量级版本（不包含 geom 数据）
export interface VectorAreaListItem {
  id: string;
  code: string;
  name: string;
  description: string;
  geomType?: string; // 只保留几何类型，不保留具体坐标
  layerGroupName?: string | null;
  cacheStatus: 'loading' | 'loaded' | 'error';
}
export interface UserVectorArea {
  accountNumber: string;
  vectorAreas: VectorArea[];
  createdAt: number;
}

export const useVectorAreaStore = defineStore(
  'vectorArea',
  () => {
    // 存储的所有缓存区列表（完整数据，包含 geom）
    const areas = ref<UserVectorArea[]>([]);

    // 当前用户的分区数据（计算属性）
    const currentUserAreas = computed(() => {
      const surveyTokenStore = useSurveyTokenStore();
      const { accountNumber } = surveyTokenStore;
      const userArea = areas.value.find(item => item.accountNumber === accountNumber);
      return userArea?.vectorAreas || [];
    });

    // 用于列表展示的轻量级数据（不包含 geom）
    const lastVectorAreas = computed((): VectorAreaListItem[] => {
      return currentUserAreas.value.map(area => ({
        id: area.id,
        code: area.code,
        name: area.name,
        description: area.description,
        geomType: area.geom?.type,
        layerGroupName: area.layerGroupName,
        cacheStatus: area.cacheStatus,
      }));
    });

    // 最近更新时间
    const lastCreatedAt = computed(() => {
      const surveyTokenStore = useSurveyTokenStore();
      const { accountNumber } = surveyTokenStore;
      const userArea = areas.value.find(item => item.accountNumber === accountNumber);
      return userArea?.createdAt;
    });

    /**
     * 存入分区数据
     * 有当前用户名数据则覆盖，没有则新增
     * @param newAreas
     */
    const setAreas = (newAreas: VectorArea[]) => {
      const surveyTokenStore = useSurveyTokenStore();
      const { accountNumber } = surveyTokenStore;

      const findIndex = areas.value.findIndex(item => item.accountNumber === accountNumber);
      if (findIndex > -1) {
        areas.value[findIndex].vectorAreas = newAreas;
        areas.value[findIndex].createdAt = Date.now();
      } else {
        areas.value.push({
          accountNumber,
          vectorAreas: newAreas,
          createdAt: Date.now(),
        });
      }
    };

    /**
     * 根据 ID 获取完整的分区数据（包含 geom）
     * @param areaId 分区 ID
     */
    const getAreaById = (areaId: string): VectorArea | undefined => {
      return currentUserAreas.value.find(area => area.id === areaId);
    };

    return {
      areas,
      setAreas,
      lastVectorAreas,
      lastCreatedAt,
      currentUserAreas,
      getAreaById,
    };
  },
  {
    persist: {
      storage: UniStorage,
      key: 'tree_vector_area',
    },
  },
);
