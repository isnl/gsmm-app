<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import VideoPlayerPopup from '@/components/VideoPlayerPopup.vue';
import { service } from '@/service';

// 定义Props
const props = defineProps<{
  clusterId?: string | number;
}>();

const emit = defineEmits<{
  close: [];
}>();

// 视频播放弹窗引用
const videoPlayerPopupRef = ref();

// Tab切换状态：基本信息、每木调查、样方调查
const activeTab = ref('basicInfo');

// 基本信息数据
const basicInfo = ref<Record<string, any>>({});

// 字段名映射（英文到中文）
const fieldNameMap: Record<string, string> = {
  createdAt: '创建时间',
  createdByName: '创建人',
  gsqbh: '古树群编号',
  pcfw: '普查范围',
  dcf: '调查方法',
  xz: '乡镇(街道)',
  cun: '村(居委会)',
  xdm: '小地名',
  fbcs: '分布场所',
  szfwms: '四至范围描述',
  hb: '海拔(m)',
  mj: '面积(hm²)',
  gszs: '古树株数(株)',
  gt500: '>500年(%)',
  s300_500: '300-500年(%)',
  s100_300: '100-300年(%)',
  zgbm: '主管部门',
  qs: '权属',
  rcyhzrrlx: '日常养护责任人类型',
  dwlbOrGrmc: '单位类别或个人名称',
  bhcs: '保护措施',
  lcjgzk: '林层结构状况',
  ybd: '郁闭度',
  pjxj: '平均胸径(cm)',
  pjsg: '平均树高(m)',
  gmzl: '灌木种类',
  gmgd: '灌木盖度(%)',
  gmhd: '灌木高度(m)',
  cbzl: '草本种类',
  cbgd: '草本盖度(%)',
  cbhd: '草本高度(m)',
  zyjz: '重要价值',
  sm: '说明',
  bhyy: '变化原因',
  zpsm: '照片说明',
  bz: '备注',
  submitType: '提交状态',
};

// 格式化字段值
const formatFieldValue = (key: string, value: any): string => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  // 特殊处理
  if (key === 'submitType') {
    return value === 1 ? '已调查' : value === 0 ? '调查中' : '—';
  }

  // 如果是数组（如主要树种组成）
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    if (key === 'zysz') {
      // 主要树种组成数组
      return value.map((item: any) => `${item.name || ''} ${item.quantity || ''}株 ${item.ratio || ''}%`).join('、');
    }
    return value.join('、');
  }

  return String(value);
};

// 每木调查列表数据
const treeList = ref<any[]>([]);

// 样方调查列表数据
const plotList = ref<any[]>([]);

// 是否可以编辑（submitType === 0 时可以编辑）
const canEdit = computed(() => {
  return basicInfo.value.submitType === 0;
});

// 加载状态
const loading = ref(false);

// 加载详情数据
const loadDetail = async (id: string | number) => {
  if (!id) {
    console.warn('古树群ID为空');
    return;
  }

  loading.value = true;
  try {
    const res = await service({
      url: `/gu_shu_quns/${id}`,
      method: 'GET',
    });

    if (res && res.data) {
      // 特殊处理照片/视频字段，如果是 null 则转为空数组
      const detailData = {
        ...res.data,
        fieldImageLongShot: res.data.fieldImageLongShot || [],
        fieldImageCloseUp: res.data.fieldImageCloseUp || [],
        fieldImageHabitat: res.data.fieldImageHabitat || [],
        zysz: res.data.zysz || [], // 主要树种组成
      };

      basicInfo.value = detailData;
    }
  } catch (error: any) {
    console.error('加载古树群详情失败:', error);
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    });
    basicInfo.value = {};
  } finally {
    loading.value = false;
  }
};

// 获取基本信息属性值
const getBasicInfoValue = (key: string) => {
  return basicInfo.value[key] || '';
};

// 从路径或文件名中提取文件扩展名
const getFileExtension = (str: string | undefined): string => {
  if (!str) return '';
  // 提取最后一个 . 后面的扩展名
  const match = str.toLowerCase().match(/\.([a-z0-9]+)(?:[?#]|$)/);
  return match ? match[1] : '';
};

// 判断是否为图片
const checkIsImage = (item: any): boolean => {
  // 优先使用 fileType
  if (item?.fileType) {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'image'];
    const type = item.fileType.toLowerCase();
    if (imageTypes.some(t => type.includes(t))) return true;
  }

  // 如果没有 fileType，从 name 或 path 中提取扩展名判断
  const extension = getFileExtension(item?.name || item?.path);
  if (extension) {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    return imageTypes.includes(extension);
  }

  return false;
};

// 判断是否为视频
const checkIsVideo = (item: any): boolean => {
  // 优先使用 fileType
  if (item?.fileType) {
    const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'video'];
    const type = item.fileType.toLowerCase();
    if (videoTypes.some(t => type.includes(t))) return true;
  }

  // 如果没有 fileType，从 name 或 path 中提取扩展名判断
  const extension = getFileExtension(item?.name || item?.path);
  if (extension) {
    const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'video'];
    return videoTypes.includes(extension);
  }

  return false;
};

// 预览图片
const previewImage = (current: string, images: any[]) => {
  const imageUrls = images.filter((item: any) => checkIsImage(item)).map((item: any) => item.url || item.tempFilePath || item.path);

  if (imageUrls.length === 0) {
    uni.showToast({
      title: '没有可预览的图片',
      icon: 'none',
    });
    return;
  }

  uni.previewImage({
    current,
    urls: imageUrls,
  });
};

// 播放视频
const handleVideoPlay = (videoPath: string) => {
  console.log('播放视频:', videoPath);
  videoPlayerPopupRef.value?.open(videoPath);
};

// 处理编辑按钮点击
const handleEdit = () => {
  if (!props.clusterId) {
    uni.showToast({
      title: '无法获取古树群ID',
      icon: 'none',
    });
    return;
  }

  emit('close');
  uni.navigateTo({
    url: `/pages/ancient_tree_cluster/index?id=${props.clusterId}`,
  });
};

// 新增每木调查
const handleAddTreeSurvey = () => {
  // TODO: 跳转到新增古树页面
  uni.navigateTo({
    url: `/pages/ancient_tree/index?gsqId=${props.clusterId}&gsqbh=${basicInfo.value.gsqbh}`,
  });
};

// 新增样方调查
const handleAddPlotSurvey = () => {
  // TODO: 跳转到新增样方调查页面
  uni.navigateTo({
    url: '/pages/ancient_tree_cluster_sample/index',
  });
};

// 关闭弹窗
const handleClose = () => {
  emit('close');
};

// 初始化数据
const initData = () => {
  if (props.clusterId) {
    loadDetail(props.clusterId);
  }

  // 模拟每木调查数据
  treeList.value = [
    {
      id: 1,
      code: 'GS2024001-T001',
      date: '2025.01.06',
      breastHeight: '45.6',
      treeHeight: '12.8',
      investigator: '张三',
      image: '',
    },
    {
      id: 2,
      code: 'GS2024001-T002',
      date: '2025.01.06',
      breastHeight: '52.3',
      treeHeight: '15.2',
      investigator: '李四',
      image: '',
    },
    {
      id: 3,
      code: 'GS2024001-T003',
      date: '2025.01.05',
      breastHeight: '38.9',
      treeHeight: '11.5',
      investigator: '王五',
      image: '',
    },
  ];

  // 模拟样方调查数据
  plotList.value = [
    {
      id: 1,
      code: 'GS2024002-C001',
      date: '2025.01.06',
      area: '20m*20m',
      type: '样方调查',
      investigator: '张三',
      image: '',
    },
    {
      id: 2,
      code: 'GS2024002-C002',
      date: '2025.01.05',
      area: '10m*10m',
      type: '样方调查',
      investigator: '李四',
      image: '',
    },
    {
      id: 3,
      code: 'GS2024002-C003',
      date: '2025.01.04',
      area: '15m*15m',
      type: '样方调查',
      investigator: '王五',
      image: '',
    },
  ];
};

// 监听 clusterId 变化
watch(
  () => props.clusterId,
  newVal => {
    if (newVal) {
      loadDetail(newVal);
    } else {
      basicInfo.value = {};
    }
  },
  { immediate: true },
);
</script>

<template>
  <view class="w-full h-80vh flex flex-col bg-#fff">
    <!-- Tab切换 -->
    <view class="w-full flex items-center justify-between px-20px py-15px border-b-1px border-#eee">
      <view class="flex items-center gap-10px flex-1">
        <view @click="activeTab = 'basicInfo'" :class="['px-20px h-36px fc rounded-6px flex-1', activeTab === 'basicInfo' ? 'bg-#01bd8d' : 'bg-#f5f5f5']">
          <text :class="['text-14px', activeTab === 'basicInfo' ? 'color-#fff' : 'color-#666']">基本信息</text>
        </view>
        <view @click="activeTab = 'treeSurvey'" :class="['px-20px h-36px fc rounded-6px flex-1', activeTab === 'treeSurvey' ? 'bg-#01bd8d' : 'bg-#f5f5f5']">
          <text :class="['text-14px', activeTab === 'treeSurvey' ? 'color-#fff' : 'color-#666']">每木调查</text>
        </view>
        <view @click="activeTab = 'plotSurvey'" :class="['px-20px h-36px fc rounded-6px flex-1', activeTab === 'plotSurvey' ? 'bg-#01bd8d' : 'bg-#f5f5f5']">
          <text :class="['text-14px', activeTab === 'plotSurvey' ? 'color-#fff' : 'color-#666']">样方调查</text>
        </view>
      </view>
      <view @click="handleClose" class="w-30px h-30px fc ml-10px">
        <uni-icons type="closeempty" size="24" color="#666"></uni-icons>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="flex-1 overflow-y-auto px-20px py-20px">
      <!-- 基本信息Tab -->
      <view v-if="activeTab === 'basicInfo'" class="flex flex-col gap-16px">
        <!-- 按顺序显示重要字段 -->
        <template v-for="(value, key) in basicInfo" :key="key">
          <!-- 跳过不需要显示的字段 -->
          <view
            v-if="!['id', 'status', 'geom', 'fieldImageLongShot', 'fieldImageCloseUp', 'fieldImageHabitat', 'zysz'].includes(key)"
            class="flex flex-col gap-8px"
          >
            <view class="flex items-center">
              <text class="text-14px color-#666">{{ fieldNameMap[key] || key }}</text>
            </view>
            <view class="bg-#f5f5f5 px-12px py-10px rounded-4px">
              <text class="text-14px color-#333">{{ formatFieldValue(key, value) }}</text>
            </view>
          </view>
        </template>

        <!-- 主要树种组成特殊处理 -->
        <view v-if="basicInfo.zysz && Array.isArray(basicInfo.zysz) && basicInfo.zysz.length > 0" class="flex flex-col gap-8px">
          <view class="flex items-center">
            <text class="text-14px color-#666">主要树种组成</text>
          </view>
          <view class="bg-#f5f5f5 px-12px py-10px rounded-4px">
            <view v-for="(item, index) in basicInfo.zysz" :key="index" class="mb-8px last:mb-0">
              <text class="text-14px color-#333"> {{ item.name || '—' }} {{ item.quantity || '—' }}株 {{ item.ratio ? item.ratio + '%' : '—' }} </text>
            </view>
          </view>
        </view>

        <!-- 图片/视频展示 -->
        <!-- 远景照片 -->
        <view
          v-if="basicInfo.fieldImageLongShot && Array.isArray(basicInfo.fieldImageLongShot) && basicInfo.fieldImageLongShot.length > 0"
          class="flex flex-col gap-8px"
        >
          <view class="flex items-center">
            <text class="text-14px color-#666">远景照片</text>
          </view>
          <view class="flex gap-10px flex-wrap">
            <view v-for="(photo, index) in basicInfo.fieldImageLongShot" :key="index" class="relative w-72px h-72px bg-#f5f5f5 rounded-8px overflow-hidden">
              <!-- 图片预览 -->
              <image
                v-if="checkIsImage(photo)"
                :src="photo.id ? photo.url : photo.tempFilePath || photo.path"
                mode="aspectFill"
                class="w-full h-full"
                @click="previewImage(photo.id ? photo.url : photo.tempFilePath || photo.path, basicInfo.fieldImageLongShot)"
              />
              <!-- 视频预览 -->
              <view
                v-else-if="checkIsVideo(photo)"
                class="w-full h-full relative bg-#000"
                @click="handleVideoPlay(photo.id ? photo.url : photo.tempFilePath || photo.path)"
              >
                <image v-if="photo.thumbTempFilePath" :src="photo.thumbTempFilePath" class="w-full h-full object-cover rounded" mode="aspectFill" />
                <view class="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-rgba(0,0,0,0.5)">
                  <view class="w-25px h-25px rounded-full bg-#fff b-(2px solid #000) fc">
                    <view class="text-24px color-#000 iconfont icon-play"></view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 近景照片 -->
        <view
          v-if="basicInfo.fieldImageCloseUp && Array.isArray(basicInfo.fieldImageCloseUp) && basicInfo.fieldImageCloseUp.length > 0"
          class="flex flex-col gap-8px"
        >
          <view class="flex items-center">
            <text class="text-14px color-#666">近景照片</text>
          </view>
          <view class="flex gap-10px flex-wrap">
            <view v-for="(photo, index) in basicInfo.fieldImageCloseUp" :key="index" class="relative w-72px h-72px bg-#f5f5f5 rounded-8px overflow-hidden">
              <!-- 图片预览 -->
              <image
                v-if="checkIsImage(photo)"
                :src="photo.id ? photo.url : photo.tempFilePath || photo.path"
                mode="aspectFill"
                class="w-full h-full"
                @click="previewImage(photo.id ? photo.url : photo.tempFilePath || photo.path, basicInfo.fieldImageCloseUp)"
              />
              <!-- 视频预览 -->
              <view
                v-else-if="checkIsVideo(photo)"
                class="w-full h-full relative bg-#000"
                @click="handleVideoPlay(photo.id ? photo.url : photo.tempFilePath || photo.path)"
              >
                <image v-if="photo.thumbTempFilePath" :src="photo.thumbTempFilePath" class="w-full h-full object-cover rounded" mode="aspectFill" />
                <view class="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-rgba(0,0,0,0.5)">
                  <view class="w-25px h-25px rounded-full bg-#fff b-(2px solid #000) fc">
                    <view class="text-24px color-#000 iconfont icon-play"></view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 群内生境照片 -->
        <view
          v-if="basicInfo.fieldImageHabitat && Array.isArray(basicInfo.fieldImageHabitat) && basicInfo.fieldImageHabitat.length > 0"
          class="flex flex-col gap-8px"
        >
          <view class="flex items-center">
            <text class="text-14px color-#666">群内生境照片</text>
          </view>
          <view class="flex gap-10px flex-wrap">
            <view v-for="(photo, index) in basicInfo.fieldImageHabitat" :key="index" class="relative w-72px h-72px bg-#f5f5f5 rounded-8px overflow-hidden">
              <!-- 图片预览 -->
              <image
                v-if="checkIsImage(photo)"
                :src="photo.id ? photo.url : photo.tempFilePath || photo.path"
                mode="aspectFill"
                class="w-full h-full"
                @click="previewImage(photo.id ? photo.url : photo.tempFilePath || photo.path, basicInfo.fieldImageHabitat)"
              />
              <!-- 视频预览 -->
              <view
                v-else-if="checkIsVideo(photo)"
                class="w-full h-full relative bg-#000"
                @click="handleVideoPlay(photo.id ? photo.url : photo.tempFilePath || photo.path)"
              >
                <image v-if="photo.thumbTempFilePath" :src="photo.thumbTempFilePath" class="w-full h-full object-cover rounded" mode="aspectFill" />
                <view class="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-rgba(0,0,0,0.5)">
                  <view class="w-25px h-25px rounded-full bg-#fff b-(2px solid #000) fc">
                    <view class="text-24px color-#000 iconfont icon-play"></view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 无数据提示 -->
        <view v-if="Object.keys(basicInfo).length === 0" class="w-full h-200px fc">
          <text class="text-14px color-#999">暂无基本信息</text>
        </view>
      </view>

      <!-- 每木调查Tab -->
      <view v-if="activeTab === 'treeSurvey'" class="flex flex-col gap-12px">
        <!-- 列表项 -->
        <view
          v-for="(item, index) in treeList"
          :key="index"
          class="flex items-center gap-12px bg-#fff border-1px border-solid border-#eee rounded-8px p-12px active:bg-#e6f7f1"
        >
          <!-- 左侧缩略图 -->
          <view class="w-80px h-80px bg-#f5f5f5 rounded-6px overflow-hidden flex-shrink-0">
            <image v-if="item.image" :src="item.image" mode="aspectFill" class="w-full h-full"></image>
            <view v-else class="w-full h-full fc">
              <image src="/static/images/icons/img_thum.png" mode="widthFix" class="w-40px"></image>
            </view>
          </view>

          <!-- 右侧内容 -->
          <view class="flex-1 flex flex-col gap-6px">
            <!-- 第一行：编号和日期 -->
            <view class="flex items-center justify-between">
              <text class="text-15px font-bold color-#333">{{ item.code || '未知编号' }}</text>
              <text class="text-12px color-#666">{{ item.date || '' }}</text>
            </view>

            <!-- 第二行：详细信息 -->
            <view class="flex items-center gap-10px flex-wrap">
              <text class="text-13px color-#666">{{ item.breastHeight || '—' }}cm</text>
              <text class="text-13px color-#666">{{ item.treeHeight || '—' }}m</text>
              <text class="text-13px color-#666">每木调查</text>
              <text class="text-13px color-#666">{{ item.investigator || '—' }}</text>
            </view>
          </view>
        </view>

        <!-- 无数据提示 -->
        <view v-if="treeList.length === 0" class="w-full h-200px fc">
          <text class="text-14px color-#999">暂无每木调查数据</text>
        </view>
      </view>

      <!-- 样方调查Tab -->
      <view v-if="activeTab === 'plotSurvey'" class="flex flex-col gap-12px">
        <!-- 列表项 -->
        <view
          v-for="(item, index) in plotList"
          :key="index"
          class="flex items-center gap-12px bg-#fff border-1px border-solid border-#eee rounded-8px p-12px active:bg-#e6f7f1"
        >
          <!-- 左侧缩略图 -->
          <view class="w-80px h-80px bg-#f5f5f5 rounded-6px overflow-hidden flex-shrink-0">
            <image v-if="item.image" :src="item.image" mode="aspectFill" class="w-full h-full"></image>
            <view v-else class="w-full h-full fc">
              <image src="/static/images/icons/img_thum.png" mode="widthFix" class="w-40px"></image>
            </view>
          </view>

          <!-- 右侧内容 -->
          <view class="flex-1 flex flex-col gap-6px">
            <!-- 第一行：编号和日期 -->
            <view class="flex items-center justify-between">
              <text class="text-15px font-bold color-#333">{{ item.code || '未知编号' }}</text>
              <text class="text-12px color-#666">{{ item.date || '' }}</text>
            </view>

            <!-- 第二行：详细信息 -->
            <view class="flex items-center gap-10px flex-wrap">
              <text class="text-13px color-#666">{{ item.area || '—' }}</text>
              <text class="text-13px color-#666">{{ item.type || '样方调查' }}</text>
              <text class="text-13px color-#666">{{ item.investigator || '—' }}</text>
            </view>
          </view>
        </view>

        <!-- 无数据提示 -->
        <view v-if="plotList.length === 0" class="w-full h-200px fc">
          <text class="text-14px color-#999">暂无样方调查数据</text>
        </view>
      </view>
    </view>

    <!-- 底部按钮区域 -->
    <view class="w-full px-20px py-15px border-t-1px border-#eee bg-#fff">
      <!-- 编辑按钮（仅在基本信息Tab且submitType=0时显示） -->
      <view v-if="activeTab === 'basicInfo' && canEdit" class="w-full mb-10px">
        <view @click="handleEdit" class="w-full h-44px bg-#01bd8d fc rounded-8px">
          <text class="text-15px color-#fff">编辑</text>
        </view>
      </view>

      <!-- 新增按钮（其他Tab显示） -->
      <view v-if="activeTab !== 'basicInfo'">
        <view @click="activeTab === 'treeSurvey' ? handleAddTreeSurvey() : handleAddPlotSurvey()" class="w-full h-44px bg-#01bd8d fc rounded-8px">
          <text class="text-15px color-#fff">
            {{ activeTab === 'treeSurvey' ? '新增古树' : '新增样方调查' }}
          </text>
        </view>
      </view>
    </view>

    <!-- 视频播放弹窗 -->
    <VideoPlayerPopup ref="videoPlayerPopupRef" />
  </view>
</template>

<style scoped></style>
