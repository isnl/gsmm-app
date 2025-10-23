<script lang="ts" setup>
import { useGlobalStore } from '@/stores/global';
import { useGermplasmStore } from '@/stores/germplasm';
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { storeToRefs } from 'pinia';
import { goBack, checkIsImage, checkIsVideo } from '@/utils';
import dayjs from 'dayjs';
import { ref } from 'vue';
import { GermplasmResources, GermplasmResourcesOrigin, GermplasmResourcesCollect } from './components/index';
import TagSelectorPopup from '@/components/TagSelectorPopup.vue';
import { useSurveyTokenStore } from '@/stores/token';
import { onLoad } from '@dcloudio/uni-app';
import { useGermplasmLisStore } from '@/stores/germplasm_list';
import type { Germplasm } from '@/stores/germplasm_list';
import { randomFill } from './randomFill';

const { statusBarHeight } = useStatusBarHeight();
const globalStore = useGlobalStore();
const germplasmStore = useGermplasmStore();
const surveyTokenStore = useSurveyTokenStore();
const germplasmListStore = useGermplasmLisStore();

const { getInfoById, updateGermplasmById } = germplasmListStore;

const { accountNumber } = storeToRefs(surveyTokenStore);
const { weatherDict, randomFillStatus } = storeToRefs(globalStore);
const { lastInputs } = storeToRefs(germplasmStore);

const tabs = [
  {
    name: '来源母体信息',
    value: 'germplasm_resources',
    component: GermplasmResources,
  },
  {
    name: '原生境信息',
    value: 'germplasm_resources_origin',
    component: GermplasmResourcesOrigin,
  },
  {
    name: '现场采集',
    value: 'germplasm_resources_collect',
    component: GermplasmResourcesCollect,
  },
];
const tabActived = ref('germplasm_resources');
const onTabChange = (value: string) => {
  tabActived.value = value;
};

const id = ref();
const currentInfo = ref<Germplasm>({});
const isHistory = ref(false);
onLoad((options: any) => {
  id.value = options.id;
  isHistory.value = !!options.isHistory;
  currentInfo.value = getInfoById(id.value, isHistory.value) as Germplasm;
  // 临时数据不为空 或者是 历史数据
  if (currentInfo.value.notTempData || isHistory.value) {
    fillEditDatas();
  }
});
/**
 * TODO:
 * 回填编辑数据
 */
const fillEditDatas = () => {
  formData.value = {
    codeNumber: currentInfo.value.codeNumber || '',
    collectTime: currentInfo.value.collectTime || '',
    weather: currentInfo.value.weather || '',
    collectTeam: currentInfo.value.collectTeam || '',
    collectPersonnel: currentInfo.value.collectPersonnel || '',
    parentHealthStatus: currentInfo.value.parentHealthStatus || '',
    hasPestsDiseases: currentInfo.value.hasPestsDiseases || '',
    phenotypeDescription: currentInfo.value.phenotypeDescription || '',
    communityEnvironment: currentInfo.value.communityEnvironment || '',
    signatureDate: currentInfo.value.signatureDate || '',
    // 照片记录
    fieldImageParentTree: currentInfo.value.fieldImageParentTree || [],
    fieldImageTrunkBase: currentInfo.value.fieldImageTrunkBase || [],
    fieldImageCrown: currentInfo.value.fieldImageCrown || [],
    fieldImageHabitat: currentInfo.value.fieldImageHabitat || [],
    // 签字记录
    collectorSignature: currentInfo.value.collectorSignature || [],
    recorderSignature: currentInfo.value.recorderSignature || [],
  };
};

const formData = ref({
  codeNumber: '',
  collectTime: dayjs().format('YYYY-MM-DD'),
  weather: '',
  collectTeam: '',
  collectPersonnel: '',
  parentHealthStatus: '',
  hasPestsDiseases: '',
  phenotypeDescription: '',
  communityEnvironment: '',
  signatureDate: dayjs().format('YYYY-MM-DD'),
  // 照片记录
  fieldImageParentTree: [] as any[], // 母树全貌
  fieldImageTrunkBase: [] as any[], // 树干基部
  fieldImageCrown: [] as any[], // 树冠
  fieldImageHabitat: [] as any[], // 生境环境
  // 签字记录
  collectorSignature: [] as any[], // 采集人签字
  recorderSignature: [] as any[], // 记录人签字
});

const onHandleRandomFill = () => {
  randomFill(formData);
};

// 表单验证规则
const rules = ref({
  codeNumber: {
    rules: [
      {
        required: true,
        errorMessage: '请输入挂牌编号',
      },
    ],
  },
  collectTime: {
    rules: [
      {
        required: true,
        errorMessage: '请选择采集日期',
      },
    ],
  },
  weather: {
    rules: [
      {
        required: true,
        errorMessage: '请选择天气状况',
      },
    ],
  },
  collectTeam: {
    rules: [
      {
        required: true,
        errorMessage: '请输入单位/团队',
      },
    ],
  },
  collectPersonnel: {
    rules: [
      {
        required: true,
        errorMessage: '请输入采集人员',
      },
    ],
  },
  parentHealthStatus: {
    rules: [
      {
        required: true,
        errorMessage: '请选择健康状况',
      },
    ],
  },
  hasPestsDiseases: {
    rules: [
      {
        required: true,
        errorMessage: '请选择或输入病虫害情况',
      },
    ],
  },
  phenotypeDescription: {
    rules: [
      {
        required: true,
        errorMessage: '请输入表型特征描述',
      },
    ],
  },
  communityEnvironment: {
    rules: [
      {
        required: true,
        errorMessage: '请输入群落环境描述',
      },
    ],
  },
});

// 组件引用
const formRef = ref<any>(null);
const germplasmResourcesRef = ref();
const germplasmResourcesOriginRef = ref();
const germplasmResourcesCollectRef = ref();
const saveLoading = ref(false);

const onFinish = async (isDone: boolean) => {
  formRef.value
    ?.validate()
    .then(res => {
      saveLoading.value = true;

      // 保存签字数据
      if (germplasmResourcesCollectRef.value?.saveSignaturesToFormData) {
        germplasmResourcesCollectRef.value.saveSignaturesToFormData();
      }

      const newInputs: Record<string, string> = {};
      if (formData.value.collectTeam && formData.value.collectTeam.trim()) {
        newInputs.collectTeam = formData.value.collectTeam.trim();
      }
      if (formData.value.collectPersonnel && formData.value.collectPersonnel.trim()) {
        newInputs.collectPersonnel = formData.value.collectPersonnel.trim();
      }
      if (Object.keys(newInputs).length > 0) {
        germplasmStore.setLastInputs(newInputs);
      }
      updateGermplasmById(id.value, {
        ...formData.value,
        status: isDone ? 'done' : 'saved',
      });
      saveLoading.value = false;
      goBack();
      uni.showToast({
        title: '保存成功',
        icon: 'success',
      });
    })
    .catch(error => {
      uni.showToast({
        title: '请填写必填项',
        icon: 'none',
      });
      saveLoading.value = false;
    });
};

// Tag选择器相关
const showTagSelector = ref(false);
const currentField = ref('');
const currentOptions = ref<any[]>([]);
const tagSelectorPopup = ref<any>(null);

// 打开Tag选择器
const openTagSelector = (field: string, options: any[]) => {
  if (isHistory.value) return;
  currentField.value = field;
  currentOptions.value = options;
  showTagSelector.value = true;
  tagSelectorPopup.value?.open();
};

// 获取字段的中文标题
const getFieldTitle = (field: string) => {
  const titleMap: Record<string, string> = {
    weather: '天气状况',
  };
  return titleMap[field] || field;
};

// 关闭Tag选择器
const closeTagSelector = () => {
  showTagSelector.value = false;
  tagSelectorPopup.value?.close();
};

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

// 确认Tag选择
const handleTagConfirm = (value: string) => {
  (formData.value as any)[currentField.value] = value;
  closeTagSelector();
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

// 快速填写应用
const applyLastInputValue = (key: string, value: string) => {
  (formData.value as any)[key] = value;
};

const onHandleBack = () => {
  if (!isHistory.value) {
    // 如果是临时数据，提醒是否保存
    if (!currentInfo.value.notTempData) {
      uni.showModal({
        title: '提示',
        content: '当前数据未保存，确定要离开吗？',
        success: res => {
          if (res.confirm) {
            goBack();
          }
        },
      });
    } else {
      goBack();
    }
  } else {
    goBack();
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
      <view class="flex items-center gap-10px px-10px py-24px">
        <view class="w-auto flex items-center" @click="onHandleBack">
          <uni-icons type="left" size="30" color="#fff"></uni-icons>
          <!-- TODO: 后续跟名称走 -->
          <text class="text-#fff text-18px font-bold">种质资源采集</text>
        </view>
      </view>
    </view>

    <!-- 页面内容 -->
    <view class="flex-1 overflow-hidden flex flex-col bg-#f9f9fb">
      <scroll-view :scroll-y="true" class="h-full">
        <!-- 基础信息填写 -->
        <uni-forms ref="formRef" :model="formData" :rules="rules" :label-width="100" label-align="right" class="p-15px">
          <!-- 挂牌编号 -->
          <uni-forms-item label="挂牌编号" name="codeNumber" class="!mb-20px" required>
            <uni-easyinput :disabled="isHistory" v-model="formData.codeNumber" placeholder="请输入挂牌编号" :clearable="false" />
          </uni-forms-item>

          <!-- 采集日期 -->
          <uni-forms-item label="采集日期" name="collectTime" class="!mb-20px" required>
            <uni-datetime-picker :disabled="isHistory" v-model="formData.collectTime" type="date" placeholder="请选择采集日期" :clear-icon="true" />
          </uni-forms-item>

          <!-- 天气状况 -->
          <uni-forms-item label="天气状况" name="weather" class="!mb-20px" required>
            <view
              class="flex b-(1px solid #e5e5e5) items-center justify-between px-12px py-8px rounded-4px cursor-pointer"
              :class="isHistory ? 'bg-#F7F6F6' : 'bg-#fff'"
              @click="openTagSelector('weather', weatherDict)"
            >
              <text class="text-14px" :class="!formData.weather || isHistory ? 'text-#d5d5d5' : 'text-#333'">
                {{ formData.weather || '请选择天气状况' }}
              </text>
              <uni-icons type="right" size="16" color="#c0c4cc"></uni-icons>
            </view>
          </uni-forms-item>

          <!-- 单位/团队 -->
          <uni-forms-item label="单位/团队" name="collectTeam" class="!mb-20px" required>
            <uni-easyinput :disabled="isHistory" v-model="formData.collectTeam" placeholder="请输入单位/团队" :clearable="false" />
          </uni-forms-item>
          <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputs.collectTeam && !isHistory">
            <text>单位/团队上次输入：</text>
            <view class="flex-1 textEllipsis">{{ lastInputs.collectTeam }}</view>
            <button class="w-60px h-25px fc text-#fff bgPrimary text-12px" @click="applyLastInputValue('collectTeam', lastInputs.collectTeam)">应用</button>
          </view>

          <!-- 采集人员 -->
          <uni-forms-item label="采集人员" name="collectPersonnel" class="!mb-20px" required>
            <uni-easyinput :disabled="isHistory" v-model="formData.collectPersonnel" placeholder="请输入采集人员" :clearable="false" />
          </uni-forms-item>
          <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputs.collectPersonnel && !isHistory">
            <text>采集人员上次输入：</text>
            <view class="flex-1 textEllipsis">{{ lastInputs.collectPersonnel }}</view>
            <button class="w-60px h-25px fc text-#fff bgPrimary text-12px" @click="applyLastInputValue('collectPersonnel', lastInputs.collectPersonnel)">
              应用
            </button>
          </view>

          <!-- 负责人 -->
          <uni-forms-item label="负责人" class="!mb-20px" v-if="accountNumber">
            <view class="h-full flex items-center">{{ accountNumber }}</view>
          </uni-forms-item>

          <view class="w-full">
            <view class="text-#606266 pb-10px text-14px">照片记录</view>
            <view class="w-full flex flex-col gap-10px">
              <!-- 母树全貌 -->
              <view class="flex gap-10px flex-wrap">
                <view class="flex flex-col items-center w-72px" @click="handlePhotoUpload('fieldImageParentTree')">
                  <view class="w-72px h-72px fc bg-#fff rounded-8px">
                    <image src="@/static/images/icons/img_thum.png" mode="widthFix" class="w-16px" />
                  </view>
                  <text class="text-14px text-#333">母树全貌</text>
                </view>
                <!-- 已选择的照片/视频 -->
                <view v-for="(photo, index) in formData.fieldImageParentTree" :key="index" class="relative flex flex-col items-center w-72px">
                  <view class="w-72px h-72px bg-#fff rounded-8px overflow-hidden">
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
                    @click.stop="removePhoto('fieldImageParentTree', index)"
                  >
                    <uni-icons type="close" size="12" color="#fe5359" />
                  </view>
                </view>
              </view>

              <!-- 树干基部 -->
              <view class="flex gap-10px flex-wrap">
                <view class="flex flex-col items-center w-72px" @click="handlePhotoUpload('fieldImageTrunkBase')">
                  <view class="w-72px h-72px fc bg-#fff rounded-8px">
                    <image src="@/static/images/icons/img_thum.png" mode="widthFix" class="w-16px" />
                  </view>
                  <text class="text-14px text-#333">树干基部</text>
                </view>
                <!-- 已选择的照片/视频 -->
                <view v-for="(photo, index) in formData.fieldImageTrunkBase" :key="index" class="relative flex flex-col items-center w-72px">
                  <view class="w-72px h-72px bg-#fff rounded-8px overflow-hidden">
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
                    @click.stop="removePhoto('fieldImageTrunkBase', index)"
                  >
                    <uni-icons type="close" size="12" color="#fe5359" />
                  </view>
                </view>
              </view>

              <!-- 树冠 -->
              <view class="flex gap-10px flex-wrap">
                <view class="flex flex-col items-center w-72px" @click="handlePhotoUpload('fieldImageCrown')">
                  <view class="w-72px h-72px fc bg-#fff rounded-8px">
                    <image src="@/static/images/icons/img_thum.png" mode="widthFix" class="w-16px" />
                  </view>
                  <text class="text-14px text-#333">树冠</text>
                </view>
                <!-- 已选择的照片/视频 -->
                <view v-for="(photo, index) in formData.fieldImageCrown" :key="index" class="relative flex flex-col items-center w-72px">
                  <view class="w-72px h-72px bg-#fff rounded-8px overflow-hidden">
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
                    @click.stop="removePhoto('fieldImageCrown', index)"
                  >
                    <uni-icons type="close" size="12" color="#fe5359" />
                  </view>
                </view>
              </view>

              <!-- 生境环境 -->
              <view class="flex gap-10px flex-wrap">
                <view class="flex flex-col items-center w-72px" @click="handlePhotoUpload('fieldImageHabitat')">
                  <view class="w-72px h-72px fc bg-#fff rounded-8px">
                    <image src="@/static/images/icons/img_thum.png" mode="widthFix" class="w-16px" />
                  </view>
                  <text class="text-14px text-#333">生境环境</text>
                </view>
                <!-- 已选择的照片/视频 -->
                <view v-for="(photo, index) in formData.fieldImageHabitat" :key="index" class="relative flex flex-col items-center w-72px">
                  <view class="w-72px h-72px bg-#fff rounded-8px overflow-hidden">
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
                    @click.stop="removePhoto('fieldImageHabitat', index)"
                  >
                    <uni-icons type="close" size="12" color="#fe5359" />
                  </view>
                </view>
              </view>
            </view>
          </view>

          <view class="w-full">
            <!-- tabs -->
            <view class="w-full flex py-12px sticky bg-#f9f9fb top-0">
              <view class="flex-1 fc" v-for="item in tabs" :key="item.value" @click="onTabChange(item.value)">
                <view class="flex items-center flex-col gap-3px">
                  <text class="text-14px" :class="tabActived === item.value ? 'text-#374663' : 'text-#516280'">{{ item.name }}</text>
                  <view
                    v-if="tabActived === item.value"
                    class="w-68px h-4px rounded-1px shadow-[0_2px_3px_1px_rgba(0,0,0,.16)] bg-gradient-to-b from-#08bd92 to-#07a47f"
                  ></view>
                  <view v-else class="w-68px h-4px"></view>
                </view>
              </view>
            </view>
            <!-- 内容 组件 -->
            <GermplasmResources
              ref="germplasmResourcesRef"
              :historyInfo="currentInfo"
              :isHistory="isHistory"
              v-show="tabActived === 'germplasm_resources'"
              :form-data="formData"
              @update:form-data="newFormData => (formData = newFormData)"
            />
            <GermplasmResourcesOrigin
              ref="germplasmResourcesOriginRef"
              :historyInfo="currentInfo"
              :isHistory="isHistory"
              v-show="tabActived === 'germplasm_resources_origin'"
              :form-data="formData"
              @update:form-data="newFormData => (formData = newFormData)"
            />
            <GermplasmResourcesCollect
              ref="germplasmResourcesCollectRef"
              :historyInfo="currentInfo"
              :isHistory="isHistory"
              v-show="tabActived === 'germplasm_resources_collect'"
              :form-data="formData"
              :currentId="id"
              @update:form-data="newFormData => (formData = newFormData)"
            />
          </view>
        </uni-forms>
      </scroll-view>
    </view>

    <!-- 底部按钮 -->
    <view class="w-full px-10px pb-15px flex items-center gap-10px bg-#f9f9fb z-9" v-if="!isHistory">
      <button class="flex-1 h-46px rounded-4px fc bgPrimary" @click="onHandleRandomFill" v-if="randomFillStatus">
        <text class="text-14px text-#fff font-medium">随机填充</text>
      </button>
      <button
        class="flex-1 h-46px rounded-4px fc"
        :disabled="saveLoading"
        :class="saveLoading ? 'bg-#ccc' : 'bg-#f2f2f6'"
        :loading="saveLoading"
        @click="onFinish(false)"
      >
        <text class="text-14px text-#333 font-medium">保存</text>
      </button>
      <button
        class="flex-1 h-46px rounded-4px fc"
        :disabled="saveLoading"
        :class="saveLoading ? 'bg-#ccc' : 'bgPrimary'"
        :loading="saveLoading"
        @click="onFinish(true)"
      >
        <text class="text-14px text-#fff font-medium">完成采集</text>
      </button>
    </view>

    <!-- TagSelectorPopup 弹窗 -->
    <uni-popup ref="tagSelectorPopup" type="bottom" background-color="transparent" @change="(e: any) => { if (!e.show) showTagSelector = false }">
      <TagSelectorPopup
        v-if="showTagSelector"
        :title="getFieldTitle(currentField)"
        :options="currentOptions"
        :model-value="(formData as any)[currentField]"
        :multiple="false"
        :allow-custom="true"
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
