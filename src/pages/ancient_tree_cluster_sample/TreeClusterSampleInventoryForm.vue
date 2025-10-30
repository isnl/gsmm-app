<script lang="ts" setup>
import { ref, watch } from 'vue';
import { samplingMethodOptions, slopePositionOptions, soilCompactnessOptions, soilThicknessOptions, slopeGradeOptions, slopeAspectOptions } from './constants';
import VideoPlayerPopup from '@/components/VideoPlayerPopup.vue';

// 抽样古树信息项的类型定义
interface SampleTreeItem {
  id: string;
  gsbh: string; // 古树编号
  sz: string; // 树种
  sl: string; // 树龄
  xj: string; // 胸径/cm
  sg: string; // 树高/m
  pjgf: string; // 平均冠幅/m
  jd: string; // 经度
  wd: string; // 纬度
}

// 定义 Props
const props = defineProps<{
  formData: any;
  isEditMode?: boolean; // 是否为编辑模式
}>();

// 定义 Emits
const emit = defineEmits<{
  update: [data: any];
}>();

// 本地表单数据（字段缩写）
const localFormData = ref({
  gsqId: '', // 古树群ID
  gsqbh: '', // 古树群编号
  cydch: '', // 抽样调查号
  cyff: '', // 抽样方法（样方/样带）
  cyMj: '', // 面积（样方/样带）
  pw: '', // 坡位
  trjmd: '', // 土壤紧密度
  tchd: '', // 土层厚度
  pd: '', // 坡度
  px: '', // 坡向
  xnJiao: '', // 样方（带）西南角
  dbJiao: '', // 样方（带）东北角
  xbJiao: '', // 样方（带）西北角
  dnJiao: '', // 样方（带）东南角
  zpsm: '', // 照片及说明
  bz: '', // 备注
  jd: '', // 经度
  wd: '', // 纬度
  cygsxx: [] as SampleTreeItem[], // 抽样古树信息
  // 照片/视频字段
  fieldImageTrunkBase: [], // 照片
});

// 视频播放弹窗引用
const videoPlayerPopupRef = ref();

// 当前正在上传的字段类型
const currentUploadFieldType = ref('');

// 判断是否为图片
const checkIsImage = (fileType: string) => {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'image'];
  if (!fileType) return false;
  const type = fileType.toLowerCase();

  // 如果包含路径分隔符，说明是路径，提取后缀名
  if (type.includes('/') || type.includes('\\')) {
    const extension = type.split('.').pop()?.split('?')[0] || '';
    return imageTypes.includes(extension);
  }

  // 否则直接判断
  return imageTypes.some(t => type.includes(t));
};

// 判断是否为视频
const checkIsVideo = (fileType: string) => {
  const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'video'];
  if (!fileType) return false;
  const type = fileType.toLowerCase();

  // 如果包含路径分隔符，说明是路径，提取后缀名
  if (type.includes('/') || type.includes('\\')) {
    const extension = type.split('.').pop()?.split('?')[0] || '';
    return videoTypes.includes(extension);
  }

  // 否则直接判断
  return videoTypes.some(t => type.includes(t));
};

// 处理照片/视频上传
const handlePhotoUpload = (fieldType: string) => {
  currentUploadFieldType.value = fieldType;

  uni.showActionSheet({
    itemList: ['拍照', '从相册选择', '拍摄视频', '从相册选择视频'],
    success: res => {
      if (res.tapIndex === 0) {
        chooseImage('camera');
      } else if (res.tapIndex === 1) {
        chooseImage('album');
      } else if (res.tapIndex === 2) {
        chooseVideo('camera');
      } else if (res.tapIndex === 3) {
        chooseVideo('album');
      }
    },
  });
};

// 选择图片
const chooseImage = (sourceType: 'camera' | 'album') => {
  uni.chooseImage({
    count: 9,
    sizeType: ['compressed'],
    sourceType: [sourceType],
    success: res => {
      console.log('选择的图片:', res);
      res.tempFilePaths.forEach((path, index) => {
        const fileInfo = res.tempFiles[index];
        const photo = {
          tempFilePath: path,
          path: path,
          fileType: 'image',
          size: fileInfo.size,
          name: fileInfo.name || `image_${Date.now()}.jpg`,
        };
        localFormData.value[currentUploadFieldType.value].push(photo);
      });
      uni.showToast({
        title: `已添加${res.tempFilePaths.length}张图片`,
        icon: 'success',
      });
    },
    fail: err => {
      console.error('选择图片失败:', err);
      uni.showToast({
        title: '选择图片失败',
        icon: 'none',
      });
    },
  });
};

// 选择视频
const chooseVideo = (sourceType: 'camera' | 'album') => {
  uni.chooseVideo({
    sourceType: [sourceType],
    maxDuration: 60,
    camera: 'back',
    success: res => {
      console.log('选择的视频:', res);

      const video = {
        tempFilePath: res.tempFilePath,
        path: res.tempFilePath,
        fileType: 'video',
        size: res.size,
        duration: res.duration,
        width: res.width,
        height: res.height,
        thumbTempFilePath: res.thumbTempFilePath,
        name: `video_${Date.now()}.mp4`,
      };

      localFormData.value[currentUploadFieldType.value].push(video);

      uni.showToast({
        title: '已添加视频',
        icon: 'success',
      });
    },
    fail: err => {
      console.error('选择视频失败:', err);
      uni.showToast({
        title: '选择视频失败',
        icon: 'none',
      });
    },
  });
};

// 移除照片/视频
const removePhoto = (fieldType: string, index: number) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除这张照片/视频吗？',
    success: res => {
      if (res.confirm) {
        localFormData.value[fieldType].splice(index, 1);
        uni.showToast({
          title: '删除成功',
          icon: 'success',
        });
      }
    },
  });
};

// 预览图片
const previewImage = (current: string) => {
  const allImages: string[] = [];

  localFormData.value['fieldImageTrunkBase'].forEach((photo: any) => {
    if (checkIsImage(photo.id ? photo.path : photo.fileType)) {
      const url = photo.id ? photo.url : photo.tempFilePath || photo.path;
      allImages.push(url);
    }
  });

  uni.previewImage({
    current,
    urls: allImages,
  });
};

// 播放视频
const handleVideoPlay = (videoPath: string) => {
  console.log('播放视频:', videoPath);
  videoPlayerPopupRef.value?.open(videoPath);
};
// 监听表单数据变化
watch(
  localFormData,
  newVal => {
    emit('update', newVal);
  },
  { deep: true },
);

// 监听外部传入的formData
watch(
  () => props.formData,
  newVal => {
    if (newVal && Object.keys(newVal).length > 0) {
      Object.assign(localFormData.value, newVal);
      // 确保 cygsxx 是数组
      if (!Array.isArray(localFormData.value.cygsxx)) {
        localFormData.value.cygsxx = [];
      }
    }
  },
  { immediate: true },
);

// 是否为历史记录（禁止编辑）
const isHistory = ref(false);

// 跳转到古树信息新增页面
const goToAddSampleTree = () => {
  // 跳转到古树信息新增页面，带上当前表单数据
  uni.navigateTo({
    url: '/pages/ancient_tree_cluster_sample/addSampleTree',
  });
};

// 编辑抽样古树
const editSampleTree = (item: SampleTreeItem) => {
  uni.navigateTo({
    url: `/pages/ancient_tree_cluster_sample/addSampleTree?id=${item.id}`,
  });
};

// 删除抽样古树
const deleteSampleTree = (id: string) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除吗？',
    success: res => {
      if (res.confirm) {
        const index = localFormData.value.cygsxx.findIndex(item => item.id === id);
        if (index > -1) {
          localFormData.value.cygsxx.splice(index, 1);
          uni.showToast({
            title: '删除成功',
            icon: 'success',
          });
        }
      }
    },
  });
};

// 从其他页面返回时接收数据
// @ts-ignore
uni.$on('addSampleTreeData', (data: SampleTreeItem) => {
  const index = localFormData.value.cygsxx.findIndex(item => item.id === data.id);
  if (index > -1) {
    // 更新现有数据
    localFormData.value.cygsxx[index] = data;
  } else {
    // 添加新数据
    localFormData.value.cygsxx.push(data);
  }
});
</script>

<template>
  <view class="w-full">
    <view class="px-20px py-20px">
      <!-- 基本信息 -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">基本信息</text>
        </view>

        <!-- 古树群编号 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">古树群编号</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-easyinput v-model="localFormData.gsqbh" placeholder="请输入古树群编号" :clearable="true" :disabled="true"></uni-easyinput>
        </view>

        <!-- 抽样调查号 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">抽样调查号</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-easyinput v-model="localFormData.cydch" placeholder="请输入抽样调查号" :clearable="true" :disabled="isEditMode"></uni-easyinput>
        </view>

        <!-- 经度 -->
        <view v-if="localFormData.jd" class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">经度</text>
          </view>
          <uni-easyinput v-model="localFormData.jd" type="digit" placeholder="保留6位小数" :clearable="true"></uni-easyinput>
        </view>

        <!-- 纬度 -->
        <view v-if="localFormData.wd" class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">纬度</text>
          </view>
          <uni-easyinput v-model="localFormData.wd" type="digit" placeholder="保留6位小数" :clearable="true"></uni-easyinput>
        </view>
      </view>

      <!-- 抽样方法 -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">抽样方法</text>
        </view>

        <view class="mb-15px">
          <uni-data-select v-model="localFormData.cyff" :localdata="samplingMethodOptions" placeholder="请选择抽样方法"></uni-data-select>
        </view>
      </view>

      <!-- 样方/样带信息 -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">{{ localFormData.cyff || '样方/样带' }}信息</text>
        </view>

        <!-- 面积 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">面积</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.cyMj" type="digit" placeholder="请输入面积" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">㎡</text>
          </view>
        </view>

        <!-- 坡位 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">坡位</text>
          </view>
          <uni-data-select v-model="localFormData.pw" :localdata="slopePositionOptions" placeholder="请选择坡位"></uni-data-select>
        </view>

        <!-- 土壤紧密度 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">土壤紧密度</text>
          </view>
          <uni-data-select v-model="localFormData.trjmd" :localdata="soilCompactnessOptions" placeholder="请选择土壤紧密度"></uni-data-select>
        </view>

        <!-- 土层厚度 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">土层厚度</text>
          </view>
          <uni-data-select v-model="localFormData.tchd" :localdata="soilThicknessOptions" placeholder="请选择土层厚度"></uni-data-select>
        </view>

        <!-- 坡度 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">坡度</text>
          </view>
          <uni-data-select v-model="localFormData.pd" :localdata="slopeGradeOptions" placeholder="请选择坡度"></uni-data-select>
        </view>

        <!-- 坡向 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">坡向</text>
          </view>
          <uni-data-select v-model="localFormData.px" :localdata="slopeAspectOptions" placeholder="请选择坡向"></uni-data-select>
        </view>
      </view>

      <!-- 坐标信息 -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">坐标信息</text>
        </view>

        <!-- 样方（带）西南角 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">样方（带）西南角</text>
          </view>
          <uni-easyinput v-model="localFormData.xnJiao" placeholder="请输入坐标" :clearable="true"></uni-easyinput>
        </view>
        <!-- 样方（带）东北角 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">样方（带）东北角</text>
          </view>
          <uni-easyinput v-model="localFormData.dbJiao" placeholder="请输入坐标" :clearable="true"></uni-easyinput>
        </view>

        <!-- 样方（带）西北角 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">样方（带）西北角</text>
          </view>
          <uni-easyinput v-model="localFormData.xbJiao" placeholder="请输入坐标" :clearable="true"></uni-easyinput>
        </view>

        <!-- 样方（带）东南角 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">样方（带）东南角</text>
          </view>
          <uni-easyinput v-model="localFormData.dnJiao" placeholder="请输入坐标" :clearable="true"></uni-easyinput>
        </view>
      </view>

      <!-- 照片及说明 -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">照片及说明</text>
          <text class="text-12px color-red ml-5px">*</text>
        </view>
        <view class="w-full flex flex-col gap-10px">
          <view class="flex gap-10px flex-wrap">
            <view class="flex flex-col items-center w-72px" @click="handlePhotoUpload('fieldImageTrunkBase')">
              <view class="w-72px h-72px fc bg-#fff rounded-8px border-1px border-dashed border-#ddd">
                <image src="@/static/images/icons/img_thum.png" mode="widthFix" class="w-16px" />
              </view>
            </view>
            <!-- 已选择的照片/视频 -->
            <view v-for="(photo, index) in localFormData.fieldImageTrunkBase" :key="index" class="relative flex flex-col items-center w-72px">
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
                class="absolute top-0 right-0 bg-rgba(0,0,0,0.8) rounded-full fc w-20px h-20px"
                @click.stop="removePhoto('fieldImageTrunkBase', index)"
              >
                <uni-icons type="close" size="18" color="#fe5359" />
              </view>
            </view>
          </view>
        </view>
        <view class="my-8px">
          <text class="text-14px color-#666">照片说明</text>
        </view>
        <uni-easyinput v-model="localFormData.zpsm" type="textarea" placeholder="请输入照片说明" :clearable="true"></uni-easyinput>
      </view>

      <!-- 备注 -->
      <view class="mb-30px">
        <view class="mb-8px">
          <text class="text-14px color-#666">备注</text>
        </view>
        <uni-easyinput v-model="localFormData.bz" type="textarea" placeholder="请输入备注" :clearable="true"></uni-easyinput>
      </view>

      <!-- 抽样古树信息 -->
      <view class="mb-30px">
        <view class="mb-15px flex items-center justify-between">
          <view>
            <text class="text-16px font-bold color-#333">抽样古树信息</text>
          </view>
          <view class="px-15px py-6px bg-#01bd8d text-#fff rounded-4px" @click="goToAddSampleTree">
            <text class="text-14px">新增</text>
          </view>
        </view>

        <view v-if="localFormData.cygsxx.length === 0" class="text-center py-20px color-#999">
          <text class="text-14px">暂无抽样古树信息，请点击新增按钮添加</text>
        </view>

        <!-- 抽样古树列表 -->
        <view v-for="(item, index) in localFormData.cygsxx" :key="item.id" class="mb-15px">
          <view class="p-15px border-1px border-solid border-#e5e5e5 rounded-8px bg-#fff">
            <!-- 头部：序号和操作按钮 -->
            <view class="flex items-center justify-between mb-12px pb-6px">
              <text class="text-15px font-bold color-#333">古树 {{ index + 1 }}</text>
              <view class="flex items-center gap-10px">
                <!-- <view class="px-12px py-4px bg-#01bd8d text-#fff rounded-4px" @click="editSampleTree(item)">
                  <text class="text-12px">编辑</text>
                </view> -->
                <view class="px-12px py-4px bg-red text-#fff rounded-4px" @click="deleteSampleTree(item.id)">
                  <text class="text-12px">删除</text>
                </view>
              </view>
            </view>

            <!-- 古树信息 -->
            <view class="space-y-8px">
              <view class="flex items-center">
                <text class="text-13px color-#999 w-100px">古树编号：</text>
                <text class="text-13px color-#333 flex-1">{{ item.gsbh || '-' }}</text>
              </view>
              <view class="flex items-center">
                <text class="text-13px color-#999 w-100px">树种：</text>
                <text class="text-13px color-#333 flex-1">{{ item.sz || '-' }}</text>
              </view>
              <view class="flex items-center">
                <text class="text-13px color-#999 w-100px">树龄：</text>
                <text class="text-13px color-#333 flex-1">{{ item.sl || '-' }}</text>
              </view>
              <view class="flex items-center">
                <text class="text-13px color-#999 w-100px">胸径：</text>
                <text class="text-13px color-#333 flex-1">{{ item.xj || '-' }} cm</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
    <!-- 视频播放弹窗 -->
    <VideoPlayerPopup ref="videoPlayerPopupRef" />
  </view>
</template>

<style scoped>
.space-y-8px > view + view {
  margin-top: 8px;
}
</style>
