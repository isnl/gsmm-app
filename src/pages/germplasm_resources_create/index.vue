<script lang="ts" setup>
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { storeToRefs } from 'pinia';
import { goBack, checkIsImage, checkIsVideo } from '@/utils';
import { ref, computed } from 'vue';
import { useGlobalStore } from '@/stores/global';
import { useGermplasmStore } from '@/stores/germplasm';
import { useGermplasmLisStore } from '@/stores/germplasm_list';
import TagSelectorPopup from '@/components/TagSelectorPopup.vue';
import { onLoad } from '@dcloudio/uni-app';
import { randomFill } from './randomFill';

const { statusBarHeight } = useStatusBarHeight();

const germplasmLisStore = useGermplasmLisStore();
const globalStore = useGlobalStore();
const germplasmStore = useGermplasmStore();
const {
  germplasmResourceTypeDict,
  germplasmCollectionMethodDict,
  germplasmCollectionUnitDict,
  germplasmQualityAssessmentDict,
  germplasmMaturityDict,
  germplasmPestDiseaseDict,
  germplasmInitialProcessingDict,
  germplasmPackagingContainerDict,
  randomFillStatus,
} = storeToRefs(globalStore);
const { addGermplasmDetailById, updateGermplasmDetailById } = germplasmLisStore;

const { lastInputs } = storeToRefs(germplasmStore);

// 表单验证规则
const rules = ref({
  germplasmResourcesCode: {
    rules: [
      {
        required: true,
        errorMessage: '请输入唯一编号',
      },
    ],
  },
  germplasmType: {
    rules: [
      {
        required: true,
        errorMessage: '请选择资源类型',
      },
    ],
  },
  collectPart: {
    rules: [
      {
        required: true,
        errorMessage: '请输入采集部位',
      },
    ],
  },
});

// 表单引用
const formRef = ref();

const formData = ref({
  // 种质资源信息部分
  germplasmResourcesCode: '',
  germplasmType: '',
  collectPart: '',
  collectMethod: '',
  collectQuantity: '',
  collectUnit: '',
  sampleQualityAssessment: '',
  collectMaturity: '',
  appearanceDescription: '',
  pestDiseaseSituation: '',
  // 现场处理与封装部分
  preliminaryTreatment: '',
  containerPackaging: '',
  packagingSpecQuantity: '',
  labelCheckConfirmation: false,
  // 现场影像记录与备注部分
  germplasmSampleCloseup: [] as any[], // 样本特写照片
  remarks: '',
});

const onHandleRandomFill = () => {
  randomFill(formData);
};

// 控制弹窗显示
const showTagSelector = ref(false);
const currentField = ref('');
const currentOptions = ref<any[]>([]);
const tagSelectorPopup = ref();

const openTagSelector = (field: string, options: any[]) => {
  if (isHistory.value) return;
  currentField.value = field;
  currentOptions.value = options;
  showTagSelector.value = true;
  tagSelectorPopup.value?.open();
};

const handleTagConfirm = (value: string) => {
  if (currentField.value) {
    (formData.value as any)[currentField.value] = value;
  }
  showTagSelector.value = false;
  tagSelectorPopup.value?.close();
};

const closeTagSelector = () => {
  showTagSelector.value = false;
  tagSelectorPopup.value?.close();
};

// 获取字段的中文标题
const getFieldTitle = (field: string) => {
  const titleMap: Record<string, string> = {
    germplasmType: '资源类型',
    collectMethod: '采集方式',
    collectUnit: '采集单位',
    sampleQualityAssessment: '质量评估',
    collectMaturity: '成熟度',
    pestDiseaseSituation: '病虫害',
    preliminaryTreatment: '初步处理',
    containerPackaging: '封装容器',
  };
  return titleMap[field] || field;
};

// 格式化初步处理字段的显示文本
const formatInitialProcessingText = computed(() => {
  if (!formData.value.preliminaryTreatment) return '请选择初步处理';
  const values = formData.value.preliminaryTreatment.split(',');
  if (values.length <= 2) {
    return values.join('、');
  } else {
    return `${values.slice(0, 2).join('、')}等${values.length}项`;
  }
});

// 快速填写应用
const applyLastInputValue = (key: string, value: string) => {
  (formData.value as any)[key] = value;
};

// 保存表单数据到store（在保存/完成调查时调用）
const saveLoading = ref(false);
const onSave = async () => {
  // 先进行表单验证
  formRef.value
    ?.validate()
    .then(res => {
      saveLoading.value = true;
      const newInputs: Record<string, string> = {};

      if (formData.value.germplasmType && formData.value.germplasmType.trim()) {
        newInputs.germplasmType = formData.value.germplasmType.trim();
      }
      if (formData.value.collectPart && formData.value.collectPart.trim()) {
        newInputs.collectPart = formData.value.collectPart.trim();
      }
      if (formData.value.collectMethod && formData.value.collectMethod.trim()) {
        newInputs.collectMethod = formData.value.collectMethod.trim();
      }
      if (formData.value.collectQuantity && formData.value.collectQuantity.trim()) {
        newInputs.collectQuantity = formData.value.collectQuantity.trim();
      }
      if (formData.value.collectUnit && formData.value.collectUnit.trim()) {
        newInputs.collectUnitType = formData.value.collectUnit.trim();
      }
      if (formData.value.sampleQualityAssessment && formData.value.sampleQualityAssessment.trim()) {
        newInputs.sampleQualityAssessment = formData.value.sampleQualityAssessment.trim();
      }
      if (formData.value.collectMaturity && formData.value.collectMaturity.trim()) {
        newInputs.collectMaturity = formData.value.collectMaturity.trim();
      }
      if (formData.value.pestDiseaseSituation && formData.value.pestDiseaseSituation.trim()) {
        newInputs.pestDiseaseSituation = formData.value.pestDiseaseSituation.trim();
      }
      if (formData.value.preliminaryTreatment && formData.value.preliminaryTreatment.trim()) {
        newInputs.preliminaryTreatment = formData.value.preliminaryTreatment.trim();
      }
      if (formData.value.containerPackaging && formData.value.containerPackaging.trim()) {
        newInputs.containerPackaging = formData.value.containerPackaging.trim();
      }

      if (Object.keys(newInputs).length > 0) {
        germplasmStore.setLastInputs(newInputs);
      }

      // 根据isCreate判断是新建还是修改
      if (isCreate.value) {
        // 新建
        addGermplasmDetailById(recordId.value, formData.value);
      } else {
        // 修改
        updateGermplasmDetailById(recordId.value, currentId.value, formData.value);
      }

      uni.showToast({
        title: '保存成功',
        icon: 'success',
      });
      saveLoading.value = false;
      goBack();
    })
    .catch(err => {
      uni.showToast({
        title: '请填写必填项',
        icon: 'none',
      });
      saveLoading.value = false;
    });
};

const isCreate = ref(false);
const currentId = ref();
const recordId = ref();
const isHistory = ref(false);

// 图片选择相关
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

// 处理图片上传
const handlePhotoUpload = (fieldKey: string) => {
  if (isHistory.value) return;
  // #ifdef APP-PLUS
  uni.chooseMedia({
    count: 9,
    mediaType: ['image', 'video'],
    sourceType: ['album', 'camera'],
    camera: 'back',
    success: async (res: any) => {
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
        (formData.value as any)[fieldKey] = [...(formData.value as any)[fieldKey], ...res.tempFiles];
      }
    },
    fail: err => {
      console.error('选择图片失败', err);
    },
  });
  // #endif
  // #ifdef H5
  uni.chooseImage({
    count: 9,
    sizeType: ['original', 'compressed'],
    success: (res: any) => {
      if (res.tempFiles && res.tempFiles.length > 0) {
        (formData.value as any)[fieldKey] = [...(formData.value as any)[fieldKey], ...res.tempFiles];
      }
    },
    fail: err => {
      console.error('选择图片失败', err);
    },
  });
  // #endif
};

// 删除已选择的图片
const removePhoto = (fieldKey: string, index: number) => {
  if (isHistory.value) return;
  uni.showModal({
    title: '提示',
    content: '确认删除吗？',
    success: res => {
      if (res.confirm) {
        (formData.value as any)[fieldKey].splice(index, 1);
      }
    },
  });
};

// 预览图片
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

onLoad((options: any) => {
  isCreate.value = options.currentId ? false : true;
  recordId.value = options.recordId;
  isHistory.value = options.isHistory ? true : false;
  if (options.currentId) {
    currentId.value = options.currentId;
    getCurrentInfoAndFillData();
  }
});

/**
 * 获取当前编辑的种质资源信息，并填充到表单中
 */
const getCurrentInfoAndFillData = () => {
  // 从germplasmLisStore中获取当前编辑的种质资源信息
  const germplasmInfo = germplasmLisStore.getInfoById(recordId.value, isHistory.value);
  if (germplasmInfo && germplasmInfo.details && currentId.value) {
    // 在details中查找对应的详情数据
    const currentDetail = germplasmInfo.details.find((detail: any) => {
      if (isHistory.value) {
        return detail.id === currentId.value;
      } else {
        return detail.tempId === currentId.value;
      }
    });
    if (currentDetail) {
      // 填充表单数据
      formData.value = {
        germplasmResourcesCode: currentDetail.germplasmResourcesCode || '',
        germplasmType: currentDetail.germplasmType || '',
        collectPart: currentDetail.collectPart || '',
        collectMethod: currentDetail.collectMethod || '',
        collectQuantity: currentDetail.collectQuantity || '',
        collectUnit: currentDetail.collectUnit || '',
        sampleQualityAssessment: currentDetail.sampleQualityAssessment || '',
        collectMaturity: currentDetail.collectMaturity || '',
        appearanceDescription: currentDetail.appearanceDescription || '',
        pestDiseaseSituation: currentDetail.pestDiseaseSituation || '',
        preliminaryTreatment: currentDetail.preliminaryTreatment || '',
        containerPackaging: currentDetail.containerPackaging || '',
        packagingSpecQuantity: currentDetail.packagingSpecQuantity || '',
        labelCheckConfirmation: currentDetail.labelCheckConfirmation || false,
        germplasmSampleCloseup: currentDetail.germplasmSampleCloseup || [],
        remarks: currentDetail.remarks || '',
      };
    }
  }
};
</script>

<template>
  <view class="w-full h-full flex flex-col bg-gradient-to-b from-#08bd92 to-#07a47f">
    <!-- 自定义导航栏 -->
    <view
      class="w-full"
      :style="{
        paddingTop: statusBarHeight + 12 + 'px',
      }"
    >
      <view class="flex items-center justify-between px-10px py-24px">
        <view class="w-auto flex items-center" @click="goBack">
          <uni-icons type="left" size="30" color="#fff"></uni-icons>
          <text class="text-#fff text-18px font-bold">种质资源采集</text>
        </view>
      </view>
    </view>

    <!-- 页面内容 -->
    <view class="flex-1 overflow-hidden flex flex-col bg-#f9f9fb">
      <scroll-view :scroll-y="true" class="h-full">
        <uni-forms ref="formRef" :model="formData" :rules="rules" :label-width="80" label-align="right" class="p-10px">
          <view class="w-full bg-#fff shadow-[0_5px_12px_1px_rgba(18,62,55,0.06)] rounded-8px p-12px">
            <view class="w-full flex items-center p-12px pl0">
              <image src="@/static/images/icons/germplasm.png" mode="widthFix" class="w-16px" />
              <text class="ml-5px text-#333 font-bold text-14px">种质资源信息</text>
            </view>

            <uni-forms-item label="唯一编号" name="germplasmResourcesCode" class="!mb-20px" required>
              <uni-easyinput :disabled="isHistory" v-model="formData.germplasmResourcesCode" placeholder="请输入唯一编号" :clearable="false" />
            </uni-forms-item>

            <uni-forms-item label="资源类型" name="germplasmType" class="!mb-20px" required>
              <view
                class="flex b-(1px solid #e5e5e5) items-center justify-between px-12px py-8px rounded-4px cursor-pointer"
                :class="isHistory ? 'bg-#F7F6F6' : 'bg-white'"
                @click="openTagSelector('germplasmType', germplasmResourceTypeDict)"
              >
                <text class="text-14px" :class="!formData.germplasmType || isHistory ? 'text-#d5d5d5' : 'text-#333'">
                  {{ formData.germplasmType || '请选择资源类型' }}
                </text>
                <uni-icons type="right" size="16" color="#c0c4cc"></uni-icons>
              </view>
            </uni-forms-item>
            <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputs.germplasmType && !isHistory">
              <text>资源类型上次输入：</text>
              <view class="flex-1 textEllipsis">{{ lastInputs.germplasmType }}</view>
              <button class="w-60px h-25px fc text-#fff bgPrimary text-12px" @click="applyLastInputValue('germplasmType', lastInputs.germplasmType)">
                应用
              </button>
            </view>

            <uni-forms-item label="采集部位" name="collectPart" class="!mb-20px" required>
              <uni-easyinput :disabled="isHistory" v-model="formData.collectPart" placeholder="请输入采集部位" :clearable="false" />
            </uni-forms-item>
            <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputs.collectPart && !isHistory">
              <text>采集部位上次输入：</text>
              <view class="flex-1 textEllipsis">{{ lastInputs.collectPart }}</view>
              <button class="w-60px h-25px fc text-#fff bgPrimary text-12px" @click="applyLastInputValue('collectPart', lastInputs.collectPart)">应用</button>
            </view>

            <uni-forms-item label="采集方式" name="collectMethod" class="!mb-12px">
              <view
                class="flex b-(1px solid #e5e5e5) items-center justify-between px-12px py-8px rounded-4px cursor-pointer"
                :class="isHistory ? 'bg-#F7F6F6' : 'bg-white'"
                @click="openTagSelector('collectMethod', germplasmCollectionMethodDict)"
              >
                <text class="text-14px" :class="!formData.collectMethod || isHistory ? 'text-#d5d5d5' : 'text-#333'">
                  {{ formData.collectMethod || '请选择采集方式' }}
                </text>
                <uni-icons type="right" size="16" color="#c0c4cc"></uni-icons>
              </view>
            </uni-forms-item>
            <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputs.collectMethod && !isHistory">
              <text>采集方式上次输入：</text>
              <view class="flex-1 textEllipsis">{{ lastInputs.collectMethod }}</view>
              <button class="w-60px h-25px fc text-#fff bgPrimary text-12px" @click="applyLastInputValue('collectMethod', lastInputs.collectMethod)">
                应用
              </button>
            </view>

            <uni-forms-item label="采集数量" name="collectQuantity" class="!mb-12px">
              <view class="flex items-center gap-10px">
                <uni-easyinput
                  :disabled="isHistory"
                  v-model="formData.collectQuantity"
                  placeholder="请输入数量"
                  type="number"
                  :clearable="false"
                  class="flex-1"
                />
                <view
                  class="w-100px flex b-(1px solid #e5e5e5) items-center justify-between px-12px py-8px rounded-4px cursor-pointer"
                  :class="isHistory ? 'bg-#F7F6F6' : 'bg-white'"
                  @click="openTagSelector('collectUnit', germplasmCollectionUnitDict)"
                >
                  <text class="text-14px" :class="!formData.collectUnit || isHistory ? 'text-#d5d5d5' : 'text-#333'">
                    {{ formData.collectUnit || '单位' }}
                  </text>
                  <uni-icons type="right" size="16" color="#c0c4cc"></uni-icons>
                </view>
              </view>
            </uni-forms-item>
            <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputs.collectQuantity && lastInputs.collectUnitType && !isHistory">
              <text>采集数量/单位上次输入：</text>
              <view class="flex-1 textEllipsis">{{ lastInputs.collectQuantity }} {{ lastInputs.collectUnitType }}</view>
              <button
                class="w-60px h-25px fc text-#fff bgPrimary text-12px"
                @click="
                  applyLastInputValue('collectQuantity', lastInputs.collectQuantity);
                  applyLastInputValue('collectUnit', lastInputs.collectUnitType);
                "
              >
                应用
              </button>
            </view>

            <uni-forms-item label="质量评估" name="sampleQualityAssessment" class="!mb-12px">
              <view
                class="flex b-(1px solid #e5e5e5) items-center justify-between px-12px py-8px rounded-4px cursor-pointer"
                :class="isHistory ? 'bg-#F7F6F6' : 'bg-white'"
                @click="openTagSelector('sampleQualityAssessment', germplasmQualityAssessmentDict)"
              >
                <text class="text-14px" :class="!formData.sampleQualityAssessment || isHistory ? 'text-#d5d5d5' : 'text-#333'">
                  {{ formData.sampleQualityAssessment || '请选择质量评估' }}
                </text>
                <uni-icons type="right" size="16" color="#c0c4cc"></uni-icons>
              </view>
            </uni-forms-item>
            <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputs.sampleQualityAssessment && !isHistory">
              <text>质量评估上次输入：</text>
              <view class="flex-1 textEllipsis">{{ lastInputs.sampleQualityAssessment }}</view>
              <button
                class="w-60px h-25px fc text-#fff bgPrimary text-12px"
                @click="applyLastInputValue('sampleQualityAssessment', lastInputs.sampleQualityAssessment)"
              >
                应用
              </button>
            </view>

            <uni-forms-item label="成熟度" name="collectMaturity" class="!mb-12px">
              <view
                class="flex b-(1px solid #e5e5e5) items-center justify-between px-12px py-8px rounded-4px cursor-pointer"
                :class="isHistory ? 'bg-#F7F6F6' : 'bg-white'"
                @click="openTagSelector('collectMaturity', germplasmMaturityDict)"
              >
                <text class="text-14px" :class="!formData.collectMaturity || isHistory ? 'text-#d5d5d5' : 'text-#333'">
                  {{ formData.collectMaturity || '请选择成熟度' }}
                </text>
                <uni-icons type="right" size="16" color="#c0c4cc"></uni-icons>
              </view>
            </uni-forms-item>
            <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputs.collectMaturity && !isHistory">
              <text>成熟度上次输入：</text>
              <view class="flex-1 textEllipsis">{{ lastInputs.collectMaturity }}</view>
              <button class="w-60px h-25px fc text-#fff bgPrimary text-12px" @click="applyLastInputValue('collectMaturity', lastInputs.collectMaturity)">
                应用
              </button>
            </view>

            <uni-forms-item label="外观描述" name="appearanceDescription" class="!mb-12px">
              <uni-easyinput :disabled="isHistory" v-model="formData.appearanceDescription" placeholder="请输入外观描述" type="textarea" :clearable="false" />
            </uni-forms-item>

            <uni-forms-item label="病虫害" name="pestDiseaseSituation">
              <view
                class="flex b-(1px solid #e5e5e5) items-center justify-between px-12px py-8px rounded-4px cursor-pointer"
                :class="isHistory ? 'bg-#F7F6F6' : 'bg-white'"
                @click="openTagSelector('pestDiseaseSituation', germplasmPestDiseaseDict)"
              >
                <text class="text-14px" :class="!formData.pestDiseaseSituation || isHistory ? 'text-#d5d5d5' : 'text-#333'">
                  {{ formData.pestDiseaseSituation || '请选择病虫害' }}
                </text>
                <uni-icons type="right" size="16" color="#c0c4cc"></uni-icons>
              </view>
            </uni-forms-item>
            <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputs.pestDiseaseSituation && !isHistory">
              <text>病虫害上次输入：</text>
              <view class="flex-1 textEllipsis">{{ lastInputs.pestDiseaseSituation }}</view>
              <button
                class="w-60px h-25px fc text-#fff bgPrimary text-12px"
                @click="applyLastInputValue('pestDiseaseSituation', lastInputs.pestDiseaseSituation)"
              >
                应用
              </button>
            </view>
          </view>

          <view class="w-full bg-#fff shadow-[0_5px_12px_1px_rgba(18,62,55,0.06)] rounded-8px p-12px mt-16px">
            <view class="w-full flex items-center p-12px pl0">
              <image src="@/static/images/icons/xianchang_chuli.png" mode="widthFix" class="w-16px" />
              <text class="ml-5px text-#333 font-bold text-14px">现场处理与封装</text>
            </view>

            <uni-forms-item label="初步处理" name="preliminaryTreatment" class="!mb-12px">
              <view
                class="flex b-(1px solid #e5e5e5) items-center justify-between px-12px py-8px rounded-4px cursor-pointer"
                :class="isHistory ? 'bg-#F7F6F6' : 'bg-white'"
                @click="openTagSelector('preliminaryTreatment', germplasmInitialProcessingDict)"
              >
                <text class="text-14px" :class="!formData.preliminaryTreatment || isHistory ? 'text-#d5d5d5' : 'text-#333'">
                  {{ formatInitialProcessingText }}
                </text>
                <uni-icons type="right" size="16" color="#c0c4cc"></uni-icons>
              </view>
            </uni-forms-item>
            <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputs.preliminaryTreatment && !isHistory">
              <text>初步处理上次输入：</text>
              <view class="flex-1 textEllipsis">{{ lastInputs.preliminaryTreatment }}</view>
              <button
                class="w-60px h-25px fc text-#fff bgPrimary text-12px"
                @click="applyLastInputValue('preliminaryTreatment', lastInputs.preliminaryTreatment)"
              >
                应用
              </button>
            </view>

            <uni-forms-item label="封装容器" name="containerPackaging" class="!mb-12px">
              <view
                class="flex b-(1px solid #e5e5e5) items-center justify-between px-12px py-8px rounded-4px cursor-pointer"
                :class="isHistory ? 'bg-#F7F6F6' : 'bg-white'"
                @click="openTagSelector('containerPackaging', germplasmPackagingContainerDict)"
              >
                <text class="text-14px" :class="!formData.containerPackaging || isHistory ? 'text-#d5d5d5' : 'text-#333'">
                  {{ formData.containerPackaging || '请选择封装容器' }}
                </text>
                <uni-icons type="right" size="16" color="#c0c4cc"></uni-icons>
              </view>
            </uni-forms-item>
            <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputs.containerPackaging && !isHistory">
              <text>封装容器上次输入：</text>
              <view class="flex-1 textEllipsis">{{ lastInputs.containerPackaging }}</view>
              <button class="w-60px h-25px fc text-#fff bgPrimary text-12px" @click="applyLastInputValue('containerPackaging', lastInputs.containerPackaging)">
                应用
              </button>
            </view>

            <uni-forms-item label="规格/数量" name="packagingSpecQuantity" class="!mb-12px">
              <uni-easyinput :disabled="isHistory" v-model="formData.packagingSpecQuantity" placeholder="请输入规格/数量" :clearable="false" />
            </uni-forms-item>

            <uni-forms-item label="标签核对" name="labelCheckConfirmation" class="!mb-0">
              <view class="flex items-center justify-between">
                <switch
                  style="transform: scale(0.7)"
                  :disabled="isHistory"
                  :checked="formData.labelCheckConfirmation"
                  @change="(e: any) => formData.labelCheckConfirmation = e.detail.value"
                />
              </view>
            </uni-forms-item>
            <view class="pl-5px">
              <text class="text-12px text-gray-600 flex-1 mr-10px">已确认物理标签上的编号与本表顶部的"种质资源唯一编号"完全一致。</text>
            </view>
          </view>

          <view class="w-full bg-#fff shadow-[0_5px_12px_1px_rgba(18,62,55,0.06)] rounded-8px p-12px mt-16px">
            <view class="w-full flex items-center p-12px pl0">
              <image src="@/static/images/icons/germplasm.png" mode="widthFix" class="w-16px" />
              <text class="ml-5px text-#333 font-bold text-14px">现场影像记录与备注</text>
            </view>

            <view class="w-full mb-20px">
              <view class="text-#606266 pb-10px text-14px">照片记录</view>
              <view class="w-full flex flex-wrap gap-10px">
                <!-- 样本特写 -->
                <view class="flex gap-10px flex-wrap">
                  <view class="flex flex-col items-center w-72px" @click="handlePhotoUpload('germplasmSampleCloseup')">
                    <view class="w-72px h-72px fc bg-#fff rounded-8px">
                      <image src="@/static/images/icons/img_thum.png" mode="widthFix" class="w-16px" />
                    </view>
                    <text class="text-14px text-#333">样本特写</text>
                  </view>
                  <!-- 已选择的照片/视频 -->
                  <view v-for="(photo, index) in formData.germplasmSampleCloseup" :key="index" class="relative flex flex-col items-center w-72px">
                    <view class="w-72px h-72px rounded-8px overflow-hidden">
                      <!-- 图片预览 -->
                      <image
                        v-if="checkIsImage(photo.id ? photo.path : photo.fileType)"
                        :src="photo.id ? photo.url : photo.tempFilePath || photo.path"
                        mode="aspectFill"
                        class="w-full h-full"
                        @click="previewImage(photo.id ? photo.url : photo.tempFilePath || photo.path)"
                      />
                      <!-- 视频预览 -->
                      <view
                        v-else-if="checkIsVideo(photo.id ? photo.path : photo.fileType)"
                        class="w-full h-full relative"
                        @click="handleVideoPlay(photo.id ? photo.url : photo.tempFilePath || photo.path)"
                      >
                        <image v-if="photo.thumbTempFilePath" :src="photo.thumbTempFilePath" class="w-full h-full object-cover rounded" mode="aspectFill" />
                        <view class="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                          <view class="w-25px h-25px rounded-full bg-#fff b-(2px solid #000) fc">
                            <view class="text-24px color-#000 iconfont icon-play"></view>
                          </view>
                        </view>
                      </view>
                    </view>
                    <view
                      v-if="!isHistory"
                      class="absolute top-2px right-2px bg-rgba(0,0,0,0.8) rounded-full fc w-20px h-20px"
                      @click.stop="removePhoto('germplasmSampleCloseup', index)"
                    >
                      <uni-icons type="close" size="12" color="#fe5359" />
                    </view>
                  </view>
                </view>
              </view>
            </view>

            <uni-forms-item label="备注" name="remarks">
              <uni-easyinput :disabled="isHistory" v-model="formData.remarks" placeholder="请输入备注" type="textarea" :clearable="false" />
            </uni-forms-item>
          </view>
        </uni-forms>
      </scroll-view>
    </view>
    <view class="w-full px-10px pb-15px flex items-center gap-10px bg-#f9f9fb z-9" v-if="!isHistory">
      <button class="flex-1 h-46px rounded-4px fc bgPrimary" @click="onHandleRandomFill" v-if="randomFillStatus">
        <text class="text-14px text-#fff font-medium">随机填充</text>
      </button>
      <button class="flex-1 h-46px rounded-4px fc bgPrimary" :loading="saveLoading" :disabled="saveLoading" @click="onSave">
        <text class="text-14px text-#fff font-medium">保存</text>
      </button>
    </view>

    <!-- TagSelectorPopup 弹窗 -->
    <uni-popup ref="tagSelectorPopup" type="bottom" background-color="transparent" @change="(e: any) => { if (!e.show) showTagSelector = false }">
      <TagSelectorPopup
        v-if="showTagSelector"
        :title="getFieldTitle(currentField)"
        :options="currentOptions"
        :model-value="(formData as any)[currentField]"
        :multiple="currentField === 'preliminaryTreatment'"
        :allow-custom="currentField !== 'preliminaryTreatment'"
        @confirm="handleTagConfirm"
        @close="closeTagSelector"
      />
    </uni-popup>

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
  </view>
</template>
