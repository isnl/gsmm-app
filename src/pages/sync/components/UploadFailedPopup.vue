<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import { getAllImagesFromMultimedia, checkIsImage, checkIsVideo } from '@/utils';
import { storeToRefs } from 'pinia';
import { useSyncSurveyStore, type SyncItem } from '@/stores/sync_survey';
import { useSurveyEditStore } from '@/stores/survey_edit';
import { noUploadService, uploadService } from '@/service';
import { getSurveyList } from '@/hooks/useSync';
import dayjs from 'dayjs';

const syncSurveyStore = useSyncSurveyStore();
const { setCurrentEditData } = useSurveyEditStore();
const { syncErrorList } = storeToRefs(syncSurveyStore);
const { removeSyncItem } = syncSurveyStore;

interface Props {
  visible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:visible', 'handle-single-delete', 'handle-batch-cover', 'handle-batch-delete']);

const uploadFailedPopup = ref<any>(null);
const expandedItems = ref<Set<string>>(new Set());
const loadingItems = ref<Set<string>>(new Set()); // 正在加载的项目ID集合

const onHandleEdit = (item: SyncItem) => {
  // 将数据存储到pinia中
  setCurrentEditData(item.data);

  // 跳转到创建/编辑页面
  const url = item.data.id ? `/pages/survey_create/index?id=${item.data.id}` : `/pages/survey_create/index`;
  uni.navigateTo({ url });
};

// 监听弹窗显示状态
watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      uploadFailedPopup.value?.open('bottom');
    } else {
      uploadFailedPopup.value?.close();
    }
  },
);

// 弹窗状态变化处理
const onPopupChange = (e: any) => {
  emit('update:visible', e.show);
};

// 切换展开/收缩状态
const toggleExpand = (itemId: string) => {
  if (expandedItems.value.has(itemId)) {
    expandedItems.value.delete(itemId);
  } else {
    expandedItems.value.add(itemId);
  }
};

// 覆盖单个数据
const coverCurrentItem = async (syncItem: SyncItem) => {
  const { data, id, url } = syncItem;
  loadingItems.value.add(id); // 添加到加载集合

  try {
    let params: any = {
      isCover: true,
    };
    for (const key in data) {
      if (key !== 'multimedia' && key !== 'tempId' && key !== 'investigatorId' && key !== 'coverId') {
        if (key === 'location') {
          params['location.x'] = data.location.x;
          params['location.y'] = data.location.y;
        } else {
          // 有值才添加
          if (data[key]) {
            params[key] = data[key];
          }
        }
      }
    }
    const realPhotoFiles = data.multimedia.filter((item: any) => !item.id);
    const oldPhotos = data.multimedia.filter((item: any) => item.id);
    // 转换文件列表为uploadService所需格式
    let uploadPhotoFiles = [];
    // #ifdef H5
    uploadPhotoFiles = realPhotoFiles.map((file: any, index: number) => ({
      name: `multimedia[${index}]`, // 文件对应的key
      file,
    }));
    // #endif
    // #ifdef APP-PLUS
    uploadPhotoFiles = realPhotoFiles.map((file: any, index: number) => ({
      name: `multimedia[${index}]`, // 文件对应的key
      file: file.tempFilePath,
      uri: file.tempFilePath,
    }));
    // #endif
    let oldPhotoFiles = {};
    oldPhotos.forEach((item: any, index: number) => {
      // @ts-ignore
      oldPhotoFiles[`multimedia_[${index}].id`] = item.id;
      // @ts-ignore
      oldPhotoFiles[`multimedia_[${index}].name`] = item.name;
      // @ts-ignore
      oldPhotoFiles[`multimedia_[${index}].path`] = item.path;
      // @ts-ignore
      oldPhotoFiles[`multimedia_[${index}].url`] = item.url;
      // @ts-ignore
      oldPhotoFiles[`multimedia_[${index}].screenshotPath`] = item.screenshotPath;
      // @ts-ignore
      oldPhotoFiles[`multimedia_[${index}].type`] = item.type;
    });
    // 调用完成调查接口
    let res;
    if (uploadPhotoFiles.length) {
      res = await uploadService({
        url,
        files: uploadPhotoFiles,
        formData: { ...params, ...oldPhotoFiles },
      });
    } else {
      res = await noUploadService({
        url,
        method: 'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        params: { ...params, ...oldPhotoFiles },
      });
    }

    if (res && res.statusCode === 200) {
      uni.showToast({
        title: '覆盖成功',
        icon: 'success',
      });
      removeSyncItem(id);
      shouldHideFailedPopup();
      await getSurveyList();
    }
  } catch (error) {
    console.error('覆盖数据失败', error);
    uni.showToast({
      title: '覆盖失败，请重试',
      icon: 'none',
    });
  } finally {
    loadingItems.value.delete(id); // 从加载集合中移除
  }
};

// 处理单个数据覆盖
const handleSingleCover = (item: SyncItem) => {
  uni.showModal({
    title: '提示',
    content: '当前调查数据已存在，确定要覆盖吗？',
    success: res => {
      if (res.confirm) {
        coverCurrentItem(item);
      }
    },
  });
};

// 处理单个数据删除
const handleSingleDelete = (item: SyncItem) => {
  emit('handle-single-delete', item);
};

// 处理批量删除按钮点击
const handleBatchDelete = () => {
  emit('handle-batch-delete');
};

// 批量重置状态为待上传
const handleBatchReset = () => {
  syncErrorList.value.forEach(item => {
    item.status = 'pending';
    item.errorMessage = undefined;
  });
  emit('update:visible', false);
};

// 判断是否应该隐藏失败弹窗
const shouldHideFailedPopup = () => {
  if (!syncErrorList.value.length) {
    emit('update:visible', false);
  }
};

// 图片预览
const previewImage = (url: string = '') => {
  uni.previewImage({
    urls: [url],
  });
};

// 视频播放相关
const videoPopupRef = ref();
const currentVideoUrl = ref('');
const isVideoPlaying = ref(false);

const handleVideoPlay = (url: string = '') => {
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

// 解析测量信息
const getParsedMeasurementInfo = (measurementInfo: any) => {
  if (!measurementInfo) return null;

  try {
    let parsedInfo = null;

    if (typeof measurementInfo === 'string') {
      parsedInfo = JSON.parse(measurementInfo);
    } else if (typeof measurementInfo === 'object') {
      parsedInfo = measurementInfo;
    }

    // 检查解析后的对象是否有有效数据
    if (parsedInfo && typeof parsedInfo === 'object') {
      const hasValidData = Object.values(parsedInfo).some(value => value !== null && value !== undefined && value !== '');
      return hasValidData ? parsedInfo : null;
    }
  } catch (error) {
    console.error('解析测量信息失败:', error);
  }

  return null;
};
</script>

<template>
  <uni-popup ref="uploadFailedPopup" type="share" background-color="#fff" @change="onPopupChange">
    <div class="w-full h-70vh overflow-hidden flex flex-col">
      <!-- 标题栏 -->
      <view class="w-full flex fc justify-between px-15px py-12px border-b border-#eee">
        <text class="text-18px font-bold text-#333">失败数据</text>
        <text class="text-14px text-#666">共 {{ syncErrorList.length }} 条</text>
      </view>

      <!-- 失败数据列表 -->
      <view class="flex-1 overflow-hidden">
        <scroll-view :scroll-y="true" class="h-full px-15px">
          <view v-for="item in syncErrorList" :key="item.id" class="py-12px border-b border-#eee">
            <!-- 数据标题行 -->
            <view class="flex flex-col cursor-pointer" @click="toggleExpand(item.id)">
              <view class="flex items-center justify-between">
                <view class="flex-1">
                  <text class="text-16px font-bold text-#333"> {{ item.data.treeCode || '无编号' }}{{ item.data.treeSpecies || '未知树种' }} </text>
                </view>
                <uni-icons :type="expandedItems.has(item.id) ? 'bottom' : 'right'" size="20" color="#666" />
              </view>
              <view class="text-12px text-red">失败原因：{{ item.errorMessage || '- -' }}</view>
            </view>

            <!-- 详情数据 -->
            <view v-if="expandedItems.has(item.id)" class="mt-12px">
              <!-- 顶部图片和标题区域 -->
              <view class="w-full flex gap-20px p-15px">
                <!-- 树木图片轮播图 -->
                <swiper
                  v-if="getAllImagesFromMultimedia(item.data?.multimedia).length"
                  class="w-115px h-90px"
                  :indicator-dots="false"
                  :autoplay="true"
                  :interval="3000"
                  :duration="500"
                >
                  <swiper-item v-for="(media, index) in item.data?.multimedia" :key="index">
                    <!-- #ifdef APP-PLUS -->
                    <!-- 图片预览 -->
                    <image
                      v-if="checkIsImage(media.id ? media.path : media.fileType)"
                      :src="media.id ? media.url : media.tempFilePath"
                      @click="previewImage(media.id ? media.url : media.tempFilePath)"
                      class="w-full h-full object-cover rounded"
                      mode="aspectFill"
                    />
                    <!-- 视频预览 -->
                    <view
                      v-else-if="checkIsVideo(media.id ? media.path : media.fileType)"
                      class="w-full h-full relative"
                      @click="handleVideoPlay(media.id ? media.url : media.tempFilePath)"
                    >
                      <image v-if="media.thumbTempFilePath" :src="media.thumbTempFilePath" class="w-full h-full object-cover rounded" mode="aspectFill" />
                      <!-- css画一个类似暂停按钮的箭头朝右的三角形  -->
                      <view class="absolute top-0 left-0 w-full h-full bg-rgba(0,0,0,0.5) rounded-full flex items-center justify-center">
                        <view class="w-25px h-25px rounded-full bg-#fff b-(2px solid #000) fc">
                          <view class="text-24px color-#000 iconfont icon-play"></view>
                        </view>
                      </view>
                    </view>
                    <!-- #endif -->
                  </swiper-item>
                </swiper>
                <view v-else class="w-115px h-90px fc text-12px b-(1px dashed #eee)"> 暂无图片 </view>

                <!-- 标题部分 -->
                <view class="flex flex-col gap-5px justify-between">
                  <text class="text-20px font-bold text-#333">{{ item.data?.treeSpecies || '未知树种' }}</text>
                  <text class="text-14px text-#666">{{ item.data?.treeCode || '无编号' }}</text>
                  <text class="text-14px text-#666">挂牌编号：{{ item.data?.codeNumber || '无编号' }}</text>
                  <text v-if="item.data?.type" class="text-14px text-#666">树种类型：{{ item.data.type }}</text>
                  <text class="text-14px text-#666">{{ item.data?.areaName || '' }}</text>
                </view>
              </view>

              <!-- 拉丁学名 -->
              <view v-if="item.data.latinName" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">拉丁学名</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.latinName }}</text>
              </view>

              <!-- 科 -->
              <view v-if="item.data.family" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">科</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.family }}</text>
              </view>

              <!-- 属 -->
              <view v-if="item.data.genus" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">属</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.genus }}</text>
              </view>

              <!-- 种 -->
              <view v-if="item.data.species" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">种</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.species }}</text>
              </view>

              <!-- 乡（镇） -->
              <view v-if="item.data.town" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">乡（镇）</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.town }}</text>
              </view>

              <!-- 村 -->
              <view v-if="item.data.village" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">村</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.village }}</text>
              </view>

              <!-- 小地名 -->
              <view v-if="item.data.smallPlaceName" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">小地名</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.smallPlaceName }}</text>
              </view>

              <!-- 经纬度 -->
              <view v-if="item.data.location?.x || item.data.location?.y" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">经纬度</text>
                <view class="flex-1">
                  <text v-if="item.data.location?.x" class="text-14px text-#333">{{ item.data.location.x }}</text>
                  <text v-if="item.data.location?.y" class="block text-14px text-#333">{{ item.data.location.y }}</text>
                </view>
              </view>

              <!-- 海拔 -->
              <view v-if="item.data.altitude" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">海拔</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.altitude + '米' }}</text>
              </view>

              <!-- 保护类型 -->
              <view v-if="item.data.protectionType" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">保护类型</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.protectionType }}</text>
              </view>

              <!-- 等级 -->
              <view v-if="item.data.protectionLevel" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">等级</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.protectionLevel }}</text>
              </view>

              <!-- 树高 -->
              <view v-if="item.data.treeHeight" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">树高</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.treeHeight + '米' }}</text>
              </view>

              <!-- 冠幅 -->
              <view v-if="item.data.crownWidth" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">冠幅</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.crownWidth + '米' }}</text>
              </view>

              <!-- 测量维度 -->
              <view v-if="item.data.measurementDimensionType" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">测量维度</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.measurementDimensionType }}</text>
              </view>

              <!-- 测量信息 -->
              <view v-if="getParsedMeasurementInfo(item.data.measurementInfo)" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">测量信息</text>
                <view class="flex-1 text-14px text-#333">
                  <view v-for="(value, key) in getParsedMeasurementInfo(item.data.measurementInfo)" :key="key" v-if="value">
                    <text v-if="key === 'chestDiameter'">胸径: {{ value }}厘米</text>
                    <text v-else-if="key === 'groundDiameter'">地径: {{ value }}厘米</text>
                    <text v-else-if="key === 'distributionDiameter'">分布直径: {{ value }}厘米</text>
                    <text v-else-if="key === 'branchCount'">分支数量: {{ value }}个</text>
                    <text v-else-if="key === 'farthestDiameter'">离中心点最远的树木的胸径/直径: {{ value }}厘米</text>
                  </view>
                </view>
              </view>

              <!-- 规格 -->
              <view v-if="item.data.specs" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">规格</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.specs + '厘米' }}</text>
              </view>

              <!-- 枝下高 -->
              <view v-if="item.data.underBranchHeight" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">枝下高</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.underBranchHeight + '米' }}</text>
              </view>

              <!-- 树龄 -->
              <view v-if="item.data.estimatedAge" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">树龄</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.estimatedAge + '年' }}</text>
              </view>

              <!-- 俗名 -->
              <view v-if="item.data.commonName" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">俗名</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.commonName }}</text>
              </view>

              <!-- 权属单位 -->
              <view v-if="item.data.ownershipUnit" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">权属单位</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.ownershipUnit }}</text>
              </view>

              <!-- 生长势 -->
              <view v-if="item.data.healthStatus" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">生长势</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.healthStatus }}</text>
              </view>

              <!-- 生长环境 -->
              <view v-if="item.data.growthEnvironment" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">生长环境</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.growthEnvironment }}</text>
              </view>

              <!-- 是否具备移植条件 -->
              <view v-if="item.data.isTransplant" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">是否具备移植条件</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.isTransplant === 'true' ? '是' : '否' }}</text>
              </view>

              <!-- 不可移植原因 -->
              <view v-if="item.data.notTransplant" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">不可移植原因</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.notTransplant }}</text>
              </view>

              <!-- 历史典故 -->
              <view v-if="item.data.historicalAnecdotes" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">历史典故</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.historicalAnecdotes }}</text>
              </view>

              <!-- 是否稀有物种 -->
              <view v-if="item.data.isRareSpecies !== null && item.data.isRareSpecies !== ''" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">稀有物种</text>
                <text class="flex-1 text-14px text-#333">{{ item.data?.isRareSpecies == 'true' || item.data?.isRareSpecies == true ? '是' : '否' }}</text>
              </view>

              <!-- 发现日期 -->
              <view v-if="item.data.discoveryDate" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">发现日期</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.discoveryDate }}</text>
              </view>

              <!-- 批次 -->
              <view v-if="item.data.batch" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">批次</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.batch }}</text>
              </view>

              <!-- 地块名称 -->
              <view v-if="item.data.landParcelsName" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">地块名称</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.landParcelsName }}</text>
              </view>

              <!-- 调查人员 -->
              <view v-if="item.data.investigatorName" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">调查人员</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.investigatorName }}</text>
              </view>

              <!-- 调查时间 -->
              <view v-if="item.data.finishDate" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">调查时间</text>
                <text class="flex-1 text-14px text-#333">{{ dayjs(item.data.finishDate).format('YYYY-MM-DD HH:mm:ss') }}</text>
              </view>

              <!-- 修改时间 -->
              <view v-if="item.data.updateDate" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">调查时间</text>
                <text class="flex-1 text-14px text-#333">{{ dayjs(item.data.updateDate).format('YYYY-MM-DD HH:mm:ss') }}</text>
              </view>

              <!-- 面积 -->
              <view v-if="item.data.area" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">面积</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.area + '㎡' }}</text>
              </view>

              <!-- 数量 -->
              <view v-if="item.data.quantity" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">数量</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.quantity + '株' }}</text>
              </view>

              <!-- 移栽方案 -->
              <view v-if="item.data.transplantPlan" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">移栽方案</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.transplantPlan }}</text>
              </view>

              <!-- 地类 -->
              <view v-if="item.data.landType" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">地类</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.landType }}</text>
              </view>

              <!-- 土壤类型 -->
              <view v-if="item.data.soilTexture" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">土壤类型</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.soilTexture }}</text>
              </view>

              <!-- 土层厚度 -->
              <view v-if="item.data.soilLayerThickness" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">土层厚度</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.soilLayerThickness }}厘米</text>
              </view>

              <!-- 坡度 -->
              <view v-if="item.data.slope" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">坡度</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.slope }}</text>
              </view>

              <!-- 坡向 -->
              <view v-if="item.data.aspect" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">坡向</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.aspect }}</text>
              </view>

              <!-- 坡位 -->
              <view v-if="item.data.slopePosition" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">坡位</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.slopePosition }}</text>
              </view>

              <!-- 迁出地 -->
              <view v-if="item.data.relocationPlace" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">迁出地</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.relocationPlace }}</text>
              </view>

              <!-- 立地条件 -->
              <view v-if="item.data.siteConditionDesc" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">立地条件</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.siteConditionDesc }}</text>
              </view>

              <!-- 现有保护措施 -->
              <view v-if="item.data.protectionMeasureType" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">现有保护措施</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.protectionMeasureType }}</text>
              </view>

              <!-- 组员 -->
              <view v-if="item.data.team" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">组员</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.team }}</text>
              </view>

              <!-- 迁地保护 -->
              <view v-if="item.data.relocationProtection" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">迁地保护</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.relocationProtection }}</text>
              </view>

              <!-- 管护措施 -->
              <view v-if="item.data.managementMeasures" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">管护措施</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.managementMeasures }}</text>
              </view>

              <!-- 工程进度 -->
              <view v-if="item.data.projectSchedule" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">工程进度</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.projectSchedule }}</text>
              </view>

              <!-- 用工量统计 -->
              <view v-if="item.data.laborStatistics" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">用工量统计</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.laborStatistics }}</text>
              </view>

              <!-- 投资概算 -->
              <view v-if="item.data.investmentEstimate" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">投资概算</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.investmentEstimate + '元' }}</text>
              </view>

              <!-- 行政区划代码 -->
              <view v-if="item.data.areaCode" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">区划代码</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.areaCode }}</text>
              </view>

              <!-- 创建时间 -->
              <view v-if="item.data.createdAt" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">创建时间</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.createdAt }}</text>
              </view>

              <!-- 更新时间 -->
              <view v-if="item.data.updatedAt" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">更新时间</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.updatedAt }}</text>
              </view>

              <!-- 备注 -->
              <view v-if="item.data.remarks" class="flex gap-20px py-8px border-b border-#eee">
                <text class="w-100px text-right text-14px text-#516280">备注</text>
                <text class="flex-1 text-14px text-#333">{{ item.data.remarks }}</text>
              </view>

              <!-- 单个数据操作按钮 -->
              <view class="flex items-center gap-12px mt-12px pt-12px border-t border-#eee">
                <button class="flex-1 h-36px text-#fff bg-#225ed5 text-14px rounded-5px fc" @click="onHandleEdit(item)">编辑</button>
                <button
                  class="flex-1 h-36px text-#fff bg-#225ed5 text-14px rounded-5px fc"
                  @click="handleSingleCover(item)"
                  v-if="item.data.coverId"
                  :loading="loadingItems.has(item.id)"
                  :disabled="loadingItems.has(item.id)"
                >
                  {{ loadingItems.has(item.id) ? '覆盖中...' : '覆盖' }}
                </button>
                <button class="flex-1 h-36px text-#fff bg-#ff6a6a text-14px rounded-5px fc" @click="handleSingleDelete(item)">删除</button>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 底部按钮 -->
      <view v-if="syncErrorList.length" class="w-full px-15px py-12px bg-white border-t border-#eee">
        <view class="text-12px text-#666 mb-10px">提示： 批量状态重置可将当前所有失败数据重置为待上传状态 </view>
        <view class="flex items-center gap-12px">
          <button class="flex-1 h-44px text-#fff bgPrimary text-16px rounded-5px fc font-bold" @click="handleBatchReset">批量状态重置</button>
          <button class="flex-1 h-44px text-#fff bg-#ff6a6a text-16px rounded-5px fc font-bold" @click="handleBatchDelete">批量删除</button>
        </view>
      </view>
    </div>
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
</template>
