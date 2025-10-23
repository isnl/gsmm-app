import { useGlobalStore } from '@/stores/global';
import { storeToRefs } from 'pinia';
import type { UseCreateTestParams, MediaItem } from './types';
import { MEASUREMENT_TYPES } from './types';
// 模拟媒体数据（仅用于测试）
const mockMedia = [
  {
    fileType: 'image',
    tempFilePath: '_doc/uniapp_save/17558719047093.jpg',
    size: 3654894,
  },
  {
    height: 2400,
    thumbTempFilePath: '_doc/uniapp_save/17558719090914.jpg',
    fileType: 'video',
    duration: 20.64,
    width: 1080,
    tempFilePath: 'content://media/picker/0/com.android.providers.media.photopicker/media/1000007395',
    byteSize: 33858719,
    size: 33065.156,
  },
  {
    fileType: 'image',
    tempFilePath: '_doc/uniapp_save/17558719131115.jpg',
    size: 2606059,
  },
  {
    fileType: 'image',
    tempFilePath: '_doc/uniapp_save/17558719179536.jpg',
    size: 3682838,
  },
  {
    height: 2400,
    thumbTempFilePath: '_doc/uniapp_save/17558719420118.jpg',
    fileType: 'video',
    duration: 8.75,
    width: 1080,
    tempFilePath: 'content://media/picker/0/com.android.providers.media.photopicker/media/1000007210',
    byteSize: 5162647,
    size: 5041.647,
  },
];

/**
 * 测试数据填充相关逻辑
 * @param params Hook 参数
 */
export function useCreateTest(params: UseCreateTestParams) {
  const { formData, treeSpeciesOptions, onTypeChange, onTreeSpeciesConfirm, calculateSpecs, codeNumberFirst, codeNumberSecond, onCodeNumberChange } = params;
  const globalStore = useGlobalStore();
  const { TREE_TYPES } = storeToRefs(globalStore);
  /**
   * 生成随机整数
   * @param min 最小值
   * @param max 最大值
   */
  const randomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  /**
   * 从数组中随机选择一个元素
   * @param array 数组
   */
  const randomChoice = <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };

  /**
   * 生成随机姓名
   */
  const generateRandomName = (): string => {
    const preNames = ['张', '王', '李', '刘', '田', '景', '天', '房'];
    const sufNames = ['北', '大', '青', '糊涂', '流', '开', '低', '滴滴', '忘', '与', '雨', '鱼', '系', '君', '军', '乐', '凯', '未', '模', '多', '砸', '度'];
    return randomChoice(preNames) + randomChoice(sufNames);
  };

  /**
   * 生成随机团队成员
   */
  const generateRandomTeam = (): string => {
    const memberCount = randomInt(1, 5);
    return Array.from({ length: memberCount }, generateRandomName).join('、');
  };

  /**
   * 生成随机经纬度
   */
  const generateRandomCoordinates = () => {
    const longitude = '93.76' + randomInt(0, 9999).toString().padStart(4, '0');
    const latitude = '29.23' + randomInt(0, 9999).toString().padStart(4, '0');
    return { longitude, latitude };
  };

  /**
   * 随机填充表单数据（仅用于测试）
   */
  const randomFill = (): void => {
    // 1. 基础信息填充
    const randomType = randomChoice(TREE_TYPES.value);
    formData.value.type = randomType.value;
    onTypeChange(randomType.value);

    // 编号填充
    // formData.value.treeCode = randomInt(1, 99999).toString().padStart(5, '0');

    // 挂牌编号填充
    codeNumberFirst.value = randomInt(1, 999).toString();
    codeNumberSecond.value = randomInt(1, 99999).toString();
    onCodeNumberChange();

    // 等待树种选项更新后再选择
    setTimeout(() => {
      if (treeSpeciesOptions.value.length > 0) {
        const randomTreeSpecies = randomChoice(treeSpeciesOptions.value);
        formData.value.treeSpecies = randomTreeSpecies.value;
        onTreeSpeciesConfirm(randomTreeSpecies.value);
      }
    }, 100);

    // 2. 测量数据填充
    formData.value.treeHeight = randomInt(1, 50).toString();
    formData.value.crownWidth = randomInt(1, 100).toString();

    // 测量维度
    const randomMeasurementType = randomChoice([...MEASUREMENT_TYPES]);
    formData.value.measurementDimensionType = randomMeasurementType;

    // 根据测量维度填充对应数据
    switch (randomMeasurementType) {
      case '胸径':
        formData.value.measurementInfo.chestDiameter = randomInt(1, 100).toString();
        break;
      case '地径':
        formData.value.measurementInfo.groundDiameter = randomInt(1, 100).toString();
        break;
      case '丛生':
        formData.value.measurementInfo.distributionDiameter = randomInt(1, 100).toString();
        formData.value.measurementInfo.branchCount = randomInt(1, 100).toString();
        formData.value.measurementInfo.farthestDiameter = randomInt(1, 100).toString();
        break;
    }

    calculateSpecs();

    // 3. 多媒体数据填充
    const generateRandomMedia = () => {
      const imageMedia = mockMedia.filter(item => item.fileType === 'image');
      const videoMedia = mockMedia.filter(item => item.fileType === 'video');

      const imageCount = randomInt(1, 3);
      const videoCount = randomInt(1, 2);

      // 随机选择不重复的图片和视频
      const selectedImages = imageMedia.sort(() => Math.random() - 0.5).slice(0, Math.min(imageCount, imageMedia.length));

      const selectedVideos = videoMedia.sort(() => Math.random() - 0.5).slice(0, Math.min(videoCount, videoMedia.length));

      return [...selectedImages, ...selectedVideos];
    };

    formData.value.multimedia = generateRandomMedia();

    // 4. 位置和环境信息填充
    formData.value.altitude = randomInt(1, 3000).toString();

    const coordinates = generateRandomCoordinates();
    formData.value.location.x = coordinates.longitude;
    formData.value.location.y = coordinates.latitude;

    // 环境相关字段
    formData.value.healthStatus = randomChoice(globalStore.healthStatusDict).value;
    formData.value.growthEnvironment = randomChoice(globalStore.growthEnvironmentDict).value;
    formData.value.slope = randomChoice(globalStore.slopeDict).value;
    formData.value.aspect = randomChoice(globalStore.aspectDict).value;
    formData.value.slopePosition = randomChoice(globalStore.slopePositionDict).value;

    // 5. 移植条件
    const isTransplant = Math.random() > 0.5;
    formData.value.isTransplant = isTransplant ? 'true' : 'false';
    formData.value.notTransplant = isTransplant ? '无' : randomChoice(globalStore.nonPortableReasonDict).value;

    // 6. 团队和基础信息
    formData.value.team = generateRandomTeam();
    formData.value.batch = randomChoice(globalStore.batchDict).value;
    formData.value.town = `${randomChoice(['镇', '乡', '街道'])}${randomInt(1, 100)}`;
    formData.value.village = `${randomChoice(['村', '社区', '居委会'])}${randomInt(1, 100)}`;
    formData.value.siteConditionDesc = `立地条件描述${randomInt(1, 100)}`;

    // 7. 其他详细信息填充
    Object.assign(formData.value, {
      // 保护相关
      protectionMeasureType: randomChoice(globalStore.protectionMeasureTypeDict).value,
      protectionLevel: randomChoice(globalStore.protectionLevelDict).value,
      protectionType: randomChoice(globalStore.protectionTypeDict).value,

      // 基础属性
      estimatedAge: randomInt(1, 1000).toString(),
      ownershipUnit: `权属单位${randomInt(1, 100)}`,
      smallPlaceName: `小地名${randomInt(1, 100)}`,
      isRareSpecies: Math.random() > 0.5 ? 'true' : 'false',

      // 测量数据
      underBranchHeight: randomInt(1, 100).toString(),
      area: randomInt(1, 10000).toString(),
      quantity: randomInt(1, 100).toString(),

      // 方案和类型
      transplantPlan: randomChoice(globalStore.transplantPlanDict).value,
      landType: `地类${randomInt(1, 100)}`,
      soilTexture: `土壤类型${randomInt(1, 100)}`,

      // 保护措施
      relocationProtection: `迁地保护/就地保护技术措施${randomInt(1, 100)}`,
      managementMeasures: `管护措施${randomInt(1, 100)}`,
      relocationPlace: `迁出地${randomInt(1, 100)}`,

      // 项目信息
      projectSchedule: `工程进度安排${randomInt(1, 100)}`,
      laborStatistics: `用工量统计${randomInt(1, 100)}`,
      investmentEstimate: randomInt(1, 1000000).toString(),

      // 其他信息
      historicalAnecdotes: `历史典故/传说${randomInt(1, 100)}`,
      remarks: `备注${randomInt(1, 100)}`,
    });
  };

  return {
    randomFill,
  };
}
