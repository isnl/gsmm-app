<script lang="ts" setup>
import { ref } from 'vue';
import { onLoad, onReady } from '@dcloudio/uni-app';
import { usePlantTaskEditStore } from '@/stores/plant_task_edit';
import NavigateBar from '@/components/NavigateBar.vue';
import MapSelectionPopup from '@/components/MapSelectionPopup.vue';
import { checkIsImage, checkIsVideo } from '@/utils';
import type { PlantTaskCreateFormData } from '@/types';

const plantTaskEditStore = usePlantTaskEditStore();
const { clearCurrentEditData } = plantTaskEditStore;
// 类型定义
interface PopupRef {
  open: (type: string) => void;
  close: () => void;
}
const xcjlPopupRef = ref<PopupRef | null>(null);
const currentEditId = ref('');
const scrollTop = ref(0);
// 表单引用
const formRef = ref<any>(null);
// 表单数据
const formData = ref<any>({});
onLoad(async (options: any) => {
  const { id, longitude, latitude } = options;
  if (id) {
    currentEditId.value = id;
  }
});
// 回填表单数据的方法
const fillFormData = (data: any) => {
  formData.value = {
    describe: data.describe || '',
  };
  if (data.configNodeFiles && Array.isArray(data.configNodeFiles)) {
    formData.value.configNodeFiles = data.configNodeFiles || [];
  } else {
    formData.value.configNodeFiles = [];
  }
  if (data.id) {
    formData.value.id = data.id;
  }
};

// 地图选择弹窗相关
const mapSelectionVisible = ref(false);
const currentLatitude = ref<number | string>('');
const currentLongitude = ref<number | string>('');
const currentLocationName = ref('');

// 打开外部导航 - 迁出地
const openNavigationFrom = () => {
  currentLatitude.value = 98.17277261;
  currentLongitude.value = 116.2839111;
  currentLocationName.value = '迁出地';
  mapSelectionVisible.value = true;
};

// 打开外部导航 - 迁入地
const openNavigationTo = () => {
  currentLatitude.value = 98.17277261;
  currentLongitude.value = 116.2839111;
  currentLocationName.value = '迁入地';
  mapSelectionVisible.value = true;
};
const jdlist = ref([
  {
    name: '节点名称',
    details: '东侧3米处设直径1.2m混凝土树池（底部铺设15cm砾石层），南侧5米',
    annex: '某节点任务要求.PDF',
    date: '2020-09-01  14:00',
    type: 2,
  },
  {
    name: '节点名称',
    details: '东侧3米处设直径1.2m混凝土树池（底部铺设15cm砾石层），南侧5米',
    annex: '某节点任务要求.PDF',
    type: 1,
  },
  {
    name: '节点名称',
    details: '东侧3米处设直径1.2m混凝土树池（底部铺设15cm砾石层），南侧5米',
    annex: '某节点任务要求.PDF',
    type: 1,
  },
  {
    name: '节点名称',
    details: '东侧3米处设直径1.2m混凝土树池（底部铺设15cm砾石层），南侧5米为双向四车',
    annex: '某节点任务要求.PDF',
    type: 1,
  },
]);

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
    sizeType: ['compressed'], // 可以指定是原图还是压缩图
    maxDuration: 60, // 视频最长60秒
    camera: 'back', // 默认使用后置摄像头
    success: async (res: any) => {
      console.log('选择的文件', res);
      for (let i = 0; i < res.tempFiles.length; i++) {
        let file = res.tempFiles[i];
        if (file.fileType === 'image') {
          const realFilePath = await saveTempFileToPhone(file.tempFilePath);
          file.tempFilePath = realFilePath;
        } else if (file.fileType === 'video') {
          const realThumFilePath = await saveTempFileToPhone(file.thumbTempFilePath);
          file.thumbTempFilePath = realThumFilePath;
        }
      }
      if (res.tempFiles && res.tempFiles.length > 0) {
        formData.value.configNodeFiles = [...formData.value.configNodeFiles, ...res.tempFiles];
      }
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
        formData.value.configNodeFiles = [...formData.value.configNodeFiles, ...res.tempFiles];
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
  formData.value.configNodeFiles!.splice(index, 1);
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
const onFinish = () => {};
const handlexcjlPopup = (item: any) => {
  console.log(item);
  xcjlPopupRef.value?.open('bottom');
  fillFormData(item);
};
const handleLight = () => {};

const closePopup = () => {};
</script>
<template>
  <view class="w-full h-full flex flex-col bg-gradient-to-b from-#08bd92 to-#07a47f">
    <!-- TODO: 标题用编号+树木名称+移栽任务 -->
    <NavigateBar title="移栽任务" />
    <view class="w-full flex-1 flex flex-col bg-#F9F9FB overflow-hidden">
      <scroll-view class="flex-1 flex overflow-hidden" scroll-y :scroll-top="scrollTop">
        <view class="px-15px bg-#fff">
          <view class="flex text-16px h-32px line-height-32px">
            <text class="color-#516280 w-70px text-right">编号</text>
            <text class="color-#333 ml-20px">{{ plantTaskEditStore.currentEditData.treeCode }}</text>
          </view>
          <view class="flex text-16px h-32px line-height-32px">
            <text class="color-#516280 w-70px text-right">行政区</text>
            <text class="color-#333 ml-20px"> {{ plantTaskEditStore.currentEditData.areaName }}</text>
          </view>
          <view class="flex text-16px line-height-32px">
            <text class="color-#516280 w-70px text-right">迁出地</text>
            <view class="color-#333 ml-20px flex-1">
              <view class="flex justify-between items-center">
                <view> 98.17277261</view>
                <view>
                  <button class="text-white text-10px w-60px h-26px fc bg-#225ed5 rounded-5px" @click="openNavigationFrom">去这里</button>
                </view>
              </view>
              <view>116.2839111</view>
            </view>
          </view>
          <view class="flex text-16px line-height-32px">
            <text class="color-#516280 w-70px text-right">迁入地</text>
            <view class="color-#333 ml-20px flex-1">
              <view class="flex justify-between items-center">
                <view> 98.17277261</view>
                <view>
                  <button class="text-white text-10px w-60px h-26px fc bg-#225ed5 rounded-5px" @click="openNavigationTo">去这里</button>
                </view>
              </view>
              <view>116.2839111</view>
            </view>
          </view>
          <view class="flex text-16px h-32px line-height-32px">
            <text class="color-#516280 w-70px text-right">计划日期</text>
            <text class="color-#333 ml-20px"> 2020.06.01</text>
          </view>
        </view>
        <view class="bg-#F9F9FB">
          <view v-for="(item, index) in plantTaskEditStore.currentEditData.taskConfigNodeProgress" :key="index" class="flex">
            <view class="w-10% flex justify-center">
              <view class="relative">
                <view
                  class="w-20px h-20px mt-15px"
                  :class="!item.isFinish ? 'border-(2px solid #A0B0CB)' : 'border-(2px solid #058373)'"
                  style="border-radius: 50%"
                >
                </view>
                <view class="w-12px h-12px absolute top-19px left-4px" :class="!item.isFinish ? 'bg-#A0B0CB' : 'bg-#058373'" style="border-radius: 50%"></view>
                <view
                  v-if="index !== plantTaskEditStore.currentEditData.taskConfigNodeProgress.length - 1"
                  class="w-0px absolute left-8px"
                  :class="!item.isFinish ? 'border-(1px solid #A0B0CB)' : 'border-(1px solid #058373)'"
                  style="height: calc(100% - 20px)"
                ></view>
              </view>
            </view>
            <view class="w-88%" v-if="item.isFinish">
              <view class="color-#058373 my-10px">{{ item.nodeFinishDate }}</view>
              <view class="bg-#fff p-10px b-rd-16px">
                <view>
                  <view class="flex justify-between items-center">
                    <text>{{ item.name }}</text>
                    <view>
                      <button class="text-white text-10px w-60px h-26px fc bg-#225ed5 rounded-5px" @click="handlexcjlPopup(item)">编辑</button>
                    </view>
                  </view>
                  <view class="flex mt-10px justify-between">
                    <text class="color-#333 flex-1"> {{ item.details }}</text>
                  </view>
                  <view class="flex justify-between">
                    <text class="color-#516280 w-64px text-right">附件</text>
                    <text class="color-#333 flex-1 ml-20px"> {{ item.nodeFiles }}</text>
                  </view>
                </view>
              </view>
            </view>
            <view class="w-88%" v-else>
              <view class="color-#516280 my-10px">待完成</view>
              <view class="bg-#fff p-10px b-rd-16px">
                <view>
                  <view class="flex justify-between items-center">
                    <text>{{ item.name }}</text>
                    <view>
                      <button class="text-white text-10px w-60px h-26px fc bg-#08BD92 rounded-5px" @click="handlexcjlPopup(item)">完成</button>
                    </view>
                  </view>
                  <view class="flex mt-10px justify-between">
                    <text class="color-#516280 w-64px text-right">任务要求</text>
                    <text class="color-#333 flex-1 ml-20px"> {{ item.describe }}</text>
                  </view>
                  <view class="flex justify-between">
                    <text class="color-#516280 w-64px text-right">附件</text>
                    <text class="color-#333 flex-1 ml-20px"> {{ item.nodeFiles }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
      <view class="w-full pb-15px flex items-center gap-10px bg-#fff z-9">
        <view class="flex-1 h-46px bg-#f2f2f6 rounded-4px fc" @click="onFinish">
          <text class="text-14px text-#333 font-medium">保存</text>
        </view>
        <view class="flex-1 h-46px bgPrimary rounded-4px fc" @click="onFinish">
          <text class="text-14px text-#fff font-medium">完成移栽</text>
        </view>
      </view>
    </view>
    <uni-popup ref="xcjlPopupRef" type="bottom" :is-mask-click="true" @maskClick="closePopup">
      <view class="bg-white rounded-t-20px">
        <view class="pt-10px px-20px border-b-1px border-b-#f0f0f0">
          <text class="text-18px font-medium text-#333">选择批次</text>
        </view>
        <uni-forms ref="formRef" :model="formData" label-position="top" label-width="300" class="p-10px">
          <uni-forms-item label="现场记录" name="managementMeasures">
            <uni-easyinput v-model="formData.managementMeasures" type="textarea" placeholder="请输入现场记录" :clearable="false" maxlength="500" />
          </uni-forms-item>
          <uni-forms-item label="拍摄照片/视频" name="configNodeFiles" required>
            <view class="flex h-full w-full">
              <view class="flex items-center flex-col w-28vw h-25vw border border-dashed border-#00BF9F rounded-8px p-3px mr-2 mb-2" @click="handlePhotoUpload">
                <image src="@/static/images/icons/addImg.png" mode="widthFix" class="w-45px mt-10px"></image>
                <view class="flex items-center mt-5px">
                  <text class="text-gray-400 text-14px color-#00BF9F">新增照片/视频</text>
                </view>
              </view>

              <!-- 媒体文件预览列表 -->
              <view v-if="formData.configNodeFiles.length > 0" class="flex flex-wrap">
                <view
                  v-for="(media, index) in formData.configNodeFiles"
                  :key="index"
                  class="relative mr-2 mb-2 w-28vw h-25vw b-(1px dashed #e5e5e5) p-3px rounded-4px overflow-hidden box-border"
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
                    <!-- css画一个类似暂停按钮的箭头朝右的三角形  -->
                    <view class="absolute top-0 left-0 w-full h-full bg-rgba(0,0,0,0.5) rounded-full flex items-center justify-center">
                      <view class="w-32px h-32px bg-rgba(0,0,0,0.4) rounded-full flex items-center justify-center">
                        <view class="w-0 h-0 border-y-8px border-y-transparent border-l-14px border-l-#fff ml-2px" style="border-style: solid"></view>
                      </view>
                    </view>
                  </view>

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
          <view class="h-46px bgPrimary rounded-4px fc" @click="handleLight">
            <text class="text-14px text-#fff font-medium">点亮节点</text>
          </view>
        </uni-forms>
      </view>
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

    <!-- 地图选择弹窗 -->
    <MapSelectionPopup v-model:visible="mapSelectionVisible" :latitude="currentLatitude" :longitude="currentLongitude" :location-name="currentLocationName" />
  </view>
</template>
