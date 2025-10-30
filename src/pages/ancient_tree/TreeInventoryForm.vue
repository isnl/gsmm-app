<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import TagSelectorPopup from '@/components/TagSelectorPopup.vue';
import VideoPlayerPopup from '@/components/VideoPlayerPopup.vue';
import {
  censusRangeOptions,
  distributionTypeOptions,
  distributionPlaceOptions,
  soilCompactnessOptions,
  soilThicknessOptions,
  slopePositionOptions,
  slopeGradeOptions,
  slopeAspectOptions,
  growthEnvironmentOptions,
  ageTestMethodOptions,
  protectionLevelOptions,
  treeCategoryOptions,
  growthStatusOptions,
  treeDamageOptions,
  potentialImpactOptions,
  managementDeptOptions,
  ownershipOptions,
  responsibleTypeOptions,
  protectionMeasureOptions,
  importantValueOptions,
  newIncreaseReasonOptions,
  decreaseReasonOptions,
  deathDisposalOptions,
} from './constants';

// 定义 Props
const props = defineProps<{
  formData: any;
  hasGsqId?: boolean; // 是否有古树群ID
  isEditMode?: boolean; // 是否为编辑模式
}>();

// 定义 Emits
const emit = defineEmits<{
  update: [data: any];
}>();

// 本地表单数据（字段改为首字母缩写，保留照片/视频字段不变）
const localFormData = ref({
  // 基本信息
  gsmmbh: '', // 古树名木编号（c1）
  pcfw: '', // 普查范围（c2）
  sfzdgylqfw: '0', //是否重点国有林区范围（0-否，1-是）
  sgjt: '', //森工集团（林业集团）
  lyj: '', //林业局
  lcmc: '', //林场名称
  fbtz: '', // 分布特点（c3）
  gsqbh: '', // 古树群编号（c4）

  // 地理位置
  xz: '', // 乡镇(街道)（c5）
  cun: '', // 村(居委会)（c6）
  xdm: '', // 小地名（c7）
  fbcs: '', // 分布场所（c8）
  jd: '', // 经度（c9）
  wd: '', // 纬度（c10）

  // 立地条件
  hb: '', // 海拔(m)（c11）
  trjmd: '', // 土壤紧密度（c12）
  tchd: '', // 土层厚度（c13）
  pw: '', // 坡位（c14）
  pd: '', // 坡度（c15）
  px: '', // 坡向（c16）
  szhjdj: '', // 生长环境等级（c17）

  // 树种
  ke: '', // 科（c18）
  shu: '', // 属（c19）
  zwm: '', // 中文名（c20）
  xm: '', // 学名（c21）
  sm: '', // 俗名（c22）

  sl: '', // 树龄(年)（c23）
  cdff: '', // 测定方法（c24）
  bhdj: '', // 保护等级（c25）
  gsmmlb: '', // 古树名木类别（c26）

  // 测树因子
  sg: '', // 树高(m)（c27）
  xj: '', // 胸径(cm)（c28）
  dj: '', // 地径(cm)（c29）
  pjgf: '', // 平均冠幅(m)（c30）
  xw: '', // 胸围(cm)（c31）
  dw: '', // 地围(cm)（c32）

  szsdj: '', // 生长势等级（c33）

  // 受损情况
  stss: '', // 树体损伤（c34）
  qzyxys: '', // 潜在影响因素（c35）

  // 保护现状
  zgbm: '', // 主管部门（c36）
  qs: '', // 权属（c37）
  rcyhzrrlx: '', // 日常养护责任人类型（c38）
  dwmcOrgrmc: '', // 单位名称或个人名称（c39）
  bhcs: '', // 保护措施（c40）

  zyjz: '', // 重要价值（c41）
  zyjzsm: '', // 说明（c42）
  xzyy: '', // 新增原因（c43）
  jsyy: '', // 减少原因（c44）
  swczcs: '', // 死亡处置措施（c45）
  smqtxz: '', // 树木奇特性状（c46）
  zpjsm: '', // 照片及说明（c47）
  bz: '', // 备注（c48）

  // 照片/视频字段
  fieldImageParentTree: [], // 树体全貌
  fieldImageTrunkBase: [], // 特征特写
  fieldImageCrown: [], // 生长环境
});

// 通用 TagSelectorPopup 配置
const tagSelectorPopupRef = ref();
const currentPopupConfig = ref({
  title: '',
  options: [],
  fieldKey: '',
});

// 视频播放弹窗引用
const videoPlayerPopupRef = ref();

// 根据 hasGsqId 计算分布特点选项（两个选项都显示，但根据 hasGsqId 禁用其中一个）
const distributionTypeOptionsFiltered = computed(() => {
  return [
    {
      text: '散生',
      value: '散生',
      disable: props.hasGsqId === true, // 有 gsqId 时禁用"散生"
    },
    {
      text: '群状',
      value: '群状',
      disable: props.hasGsqId === false, // 没有 gsqId 时禁用"群状"
    },
  ];
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
        // 拍照
        chooseImage('camera');
      } else if (res.tapIndex === 1) {
        // 从相册选择照片
        chooseImage('album');
      } else if (res.tapIndex === 2) {
        // 拍摄视频
        chooseVideo('camera');
      } else if (res.tapIndex === 3) {
        // 从相册选择视频
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
        console.log(photo);
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
    maxDuration: 60, // 最长60秒
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
        thumbTempFilePath: res.thumbTempFilePath, // 视频缩略图
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
  // 收集所有图片URL
  const allImages: string[] = [];

  // 从所有照片字段中收集图片
  ['fieldImageParentTree', 'fieldImageTrunkBase', 'fieldImageCrown'].forEach(fieldType => {
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
  // 打开视频播放弹窗
  videoPlayerPopupRef.value?.open(videoPath);
};

// 是否为历史记录（禁止编辑）
const isHistory = ref(false);

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
    }
  },
  { immediate: true },
);

// 监听 hasGsqId 变化，确保分布特点值正确（仅在非编辑模式下强制设置）
watch(
  () => [props.hasGsqId, props.isEditMode],
  ([hasGsqId, isEditMode]) => {
    // 只在非编辑模式下强制设置分布特点
    if (hasGsqId !== undefined && !isEditMode) {
      if (hasGsqId) {
        // 有 gsqId，设置为"群状"
        localFormData.value.fbtz = '群状';
      } else {
        // 没有 gsqId，设置为"散生"
        localFormData.value.fbtz = '散生';
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <view class="w-full">
    <view class="px-20px py-20px">
      <!-- 基本信息（c1-c4） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">基本信息</text>
        </view>

        <!-- c1: 古树名木编号 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">古树名木编号</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-easyinput v-model="localFormData.gsmmbh" placeholder="请输入古树名木编号" :clearable="true" :disabled="isEditMode"></uni-easyinput>
        </view>

        <!-- c2: 普查范围 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">普查范围</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-data-select v-model="localFormData.pcfw" :localdata="censusRangeOptions" placeholder="请选择普查范围"></uni-data-select>
        </view>

        <!-- 是否重点国有林区范围 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">是否重点国有林区范围</text>
          </view>
          <view class="flex items-center gap-20px">
            <view class="flex items-center" @click="localFormData.sfzdgylqfw = '1'">
              <uni-icons
                :type="localFormData.sfzdgylqfw === '1' ? 'checkbox-filled' : 'circle'"
                size="20"
                :color="localFormData.sfzdgylqfw === '1' ? '#01bd8d' : '#c0c4cc'"
              ></uni-icons>
              <text class="ml-8px text-14px color-#333">是</text>
            </view>
            <view class="flex items-center" @click="localFormData.sfzdgylqfw = '0'">
              <uni-icons
                :type="localFormData.sfzdgylqfw === '0' ? 'checkbox-filled' : 'circle'"
                size="20"
                :color="localFormData.sfzdgylqfw === '0' ? '#01bd8d' : '#c0c4cc'"
              ></uni-icons>
              <text class="ml-8px text-14px color-#333">否</text>
            </view>
          </view>
        </view>

        <!-- 森工集团（林业集团） - 当sfzdgylqfw为是时显示 -->
        <view v-if="localFormData.sfzdgylqfw === '1'" class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">森工集团（林业集团）</text>
          </view>
          <uni-easyinput v-model="localFormData.sgjt" placeholder="请输入森工集团（林业集团）" :clearable="true"></uni-easyinput>
        </view>

        <!-- 林业局 - 当sfzdgylqfw为是时显示 -->
        <view v-if="localFormData.sfzdgylqfw === '1'" class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">林业局</text>
          </view>
          <uni-easyinput v-model="localFormData.lyj" placeholder="请输入林业局" :clearable="true"></uni-easyinput>
        </view>

        <!-- 林场名称 - 当sfzdgylqfw为是时显示 -->
        <view v-if="localFormData.sfzdgylqfw === '1'" class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">林场名称</text>
          </view>
          <uni-easyinput v-model="localFormData.lcmc" placeholder="请输入林场名称" :clearable="true"></uni-easyinput>
        </view>

        <!-- c3: 分布特点 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">分布特点</text>
          </view>
          <uni-data-select
            v-model="localFormData.fbtz"
            :localdata="distributionTypeOptionsFiltered"
            placeholder="请选择分布特点"
            :disabled="isEditMode"
          ></uni-data-select>
        </view>

        <!-- c4: 古树群编号 (当c3为群状时显示) -->
        <view v-if="localFormData.fbtz === '群状'" class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">古树群编号</text>
          </view>
          <uni-easyinput v-model="localFormData.gsqbh" placeholder="请输入古树群编号" :clearable="true"></uni-easyinput>
        </view>
      </view>

      <!-- 地理位置（c5-c10） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">地理位置</text>
        </view>

        <!-- c5: 乡镇(街道) -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">乡镇(街道)</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-easyinput v-model="localFormData.xz" placeholder="请输入乡镇(街道)" :clearable="true"></uni-easyinput>
        </view>

        <!-- c6: 村(居委会) -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">村(居委会)</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-easyinput v-model="localFormData.cun" placeholder="请输入村(居委会)" :clearable="true"></uni-easyinput>
        </view>

        <!-- c7: 小地名 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">小地名</text>
          </view>
          <uni-easyinput v-model="localFormData.xdm" placeholder="请输入小地名" :clearable="true"></uni-easyinput>
        </view>

        <!-- c8: 分布场所 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">分布场所</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <view
            class="flex border-1px border-solid border-#e5e5e5 items-center justify-between px-12px py-10px rounded-4px bg-#fff"
            @click="openTagSelectorPopup('选择分布场所', distributionPlaceOptions, 'fbcs')"
          >
            <text class="text-14px" :class="!localFormData.fbcs ? 'color-#d5d5d5' : 'color-#333'">
              {{ localFormData.fbcs || '请选择分布场所' }}
            </text>
            <uni-icons type="bottom" size="16" color="#c0c4cc"></uni-icons>
          </view>
        </view>

        <!-- c9: 经度 -->
        <view class="mb-15px">
          <view class="mb-8px flex items-center justify-between">
            <text class="text-14px color-#666">经度</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-easyinput v-model="localFormData.jd" type="digit" placeholder="保留6位小数" :clearable="true"></uni-easyinput>
        </view>

        <!-- c10: 纬度 -->
        <view class="mb-15px">
          <view class="mb-8px flex items-center justify-between">
            <text class="text-14px color-#666">纬度</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-easyinput v-model="localFormData.wd" type="digit" placeholder="保留6位小数" :clearable="true"></uni-easyinput>
        </view>
      </view>

      <!-- 立地条件（c11-c17） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">立地条件</text>
        </view>

        <!-- c11: 海拔 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">海拔</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.hb" type="number" placeholder="请输入海拔" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">m</text>
          </view>
        </view>

        <!-- c12: 土壤紧密度 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">土壤紧密度</text>
          </view>
          <uni-data-select v-model="localFormData.trjmd" :localdata="soilCompactnessOptions" placeholder="请选择土壤紧密度"></uni-data-select>
        </view>

        <!-- c13: 土层厚度 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">土层厚度</text>
          </view>
          <uni-data-select v-model="localFormData.tchd" :localdata="soilThicknessOptions" placeholder="请选择土层厚度"></uni-data-select>
          <view class="mt-5px">
            <text class="text-12px color-#999">提示：≥80cm为厚，≥40cm且<80cm为中，<40cm为薄</text>
          </view>
        </view>

        <!-- c14: 坡位 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">坡位</text>
          </view>
          <uni-data-select v-model="localFormData.pw" :localdata="slopePositionOptions" placeholder="请选择坡位"></uni-data-select>
        </view>

        <!-- c15: 坡度 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">坡度</text>
          </view>
          <uni-data-select v-model="localFormData.pd" :localdata="slopeGradeOptions" placeholder="请选择坡度"></uni-data-select>
        </view>

        <!-- c16: 坡向 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">坡向</text>
          </view>
          <uni-data-select v-model="localFormData.px" :localdata="slopeAspectOptions" placeholder="请选择坡向"></uni-data-select>
        </view>

        <!-- c17: 生长环境等级 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">生长环境等级</text>
          </view>
          <uni-data-select v-model="localFormData.szhjdj" :localdata="growthEnvironmentOptions" placeholder="请选择生长环境等级"></uni-data-select>
        </view>
      </view>

      <!-- 树种（c18-c22） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">树种</text>
        </view>

        <!-- c18: 科 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">科</text>
          </view>
          <uni-easyinput v-model="localFormData.ke" placeholder="请输入科" :清除="true"></uni-easyinput>
        </view>

        <!-- c19: 属 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">属</text>
          </view>
          <uni-easyinput v-model="localFormData.shu" placeholder="请输入属" :clearable="true"></uni-easyinput>
        </view>

        <!-- c20: 中文名 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">中文名</text>
          </view>
          <uni-easyinput v-model="localFormData.zwm" placeholder="请输入中文名" :clearable="true"></uni-easyinput>
        </view>

        <!-- c21: 学名 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">学名</text>
          </view>
          <uni-easyinput v-model="localFormData.xm" placeholder="请输入学名" :clearable="true"></uni-easyinput>
        </view>

        <!-- c22: 俗名 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">俗名</text>
          </view>
          <uni-easyinput v-model="localFormData.sm" placeholder="请输入俗名" :clearable="true"></uni-easyinput>
        </view>
      </view>

      <!-- 树龄及分类（c23-c26） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">树龄及分类</text>
        </view>

        <!-- c23: 树龄 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">树龄</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.sl" type="number" placeholder="请输入树龄" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">年</text>
          </view>
        </view>

        <!-- c24: 测定方法 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">测定方法</text>
          </view>
          <view
            class="flex border-1px border-solid border-#e5e5e5 items-center justify-between px-12px py-10px rounded-4px bg-#fff"
            @click="openTagSelectorPopup('选择测定方法', ageTestMethodOptions, 'cdff')"
          >
            <text class="text-14px" :class="!localFormData.cdff ? 'color-#d5d5d5' : 'color-#333'">
              {{ localFormData.cdff || '请选择测定方法' }}
            </text>
            <uni-icons type="bottom" size="16" color="#c0c4cc"></uni-icons>
          </view>
        </view>

        <!-- c25: 保护等级 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">保护等级</text>
          </view>
          <uni-data-select v-model="localFormData.bhdj" :localdata="protectionLevelOptions" placeholder="请选择保护等级"></uni-data-select>
        </view>

        <!-- c26: 古树名木类别 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">古树名木类别</text>
          </view>
          <uni-data-select v-model="localFormData.gsmmlb" :localdata="treeCategoryOptions" placeholder="请选择古树名木类别"></uni-data-select>
        </view>
      </view>

      <!-- 测树因子（c27-c32） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">测树因子</text>
        </view>

        <!-- c27: 树高 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">树高</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.sg" type="digit" placeholder="请输入树高" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">m</text>
          </view>
        </view>

        <!-- c28: 胸径 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">胸径</text>
            <text class="text-12px color-red ml-5px">*</text>
            <text class="text-12px color-#999 ml-5px">（与地径二选一）</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.xj" type="digit" placeholder="请输入胸径" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">cm</text>
          </view>
        </view>

        <!-- c29: 地径 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">地径</text>
            <text class="text-12px color-red ml-5px">*</text>
            <text class="text-12px color-#999 ml-5px">（与胸径二选一）</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.dj" type="digit" placeholder="请输入地径" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">cm</text>
          </view>
        </view>

        <!-- c30: 平均冠幅 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">平均冠幅</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.pjgf" type="digit" placeholder="请输入平均冠幅" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">m</text>
          </view>
        </view>

        <!-- c31: 胸围 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">胸围</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.xw" type="digit" placeholder="请输入胸围" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">cm</text>
          </view>
        </view>

        <!-- c32: 地围 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">地围</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.dw" type="digit" placeholder="请输入地围" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">cm</text>
          </view>
        </view>
      </view>

      <!-- 生长势（c33） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">生长势</text>
        </view>

        <!-- c33: 等级 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">等级</text>
          </view>
          <uni-data-select v-model="localFormData.szsdj" :localdata="growthStatusOptions" placeholder="请选择等级"></uni-data-select>
        </view>
      </view>

      <!-- 受损情况（c34-c35） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">受损情况</text>
        </view>

        <!-- c34: 树体损伤 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">树体损伤</text>
          </view>
          <view
            class="flex border-1px border-solid border-#e5e5e5 items-center justify-between px-12px py-10px rounded-4px bg-#fff"
            @click="openTagSelectorPopup('选择树体损伤', treeDamageOptions, 'stss')"
          >
            <text class="text-14px" :class="!localFormData.stss ? 'color-#d5d5d5' : 'color-#333'">
              {{ localFormData.stss || '请选择树体损伤' }}
            </text>
            <uni-icons type="bottom" size="16" color="#c0c4cc"></uni-icons>
          </view>
        </view>

        <!-- c35: 潜在影响因素 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">潜在影响因素</text>
          </view>
          <view
            class="flex border-1px border-solid border-#e5e5e5 items-center justify-between px-12px py-10px rounded-4px bg-#fff"
            @click="openTagSelectorPopup('选择潜在影响因素', potentialImpactOptions, 'qzyxys')"
          >
            <text class="text-14px" :class="!localFormData.qzyxys ? 'color-#d5d5d5' : 'color-#333'">
              {{ localFormData.qzyxys || '请选择潜在影响因素' }}
            </text>
            <uni-icons type="bottom" size="16" color="#c0c4cc"></uni-icons>
          </view>
        </view>
      </view>

      <!-- 保护现状（c36-c40） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">保护现状</text>
        </view>

        <!-- c36: 主管部门 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">主管部门</text>
          </view>
          <uni-data-select v-model="localFormData.zgbm" :localdata="managementDeptOptions" placeholder="请选择主管部门"></uni-data-select>
        </view>

        <!-- c37: 权属 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">权属</text>
          </view>
          <view
            class="flex border-1px border-solid border-#e5e5e5 items-center justify-between px-12px py-10px rounded-4px bg-#fff"
            @click="openTagSelectorPopup('选择权属', ownershipOptions, 'qs')"
          >
            <text class="text-14px" :class="!localFormData.qs ? 'color-#d5d5d5' : 'color-#333'">
              {{ localFormData.qs || '请选择权属' }}
            </text>
            <uni-icons type="bottom" size="16" color="#c0c4cc"></uni-icons>
          </view>
        </view>

        <!-- c38: 日常养护责任人 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">日常养护责任人</text>
          </view>
          <uni-data-select v-model="localFormData.rcyhzrrlx" :localdata="responsibleTypeOptions" placeholder="请选择责任人类型"></uni-data-select>
        </view>

        <!-- c39: 单位名称或个人名称 -->
        <view v-if="localFormData.rcyhzrrlx" class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">{{ localFormData.rcyhzrrlx === '单位' ? '单位名称' : '个人名称' }}</text>
          </view>
          <uni-easyinput
            v-model="localFormData.dwmcOrgrmc"
            :placeholder="`请输入${localFormData.rcyhzrrlx === '单位' ? '单位名称' : '个人名称'}`"
            :clearable="true"
          ></uni-easyinput>
        </view>

        <!-- c40: 保护措施 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">保护措施</text>
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

      <!-- 其他信息（c41-c46） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">其他信息</text>
        </view>

        <!-- c41: 重要价值 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">重要价值</text>
          </view>
          <uni-data-select v-model="localFormData.zyjz" :localdata="importantValueOptions" placeholder="请选择重要价值"></uni-data-select>
        </view>

        <!-- c42: 说明 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">说明</text>
          </view>
          <uni-easyinput v-model="localFormData.zyjzsm" type="textarea" placeholder="请输入说明" :clearable="true"></uni-easyinput>
        </view>

        <!-- c43: 新增原因 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">新增原因</text>
          </view>
          <view
            class="flex border-1px border-solid border-#e5e5e5 items-center justify-between px-12px py-10px rounded-4px bg-#fff"
            @click="openTagSelectorPopup('选择新增原因', newIncreaseReasonOptions, 'xzyy')"
          >
            <text class="text-14px" :class="!localFormData.xzyy ? 'color-#d5d5d5' : 'color-#333'">
              {{ localFormData.xzyy || '请选择新增原因' }}
            </text>
            <uni-icons type="bottom" size="16" color="#c0c4cc"></uni-icons>
          </view>
        </view>

        <!-- c44: 减少原因 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">减少原因</text>
          </view>
          <view
            class="flex border-1px border-solid border-#e5e5e5 items-center justify-between px-12px py-10px rounded-4px bg-#fff"
            @click="openTagSelectorPopup('选择减少原因', decreaseReasonOptions, 'jsyy')"
          >
            <text class="text-14px" :class="!localFormData.jsyy ? 'color-#d5d5d5' : 'color-#333'">
              {{ localFormData.jsyy || '请选择减少原因' }}
            </text>
            <uni-icons type="bottom" size="16" color="#c0c4cc"></uni-icons>
          </view>
        </view>

        <!-- c45: 死亡处置措施 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">死亡处置措施</text>
          </view>
          <uni-data-select v-model="localFormData.swczcs" :localdata="deathDisposalOptions" placeholder="请选择死亡处置措施"></uni-data-select>
        </view>

        <!-- c46: 树木奇特性状 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">树木奇特性状</text>
          </view>
          <uni-easyinput v-model="localFormData.smqtxz" type="textarea" placeholder="请输入树木奇特性状" :clearable="true"></uni-easyinput>
        </view>
      </view>

      <!-- 照片及说明（c47） -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">照片及说明</text>
        </view>

        <view class="w-full flex flex-col gap-10px">
          <!-- 树体全貌 -->
          <view class="flex gap-10px flex-wrap">
            <view class="flex flex-col items-center w-72px" @click="handlePhotoUpload('fieldImageParentTree')">
              <view class="w-72px h-72px fc bg-#fff rounded-8px">
                <image src="@/static/images/icons/img_thum.png" mode="widthFix" class="w-16px" />
              </view>
              <text class="text-14px text-#333">树体全貌</text>
            </view>
            <!-- 已选择的照片/视频 -->
            <view v-for="(photo, index) in localFormData.fieldImageParentTree" :key="index" class="relative flex flex-col items-center w-72px">
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
                @click.stop="removePhoto('fieldImageParentTree', index)"
              >
                <uni-icons type="close" size="18" color="#fe5359" />
              </view>
            </view>
          </view>

          <!-- 特征特写 -->
          <view class="flex gap-10px flex-wrap">
            <view class="flex flex-col items-center w-72px" @click="handlePhotoUpload('fieldImageTrunkBase')">
              <view class="w-72px h-72px fc bg-#fff rounded-8px">
                <image src="@/static/images/icons/img_thum.png" mode="widthFix" class="w-16px" />
              </view>
              <text class="text-14px text-#333">特征特写</text>
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

          <!-- 生长环境 -->
          <view class="flex gap-10px flex-wrap">
            <view class="flex flex-col items-center w-72px" @click="handlePhotoUpload('fieldImageCrown')">
              <view class="w-72px h-72px fc bg-#fff rounded-8px">
                <image src="@/static/images/icons/img_thum.png" mode="widthFix" class="w-16px" />
              </view>
              <text class="text-14px text-#333">生长环境</text>
            </view>
            <!-- 已选择的照片/视频 -->
            <view v-for="(photo, index) in localFormData.fieldImageCrown" :key="index" class="relative flex flex-col items-center w-72px">
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
                @click.stop="removePhoto('fieldImageCrown', index)"
              >
                <uni-icons type="close" size="18" color="#fe5359" />
              </view>
            </view>
          </view>
        </view>
        <view class="my-8px">
          <text class="text-14px color-#666">照片说明</text>
        </view>
        <uni-easyinput v-model="localFormData.zpjsm" type="textarea" placeholder="请输入照片说明" :clearable="true"></uni-easyinput>
      </view>

      <!-- 备注（c48） -->
      <view class="mb-30px">
        <view class="mb-8px">
          <text class="text-14px color-#666">备注</text>
        </view>
        <uni-easyinput v-model="localFormData.bz" type="textarea" placeholder="请输入备注" :clearable="true"></uni-easyinput>
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
