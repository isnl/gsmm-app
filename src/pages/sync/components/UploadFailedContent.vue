<script lang="ts" setup>
import { ref, computed } from 'vue';
import { getAllImagesFromMultimedia, checkIsImage, checkIsVideo } from '@/utils';
import { storeToRefs } from 'pinia';
import { useSyncSurveyStore, type SyncItem } from '@/stores/sync_survey';
import { useSurveyEditStore } from '@/stores/survey_edit';
import { noUploadService, uploadService } from '@/service';
import { getSurveyList } from '@/hooks/useSync';

const syncSurveyStore = useSyncSurveyStore();
const { setCurrentEditData } = useSurveyEditStore();
const { syncErrorList } = storeToRefs(syncSurveyStore);
const { removeSyncItem } = syncSurveyStore;

// 定义 emits
const emit = defineEmits(['handle-single-delete', 'handle-batch-cover', 'handle-batch-delete']);

const expandedItems = ref<Set<string>>(new Set());
const loadingItems = ref<Set<string>>(new Set()); // 正在加载的项目ID集合

const onHandleEdit = (item: SyncItem) => {
  // 将数据存储到pinia中
  setCurrentEditData(item.data);

  // 跳转到创建/编辑页面
  const url = item.data.id ? `/pages/survey_create/index?id=${item.data.id}` : `/pages/survey_create/index`;
  uni.navigateTo({ url });
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

    let oldPhotoFiles: any = {};
    oldPhotos.forEach((photo: any, index: number) => {
      oldPhotoFiles[`multimedia[${realPhotoFiles.length + index}]`] = photo.id;
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
  // 这里不需要关闭弹窗，因为现在是内容组件
};

// 判断是否应该隐藏失败弹窗
const shouldHideFailedPopup = () => {
  // 这个逻辑现在由父组件处理
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
</script>

<template>
  <view class="h-full flex flex-col">
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

        <!-- 空状态 -->
        <view v-if="syncErrorList.length === 0" class="py-40px text-center text-#999"> 暂无失败数据 </view>
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
  </view>

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
