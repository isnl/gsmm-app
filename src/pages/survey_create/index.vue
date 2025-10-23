<script lang="ts" setup>
import { ref, toRaw, computed } from 'vue';
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { useSurveyEditStore } from '@/stores/survey_edit';
import { goBack, checkIsImage, checkIsVideo } from '@/utils';
import { onLoad, onReady } from '@dcloudio/uni-app';
import LocationPickerPopup from '@/components/LocationPickerPopup.vue';
import AspectSelector from '@/components/AspectSelector.vue';
import TagSelectorPopup from '@/components/TagSelectorPopup.vue';
import AccumulatorPopup from '@/components/AccumulatorPopup.vue';
import { useSyncSurveyStore } from '@/stores/sync_survey';
import type { SurveyCreateFormData } from '@/types';
import { useGlobalStore } from '@/stores/global';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';
import { useCreateTest } from './useCreateTest';
import { useAutoRelation } from './useAutoRelation';
const globalStore = useGlobalStore();
const {
  healthStatusDict,
  protectionLevelDict,
  batchDict,
  protectionTypeDict,
  transplantPlanDict,
  growthEnvironmentDict,
  soilTextureDict,
  slopeDict,
  aspectDict,
  slopePositionDict,
  protectionMeasureTypeDict,
  nonPortableReasonDict,
  measurementDimensionTypeDict,
  landformDict,
  lastInputTeamValue,
  lastInputSlope,
  lastInputAspect,
  lastInputSlopePosition,
  lastInputBatchValue,
  lastInputAltitude,
  lastCodeNumberFirstValue,
  commonPlantsInfo,
  familyGenusSpecies,
  TREE_TYPES,
  randomFillStatus,
} = storeToRefs(globalStore);
const { setLastInputValue, setLastCodeNumberFirstValue } = globalStore;

const { statusBarHeight } = useStatusBarHeight();
const surveyEditStore = useSurveyEditStore();
const { clearCurrentEditData } = surveyEditStore;
const { addSyncItemSurvey } = useSyncSurveyStore();

const currentEditId = ref('');
const isSubmitting = ref(false); // 提交loading状态
const serverTreeCode = ref('');

// 挂牌编号分离字段
const codeNumberFirst = ref(''); // 3位数字
const codeNumberSecond = ref(''); // 5位数字

// 土壤类型选择弹窗
const soilTexturePopupRef = ref<any>(null);
const soilTexturePopup = ref(false);

// 地貌选择弹窗
const landformPopupRef = ref<any>(null);
const landformPopup = ref(false);

// 树种名称选择弹窗
const treeSpeciesPopupRef = ref<any>(null);
const treeSpeciesPopup = ref(false);

// 科属种选择弹窗 - 使用一个实例动态切换
const familyGenusSpeciesPopupRef = ref<any>(null);
const familyGenusSpeciesPopup = ref(false);
const currentFGSType = ref<'family' | 'genus' | 'species'>('family'); // 当前选择的类型
const currentFGSTitle = ref('选择科');
const currentFGSOptions = ref<any[]>([]);
const currentFGSPlaceholder = ref('请选择或输入科名称');

// 累加组件相关
const accumulatorPopupRef = ref<any>(null);
const showAccumulatorPopup = ref(false);

// 验证测量信息
const validateMeasurementInfo = (): string | null => {
  const { measurementDimensionType, measurementInfo } = formData.value;

  if (!measurementDimensionType) {
    return null; // 如果没有选择测量维度，跳过验证
  }
  if (!measurementInfo) {
    return '测量信息不能为空';
  }

  if (measurementDimensionType === '胸径') {
    if (!measurementInfo.chestDiameter || measurementInfo.chestDiameter.toString().trim() === '') {
      return '请输入胸径';
    }
  } else if (measurementDimensionType === '地径') {
    if (!measurementInfo.groundDiameter || measurementInfo.groundDiameter.toString().trim() === '') {
      return '请输入地径';
    }
  } else if (measurementDimensionType === '丛生') {
    // 验证分布直径
    if (!measurementInfo.distributionDiameter || measurementInfo.distributionDiameter.toString().trim() === '') {
      return '请输入分布直径';
    }
    // 验证分支数量
    if (!measurementInfo.branchCount || measurementInfo.branchCount.toString().trim() === '') {
      return '请输入分支数量';
    }
    // 验证离中心点最远的树木的胸径/直径
    if (!measurementInfo.farthestDiameter || measurementInfo.farthestDiameter.toString().trim() === '') {
      return '请输入离中心点最远的树木的胸径/直径';
    }
  }

  return null; // 验证通过
};
/**
 * 树种名称选择确认
 */
const onTreeSpeciesConfirm = (value: string) => {
  formData.value.treeSpecies = value;
  // 使用通用的自动填充方法
  autoFillTreeSpeciesData(value);
  onTreeSpeciesClose();
};

onLoad(async (options: any) => {
  const { id, longitude, latitude } = options;
  if (id) {
    currentEditId.value = id;
  }

  // 初始化字典数据
  globalStore.setDefaultDictList();

  // 如果有经纬度参数，设置到表单中
  if (longitude && latitude) {
    formData.value.location = {
      x: longitude,
      y: latitude,
    };
  }

  // 如果有编辑数据，回填表单
  if (surveyEditStore.currentEditData) {
    fillFormData(surveyEditStore.currentEditData);
  } else {
    if (lastCodeNumberFirstValue.value) {
      codeNumberFirst.value = lastCodeNumberFirstValue.value;
    }
  }
});

/**
 * 保存临时图片文件到本地
 */
const saveTempFileToPhone = (tempFilePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    uni.saveFile({
      tempFilePath,
      success: res => {
        resolve(res.savedFilePath);
      },
      fail: err => {
        reject(err);
      },
    });
  });
};
const handlePhotoUpload = () => {
  // 使用uni-app的API选择图片和视频
  // app用chooseMedia h5用chooseImage
  // #ifdef APP-PLUS
  uni.chooseMedia({
    count: 9, // 允许选择多个文件
    mediaType: ['image', 'video'], // 支持图片和视频
    sourceType: ['album', 'camera'], // 从相册选择或使用相机拍照
    maxDuration: 60, // 视频最长60秒
    camera: 'back', // 默认使用后置摄像头
    success: async (res: any) => {
      console.log('选择的初始文件文件', res);
      for (let i = 0; i < res.tempFiles.length; i++) {
        let file = res.tempFiles[i];
        if (file.fileType === 'image') {
          const realFilePath = await saveTempFileToPhone(file.tempFilePath);
          file.tempFilePath = realFilePath;
        } else if (file.fileType === 'video') {
          const realThumFilePath = await saveTempFileToPhone(file.thumbTempFilePath);
          file.thumbTempFilePath = realThumFilePath;
          // 从手机拍摄的视频，才需要存起来
          if (file.tempFilePath.includes('file://')) {
            const realFilePath = await saveTempFileToPhone(file.tempFilePath);
            file.tempFilePath = realFilePath;
          }
        }
      }
      if (res.tempFiles && res.tempFiles.length > 0) {
        formData.value.multimedia = [...formData.value.multimedia, ...res.tempFiles];
      }
      console.log('选择的最终文件文件', formData.value.multimedia);
    },
    fail: err => {
      console.error('选择媒体文件失败', err);
    },
  });
  // #endif
  // #ifdef H5
  uni.chooseImage({
    count: 9, // 允许选择多个文件
    sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图
    success: (res: any) => {
      if (res.tempFiles && res.tempFiles.length > 0) {
        formData.value.multimedia = [...formData.value.multimedia, ...res.tempFiles];
      }
    },
    fail: err => {
      console.error('选择媒体文件失败', err);
    },
  });
  // #endif
};

// 删除已选择的媒体文件
const removePhoto = (index: number) => {
  uni.showModal({
    title: '提示',
    content: '确认删除吗？',
    success: res => {
      if (res.confirm) {
        formData.value.multimedia!.splice(index, 1);
      }
    },
  });
};

// 回填表单数据的方法
const fillFormData = (data: any) => {
  formData.value = {
    // 基本信息
    type: data.type || '',
    treeSpecies: data.treeSpecies || '',
    treeCode: data.treeCode || '',
    codeNumber: data.codeNumber || '',
    commonName: data.commonName || '',
    latinName: data.latinName || '',
    family: data.family || '',
    genus: data.genus || '',
    species: data.species || '',
    estimatedAge: data.estimatedAge || '',
    ownershipUnit: data.ownershipUnit || '',
    batch: data.batch || '', // 添加批次字段
    soilLayerThickness: data.soilLayerThickness || '', // 土层厚度
    landParcelsName: data.landParcelsName || '', // 地块名称

    // 位置信息
    location: {
      x: data.location?.x?.toString() || '',
      y: data.location?.y?.toString() || '',
    },
    areaCode: data.areaCode || '',
    town: data.town || '',
    village: data.village || '',
    smallPlaceName: data.smallPlaceName || '',
    altitude: data.altitude ? `${data.altitude}` : '',

    // 生长势
    healthStatus: data.healthStatus || '',
    protectionLevel: data.protectionLevel || '',
    protectionType: data.protectionType || '',
    isRareSpecies: data.isRareSpecies == null ? '' : data.isRareSpecies.toString(),

    // 测量数据
    treeHeight: data.treeHeight ? `${data.treeHeight}` : '',
    crownWidth: data.crownWidth ? `${data.crownWidth}` : '',
    underBranchHeight: data.underBranchHeight ? `${data.underBranchHeight}` : '',
    area: data.area ? `${data.area}` : '',
    quantity: data.quantity || '1',
    transplantPlan: data.transplantPlan || '',

    // 测量维度相关字段
    measurementDimensionType: data.measurementDimensionType || '',
    measurementInfo: {
      chestDiameter: data.measurementInfo?.chestDiameter || '',
      groundDiameter: data.measurementInfo?.groundDiameter || '',
      distributionDiameter: data.measurementInfo?.distributionDiameter || '',
      branchCount: data.measurementInfo?.branchCount || '',
      farthestDiameter: data.measurementInfo?.farthestDiameter || '',
    },
    // 新增预估字段（与 measurementInfo 同级）
    measurementInfoEstimate: data.measurementInfoEstimate || '',
    measurementDimensionTypeEstimate: data.measurementDimensionTypeEstimate || '',
    specs: data.specs || '',

    // 环境信息
    landType: data.landType || '',
    soilTexture: data.soilTexture || '',
    landform: data.landform || '',
    slope: data.slope == null ? '' : data.slope.toString(),
    aspect: data.aspect || '',
    slopePosition: data.slopePosition || '',

    // 保护信息
    relocationPlace: data.relocationPlace || '',
    siteConditionDesc: data.siteConditionDesc || '',
    protectionMeasureType: data.protectionMeasureType || '',
    team: data.team || '',
    relocationProtection: data.relocationProtection || '',
    managementMeasures: data.managementMeasures || '',

    // 项目信息
    projectSchedule: data.projectSchedule || '',
    laborStatistics: data.laborStatistics || '',
    investmentEstimate: data.investmentEstimate ? `${data.investmentEstimate}` : '',

    // 其他信息
    growthEnvironment: data.growthEnvironment || '',
    isTransplant: data.isTransplant == null ? '' : data.isTransplant.toString(),
    notTransplant: data.notTransplant || '',
    historicalAnecdotes: data.historicalAnecdotes || '',
    discoveryDate: dayjs().format('YYYY-MM-DD'),
    remarks: data.remarks || '',
    multimedia: [],
  };
  if (data.measurementInfo) {
    formData.value.measurementInfo = JSON.parse(data.measurementInfo);
  } else {
    formData.value.measurementInfo = {
      chestDiameter: '',
      groundDiameter: '',
      distributionDiameter: '',
      branchCount: '',
      farthestDiameter: '',
    };
    // 初始化预估字段
    formData.value.measurementInfoEstimate = '';
    formData.value.measurementDimensionTypeEstimate = '';
  }

  if (data.multimedia && Array.isArray(data.multimedia)) {
    formData.value.multimedia = data.multimedia || [];
  }
  if (data.id) {
    formData.value.id = data.id;
  }
  if (data.investigatorId) {
    formData.value.investigatorId = data.investigatorId;
  }
  if (data.tempId) {
    formData.value.tempId = data.tempId;
  }
  if (data.taskManageId) {
    formData.value.taskManageId = data.taskManageId;
  }
  // 完成调查时间
  if (data.finishDate) {
    formData.value.finishDate = data.finishDate;
  }

  // 解析编号
  if (data.type) {
    // 去掉服务器编号的treeCode 原始值：01-00001
    const noServerTreeCode = formData.value.treeCode.split('-');
    if (noServerTreeCode[1]) {
      serverTreeCode.value = noServerTreeCode[0];
      const type = getCodeByTreeType(data.type) || '';
      formData.value.treeCode = noServerTreeCode[1].replace(type, '');
    } else {
      // 兼容老数据
      const type = getCodeByTreeType(data.type) || '';
      formData.value.treeCode = noServerTreeCode[0].replace(type, '');
    }
  } else {
    const noServerTreeCode = formData.value.treeCode.split('-');
    if (noServerTreeCode[1]) {
      serverTreeCode.value = noServerTreeCode[0];
      const type = getCodeByTreeType(data.type) || '';
      formData.value.treeCode = noServerTreeCode[1].replace(type, '');
    }
  }

  // 解析挂牌编号
  if (data.codeNumber) {
    try {
      const type = getCodeByTreeType(data.type) || '';
      const codeNumber = data.codeNumber.replace(`${type}-`, '');
      // xxx-xxxxx 001-00001
      formData.value.codeNumber = codeNumber;
      const codeNumberParts = codeNumber.split('-');
      codeNumberFirst.value = codeNumberParts[0];
      codeNumberSecond.value = codeNumberParts[1];
    } catch (error) {}
  }
};

// 表单数据
const formData = ref<SurveyCreateFormData>({
  // 基本信息
  type: '', // 树种类型
  treeSpecies: '', // 树种名称
  treeCode: '', // 古树唯一编号
  codeNumber: '', // 挂牌编号
  commonName: '', // 俗名/当地俗称
  latinName: '', // 拉丁学名
  family: '', // 科
  genus: '', // 属
  species: '', // 种
  estimatedAge: '', // 估测树龄(年)
  ownershipUnit: '', // 权属单位/管理单位
  batch: '', // 批次
  soilLayerThickness: '', // 土层厚度(厘米)
  landParcelsName: '', // 地块名称

  location: {
    x: '',
    y: '',
  },
  areaCode: '', // 行政区划代码
  town: '', // 乡（镇）
  village: '', // 村
  smallPlaceName: '', // 小地名
  altitude: '', // 海拔(米)

  // 生长势
  healthStatus: '', // 生长势(优/良/中/差)
  protectionLevel: '', // 古树名木保护等级(一级/二级/三级)
  protectionType: '', // 植物保护类型/等级
  isRareSpecies: '', // 是否稀有物种

  // 测量数据
  treeHeight: '', // 树高(米)
  crownWidth: '', // 冠幅(米)
  underBranchHeight: '', // 枝下高(米)
  area: '', // 分布面积(平方米)
  quantity: '1', // 数量(株)
  transplantPlan: '', // 移栽方案

  // 测量维度相关字段
  measurementDimensionType: '', // 测量维度
  measurementInfo: {
    chestDiameter: '', // 胸径
    groundDiameter: '', // 地径
    distributionDiameter: '', // 分布直径
    branchCount: '', // 分支数量
    farthestDiameter: '', // 离中心点最远的树木的胸径/直径
  },
  // 新增预估字段（与 measurementInfo 同级）
  measurementInfoEstimate: '', // 预估值
  measurementDimensionTypeEstimate: '', // 预估类型
  specs: '', // 规格

  // 环境信息
  growthEnvironment: '', // 生长环境详细描述
  isTransplant: 'true', // 是否具备移植条件
  notTransplant: '无', // 不可移植原因
  landType: '', // 地类
  soilTexture: '', // 土壤类型
  landform: '', // 地貌
  slope: '', // 坡度
  aspect: '', // 坡向
  slopePosition: '', // 坡位
  siteConditionDesc: '', // 立地条件描述

  // 保护措施
  protectionMeasureType: '无', // 现有保护措施(迁地保护/就地保护)
  team: '', // 组员
  relocationProtection: '', // 迁地保护/就地保护技术措施
  managementMeasures: '', // 管护措施
  relocationPlace: '', // 迁出地

  // 项目信息
  projectSchedule: '', // 工程进度安排
  laborStatistics: '', // 用工量统计
  investmentEstimate: '', // 投资概算(元)

  // 其他信息
  historicalAnecdotes: '', // 历史典故/传说
  discoveryDate: dayjs().format('YYYY-MM-DD'), // 发现/登记日期
  remarks: '', // 备注
  multimedia: [], // 多媒体资料JSON数组，存储照片/视频路径
});

const {
  autoFillTreeSpeciesData,
  onTypeChange,
  onTransplantConditionChange,
  treeSpeciesOptions,
  onMeasurementDimensionTypeChange,
  calculateSpecs,
  onMeasurementInfoChange,
  getFamilyOptions,
  getGenusOptions,
  getSpeciesOptions,
} = useAutoRelation(formData);

/**
 * 挂牌编号变化处理
 */
const onCodeNumberChange = () => {
  // 格式化输入值，确保前导零
  const first = codeNumberFirst.value.padStart(3, '0');
  const second = codeNumberSecond.value.padStart(5, '0');

  // 只有两个部分都有值时才拼接
  if (codeNumberFirst.value && codeNumberSecond.value) {
    formData.value.codeNumber = `${first}-${second}`;
  } else {
    formData.value.codeNumber = '';
  }
};

const { randomFill } = useCreateTest({
  formData,
  treeSpeciesOptions,
  onTypeChange,
  onTreeSpeciesConfirm,
  calculateSpecs,
  codeNumberFirst,
  codeNumberSecond,
  onCodeNumberChange,
});

// 表单引用
const formRef = ref<any>(null);
// scroll-view滚动位置
const scrollTop = ref(0);

// 表单校验规则
const rules = ref({
  type: {
    rules: [{ required: true, errorMessage: '请选择树种类型' }],
  },
  treeSpecies: {
    rules: [{ required: true, errorMessage: '请输入树种名称' }],
  },
  treeCode: {
    rules: [
      { required: true, errorMessage: '请输入编号' },
      {
        validateFunction: (rule: any, value: any, data: any, callback: any) => {
          if (value && value.trim() !== '') {
            console.log('treeCode', value);

            // 提取后缀部分进行验证
            const parts = value.split('-');
            const suffix = parts.length > 1 ? parts[1] : value;

            // 验证是否为五位数字
            const pattern = /^\d{5}$/;
            if (!pattern.test(suffix)) {
              callback('编号必须是五位数字(00001-99999)');
              return;
            }

            // 验证数值范围
            const numValue = parseInt(suffix);
            if (numValue < 1 || numValue > 99999) {
              callback('编号必须在00001-99999范围内');
              return;
            }
          }
          return true;
        },
      },
    ],
  },
  codeNumber: {
    rules: [
      { required: true, errorMessage: '请输入挂牌编号' },
      {
        validateFunction: (rule: any, value: any, data: any, callback: any) => {
          if (value && value.trim() !== '') {
            console.log('挂牌编号', value);

            // 验证格式：xxx-xxxxx（3位数字-5位数字）
            const pattern = /^\d{3}-\d{5}$/;
            if (!pattern.test(value)) {
              callback('挂牌编号格式不正确，应为3位数字-5位数字');
              return;
            }

            const parts = value.split('-');
            const firstPart = parseInt(parts[0]);
            const secondPart = parseInt(parts[1]);

            // 验证第一部分范围（001-999）
            if (firstPart < 1 || firstPart > 999) {
              callback('挂牌编号第一部分必须在001-999范围内');
              return;
            }

            // 验证第二部分范围（00001-99999）
            if (secondPart < 1 || secondPart > 99999) {
              callback('挂牌编号第二部分必须在00001-99999范围内');
              return;
            }
          }
          return true;
        },
      },
    ],
  },
  location: {
    rules: [
      {
        required: true,
        validateFunction: (rule: any, value: any, data: any, callback: any) => {
          const { x, y } = value || {};

          // 检查经度
          if (!x || x.trim() === '') {
            callback('请输入经度');
          }

          // 检查纬度
          if (!y || y.trim() === '') {
            callback('请输入纬度');
          }

          // 验证经度格式 (-180 到 180)
          const lngPattern = /^-?((1[0-7]\d)|(\d{1,2}))(\.\d+)?$/;
          if (!lngPattern.test(x)) {
            callback('请输入有效的经度值(-180到180)');
          }

          // 验证纬度格式 (-90 到 90)
          const latPattern = /^-?([0-8]?\d)(\.\d+)?$/;
          if (!latPattern.test(y)) {
            callback('请输入有效的纬度值(-90到90)');
          }

          // 验证经度数值范围
          const lngValue = parseFloat(x);
          if (lngValue < -180 || lngValue > 180) {
            callback('经度值必须在-180到180之间');
          }

          // 验证纬度数值范围
          const latValue = parseFloat(y);
          if (latValue < -90 || latValue > 90) {
            callback('纬度值必须在-90到90之间');
          }

          return true;
        },
      },
    ],
  },
  multimedia: {
    rules: [
      {
        validateFunction: (rule: any, value: any, data: any, callback: any) => {
          if (!value || !Array.isArray(value) || value.length === 0) {
            callback('请至少上传一张照片或视频');
          }
          return true;
        },
      },
    ],
  },
  // 必填字段验证规则
  healthStatus: {
    rules: [{ required: true, errorMessage: '请选择生长势' }],
  },
  altitude: {
    rules: [
      { required: true, errorMessage: '请输入海拔' },
      {
        validateFunction: (rule: any, value: any, data: any, callback: any) => {
          if (value && value.trim() !== '') {
            const pattern = /^\d{1,6}(\.\d{1,2})?$/;
            if (!pattern.test(value)) {
              callback('海拔格式不正确，最多6位整数和2位小数');
              return;
            }
            const numValue = parseFloat(value);
            if (numValue > 999999.99) {
              callback('海拔不能超过999999.99米');
              return;
            }
          }
          return true;
        },
      },
    ],
  },
  treeHeight: {
    rules: [
      { required: true, errorMessage: '请输入树高' },
      {
        validateFunction: (rule: any, value: any, data: any, callback: any) => {
          if (value && value.trim() !== '') {
            // 验证格式：最多4位整数+2位小数
            const pattern = /^\d{1,4}(\.\d{1,2})?$/;
            if (!pattern.test(value)) {
              callback('树高格式不正确，最多4位整数和2位小数');
              return;
            }
            // 验证数值范围
            const numValue = parseFloat(value);
            if (numValue > 9999.99) {
              callback('树高不能超过9999.99米');
              return;
            }
          }
          return true;
        },
      },
    ],
  },
  growthEnvironment: {
    rules: [{ required: true, errorMessage: '请选择生长环境' }],
  },
  slope: {
    rules: [{ required: true, errorMessage: '请选择坡度' }],
  },
  aspect: {
    rules: [{ required: true, errorMessage: '请选择坡向' }],
  },
  slopePosition: {
    rules: [{ required: true, errorMessage: '请选择坡位' }],
  },
  team: {
    rules: [{ required: true, errorMessage: '请输入组员' }],
  },
  measurementDimensionType: {
    rules: [{ required: true, errorMessage: '请选择测量维度' }],
  },
  crownWidth: {
    rules: [
      { required: true, errorMessage: '请选择冠幅' },
      {
        validateFunction: (rule: any, value: any, data: any, callback: any) => {
          if (value && value.trim() !== '') {
            const pattern = /^\d{1,4}(\.\d{1,2})?$/;
            if (!pattern.test(value)) {
              callback('冠幅格式不正确，最多4位整数和2位小数');
              return;
            }
            const numValue = parseFloat(value);
            if (numValue > 9999.99) {
              callback('冠幅不能超过9999.99米');
              return;
            }
          }
          return true;
        },
      },
    ],
  },
  underBranchHeight: {
    rules: [
      {
        validateFunction: (rule: any, value: any, data: any, callback: any) => {
          if (value && value.trim() !== '') {
            const pattern = /^\d{1,4}(\.\d{1,2})?$/;
            if (!pattern.test(value)) {
              callback('枝下高格式不正确，最多4位整数和2位小数');
              return;
            }
            const numValue = parseFloat(value);
            if (numValue > 9999.99) {
              callback('枝下高不能超过9999.99米');
              return;
            }
          }
          return true;
        },
      },
    ],
  },
  area: {
    rules: [
      {
        validateFunction: (rule: any, value: any, data: any, callback: any) => {
          if (value && value.trim() !== '') {
            const pattern = /^\d{1,8}(\.\d{1,2})?$/;
            if (!pattern.test(value)) {
              callback('面积格式不正确，最多8位整数和2位小数');
              return;
            }
            const numValue = parseFloat(value);
            if (numValue > 99999999.99) {
              callback('面积不能超过99999999.99平方米');
              return;
            }
          }
          return true;
        },
      },
    ],
  },
  investmentEstimate: {
    rules: [
      {
        validateFunction: (rule: any, value: any, data: any, callback: any) => {
          if (value && value.trim() !== '') {
            const pattern = /^\d{1,10}(\.\d{1,2})?$/;
            if (!pattern.test(value)) {
              callback('投资概算格式不正确，最多10位整数和2位小数');
              return;
            }
            const numValue = parseFloat(value);
            if (numValue > 9999999999.99) {
              callback('投资概算不能超过9999999999.99元');
              return;
            }
          }
          return true;
        },
      },
    ],
  },
});

onReady(() => {
  formRef.value.setRules(rules.value);
  try {
    if (window) {
      window.vm = formData;
    }
  } catch (error) {}
});

// 位置选择弹窗
const locationPopupRef = ref<any>(null);
const showLocationPopup = ref(false);

const onFinish = async (isDone?: boolean) => {
  if (isSubmitting.value) return; // 防止重复提交

  try {
    isSubmitting.value = true; // 开始提交，显示loading

    // 表单验证
    formRef.value
      ?.validate()
      .then(async (result: null | { key: string; errorMessage: string }[]) => {
        console.log('---', formData.value);

        // 自定义验证测量信息
        const measurementError = validateMeasurementInfo();
        if (measurementError) {
          uni.showToast({
            title: measurementError,
            icon: 'none',
          });
          return;
        }

        console.log('完成调查，表单数据:', formData.value);

        const isCreateUrl = !currentEditId.value;
        let isNewData = !surveyEditStore.currentEditData;
        let investigateStatus = '待完成';

        let url = isCreateUrl ? '/app/investigate' : `/app/investigate/${currentEditId.value}`;
        // 进来就是空的，空空如也的表单新建
        if (isNewData) {
          investigateStatus = isDone ? '已完成' : '进行中';
        } else {
          // 有点数据，但是有可能部分数据是缓存数据
          // 先获取原有状态
          const originInvestigateStatus = surveyEditStore.currentEditData?.investigateStatus;
          if (originInvestigateStatus && originInvestigateStatus === '已完成') {
            // 如果原有数据有值且为已完成，则不论点击保存还是完成调查，都应该是已完成状态
            investigateStatus = '已完成';
          } else {
            // 如果原有数据有值且不是已完成，则应该根据点击的是保存还是完成调查去修改状态
            investigateStatus = isDone ? '已完成' : '进行中';
          }
        }
        const prefix = getCodeByTreeType(formData.value.type) || '';

        // 处理挂牌编号拼接
        let finalCodeNumber = '';
        if (codeNumberFirst.value && codeNumberSecond.value) {
          const first = codeNumberFirst.value.padStart(3, '0');
          const second = codeNumberSecond.value.padStart(5, '0');
          finalCodeNumber = `${prefix}-${first}-${second}`;
        }

        let data = {
          ...toRaw(formData.value),
          treeCode: prefix + formData.value.treeCode,
          codeNumber: finalCodeNumber,
          measurementInfo: JSON.stringify(formData.value.measurementInfo),
          investigateStatus,
          updateDate: new Date().toISOString(),
        };
        // 完成调查时间只记录一次
        if (investigateStatus === '已完成' && !data.finishDate) {
          data.finishDate = new Date().toISOString();
        }

        // 缓存上次输入的组员值、坡度、坡向、坡位、批次、海拔
        setLastInputValue({
          team: data.team,
          slope: data.slope,
          aspect: data.aspect,
          slopePosition: data.slopePosition,
          batch: data.batch,
          altitude: data.altitude,
        });
        // 缓存上次输入的codeNumber中第二个值 xxx  3位的
        setLastCodeNumberFirstValue(codeNumberFirst.value);

        addSyncItemSurvey({
          url,
          data,
          isNewData,
        });
        selfGoBack();
      })
      .catch((err: { message: string }) => {
        console.log('表单验证失败', err);
        uni.showToast({
          title: '表单验证失败，请检查！',
          icon: 'none',
        });
      })
      .finally(() => {
        isSubmitting.value = false; // 结束提交，隐藏loading
      });
  } catch (error) {
    console.error('完成调查失败:', error);
    uni.showToast({
      title: '提交失败，请重试',
      icon: 'none',
    });
    isSubmitting.value = false; // 结束提交，隐藏loading
  }
};

/**
 * 经纬度选择
 */
const handleLocation = () => {
  showLocationPopup.value = true;
  locationPopupRef.value?.open();
};

/**
 * 位置选择确认
 */
const onLocationConfirm = (location: { longitude: number; latitude: number }) => {
  formData.value.location = {
    x: location.longitude.toString(),
    y: location.latitude.toString(),
  };
  onLocationClose();
};

/**
 * 位置选择关闭
 */
const onLocationClose = () => {
  showLocationPopup.value = false;
  locationPopupRef.value?.close();
};

const previewImage = (url: string) => {
  uni.previewImage({
    urls: [url],
  });
};

// 视频播放相关
const videoPopupRef = ref();
const currentVideoUrl = ref('');
const isVideoPlaying = ref(false);

const handleVideoPlay = (url: string) => {
  currentVideoUrl.value = url;
  videoPopupRef.value?.open();
};

const closeVideoPopup = () => {
  isVideoPlaying.value = false;
  currentVideoUrl.value = '';
  videoPopupRef.value?.close();
};

const onVideoLoadedData = () => {
  isVideoPlaying.value = true;
};

const onVideoError = () => {
  uni.showToast({
    title: '视频加载失败',
    icon: 'none',
  });
  closeVideoPopup();
};

const selfGoBack = () => {
  clearCurrentEditData();
  goBack();
};

/**
 * 小数转整数（保留原有方法用于整数字段）
 * @param value
 * @param key
 */
const onNumberChange = async (value: string, key: string) => {
  (formData.value as any)[key] = parseInt(value);
};

// 快速填写应用 组员、坡度、坡向、坡位、批次
const applyLastInputValue = (key: string, value: string) => {
  (formData.value as any)[key] = value;
};

const getCodeByTreeType = (type?: string) => {
  if (!type) return;
  const item = TREE_TYPES.value.find(item => item.value === type);
  // 用正则取出括号中的内容   草本(CB)
  return item?.code;
};

const formatTreeCodePrefix = computed(() => {
  if (formData.value.type) {
    return getCodeByTreeType(formData.value.type);
  } else {
    return;
  }
});

/**
 * 土壤类型选择
 */
const handleSoilTextureSelect = () => {
  soilTexturePopup.value = true;
  soilTexturePopupRef.value?.open();
};

/**
 * 土壤类型选择确认
 */
const onSoilTextureConfirm = (value: string) => {
  formData.value.soilTexture = value;
  onSoilTextureClose();
};

/**
 * 土壤类型选择关闭
 */
const onSoilTextureClose = () => {
  soilTexturePopup.value = false;
  soilTexturePopupRef.value?.close();
};

/**
 * 地貌选择
 */
const handleLandformSelect = () => {
  landformPopup.value = true;
  landformPopupRef.value?.open();
};

/**
 * 地貌选择确认
 */
const onLandformConfirm = (value: string) => {
  formData.value.landform = value;
  onLandformClose();
};

/**
 * 地貌选择关闭
 */
const onLandformClose = () => {
  landformPopup.value = false;
  landformPopupRef.value?.close();
};

/**
 * 树种名称选择
 */
const handleTreeSpeciesSelect = () => {
  treeSpeciesPopup.value = true;
  treeSpeciesPopupRef.value?.open();
};

/**
 * 树种名称选择关闭
 */
const onTreeSpeciesClose = () => {
  treeSpeciesPopup.value = false;
  treeSpeciesPopupRef.value?.close();
};

// ==================== 科属种联动选择逻辑 ====================

/**
 * 科选择处理
 */
const handleFamilySelect = () => {
  console.log('handleFamilySelect called');
  currentFGSType.value = 'family';
  currentFGSTitle.value = '选择科';
  currentFGSPlaceholder.value = '请选择或输入科名称';
  currentFGSOptions.value = getFamilyOptions();

  console.log('currentFGSOptions.value:', currentFGSOptions.value);

  familyGenusSpeciesPopup.value = true;
  familyGenusSpeciesPopupRef.value?.open();
};

/**
 * 属选择处理
 */
const handleGenusSelect = () => {
  if (!formData.value.family) {
    uni.showToast({
      title: '请先选择科',
      icon: 'none',
    });
    return;
  }

  currentFGSType.value = 'genus';
  currentFGSTitle.value = '选择属';
  currentFGSPlaceholder.value = '请选择或输入属名称';
  currentFGSOptions.value = getGenusOptions(formData.value.family);

  familyGenusSpeciesPopup.value = true;
  familyGenusSpeciesPopupRef.value?.open();
};

/**
 * 种选择处理
 */
const handleSpeciesSelect = () => {
  if (!formData.value.family) {
    uni.showToast({
      title: '请先选择科',
      icon: 'none',
    });
    return;
  }

  if (!formData.value.genus) {
    uni.showToast({
      title: '请先选择属',
      icon: 'none',
    });
    return;
  }

  currentFGSType.value = 'species';
  currentFGSTitle.value = '选择种';
  currentFGSPlaceholder.value = '请选择或输入种名称';
  currentFGSOptions.value = getSpeciesOptions(formData.value.family, formData.value.genus);

  familyGenusSpeciesPopup.value = true;
  familyGenusSpeciesPopupRef.value?.open();
};

/**
 * 科属种选择确认
 */
const onFamilyGenusSpeciesConfirm = (value: string) => {
  if (currentFGSType.value === 'family') {
    // 科变化时，重置属和种
    if (formData.value.family !== value) {
      formData.value.family = value;
      formData.value.genus = '';
      formData.value.species = '';
    }
  } else if (currentFGSType.value === 'genus') {
    // 属变化时，重置种
    if (formData.value.genus !== value) {
      formData.value.genus = value;
      formData.value.species = '';
    }
  } else if (currentFGSType.value === 'species') {
    formData.value.species = value;
  }

  onFamilyGenusSpeciesClose();
};

/**
 * 科属种选择关闭
 */
const onFamilyGenusSpeciesClose = () => {
  familyGenusSpeciesPopup.value = false;
  familyGenusSpeciesPopupRef.value?.close();
};

/**
 * 处理胸径值变化，自动填充预估值
 */
const handleChestDiameterChange = () => {
  if (formData.value.measurementDimensionType === '胸径' && formData.value.measurementInfo?.chestDiameter) {
    formData.value.measurementInfoEstimate = formData.value.measurementInfo.chestDiameter;
  }
  onMeasurementInfoChange();
};

/**
 * 打开累加组件
 */
const openAccumulator = () => {
  showAccumulatorPopup.value = true;
  accumulatorPopupRef.value?.open();
};

/**
 * 累加组件确认
 */
const onAccumulatorConfirm = (result: { total: number; process: string }) => {
  formData.value.measurementInfoEstimate = result.total.toString();
  formData.value.measurementDimensionTypeEstimate = result.process;
  showAccumulatorPopup.value = false;
};
</script>

<template>
  <view class="w-full h-full flex flex-col bg-gradient-to-b from-#08bd92 to-#07a47f">
    <!-- 顶部统计区域 -->
    <view
      class="w-full"
      :style="{
        paddingTop: statusBarHeight + 12 + 'px',
      }"
    >
      <view class="flex items-center gap-10px px-10px py-24px pb-10px">
        <view class="w-auto flex items-center" @click="selfGoBack">
          <uni-icons type="left" size="30" color="#fff"></uni-icons>
          <text class="text-#fff text-18px font-bold">新增/调查</text>
        </view>
      </view>
    </view>

    <view class="w-full flex-1 flex flex-col px-10px bg-#fff overflow-hidden">
      <!-- 表单区域 -->
      <scroll-view class="flex-1 overflow-hidden" scroll-y :scroll-top="scrollTop">
        <uni-forms ref="formRef" :model="formData" label-position="top" label-width="300" class="p-15px">
          <!-- 树种类型 -->
          <uni-forms-item label="树种类型" name="type" required>
            <uni-data-select
              v-model="formData.type"
              :localdata="TREE_TYPES"
              :clear="false"
              placeholder="请选择树种类型"
              class="w-120px"
              @change="onTypeChange"
            />
          </uni-forms-item>
          <!-- 树种名称 -->
          <uni-forms-item label="树种名称" name="treeSpecies" required>
            <view class="flex items-center justify-between h-37px px-12px b-(1px solid #dcdfe6) rounded-4px" @click="handleTreeSpeciesSelect">
              <text class="text-14px" :class="formData.treeSpecies ? 'text-#333' : 'text-#999'">
                {{ formData.treeSpecies || '请选择或输入树种名称' }}
              </text>
              <uni-icons type="right" size="16" color="#c0c4cc" />
            </view>
          </uni-forms-item>

          <!-- 编号 -->
          <uni-forms-item label="编号" name="treeCode" required>
            <view class="flex items-center">
              <text v-if="serverTreeCode" class="text-14px text-#666">{{ serverTreeCode }}-</text>
              <text v-if="formatTreeCodePrefix" class="text-14px text-#666 mr-10px">{{ formatTreeCodePrefix }}</text>
              <uni-easyinput maxlength="5" type="number" v-model="formData.treeCode" placeholder="请输入5位数字编号" :clearable="false" />
            </view>
          </uni-forms-item>

          <!-- 挂牌编号 -->
          <uni-forms-item label="挂牌编号" name="codeNumber" required>
            <view class="flex items-center gap-10px">
              <text v-if="formatTreeCodePrefix" class="text-14px text-#666">{{ formatTreeCodePrefix }} - </text>
              <uni-easyinput
                maxlength="3"
                type="number"
                v-model="codeNumberFirst"
                placeholder="3位数字"
                @change="onCodeNumberChange"
                :clearable="false"
                class="w-80px"
              />
              <text class="text-14px text-#666">-</text>
              <uni-easyinput
                maxlength="5"
                type="number"
                v-model="codeNumberSecond"
                placeholder="5位数字"
                @change="onCodeNumberChange"
                :clearable="false"
                class="flex-1"
              />
            </view>
          </uni-forms-item>

          <!-- 树高 -->
          <uni-forms-item label="树高" name="treeHeight" required>
            <view class="flex items-center">
              <uni-easyinput v-model="formData.treeHeight" placeholder="请输入树高" type="number" :clearable="false" class="flex-1" />
              <text class="text-14px text-#666 ml-8px">米</text>
            </view>
          </uni-forms-item>

          <!-- 冠幅 -->
          <uni-forms-item label="冠幅" name="crownWidth" required>
            <view class="flex items-center">
              <uni-easyinput v-model="formData.crownWidth" placeholder="请输入冠幅" type="number" :clearable="false" class="flex-1" />
              <text class="text-14px text-#666 ml-8px">米</text>
            </view>
          </uni-forms-item>

          <!-- 测量维度 -->
          <uni-forms-item label="测量维度" name="measurementDimensionType" required>
            <uni-data-select
              v-model="formData.measurementDimensionType"
              :localdata="measurementDimensionTypeDict"
              :clear="false"
              placeholder="请选择测量维度"
              @change="onMeasurementDimensionTypeChange"
            />
          </uni-forms-item>

          <!-- 测量信息 -->
          <view v-if="formData.measurementDimensionType && formData.measurementInfo">
            <!-- 胸径类型 -->
            <uni-forms-item v-if="formData.measurementDimensionType === '胸径'" label="胸径" required>
              <view class="flex items-center">
                <uni-easyinput
                  v-model="formData.measurementInfo.chestDiameter"
                  placeholder="请输入胸径"
                  type="number"
                  :clearable="false"
                  class="flex-1"
                  @change="handleChestDiameterChange"
                />
                <text class="text-14px text-#666 ml-8px">厘米</text>
              </view>
            </uni-forms-item>

            <!-- 地径类型 -->
            <uni-forms-item v-if="formData.measurementDimensionType === '地径'" label="地径" required>
              <view class="flex items-center">
                <uni-easyinput
                  v-model="formData.measurementInfo.groundDiameter"
                  placeholder="请输入地径"
                  type="number"
                  :clearable="false"
                  class="flex-1"
                  @change="onMeasurementInfoChange"
                />
                <text class="text-14px text-#666 ml-8px">厘米</text>
              </view>
            </uni-forms-item>

            <!-- 丛生类型 -->
            <template v-if="formData.measurementDimensionType === '丛生'">
              <uni-forms-item label="分布直径" required>
                <view class="flex items-center">
                  <uni-easyinput
                    v-model="formData.measurementInfo.distributionDiameter"
                    placeholder="请输入分布直径"
                    type="number"
                    :clearable="false"
                    class="flex-1"
                    @change="onMeasurementInfoChange"
                  />
                  <text class="text-14px text-#666 ml-8px">厘米</text>
                </view>
              </uni-forms-item>

              <uni-forms-item label="分支数量" required>
                <view class="flex items-center">
                  <uni-easyinput
                    v-model="formData.measurementInfo.branchCount"
                    placeholder="请输入分支数量"
                    type="number"
                    :clearable="false"
                    class="flex-1"
                    @change="onMeasurementInfoChange"
                  />
                  <text class="text-14px text-#666 ml-8px">个</text>
                </view>
              </uni-forms-item>

              <uni-forms-item label="离中心点最远的树木的胸径/直径" required>
                <view class="flex items-center">
                  <uni-easyinput
                    v-model="formData.measurementInfo.farthestDiameter"
                    placeholder="离中心点最远的树木的胸径/直径"
                    type="number"
                    :clearable="false"
                    class="flex-1"
                    @change="onMeasurementInfoChange"
                  />
                  <text class="text-14px text-#666 ml-8px">厘米</text>
                </view>
              </uni-forms-item>
            </template>
            <!-- 预估值 -->
            <uni-forms-item label="预估值">
              <view class="flex items-center">
                <uni-easyinput v-model="formData.measurementInfoEstimate" placeholder="预估值" type="number" :clearable="false" class="flex-1" />
                <text class="text-14px text-#666 ml-8px">厘米</text>
              </view>
            </uni-forms-item>

            <!-- 预估类型 -->
            <uni-forms-item label="预估类型">
              <view class="flex gap-10px">
                <!-- 地径时显示累加按钮 -->
                <uni-easyinput v-model="formData.measurementDimensionTypeEstimate" placeholder="预估类型" :clearable="false" class="flex-1" />
                <button
                  v-if="formData.measurementDimensionType === '地径'"
                  class="w-80px h-37px bg-#07a47f text-white text-14px rounded-4px p0 fc"
                  @click="openAccumulator"
                >
                  累加计算
                </button>
              </view>
            </uni-forms-item>
          </view>

          <!-- 规格 -->
          <!-- <uni-forms-item label="规格">
            <view class="flex items-center justify-between py-12px px-16px border-1px border-#e5e5e5 rounded-8px bg-#f8f8f8">
              <text class="text-14px text-#666">{{ formData.specs }}</text>
              <text class="text-14px text-#666">厘米</text>
            </view>
          </uni-forms-item> -->
          <!-- 是否具备移植条件 -->
          <uni-forms-item label="是否具备移植条件" name="isTransplant">
            <uni-data-select
              v-model="formData.isTransplant"
              :localdata="[
                { text: '是', value: 'true' },
                { text: '否', value: 'false' },
              ]"
              :clear="true"
              placeholder="请选择是否具备移植条件"
              @change="onTransplantConditionChange"
            />
          </uni-forms-item>

          <!-- 不可移植原因 -->
          <uni-forms-item label="不可移植原因" name="notTransplant">
            <uni-data-select
              v-model="formData.notTransplant"
              :disabled="formData.isTransplant == 'true'"
              :localdata="nonPortableReasonDict"
              :clear="true"
              placeholder="请选择不可移植原因"
            />
          </uni-forms-item>

          <!-- 海拔 -->
          <uni-forms-item label="海拔" name="altitude" required>
            <view class="flex items-center">
              <uni-easyinput v-model="formData.altitude" placeholder="请输入海拔" type="number" :clearable="false" class="flex-1" />
              <text class="text-14px text-#666 ml-8px">米</text>
            </view>
          </uni-forms-item>
          <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputAltitude">
            <text>海拔上次输入：</text>
            <view class="flex-1 textEllipsis">{{ lastInputAltitude }}</view>
            <button class="w-60px h-25px fc text-#fff bgPrimary text-12px" @click="applyLastInputValue('altitude', lastInputAltitude)">应用</button>
          </view>

          <uni-forms-item label="照片/视频" name="multimedia" required>
            <view class="flex h-full justify-center flex-col w-full">
              <view
                class="h-full mt-1px flex items-center justify-between w-full border border-dashed border-gray-300 rounded-8px p-10px"
                @click="handlePhotoUpload"
              >
                <view class="flex items-center">
                  <text class="text-gray-400 text-14px">点击上传照片/视频</text>
                </view>
                <uni-icons type="camera" size="22" color="#1989fa" />
              </view>
              <view class="text-12px text-#999 mt-12px">注：须拍摄正南标记照片一张</view>

              <!-- 媒体文件预览列表 -->
              <view v-if="formData.multimedia!.length > 0" class="mt-2 flex flex-wrap">
                <view
                  v-for="(media, index) in formData.multimedia"
                  :key="index"
                  class="relative mr-2 mb-2 w-25vw h-25vw b-(1px dashed #e5e5e5) p-3px rounded-4px overflow-hidden box-border"
                >
                  <!-- #ifdef APP-PLUS -->
                  <!-- 图片预览 -->
                  <image
                    v-if="checkIsImage(media.id ? media.path : media.fileType)"
                    :src="media.id ? media.url : media.tempFilePath"
                    @click="previewImage(media.id ? media.url : (media.tempFilePath as string))"
                    class="w-full h-full object-cover rounded"
                    mode="aspectFill"
                  />
                  <!-- 视频预览 -->
                  <view
                    v-else-if="checkIsVideo(media.id ? media.path : media.fileType)"
                    class="w-full h-full relative"
                    @click="handleVideoPlay(media.id ? media.url : (media.tempFilePath as string))"
                  >
                    <image v-if="media.thumbTempFilePath" :src="media.thumbTempFilePath" class="w-full h-full object-cover rounded" mode="aspectFill" />
                    <view class="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                      <view class="w-25px h-25px rounded-full bg-#fff b-(2px solid #000) fc">
                        <view class="text-24px color-#000 iconfont icon-play"></view>
                      </view>
                    </view>
                  </view>
                  <!-- <video
                    :src="media.id ? media.url : media.tempFilePath"
                    class="w-full h-full object-cover rounded"
                    controls
                    :show-center-play-btn="true"
                    :show-play-btn="true"
                  /> -->
                  <!-- #endif -->

                  <!-- h5不考虑视频先 -->
                  <!-- #ifdef H5 -->
                  <image
                    :src="media.id ? media.url : media.path"
                    @click="previewImage(media.id ? media.url : media.path)"
                    class="w-full h-full object-cover rounded"
                    mode="aspectFill"
                  />
                  <!-- #endif -->
                  <view class="absolute top-2px right-2px bg-rgba(0,0,0,0.8) rounded-full fc" @click.stop="removePhoto(index)">
                    <uni-icons type="close" size="24" color="#fe5359" />
                  </view>
                </view>
              </view>
            </view>
          </uni-forms-item>

          <!-- 分布面积 -->
          <uni-forms-item label="分布面积" name="area">
            <view class="flex items-center">
              <uni-easyinput v-model="formData.area" placeholder="请输入分布面积" type="number" :clearable="false" class="flex-1" />
              <text class="text-14px text-#666 ml-8px">平方米</text>
            </view>
          </uni-forms-item>

          <!-- 数量 -->
          <uni-forms-item label="数量" name="quantity">
            <view class="flex items-center">
              <uni-easyinput
                v-model="formData.quantity"
                @change="(value: string) => onNumberChange(value, 'quantity')"
                placeholder="请输入数量"
                maxlength="4"
                type="number"
                :clearable="false"
                class="flex-1"
              />
              <text class="text-14px text-#666 ml-8px">株</text>
            </view>
          </uni-forms-item>

          <!-- 经纬度 -->
          <uni-forms-item label="经纬度" name="location" required>
            <view class="flex flex-col gap-10px">
              <view class="flex items-center">
                <uni-easyinput v-model="formData.location.x" placeholder="请输入经度" type="number" :clearable="false" class="flex-1" />
                <image src="/static/images/icons/latlng.png" class="w-20px h-20px ml-20px" @click="handleLocation" />
              </view>
              <view class="flex items-center">
                <uni-easyinput v-model="formData.location.y" placeholder="请输入纬度" type="number" :clearable="false" />
              </view>
            </view>
          </uni-forms-item>

          <!-- 生长势 -->
          <uni-forms-item label="生长势" name="healthStatus" required>
            <uni-data-select v-model="formData.healthStatus" :localdata="healthStatusDict" :clear="false" placeholder="请选择生长势" />
          </uni-forms-item>

          <!-- 生长环境 -->
          <uni-forms-item label="生长环境" name="growthEnvironment" required>
            <uni-data-select v-model="formData.growthEnvironment" :localdata="growthEnvironmentDict" :clear="false" placeholder="请选择生长环境" />
          </uni-forms-item>

          <!-- 坡度 -->
          <uni-forms-item label="坡度" name="slope" required>
            <uni-data-select v-model="formData.slope" :localdata="slopeDict" :clear="false" placeholder="请选择坡度" />
          </uni-forms-item>
          <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputSlope">
            <text>坡度上次输入：</text>
            <view class="flex-1 textEllipsis">{{ lastInputSlope }}</view>
            <button class="w-60px h-25px fc text-#fff bgPrimary text-12px" @click="applyLastInputValue('slope', lastInputSlope)">应用</button>
          </view>

          <!-- 坡向 -->
          <uni-forms-item label="坡向" name="aspect" required>
            <AspectSelector v-model="formData.aspect" :localdata="aspectDict" placeholder="请选择坡向" />
          </uni-forms-item>
          <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputAspect">
            <text>坡向上次输入：</text>
            <view class="flex-1 textEllipsis">{{ lastInputAspect }}</view>
            <button class="w-60px h-25px fc text-#fff bgPrimary text-12px" @click="applyLastInputValue('aspect', lastInputAspect)">应用</button>
          </view>

          <!-- 坡位 -->
          <uni-forms-item label="坡位" name="slopePosition" required>
            <uni-data-select v-model="formData.slopePosition" :localdata="slopePositionDict" :clear="false" placeholder="请选择坡位" />
          </uni-forms-item>
          <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputSlopePosition">
            <text>坡位上次输入：</text>
            <view class="flex-1 textEllipsis">{{ lastInputSlopePosition }}</view>
            <button class="w-60px h-25px fc text-#fff bgPrimary text-12px" @click="applyLastInputValue('slopePosition', lastInputSlopePosition)">应用</button>
          </view>

          <!-- 组员 -->
          <uni-forms-item label="组员" name="team" required>
            <uni-easyinput v-model="formData.team" placeholder="请输入组员" :clearable="false" />
          </uni-forms-item>
          <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputTeamValue">
            <text>组员上次输入：</text>
            <view class="flex-1 textEllipsis">{{ lastInputTeamValue }}</view>
            <button class="w-60px h-25px fc text-#fff bgPrimary text-12px" @click="applyLastInputValue('team', lastInputTeamValue)">应用</button>
          </view>

          <!-- 发现日期 -->
          <uni-forms-item label="发现/登记日期" name="discoveryDate">
            <uni-datetime-picker v-model="formData.discoveryDate" type="date" placeholder="请选择发现/登记日期" :clear-icon="true" />
          </uni-forms-item>

          <!-- 批次 -->
          <uni-forms-item label="批次" name="batch">
            <uni-data-select v-model="formData.batch" :localdata="batchDict" :clear="false" placeholder="请选择批次" />
          </uni-forms-item>
          <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputBatchValue">
            <text>批次上次输入：</text>
            <view class="flex-1 textEllipsis">{{ lastInputBatchValue }}</view>
            <button class="w-60px h-25px fc text-#fff bgPrimary text-12px" @click="applyLastInputValue('batch', lastInputBatchValue)">应用</button>
          </view>

          <!-- 地块名称 -->
          <uni-forms-item label="地块名称" name="landParcelsName">
            <uni-easyinput v-model="formData.landParcelsName" placeholder="请输入地块名称" :clearable="false" />
          </uni-forms-item>

          <!-- 乡镇 -->
          <uni-forms-item label="乡（镇）" name="town">
            <uni-easyinput v-model="formData.town" placeholder="请输入乡（镇）" :clearable="false" />
          </uni-forms-item>

          <!-- 村 -->
          <uni-forms-item label="村" name="village">
            <uni-easyinput v-model="formData.village" placeholder="请输入村" :clearable="false" />
          </uni-forms-item>

          <!-- 立地条件描述 -->
          <uni-forms-item label="立地条件描述" name="siteConditionDesc">
            <uni-easyinput v-model="formData.siteConditionDesc" type="textarea" placeholder="请输入立地条件描述" :clearable="false" maxlength="500" />
          </uni-forms-item>

          <!-- 现有保护措施 -->
          <uni-forms-item label="现有保护措施" name="protectionMeasureType">
            <uni-data-select v-model="formData.protectionMeasureType" :localdata="protectionMeasureTypeDict" :clear="false" placeholder="请选择现有保护措施" />
          </uni-forms-item>

          <!-- 行政区 -->
          <uni-forms-item label="行政区" v-if="surveyEditStore.currentEditData && surveyEditStore.currentEditData.areaName">
            <view class="flex items-center justify-between py-12px px-16px border-1px border-#e5e5e5 rounded-8px cursor-pointer">
              <!-- 仅在编辑状态下回显 -->
              {{ surveyEditStore.currentEditData?.areaName || '' }}
            </view>
          </uni-forms-item>

          <!-- 古树名木保护等级 -->
          <uni-forms-item label="古树名木保护等级" name="protectionLevel">
            <uni-data-select v-model="formData.protectionLevel" :localdata="protectionLevelDict" :clear="true" placeholder="请选择古树名木保护等级" />
          </uni-forms-item>

          <!-- 俗名 -->
          <uni-forms-item label="俗名/当地俗称" name="commonName">
            <uni-easyinput v-model="formData.commonName" placeholder="请输入俗名/当地俗称" :clearable="false" />
          </uni-forms-item>

          <!-- 拉丁学名 -->
          <uni-forms-item label="拉丁学名" name="latinName">
            <uni-easyinput v-model="formData.latinName" placeholder="请输入拉丁学名" :clearable="false" />
          </uni-forms-item>

          <!-- 科 -->
          <uni-forms-item label="科" name="family">
            <view class="flex items-center justify-between h-37px px-12px b-(1px solid #dcdfe6) rounded-4px" @click="handleFamilySelect">
              <text class="text-14px" :class="formData.family ? 'text-#333' : 'text-#999'">
                {{ formData.family || '请选择或输入科名称' }}
              </text>
              <uni-icons type="right" size="16" color="#c0c4cc" />
            </view>
          </uni-forms-item>

          <!-- 属 -->
          <uni-forms-item label="属" name="genus">
            <view class="flex items-center justify-between h-37px px-12px b-(1px solid #dcdfe6) rounded-4px" @click="handleGenusSelect">
              <text class="text-14px" :class="formData.genus ? 'text-#333' : 'text-#999'">
                {{ formData.genus || '请选择或输入属名称' }}
              </text>
              <uni-icons type="right" size="16" color="#c0c4cc" />
            </view>
          </uni-forms-item>

          <!-- 种 -->
          <uni-forms-item label="种" name="species">
            <view class="flex items-center justify-between h-37px px-12px b-(1px solid #dcdfe6) rounded-4px" @click="handleSpeciesSelect">
              <text class="text-14px" :class="formData.species ? 'text-#333' : 'text-#999'">
                {{ formData.species || '请选择或输入种名称' }}
              </text>
              <uni-icons type="right" size="16" color="#c0c4cc" />
            </view>
          </uni-forms-item>

          <!-- 估测树龄 -->
          <uni-forms-item label="估测树龄" name="estimatedAge">
            <view class="flex items-center">
              <uni-easyinput
                v-model="formData.estimatedAge"
                placeholder="请输入估测树龄"
                :maxlength="4"
                type="number"
                :clearable="false"
                class="flex-1"
                @change="value => onNumberChange(value, 'estimatedAge')"
              />
              <text class="text-14px text-#666 ml-8px">年</text>
            </view>
          </uni-forms-item>

          <!-- 权属单位 -->
          <uni-forms-item label="权属/管理单位" name="ownershipUnit">
            <uni-easyinput v-model="formData.ownershipUnit" placeholder="请输入权属单位/管理单位" :clearable="false" />
          </uni-forms-item>

          <!-- 小地名 -->
          <uni-forms-item label="小地名" name="smallPlaceName">
            <uni-easyinput v-model="formData.smallPlaceName" placeholder="请输入小地名" :clearable="false" />
          </uni-forms-item>

          <!-- 保护类型 -->
          <uni-forms-item label="植物保护类型/等级" name="protectionType">
            <uni-data-select v-model="formData.protectionType" :localdata="protectionTypeDict" :clear="true" placeholder="请选择植物保护类型/等级" />
          </uni-forms-item>

          <!-- 是否稀有物种 -->
          <uni-forms-item label="稀有物种" name="isRareSpecies">
            <uni-data-select
              v-model="formData.isRareSpecies"
              :localdata="[
                { text: '是', value: 'true' },
                { text: '否', value: 'false' },
              ]"
              :clear="true"
              placeholder="请选择稀有物种"
            />
          </uni-forms-item>

          <!-- 枝下高 -->
          <uni-forms-item label="枝下高" name="underBranchHeight">
            <view class="flex items-center">
              <uni-easyinput v-model="formData.underBranchHeight" placeholder="请输入枝下高" type="number" :clearable="false" class="flex-1" />
              <text class="text-14px text-#666 ml-8px">米</text>
            </view>
          </uni-forms-item>

          <!-- 移栽方案 -->
          <uni-forms-item label="移栽方案" name="transplantPlan">
            <uni-data-select v-model="formData.transplantPlan" :localdata="transplantPlanDict" :clear="false" placeholder="请选择移栽方案" />
          </uni-forms-item>

          <!-- 地类 -->
          <uni-forms-item label="地类" name="landType">
            <uni-easyinput v-model="formData.landType" placeholder="请输入地类" :clearable="false" />
          </uni-forms-item>

          <!-- 土壤类型 -->
          <uni-forms-item label="土壤类型" name="soilTexture">
            <view class="flex items-center justify-between h-37px px-12px b-(1px solid #dcdfe6) rounded-4px" @click="handleSoilTextureSelect">
              <text class="text-14px" :class="formData.soilTexture ? 'text-#333' : 'text-#999'">
                {{ formData.soilTexture || '请选择土壤类型' }}
              </text>
              <uni-icons type="right" size="16" color="#c0c4cc" />
            </view>
          </uni-forms-item>

          <!-- 地貌 -->
          <uni-forms-item label="地貌" name="landform">
            <view class="flex items-center justify-between h-37px px-12px b-(1px solid #dcdfe6) rounded-4px" @click="handleLandformSelect">
              <text class="text-14px" :class="formData.landform ? 'text-#333' : 'text-#999'">
                {{ formData.landform || '请选择地貌' }}
              </text>
              <uni-icons type="right" size="16" color="#c0c4cc" />
            </view>
          </uni-forms-item>

          <!-- 土层厚度 -->
          <uni-forms-item label="土层厚度" name="soilLayerThickness">
            <view class="flex items-center">
              <uni-easyinput v-model="formData.soilLayerThickness" placeholder="请输入土层厚度" type="number" :clearable="false" />
              <text class="ml-8px text-14px text-#666">厘米</text>
            </view>
          </uni-forms-item>

          <!-- 保护技术措施 -->
          <uni-forms-item label="迁地/就地保护技术措施" name="relocationProtection">
            <uni-easyinput
              v-model="formData.relocationProtection"
              type="textarea"
              placeholder="请输入迁地保护/就地保护技术措施"
              :clearable="false"
              maxlength="500"
            />
          </uni-forms-item>

          <!-- 管护措施 -->
          <uni-forms-item label="管护措施" name="managementMeasures">
            <uni-easyinput v-model="formData.managementMeasures" type="textarea" placeholder="请输入管护措施" :clearable="false" maxlength="500" />
          </uni-forms-item>

          <!-- 迁出地 -->
          <uni-forms-item label="迁出地" name="relocationPlace">
            <uni-easyinput v-model="formData.relocationPlace" placeholder="请输入迁出地" :clearable="false" />
          </uni-forms-item>
          <!-- 工程进度安排 -->
          <uni-forms-item label="工程进度安排" name="projectSchedule">
            <uni-easyinput v-model="formData.projectSchedule" type="textarea" placeholder="请输入工程进度安排" :clearable="false" maxlength="500" />
          </uni-forms-item>

          <!-- 用工量统计 -->
          <uni-forms-item label="用工量统计" name="laborStatistics">
            <uni-easyinput v-model="formData.laborStatistics" type="textarea" placeholder="请输入用工量统计" :clearable="false" maxlength="500" />
          </uni-forms-item>

          <!-- 投资概算 -->
          <uni-forms-item label="投资概算" name="investmentEstimate">
            <view class="flex items-center">
              <uni-easyinput v-model="formData.investmentEstimate" placeholder="请输入投资概算" type="number" :clearable="false" class="flex-1" />
              <text class="text-14px text-#666 ml-8px">元</text>
            </view>
          </uni-forms-item>
          <!-- 历史典故 -->
          <uni-forms-item label="历史典故/传说" name="historicalAnecdotes">
            <uni-easyinput v-model="formData.historicalAnecdotes" type="textarea" placeholder="请输入历史典故/传说" :clearable="false" maxlength="1000" />
          </uni-forms-item>

          <!-- 备注 -->
          <uni-forms-item label="备注" name="remarks">
            <uni-easyinput v-model="formData.remarks" type="textarea" placeholder="请输入备注" :clearable="false" maxlength="1000" />
          </uni-forms-item>
        </uni-forms>
      </scroll-view>

      <!-- 底部按钮 -->
      <view class="w-full pb-15px flex items-center gap-10px bg-#fff z-9">
        <button class="flex-1 h-46px rounded-4px fc bgPrimary" @click="randomFill" v-if="randomFillStatus">
          <text class="text-14px text-#fff font-medium">随机填充</text>
        </button>
        <button class="flex-1 h-46px rounded-4px fc" :class="isSubmitting ? 'bg-#ccc' : 'bg-#f2f2f6'" :loading="isSubmitting" @click="onFinish(false)">
          <text class="text-14px text-#333 font-medium">保存</text>
        </button>
        <button class="flex-1 h-46px rounded-4px fc" :class="isSubmitting ? 'bg-#ccc' : 'bgPrimary'" :loading="isSubmitting" @click="onFinish(true)">
          <text class="text-14px text-#fff font-medium">完成调查</text>
        </button>
      </view>
    </view>
  </view>

  <!-- 位置选择弹窗 -->
  <uni-popup ref="locationPopupRef" type="bottom" background-color="transparent" @change="(e: any) => (showLocationPopup = e.show)">
    <LocationPickerPopup
      :initialLocation="{
        lng: formData.location.x ? formData.location.x : null,
        lat: formData.location.y ? formData.location.y : null,
      }"
      @confirm="onLocationConfirm"
    />
  </uni-popup>

  <!-- 树种名称选择弹窗 -->
  <uni-popup ref="treeSpeciesPopupRef" type="bottom" background-color="transparent" @change="(e: any) => (treeSpeciesPopup = e.show)">
    <TagSelectorPopup
      title="树种名称"
      :options="treeSpeciesOptions || []"
      :model-value="formData.treeSpecies"
      placeholder="请选择或输入树种名称"
      @confirm="onTreeSpeciesConfirm"
      @close="onTreeSpeciesClose"
    />
  </uni-popup>

  <!-- 土壤类型选择弹窗 -->
  <uni-popup ref="soilTexturePopupRef" type="bottom" background-color="transparent" @change="(e: any) => (soilTexturePopup = e.show)">
    <TagSelectorPopup
      title="土壤类型"
      :options="soilTextureDict"
      :model-value="formData.soilTexture"
      placeholder="请选择土壤类型"
      @confirm="onSoilTextureConfirm"
      @close="onSoilTextureClose"
    />
  </uni-popup>

  <!-- 地貌选择弹窗 -->
  <uni-popup ref="landformPopupRef" type="bottom" background-color="transparent" @change="(e: any) => (landformPopup = e.show)">
    <TagSelectorPopup
      title="地貌"
      :options="landformDict"
      :model-value="formData.landform"
      placeholder="请选择地貌"
      @confirm="onLandformConfirm"
      @close="onLandformClose"
    />
  </uni-popup>

  <!-- 科属种选择弹窗 -->
  <uni-popup ref="familyGenusSpeciesPopupRef" type="bottom" background-color="transparent" @change="(e: any) => (familyGenusSpeciesPopup = e.show)">
    <TagSelectorPopup
      :title="currentFGSTitle"
      :options="currentFGSOptions"
      :model-value="currentFGSType === 'family' ? formData.family : currentFGSType === 'genus' ? formData.genus : formData.species"
      :placeholder="currentFGSPlaceholder"
      @confirm="onFamilyGenusSpeciesConfirm"
      @close="onFamilyGenusSpeciesClose"
    />
  </uni-popup>

  <!-- 累加组件 -->
  <AccumulatorPopup v-model:visible="showAccumulatorPopup" ref="accumulatorPopupRef" title="累加计算" @confirm="onAccumulatorConfirm" />

  <!-- 视频播放弹窗 -->
  <uni-popup ref="videoPopupRef" type="center" :mask-click="true" @maskClick="closeVideoPopup">
    <view class="w-90vw h-30vh bg-black rounded-12px overflow-hidden relative">
      <!-- 视频播放器 -->
      <video
        v-if="currentVideoUrl"
        :src="currentVideoUrl"
        class="w-full h-full object-contain"
        controls
        autoplay
        :show-center-play-btn="true"
        :show-play-btn="true"
        :show-fullscreen-btn="true"
        :show-progress="true"
        :show-loading="true"
        @loadeddata="onVideoLoadedData"
        @error="onVideoError"
      />
    </view>
  </uni-popup>
</template>
<style>
.uni-forms .uni-forms-item {
  margin-bottom: 15px;
}
</style>
