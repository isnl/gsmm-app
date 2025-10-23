import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UniStorage } from './storage';

export const useGermplasmStore = defineStore(
  'germplasm',
  () => {
    // 统一的上次输入数据对象
    const lastInputs = ref<Record<string, string>>({
      // 种质资源采集相关的快速应用数据
      collectTeam: '',
      collectPersonnel: '',
      // GermplasmResources 组件字段
      hasPestsDiseases: '',
      phenotypeDescription: '',
      // germplasm_resources_create 组件字段
      germplasmType: '',
      collectPart: '',
      collectMethod: '',
      collectQuantity: '',
      collectUnitType: '', // 采集单位类型
      sampleQualityAssessment: '',
      collectMaturity: '',
      pestDiseaseSituation: '',
      preliminaryTreatment: '',
      containerPackaging: '',
    });

    // 批量设置上次输入值的方法
    const setLastInputs = (newInputs: Record<string, string>) => {
      lastInputs.value = {
        ...lastInputs.value,
        ...newInputs,
      };
    };

    return {
      // 统一的上次输入数据管理
      lastInputs,
      setLastInputs,
    };
  },
  {
    persist: {
      storage: UniStorage,
      key: 'tree_germplasm',
    },
  },
);
