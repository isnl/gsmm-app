<script lang="ts" setup>
import { ref, watch } from 'vue';
import { type Survey } from '@/stores/survey_list';
import { useSurveyEditStore } from '@/stores/survey_edit';
import { getAllImagesFromMultimedia, checkIsImage, checkIsVideo, formatInvestigateStatus } from '@/utils';
import MapSelectionPopup from '@/components/MapSelectionPopup.vue';
import dayjs from 'dayjs';

interface Props {
  visible: boolean;
  disabledEdit: boolean;
  treeItem: Survey | null;
  mySurvey?: boolean; // 是否为我的调查页面
  noToggleTabbar?: boolean; // 是否不动态隐藏togglebar
}

const props = defineProps<Props>();
const emit = defineEmits(['update:visible', 'handleDeleteSyncItem']);
const { setCurrentEditData } = useSurveyEditStore();

const treeDetailPopup = ref<any>(null);

// 监听弹窗显示状态
watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      if (!props.noToggleTabbar) {
        uni.hideTabBar();
      }
      treeDetailPopup.value?.open('bottom');
    } else {
      treeDetailPopup.value?.close();
      if (!props.noToggleTabbar) {
        uni.showTabBar();
      }
    }
  },
);

// 弹窗状态变化处理
const onPopupChange = (e: any) => {
  emit('update:visible', e.show);
};

// 根据状态获取按钮文本
const getButtonText = () => {
  const status = formatInvestigateStatus(props.treeItem?.investigateStatus);
  switch (status) {
    case '待调查':
      return '开始调查';
    case '调查中':
    case '已调查':
      return '编辑';
    default:
      return '编辑';
  }
};

/**
 * 删除这条同步记录
 */
const handleDeleteSyncItem = () => {
  emit('handleDeleteSyncItem');
};

// 处理按钮点击事件
const handleButtonClick = () => {
  if (props.treeItem) {
    console.log('item', props.treeItem);

    // 将数据存储到pinia中
    setCurrentEditData(props.treeItem);

    // 跳转到创建/编辑页面
    const url = props.treeItem.id ? `/pages/survey_create/index?id=${props.treeItem.id}` : `/pages/survey_create/index`;

    emit('update:visible', false);
    if (!props.noToggleTabbar) {
      uni.showTabBar();
    }
    uni.navigateTo({ url });
  }
};

// 打开外部导航
const openNavigation = () => {
  const latitude = props.treeItem?.location?.y;
  const longitude = props.treeItem?.location?.x;
  // 检查经纬度是否有效
  if (latitude && longitude) {
    mapSelectionVisible.value = true;
  }
};

const previewImage = (url: string = '') => {
  uni.previewImage({
    urls: [url],
  });
};
// 视频播放相关
const videoPopupRef = ref();
const currentVideoUrl = ref('');
const isVideoPlaying = ref(false);

// 地图选择弹窗相关
const mapSelectionVisible = ref(false);

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
  <uni-popup ref="treeDetailPopup" type="share" background-color="#fff" @change="onPopupChange">
    <div class="w-full h-70vh overflow-hidden flex flex-col">
      <view class="w-full flex gap-20px p-15px">
        <!-- 树木图片轮播图 -->
        <swiper
          v-if="getAllImagesFromMultimedia(treeItem?.multimedia).length"
          class="w-115px h-90px"
          :indicator-dots="false"
          :autoplay="true"
          :interval="3000"
          :duration="500"
        >
          <swiper-item v-for="(media, index) in treeItem?.multimedia" :key="index">
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
            <!-- <video
                    :src="media.id ? media.url : media.tempFilePath"
                    class="w-full h-full object-cover rounded"
                    controls
                    :show-center-play-btn="true"
                    :show-play-btn="true"
                  /> -->
            <!-- #endif -->
          </swiper-item>
        </swiper>
        <view v-else class="w-115px h-90px fc text-12px b-(1px dashed #eee)"> 暂无图片 </view>

        <!-- 标题部分 -->
        <view class="flex flex-col gap-5px justify-between">
          <text class="text-20px font-bold text-#333">{{ treeItem?.treeSpecies || '未知树种' }}</text>
          <text class="text-14px text-#666">{{ treeItem?.treeCode || '无编号' }}</text>
          <text class="text-14px text-#666">挂牌编号：{{ treeItem?.codeNumber || '无编号' }}</text>
          <text v-if="treeItem?.type" class="text-14px text-#666">树种类型：{{ treeItem.type }}</text>
          <text class="text-14px text-#666">{{ treeItem?.areaName || '' }}</text>
        </view>
      </view>

      <!-- 树木信息 -->
      <view class="bg-white flex-1 overflow-hidden">
        <scroll-view :scroll-y="true" class="h-full px-15px">
          <!-- 拉丁学名 -->
          <view v-if="treeItem?.latinName" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">拉丁学名</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.latinName }}</text>
          </view>

          <!-- 科 -->
          <view v-if="treeItem?.family" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">科</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.family }}</text>
          </view>

          <!-- 属 -->
          <view v-if="treeItem?.genus" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">属</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.genus }}</text>
          </view>

          <!-- 种 -->
          <view v-if="treeItem?.species" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">种</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.species }}</text>
          </view>

          <!-- 乡（镇） -->
          <view v-if="treeItem?.town" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">乡（镇）</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.town }}</text>
          </view>

          <!-- 村 -->
          <view v-if="treeItem?.village" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">村</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.village }}</text>
          </view>

          <!-- 小地名 -->
          <view v-if="treeItem?.smallPlaceName" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">小地名</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.smallPlaceName }}</text>
          </view>

          <!-- 经纬度 -->
          <view v-if="treeItem?.location?.x || treeItem?.location?.y" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">经纬度</text>
            <view class="flex-1">
              <text v-if="treeItem?.location?.x" class="text-14px text-#333">{{ treeItem.location.x }}</text>
              <text v-if="treeItem?.location?.y" class="block text-14px text-#333">{{ treeItem.location.y }}</text>
            </view>
            <view>
              <button class="text-white text-10px w-60px h-26px fc bg-#225ed5 rounded-5px" @click="openNavigation">去这里</button>
            </view>
          </view>

          <!-- 海拔 -->
          <view v-if="treeItem?.altitude" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">海拔</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.altitude + '米' }}</text>
          </view>

          <!-- 保护类型 -->
          <view v-if="treeItem?.protectionType" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">保护类型</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.protectionType }}</text>
          </view>

          <!-- 等级 -->
          <view v-if="treeItem?.protectionLevel" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">等级</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.protectionLevel }}</text>
          </view>

          <!-- 树高 -->
          <view v-if="treeItem?.treeHeight" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">树高</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.treeHeight + '米' }}</text>
          </view>

          <!-- 冠幅 -->
          <view v-if="treeItem?.crownWidth" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">冠幅</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.crownWidth + '米' }}</text>
          </view>

          <!-- 测量维度 -->
          <view v-if="treeItem?.measurementDimensionType" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">测量维度</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.measurementDimensionType }}</text>
          </view>

          <!-- 测量信息 -->
          <view v-if="getParsedMeasurementInfo(treeItem?.measurementInfo)" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">测量信息</text>
            <view class="flex-1 text-14px text-#333">
              <view v-for="(value, key) in getParsedMeasurementInfo(treeItem?.measurementInfo)" :key="key" v-if="value">
                <text v-if="key === 'chestDiameter'">胸径: {{ value }}厘米</text>
                <text v-else-if="key === 'groundDiameter'">地径: {{ value }}厘米</text>
                <text v-else-if="key === 'distributionDiameter'">分布直径: {{ value }}厘米</text>
                <text v-else-if="key === 'branchCount'">分支数量: {{ value }}个</text>
                <text v-else-if="key === 'farthestDiameter'">离中心点最远的树木的胸径/直径: {{ value }}厘米</text>
              </view>
            </view>
          </view>

          <!-- 预估值 -->
          <view v-if="treeItem?.measurementInfoEstimate" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">预估值</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.measurementInfoEstimate }}厘米</text>
          </view>

          <!-- 预估类型 -->
          <view v-if="treeItem?.measurementDimensionTypeEstimate" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">预估类型</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.measurementDimensionTypeEstimate }}</text>
          </view>

          <!-- 规格 -->
          <view v-if="treeItem?.specs" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">规格</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.specs + '厘米' }}</text>
          </view>

          <!-- 枝下高 -->
          <view v-if="treeItem?.underBranchHeight" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">枝下高</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.underBranchHeight + '米' }}</text>
          </view>

          <!-- 树龄 -->
          <view v-if="treeItem?.estimatedAge" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">树龄</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.estimatedAge + '年' }}</text>
          </view>

          <!-- 俗名 -->
          <view v-if="treeItem?.commonName" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">俗名</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.commonName }}</text>
          </view>

          <!-- 权属单位 -->
          <view v-if="treeItem?.ownershipUnit" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">权属单位</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.ownershipUnit }}</text>
          </view>

          <!-- 生长势 -->
          <view v-if="treeItem?.healthStatus" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">生长势</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.healthStatus }}</text>
          </view>

          <!-- 生长环境 -->
          <view v-if="treeItem?.growthEnvironment" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">生长环境</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.growthEnvironment }}</text>
          </view>

          <!-- 是否具备移植条件 -->
          <view v-if="treeItem?.isTransplant" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">是否具备移植条件</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.isTransplant === 'true' ? '是' : '否' }}</text>
          </view>

          <!-- 不可移植原因 -->
          <view v-if="treeItem?.notTransplant" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">不可移植原因</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.notTransplant }}</text>
          </view>

          <!-- 历史典故 -->
          <view v-if="treeItem?.historicalAnecdotes" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">历史典故</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.historicalAnecdotes }}</text>
          </view>

          <!-- 是否稀有物种 -->
          <view v-if="treeItem?.isRareSpecies !== null && treeItem?.isRareSpecies !== ''" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">稀有物种</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem?.isRareSpecies == 'true' || treeItem?.isRareSpecies == true ? '是' : '否' }}</text>
          </view>

          <!-- 发现日期 -->
          <view v-if="treeItem?.discoveryDate" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">发现日期</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.discoveryDate }}</text>
          </view>

          <!-- 批次 -->
          <view v-if="treeItem?.batch" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">批次</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.batch }}</text>
          </view>

          <!-- 地块名称 -->
          <view v-if="treeItem?.landParcelsName" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">地块名称</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.landParcelsName }}</text>
          </view>

          <!-- 调查人员 -->
          <view v-if="treeItem?.investigatorName" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">调查人员</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.investigatorName }}</text>
          </view>

          <!-- 调查时间 -->
          <view v-if="treeItem?.finishDate" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">调查时间</text>
            <text class="flex-1 text-14px text-#333">{{ dayjs(treeItem.finishDate).format('YYYY-MM-DD HH:mm:ss') }}</text>
          </view>

          <!-- 修改时间 -->
          <view v-if="treeItem?.updateDate" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">修改时间</text>
            <text class="flex-1 text-14px text-#333">{{ dayjs(treeItem.updateDate).format('YYYY-MM-DD HH:mm:ss') }}</text>
          </view>

          <!-- 面积 -->
          <view v-if="treeItem?.area" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">面积</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.area + '㎡' }}</text>
          </view>

          <!-- 数量 -->
          <view v-if="treeItem?.quantity" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">数量</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.quantity + '株' }}</text>
          </view>

          <!-- 移栽方案 -->
          <view v-if="treeItem?.transplantPlan" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">移栽方案</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.transplantPlan }}</text>
          </view>

          <!-- 地类 -->
          <view v-if="treeItem?.landType" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">地类</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.landType }}</text>
          </view>

          <!-- 土壤类型 -->
          <view v-if="treeItem?.soilTexture" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">土壤类型</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.soilTexture }}</text>
          </view>

          <!-- 地貌 -->
          <view v-if="treeItem?.landform" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">地貌</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.landform }}</text>
          </view>

          <!-- 土层厚度 -->
          <view v-if="treeItem?.soilLayerThickness" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">土层厚度</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.soilLayerThickness }}厘米</text>
          </view>

          <!-- 坡度 -->
          <view v-if="treeItem?.slope" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">坡度</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.slope }}</text>
          </view>

          <!-- 坡向 -->
          <view v-if="treeItem?.aspect" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">坡向</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.aspect }}</text>
          </view>

          <!-- 坡位 -->
          <view v-if="treeItem?.slopePosition" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">坡位</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.slopePosition }}</text>
          </view>

          <!-- 迁出地 -->
          <view v-if="treeItem?.relocationPlace" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">迁出地</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.relocationPlace }}</text>
          </view>

          <!-- 立地条件 -->
          <view v-if="treeItem?.siteConditionDesc" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">立地条件</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.siteConditionDesc }}</text>
          </view>

          <!-- 现有保护措施 -->
          <view v-if="treeItem?.protectionMeasureType" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">现有保护措施</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.protectionMeasureType }}</text>
          </view>

          <!-- 组员 -->
          <view v-if="treeItem?.team" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">组员</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.team }}</text>
          </view>

          <!-- 迁地保护 -->
          <view v-if="treeItem?.relocationProtection" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">迁地保护</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.relocationProtection }}</text>
          </view>

          <!-- 管护措施 -->
          <view v-if="treeItem?.managementMeasures" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">管护措施</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.managementMeasures }}</text>
          </view>

          <!-- 工程进度 -->
          <view v-if="treeItem?.projectSchedule" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">工程进度</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.projectSchedule }}</text>
          </view>

          <!-- 用工量统计 -->
          <view v-if="treeItem?.laborStatistics" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">用工量统计</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.laborStatistics }}</text>
          </view>

          <!-- 投资概算 -->
          <view v-if="treeItem?.investmentEstimate" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">投资概算</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.investmentEstimate + '元' }}</text>
          </view>

          <!-- 行政区划代码 -->
          <view v-if="treeItem?.areaCode" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">区划代码</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.areaCode }}</text>
          </view>

          <!-- 创建时间 -->
          <view v-if="treeItem?.createdAt" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">创建时间</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.createdAt }}</text>
          </view>

          <!-- 更新时间 -->
          <view v-if="treeItem?.updatedAt" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">更新时间</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.updatedAt }}</text>
          </view>

          <!-- 备注 -->
          <view v-if="treeItem?.remarks" class="flex gap-20px py-8px border-b border-#eee">
            <text class="w-100px text-right text-14px text-#516280">备注</text>
            <text class="flex-1 text-14px text-#333">{{ treeItem.remarks }}</text>
          </view>
        </scroll-view>
      </view>

      <view class="w-full" v-if="!disabledEdit">
        <!-- 底部按钮 -->
        <view class="w-full px-15px py-10px bg-white border-t border-#eee" v-if="!mySurvey">
          <button
            class="w-full h-44px text-#225ed5 bg-[rgba(34,94,213,0.28)] b-(1px dashed #225ed5) text-white text-16px rounded-5px fc"
            :class="{
              '!bgPrimary !text-#fff !b-(1px solid #01bd8d)': formatInvestigateStatus(treeItem?.investigateStatus!) === '待调查',
            }"
            @click="handleButtonClick"
          >
            {{ getButtonText() }}
          </button>
        </view>

        <view class="w-full px-15px py-10px bg-white flex items-center gap-10px border-t border-#eee" v-else>
          <button class="flex-1 h-44px text-#fff bg-#225ed5 text-white text-16px rounded-5px fc" @click="handleButtonClick">编辑</button>
          <button class="flex-1 h-44px text-#fff bg-#ff6a6a text-white text-16px rounded-5px fc" @click="handleDeleteSyncItem">删除</button>
        </view>
      </view>
    </div>
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
    <MapSelectionPopup
      v-model:visible="mapSelectionVisible"
      :latitude="treeItem?.location?.y"
      :longitude="treeItem?.location?.x"
      :location-name="(treeItem?.treeCode || '') + (treeItem?.treeSpecies || '')"
    />
  </uni-popup>
</template>
