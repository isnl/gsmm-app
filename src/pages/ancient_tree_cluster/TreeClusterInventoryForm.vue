<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import TagSelectorPopup from '@/components/TagSelectorPopup.vue';
import VideoPlayerPopup from '@/components/VideoPlayerPopup.vue';
import {
  censusRangeOptions,
  surveyMethodOptions,
  clusterDistributionPlaceOptions,
  managementDeptOptions,
  clusterOwnershipOptions,
  responsibleTypeOptions,
  unitCategoryOptions,
  protectionMeasureOptions,
  forestStructureOptions,
  importantValueOptions,
  changeReasonOptions,
} from './constants';

// 主要树种组成项的类型定义
interface TreeSpeciesItem {
  id: string;
  name: string; // 名称
  quantity: number | string; // 数量
  ratio: number | string; // 占比（自动计算）
}

// 定义 Props
const props = defineProps<{
  formData: any;
}>();

// 定义 Emits
const emit = defineEmits<{
  update: [data: any];
}>();

// 本地表单数据（字段改为首字母缩写）
const localFormData = ref({
  // 基本信息
  gsqbh: '', // 古树群编号（c1）
  pcfw: '', // 普查范围（c2）
  dcf: '', // 调查方法（c3）

  // 位置边界
  xz: '', // 乡镇(街道)（c4）
  cun: '', // 村(居委会)（c5）
  xdm: '', // 小地名（c6）
  fbcs: '', // 分布场所（c7）
  szfwms: '', // 四至范围描述（c8）
  hb: '', // 海拔(m)（c9）

  mj: '', // 面积(hm²)（c10）
  gszs: '', // 古树株数(株)（c11）

  // 树龄结构
  gt500: '', // >500年(%)（c12）
  s300_500: '', // 300-500年(%)（c13）
  s100_300: '', // 100-300年(%)（c14）

  zysz: [] as TreeSpeciesItem[], // 主要树种组成（c15）

  // 保护现状
  zgbm: '', // 主管部门（c16）
  qs: '', // 权属（c17）
  rcyhzrrlx: '', // 日常养护责任人类型（c18）
  dwlbOrGrmc: '', // 单位类别或个人名称（c19）
  bhcs: '', // 保护措施（c20）

  // 林分特征
  lcjgzk: '', // 林层结构状况（c21）
  // 乔木层
  ybd: '', // 郁闭度（c22）
  pjxj: '', // 平均胸径(cm)（c23）
  pjsg: '', // 平均树高(m)（c24）
  // 灌木层
  gmzl: '', // 种类（c25）
  gmgd: '', // 盖度(%)（c26）
  gmhd: '', // 高度(m)（c27）
  // 草本/地被物
  cbzl: '', // 种类（c28）
  cbgd: '', // 盖度(%)（c29）
  cbhd: '', // 高度(m)（c30）

  zyjz: '', // 重要价值（c31）
  sm: '', // 说明（c32）

  bhyy: '', // 变化原因（c33）
  zpsm: '', // 照片说明文字（c34）
  bz: '', // 备注（c35）

  // 照片/视频字段
  fieldImageLongShot: [], // 远景照片
  fieldImageCloseUp: [], // 近景照片
  fieldImageHabitat: [], // 群内生境照片
});

// 通用 TagSelectorPopup 配置
const tagSelectorPopupRef = ref();
const currentPopupConfig = ref({
  title: '',
  options: [],
  fieldKey: '',
});

// 打开通用弹窗
const openTagSelectorPopup = (title: string, options: any[], fieldKey: string) => {
  currentPopupConfig.value = {
    title,
    options,
    fieldKey,
  };
  tagSelectorPopupRef.value?.open('bottom');
};

// 关闭弹窗
const closeTagSelectorPopup = () => {
  tagSelectorPopupRef.value?.close();
};

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

  ['fieldImageLongShot', 'fieldImageCloseUp', 'fieldImageHabitat'].forEach(fieldType => {
    localFormData.value[fieldType].forEach((photo: any) => {
      if (checkIsImage(photo.id ? photo.path : photo.fileType)) {
        const url = photo.id ? photo.url : photo.tempFilePath || photo.path;
        allImages.push(url);
      }
    });
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

// 是否为历史记录
const isHistory = ref(false);

// 主要树种组成相关方法
const addTreeSpecies = () => {
  const newItem: TreeSpeciesItem = {
    id: Date.now().toString(),
    name: '',
    quantity: '',
    ratio: '',
  };
  localFormData.value.zysz.push(newItem);
};

const removeTreeSpecies = (id: string) => {
  const index = localFormData.value.zysz.findIndex(item => item.id === id);
  if (index > -1) {
    localFormData.value.zysz.splice(index, 1);
    calculateAllRatios();
  }
};

// 计算单个树种的占比
const calculateRatio = (item: TreeSpeciesItem) => {
  const totalTrees = Number(localFormData.value.gszs) || 0;
  const quantity = Number(item.quantity) || 0;
  if (totalTrees > 0 && quantity > 0) {
    item.ratio = ((quantity / totalTrees) * 100).toFixed(2);
  } else {
    item.ratio = '';
  }
};

// 重新计算所有树种的占比
const calculateAllRatios = () => {
  localFormData.value.zysz.forEach(item => {
    calculateRatio(item);
  });
};

// 监听古树株数变化，重新计算占比
watch(
  () => localFormData.value.gszs,
  () => {
    calculateAllRatios();
  },
);

// 监听树种数量变化，计算占比
const onQuantityChange = (item: TreeSpeciesItem) => {
  calculateRatio(item);
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
      // 确保 c15 是数组
      if (!Array.isArray(localFormData.value.c15)) {
        localFormData.value.c15 = [];
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <view class="w-full">
    <view class="px-20px py-20px">
      <!-- 基本信息（c1-c3） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">基本信息</text>
        </view>

        <!-- c1: 古树群编号 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">古树群编号</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-easyinput v-model="localFormData.gsqbh" placeholder="请输入古树群编号" :clearable="true"></uni-easyinput>
        </view>

        <!-- c2: 普查范围 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">普查范围</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-data-select v-model="localFormData.pcfw" :localdata="censusRangeOptions" placeholder="请选择普查范围"></uni-data-select>
        </view>

        <!-- c3: 调查方法 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">调查方法</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <view
            class="flex border-1px border-solid border-#e5e5e5 items-center justify-between px-12px py-10px rounded-4px bg-#fff"
            @click="openTagSelectorPopup('选择调查方法', surveyMethodOptions, 'dcf')"
          >
            <text class="text-14px" :class="!localFormData.dcf ? 'color-#d5d5d5' : 'color-#333'">
              {{ localFormData.dcf || '请选择调查方法' }}
            </text>
            <uni-icons type="bottom" size="16" color="#c0c4cc"></uni-icons>
          </view>
        </view>
      </view>

      <!-- 位置边界（c4-c9） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">位置边界</text>
        </view>

        <!-- c4: 乡镇(街道) -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">乡镇(街道)</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-easyinput v-model="localFormData.xz" placeholder="请输入乡镇(街道)" :clearable="true"></uni-easyinput>
        </view>

        <!-- c5: 村(居委会) -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">村(居委会)</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-easyinput v-model="localFormData.cun" placeholder="请输入村(居委会)" :clearable="true"></uni-easyinput>
        </view>

        <!-- c6: 小地名 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">小地名</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-easyinput v-model="localFormData.xdm" placeholder="请输入小地名" :clearable="true"></uni-easyinput>
        </view>

        <!-- c7: 分布场所 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">分布场所</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <view
            class="flex border-1px border-solid border-#e5e5e5 items-center justify-between px-12px py-10px rounded-4px bg-#fff"
            @click="openTagSelectorPopup('选择分布场所', clusterDistributionPlaceOptions, 'fbcs')"
          >
            <text class="text-14px" :class="!localFormData.fbcs ? 'color-#d5d5d5' : 'color-#333'">
              {{ localFormData.fbcs || '请选择分布场所' }}
            </text>
            <uni-icons type="bottom" size="16" color="#c0c4cc"></uni-icons>
          </view>
        </view>

        <!-- c8: 四至范围描述 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">四至范围描述</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-easyinput v-model="localFormData.szfwms" type="textarea" placeholder="请输入四至范围描述" :clearable="true"></uni-easyinput>
        </view>

        <!-- c9: 海拔 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">海拔</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.hb" type="number" placeholder="请输入海拔" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">m</text>
          </view>
        </view>
      </view>

      <!-- 面积和株数（c10-c11） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">面积和株数</text>
        </view>

        <!-- c10: 面积 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">面积</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.mj" type="digit" placeholder="请输入面积" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">hm²</text>
          </view>
        </view>

        <!-- c11: 古树株数 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">古树株数</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.gszs" type="number" placeholder="请输入古树株数" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">株</text>
          </view>
        </view>
      </view>

      <!-- 树龄结构（c12-c14） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">树龄结构</text>
        </view>

        <!-- c12: >500年 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">>500年</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.gt500" type="digit" placeholder="请输入百分比" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">%</text>
          </view>
        </view>

        <!-- c13: 300-500年 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">300-500年</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.s300_500" type="digit" placeholder="请输入百分比" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">%</text>
          </view>
        </view>

        <!-- c14: 100-300年 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">100-300年</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.s100_300" type="digit" placeholder="请输入百分比" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">%</text>
          </view>
        </view>
      </view>

      <!-- c15: 主要树种组成 -->
      <view class="mb-30px">
        <view class="mb-15px flex items-center justify-between">
          <view>
            <text class="text-16px font-bold color-#333">主要树种组成</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <view class="px-15px py-6px bg-#01bd8d text-#fff rounded-4px" @click="addTreeSpecies">
            <text class="text-14px">新增</text>
          </view>
        </view>

        <view v-if="localFormData.zysz.length === 0" class="text-center py-20px color-#999">
          <text class="text-14px">暂无树种，请点击新增按钮添加</text>
        </view>

        <view v-for="(item, index) in localFormData.zysz" :key="item.id" class="mb-15px p-15px border-1px border-solid border-#e5e5e5 rounded-8px">
          <view class="flex items-center justify-between mb-10px">
            <text class="text-14px font-bold color-#333">树种 {{ index + 1 }}</text>
            <view class="px-12px py-4px bg-red text-#fff rounded-4px" @click="removeTreeSpecies(item.id)">
              <text class="text-12px">删除</text>
            </view>
          </view>

          <!-- 名称 -->
          <view class="mb-10px">
            <view class="mb-6px">
              <text class="text-13px color-#666">名称</text>
            </view>
            <uni-easyinput v-model="item.name" placeholder="请输入树种名称" :clearable="true"></uni-easyinput>
          </view>

          <!-- 数量 -->
          <view class="mb-10px">
            <view class="mb-6px">
              <text class="text-13px color-#666">数量</text>
            </view>
            <view class="flex items-center gap-10px">
              <view class="flex-1">
                <uni-easyinput v-model="item.quantity" type="number" placeholder="请输入数量" :clearable="true" @blur="onQuantityChange(item)"></uni-easyinput>
              </view>
              <text class="text-13px color-#666">株</text>
            </view>
          </view>

          <!-- 占比（自动计算） -->
          <view>
            <view class="mb-6px">
              <text class="text-13px color-#666">占比（自动计算）</text>
            </view>
            <view class="flex items-center gap-10px">
              <view class="flex-1">
                <uni-easyinput v-model="item.ratio" placeholder="自动计算" :disabled="true" :clearable="false"></uni-easyinput>
              </view>
              <text class="text-13px color-#666">%</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 保护现状（c16-c20） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">保护现状</text>
        </view>

        <!-- c16: 主管部门 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">主管部门</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-data-select v-model="localFormData.zgbm" :localdata="managementDeptOptions" placeholder="请选择主管部门"></uni-data-select>
        </view>

        <!-- c17: 权属 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">权属</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-data-select v-model="localFormData.qs" :localdata="clusterOwnershipOptions" placeholder="请选择权属"></uni-data-select>
        </view>

        <!-- c18: 日常养护责任人 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">日常养护责任人</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-data-select v-model="localFormData.rcyhzrrlx" :localdata="responsibleTypeOptions" placeholder="请选择责任人类型"></uni-data-select>
        </view>

        <!-- c19: 单位类别或个人名称 -->
        <view v-if="localFormData.rcyhzrrlx" class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">{{ localFormData.c18 === '单位' ? '单位类别' : '个人名称' }}</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <view v-if="localFormData.rcyhzrrlx === '单位'">
            <view
              class="flex border-1px border-solid border-#e5e5e5 items-center justify-between px-12px py-10px rounded-4px bg-#fff"
              @click="openTagSelectorPopup('选择单位类别', unitCategoryOptions, 'dwlbOrGrmc')"
            >
              <text class="text-14px" :class="!localFormData.dwlbOrGrmc ? 'color-#d5d5d5' : 'color-#333'">
                {{ localFormData.dwlbOrGrmc || '请选择单位类别' }}
              </text>
              <uni-icons type="bottom" size="16" color="#c0c4cc"></uni-icons>
            </view>
          </view>
          <uni-easyinput v-else v-model="localFormData.dwlbOrGrmc" placeholder="请输入个人名称" :clearable="true"></uni-easyinput>
        </view>

        <!-- c20: 保护措施 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">保护措施</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <view
            class="flex border-1px border-solid border-#e5e5e5 items-center justify-between px-12px py-10px rounded-4px bg-#fff"
            @click="openTagSelectorPopup('选择保护措施', protectionMeasureOptions, 'bhcs')"
          >
            <text class="text-14px" :class="!localFormData.bhcs ? 'color-#d5d5d5' : 'color-#333'">
              {{ localFormData.bhcs || '请选择保护措施' }}
            </text>
            <uni-icons type="bottom" size="16" color="#c0c4cc"></uni-icons>
          </view>
        </view>
      </view>

      <!-- 林分特征（c21-c30） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">林分特征</text>
          <text class="text-12px color-#999 ml-10px">选填</text>
        </view>

        <!-- c21: 林层结构状况 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">林层结构状况</text>
          </view>
          <uni-data-select v-model="localFormData.lcjgzk" :localdata="forestStructureOptions" placeholder="请选择林层结构状况"></uni-data-select>
        </view>

        <!-- 乔木层 -->
        <view class="mb-20px pl-15px border-l-2px border-#01bd8d">
          <view class="mb-12px">
            <text class="text-14px font-bold color-#333">乔木层</text>
          </view>

          <!-- c22: 郁闭度 -->
          <view class="mb-15px">
            <view class="mb-8px">
              <text class="text-14px color-#666">郁闭度</text>
            </view>
            <uni-easyinput v-model="localFormData.ybd" type="digit" placeholder="请输入郁闭度" :clearable="true"></uni-easyinput>
          </view>

          <!-- c23: 平均胸径 -->
          <view class="mb-15px">
            <view class="mb-8px">
              <text class="text-14px color-#666">平均胸径</text>
            </view>
            <view class="flex items-center gap-10px">
              <view class="flex-1">
                <uni-easyinput v-model="localFormData.pjxj" type="digit" placeholder="请输入平均胸径" :clearable="true"></uni-easyinput>
              </view>
              <text class="text-14px color-#666">cm</text>
            </view>
          </view>

          <!-- c24: 平均树高 -->
          <view class="mb-15px">
            <view class="mb-8px">
              <text class="text-14px color-#666">平均树高</text>
            </view>
            <view class="flex items-center gap-10px">
              <view class="flex-1">
                <uni-easyinput v-model="localFormData.pjsg" type="digit" placeholder="请输入平均树高" :clearable="true"></uni-easyinput>
              </view>
              <text class="text-14px color-#666">m</text>
            </view>
          </view>
        </view>

        <!-- 灌木层 -->
        <view class="mb-20px pl-15px border-l-2px border-#01bd8d">
          <view class="mb-12px">
            <text class="text-14px font-bold color-#333">灌木层</text>
          </view>

          <!-- c25: 种类 -->
          <view class="mb-15px">
            <view class="mb-8px">
              <text class="text-14px color-#666">种类</text>
            </view>
            <uni-easyinput v-model="localFormData.gmzl" placeholder="请输入种类" :clearable="true"></uni-easyinput>
          </view>

          <!-- c26: 盖度 -->
          <view class="mb-15px">
            <view class="mb-8px">
              <text class="text-14px color-#666">盖度</text>
            </view>
            <view class="flex items-center gap-10px">
              <view class="flex-1">
                <uni-easyinput v-model="localFormData.gmgd" type="digit" placeholder="请输入盖度" :clearable="true"></uni-easyinput>
              </view>
              <text class="text-14px color-#666">%</text>
            </view>
          </view>

          <!-- c27: 高度 -->
          <view class="mb-15px">
            <view class="mb-8px">
              <text class="text-14px color-#666">高度</text>
            </view>
            <view class="flex items-center gap-10px">
              <view class="flex-1">
                <uni-easyinput v-model="localFormData.gmhd" type="digit" placeholder="请输入高度" :clearable="true"></uni-easyinput>
              </view>
              <text class="text-14px color-#666">m</text>
            </view>
          </view>
        </view>

        <!-- 草本/地被物 -->
        <view class="mb-20px pl-15px border-l-2px border-#01bd8d">
          <view class="mb-12px">
            <text class="text-14px font-bold color-#333">草本/地被物</text>
          </view>

          <!-- c28: 种类 -->
          <view class="mb-15px">
            <view class="mb-8px">
              <text class="text-14px color-#666">种类</text>
            </view>
            <uni-easyinput v-model="localFormData.cbzl" placeholder="请输入种类" :clearable="true"></uni-easyinput>
          </view>

          <!-- c29: 盖度 -->
          <view class="mb-15px">
            <view class="mb-8px">
              <text class="text-14px color-#666">盖度</text>
            </view>
            <view class="flex items-center gap-10px">
              <view class="flex-1">
                <uni-easyinput v-model="localFormData.cbgd" type="digit" placeholder="请输入盖度" :clearable="true"></uni-easyinput>
              </view>
              <text class="text-14px color-#666">%</text>
            </view>
          </view>

          <!-- c30: 高度 -->
          <view class="mb-15px">
            <view class="mb-8px">
              <text class="text-14px color-#666">高度</text>
            </view>
            <view class="flex items-center gap-10px">
              <view class="flex-1">
                <uni-easyinput v-model="localFormData.cbhd" type="digit" placeholder="请输入高度" :clearable="true"></uni-easyinput>
              </view>
              <text class="text-14px color-#666">m</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 其他信息（c31-c33） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">其他信息</text>
        </view>

        <!-- c31: 重要价值 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">重要价值</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-data-select v-model="localFormData.zyjz" :localdata="importantValueOptions" placeholder="请选择重要价值"></uni-data-select>
        </view>

        <!-- c32: 说明 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">说明</text>
          </view>
          <uni-easyinput v-model="localFormData.sm" type="textarea" placeholder="请输入说明" :清除="true"></uni-easyinput>
        </view>

        <!-- c33: 变化原因 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">变化原因</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-data-select v-model="localFormData.bhyy" :localdata="changeReasonOptions" placeholder="请选择变化原因"></uni-data-select>
        </view>
      </view>

      <!-- 照片及说明（c34） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">照片及说明</text>
          <text class="text-12px color-red ml-5px">*</text>
        </view>
        <view class="w-full flex flex-col gap-10px">
          <!-- 远景照片 -->
          <view class="flex gap-10px flex-wrap">
            <view class="flex flex-col items-center w-72px" @click="handlePhotoUpload('fieldImageLongShot')">
              <view class="w-72px h-72px fc bg-#fff rounded-8px border-1px border-dashed border-#ddd">
                <image src="@/static/images/icons/img_thum.png" mode="widthFix" class="w-16px" />
              </view>
              <text class="text-14px text-#333 mt-5px">远景照片</text>
            </view>
            <!-- 已选择的照片/视频 -->
            <view v-for="(photo, index) in localFormData.fieldImageLongShot" :key="index" class="relative flex flex-col items-center w-72px">
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
                @click.stop="removePhoto('fieldImageLongShot', index)"
              >
                <uni-icons type="close" size="18" color="#fe5359" />
              </view>
            </view>
          </view>

          <!-- 近景照片 -->
          <view class="flex gap-10px flex-wrap">
            <view class="flex flex-col items-center w-72px" @click="handlePhotoUpload('fieldImageCloseUp')">
              <view class="w-72px h-72px fc bg-#fff rounded-8px border-1px border-dashed border-#ddd">
                <image src="@/static/images/icons/img_thum.png" mode="widthFix" class="w-16px" />
              </view>
              <text class="text-14px text-#333 mt-5px">近景照片</text>
            </view>
            <!-- 已选择的照片/视频 -->
            <view v-for="(photo, index) in localFormData.fieldImageCloseUp" :key="index" class="relative flex flex-col items-center w-72px">
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
                @click.stop="removePhoto('fieldImageCloseUp', index)"
              >
                <uni-icons type="close" size="18" color="#fe5359" />
              </view>
            </view>
          </view>

          <!-- 群内生境照片 -->
          <view class="flex gap-10px flex-wrap">
            <view class="flex flex-col items-center w-72px" @click="handlePhotoUpload('fieldImageHabitat')">
              <view class="w-72px h-72px fc bg-#fff rounded-8px border-1px border-dashed border-#ddd">
                <image src="@/static/images/icons/img_thum.png" mode="widthFix" class="w-16px" />
              </view>
              <text class="text-14px text-#333 mt-5px">群内生境</text>
            </view>
            <!-- 已选择的照片/视频 -->
            <view v-for="(photo, index) in localFormData.fieldImageHabitat" :key="index" class="relative flex flex-col items-center w-72px">
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
                @click.stop="removePhoto('fieldImageHabitat', index)"
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

      <!-- 备注（c35） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">备注</text>
          </view>
          <uni-easyinput v-model="localFormData.bz" type="textarea" placeholder="请输入备注" :clearable="true"></uni-easyinput>
        </view>
      </view>
    </view>

    <!-- 通用 TagSelectorPopup 弹窗 -->
    <uni-popup ref="tagSelectorPopupRef" type="bottom" :mask-click="false">
      <TagSelectorPopup
        :title="currentPopupConfig.title"
        :options="currentPopupConfig.options"
        v-model="localFormData[currentPopupConfig.fieldKey]"
        :multiple="false"
        :allowCustom="true"
        @close="closeTagSelectorPopup"
      />
    </uni-popup>

    <!-- 视频播放弹窗 -->
    <VideoPlayerPopup ref="videoPlayerPopupRef" />
  </view>
</template>

<style scoped></style>
