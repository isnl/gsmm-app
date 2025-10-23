import { useGlobalStore } from '@/stores/global';

// 随机选择数组中的一个元素
const getRandomItem = (array: any[]) => {
  if (!array || array.length === 0) return '';
  return array[Math.floor(Math.random() * array.length)];
};

// 生成随机外观描述
const generateRandomAppearance = () => {
  const appearances = [
    '种子饱满，表面光滑，颜色均匀，无明显缺陷',
    '果实成熟度良好，外观完整，色泽正常',
    '枝条新鲜，切口平整，无病虫害痕迹',
    '叶片完整，颜色鲜绿，质地厚实',
    '根系发达，主根明显，侧根较多',
    '花粉颗粒饱满，颜色正常，活性良好',
    '标本完整，保存状态良好，特征明显',
    '植株健壮，枝叶茂盛，生长状况良好',
  ];
  return getRandomItem(appearances);
};

// 生成随机备注
const generateRandomRemarks = () => {
  const remarks = [
    '采集时天气晴朗，温度适宜，有利于种质保存',
    '母树生长状况良好，周围环境无污染',
    '采集过程严格按照标准操作程序执行',
    '样品质量优良，符合种质资源保存要求',
    '采集地点GPS定位准确，便于后续追溯',
    '现场拍照记录完整，包含母树全貌和细节',
    '采集工具已消毒，避免交叉污染',
    '样品已按要求进行初步处理和包装',
  ];
  return getRandomItem(remarks);
};

export const randomFill = (formData: any) => {
  const globalStore = useGlobalStore();

  // 获取字典数据
  const germplasmResourceTypeDict = globalStore.getDictListByCode('zzzy_zylx');
  const germplasmCollectionMethodDict = globalStore.getDictListByCode('zzzy_cjfs');
  const germplasmCollectionUnitDict = globalStore.getDictListByCode('zzzy_cjdw');
  const germplasmQualityAssessmentDict = globalStore.getDictListByCode('zzzy_zlpg');
  const germplasmMaturityDict = globalStore.getDictListByCode('zzzy_csd');
  const germplasmPestDiseaseDict = globalStore.getDictListByCode('zzzy_bch');
  const germplasmInitialProcessingDict = globalStore.getDictListByCode('zzzy_cbcl');
  const germplasmPackagingContainerDict = globalStore.getDictListByCode('zzzy_fzrq');

  // 随机填充表单数据
  formData.value = {
    ...formData.value,
    // 种质资源信息部分
    germplasmResourcesCode: `ZZ${new Date().getFullYear()}${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
    germplasmType: getRandomItem(germplasmResourceTypeDict)?.key || '种子/果实',
    collectPart: getRandomItem(['成熟果实', '种子', '当年生枝条', '根系', '叶片', '花朵', '花粉', '整株植物']),
    collectMethod: getRandomItem(germplasmCollectionMethodDict)?.key || '地面拾取',
    collectQuantity: String(Math.floor(Math.random() * 1000) + 10),
    collectUnit: getRandomItem(germplasmCollectionUnitDict)?.key || 'g',
    sampleQualityAssessment: getRandomItem(germplasmQualityAssessmentDict)?.key || '良',
    collectMaturity: getRandomItem(germplasmMaturityDict)?.key || '完熟',
    appearanceDescription: generateRandomAppearance(),
    pestDiseaseSituation: getRandomItem(germplasmPestDiseaseDict)?.key || '无',

    // 现场处理与封装部分
    preliminaryTreatment: getRandomItem(germplasmInitialProcessingDict)?.key || '清洗',
    containerPackaging: getRandomItem(germplasmPackagingContainerDict)?.key || '塑料袋',
    packagingSpecQuantity: getRandomItem(['500g/袋', '1kg/袋', '100粒/袋', '50枝/束', '1株/盆', '200ml/瓶']),
    labelCheckConfirmation: true,

    // 现场影像记录与备注部分
    remarks: generateRandomRemarks(),
  };
};
