import { computed, type Ref } from 'vue';
import { useGlobalStore } from '@/stores/global';
import { storeToRefs } from 'pinia';
import type { SurveyCreateFormData } from '@/types';
import type { OptionItem, TreeSpeciesItem, MEASUREMENT_TYPES } from './types';

/**
 * 自动关联相关逻辑
 * @param formData 表单数据的响应式引用
 */
export function useAutoRelation(formData: Ref<SurveyCreateFormData>) {
  const globalStore = useGlobalStore();
  const { commonPlantsInfo, familyGenusSpecies } = storeToRefs(globalStore);
  /**
   * 根据树种名称自动填充相关字段
   * @param treeSpeciesName 树种名称
   */
  const autoFillTreeSpeciesData = (treeSpeciesName: string): void => {
    if (!treeSpeciesList.value || !treeSpeciesName) return;

    const matchedItem = treeSpeciesList.value.find((item: TreeSpeciesItem) => item.treeSpecies === treeSpeciesName);

    if (!matchedItem) return;

    // 批量更新表单数据，减少响应式更新次数
    Object.assign(formData.value, {
      commonName: matchedItem.commonName || '',
      family: matchedItem.family || '',
      genus: matchedItem.genus || '',
      isRareSpecies: matchedItem.isRareSpeciesValue || (matchedItem.isRareSpecies ? 'true' : 'false'),
      latinName: matchedItem.latinName || '',
      protectionType: matchedItem.protectionType || '',
      remarks: matchedItem.remarks || '',
    });

    // 开发环境下的调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log('自动填充树种数据:', {
        treeSpecies: treeSpeciesName,
        ...matchedItem,
      });
    }
  };
  /**
   * 树种类型变化处理
   * @param value 选中的树种类型值
   */
  const onTypeChange = (value: string): void => {
    // 批量清空相关字段
    Object.assign(formData.value, {
      type: value,
      treeSpecies: '',
      commonName: '',
      latinName: '',
      family: '',
      genus: '',
      protectionType: '',
      isRareSpecies: '',
      remarks: '',
    });
  };
  /**
   * 树种名称预选项列表
   */
  const treeSpeciesList = computed((): TreeSpeciesItem[] => {
    if (!formData.value.type) return [];

    const matchedType = commonPlantsInfo.value.find(item => item.type === formData.value.type);
    return matchedType?.children || [];
  });

  /**
   * 树种名称选项（用于下拉选择）
   */
  const treeSpeciesOptions = computed((): OptionItem[] => {
    return (
      treeSpeciesList.value?.map(item => ({
        key: item.treeSpecies,
        text: item.treeSpecies,
        value: item.treeSpecies,
      })) || []
    );
  });
  /**
   * 是否具备移植条件变化处理
   * @param value 移植条件值 ('true' | 'false')
   */
  const onTransplantConditionChange = (value: string): void => {
    formData.value.isTransplant = value;
    // 根据移植条件自动设置不可移植原因
    formData.value.notTransplant = value === 'true' ? '无' : '';
  };

  /**
   * 测量维度变化处理
   * @param value 测量维度类型
   */
  const onMeasurementDimensionTypeChange = (value: string): void => {
    formData.value.measurementDimensionType = value;

    // 重置测量信息和规格
    formData.value.measurementInfo = {
      chestDiameter: '',
      groundDiameter: '',
      distributionDiameter: '',
      branchCount: '',
      farthestDiameter: '',
    };
    formData.value.specs = '';
  };

  /**
   * 计算规格（根据测量维度和测量信息）
   */
  const calculateSpecs = (): void => {
    const { measurementDimensionType, measurementInfo } = formData.value;

    if (!measurementDimensionType || !measurementInfo) {
      formData.value.specs = '';
      return;
    }

    let result = 0;
    const MULTIPLIER = 6; // 计算系数

    switch (measurementDimensionType) {
      case '胸径':
        if (measurementInfo.chestDiameter) {
          result = Math.round(Number(measurementInfo.chestDiameter) * MULTIPLIER);
        }
        break;
      case '地径':
        if (measurementInfo.groundDiameter) {
          result = Math.round(Number(measurementInfo.groundDiameter) * MULTIPLIER);
        }
        break;
      case '丛生':
        if (measurementInfo.distributionDiameter && measurementInfo.farthestDiameter) {
          result = Math.round(Number(measurementInfo.distributionDiameter) + Number(measurementInfo.farthestDiameter) * MULTIPLIER);
        }
        break;
    }

    formData.value.specs = result > 0 ? result.toString() : '';
  };

  /**
   * 测量信息变化处理
   */
  const onMeasurementInfoChange = (): void => {
    calculateSpecs();
  };

  /**
   * 获取科的选项列表
   */
  const getFamilyOptions = (): OptionItem[] => {
    return familyGenusSpecies.value.map(item => ({
      text: item.name,
      value: item.name,
      key: item.name,
      id: item.id,
    }));
  };

  /**
   * 获取属的选项列表
   * @param familyName 科名称
   */
  const getGenusOptions = (familyName: string): OptionItem[] => {
    const family = familyGenusSpecies.value.find(item => item.name === familyName);
    if (!family?.children) return [];

    return family.children.map(item => ({
      text: item.name,
      value: item.name,
      key: item.name,
      id: item.id,
    }));
  };

  /**
   * 获取种的选项列表
   * @param familyName 科名称
   * @param genusName 属名称
   */
  const getSpeciesOptions = (familyName: string, genusName: string): OptionItem[] => {
    const family = familyGenusSpecies.value.find(item => item.name === familyName);
    if (!family?.children) return [];

    const genus = family.children.find(item => item.name === genusName);
    if (!genus?.children) return [];

    return genus.children.map(item => ({
      text: item.name,
      value: item.name,
      key: item.name,
      id: item.id,
    }));
  };

  return {
    autoFillTreeSpeciesData,
    onTypeChange,
    onTransplantConditionChange,
    treeSpeciesList,
    treeSpeciesOptions,
    onMeasurementDimensionTypeChange,
    calculateSpecs,
    onMeasurementInfoChange,
    getFamilyOptions,
    getGenusOptions,
    getSpeciesOptions,
  };
}
