<script lang="ts" setup>
import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { service } from '@/service';
import VideoPlayerPopup from '@/components/VideoPlayerPopup.vue';

// 视频播放弹窗引用
const videoPlayerPopupRef = ref();

// Tab切换状态：基本信息、每木调查、样方调查
const activeTab = ref('basicInfo');

// 基本信息数据
const basicInfo = ref<Record<string, any>>({});
const clusterId = ref('');
const loading = ref(false);

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

// 状态标签文本
const statusText = computed(() => {
  if (basicInfo.value.submitType === 1) {
    return '已调查';
  } else if (basicInfo.value.submitType === 0) {
    return '调查中';
  }
  return '未知';
});

// 状态标签颜色
const statusColor = computed(() => {
  if (basicInfo.value.submitType === 1) {
    return '#01bd8d';
  } else if (basicInfo.value.submitType === 0) {
    return '#ff9800';
  }
  return '#999';
});

// 是否显示编辑按钮（待调查或调查中状态）
const showEditButton = computed(() => {
  return basicInfo.value.submitType === 0 || basicInfo.value.submitType === undefined;
});

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
const treeListLoading = ref(false);

// 样方调查列表数据
const plotList = ref<any[]>([]);
const plotListLoading = ref(false);

// 获取状态文本
const getStatusText = (submitType: number | undefined) => {
  if (submitType === 1) return '已调查';
  if (submitType === 0) return '调查中';
  return '待调查';
};

// 获取状态颜色
const getStatusColor = (submitType: number | undefined) => {
  if (submitType === 1) return '#01bd8d';
  if (submitType === 0) return '#ff9800';
  return '#999';
};

// 每木调查项点击
const handleTreeItemClick = (item: any) => {
  if (!item.id) return;

  // 已调查：跳转到详情页
  if (item.submitType === 1) {
    uni.navigateTo({
      url: `/pages/ancient_tree/detail?id=${item.id}`,
    });
  } else {
    // 调查中或待调查：跳转到编辑页
    uni.navigateTo({
      url: `/pages/ancient_tree/index?id=${item.id}&gsqId=${clusterId.value}&gsqbh=${basicInfo.value.gsqbh}`,
    });
  }
};

// 样方调查项点击
const handlePlotItemClick = (item: any) => {
  if (!item.id) return;

  // 已调查：跳转到详情页（这里暂时跳转到编辑页，因为没有单独的详情页）
  if (item.submitType === 1) {
    uni.navigateTo({
      url: `/pages/ancient_tree_cluster_sample/detail?id=${item.id}`,
    });
  } else {
    // 调查中或待调查：跳转到编辑页
    uni.navigateTo({
      url: `/pages/ancient_tree_cluster_sample/index?id=${item.id}&gsqId=${clusterId.value}&gsqbh=${basicInfo.value.gsqbh}`,
    });
  }
};

// 判断是否为图片
const checkIsImage = (fileType: string) => {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
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

// 预览图片
const previewImage = (current: string, images: any[]) => {
  const imageUrls = images.filter((item: any) => checkIsImage(item.path || item.fileType)).map((item: any) => item.url || item.tempFilePath || item.path);

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

// 编辑
const handleEdit = () => {
  uni.navigateTo({
    url: `/pages/ancient_tree_cluster/index?id=${clusterId.value}`,
  });
};

// 新增每木调查
const handleAddTreeSurvey = () => {
  if (!clusterId.value || !basicInfo.value.gsqbh) {
    uni.showToast({
      title: '缺少必要参数',
      icon: 'none',
    });
    return;
  }

  uni.navigateTo({
    url: `/pages/ancient_tree_cluster/selectLocation?gsqId=${clusterId.value}&gsqbh=${basicInfo.value.gsqbh}&type=tree`,
  });
};

// 新增样方调查
const handleAddPlotSurvey = () => {
  if (!clusterId.value || !basicInfo.value.gsqbh) {
    uni.showToast({
      title: '缺少必要参数',
      icon: 'none',
    });
    return;
  }

  uni.navigateTo({
    url: `/pages/ancient_tree_cluster/selectLocation?gsqId=${clusterId.value}&gsqbh=${basicInfo.value.gsqbh}&type=plot`,
  });
};

// 加载详情数据
const loadDetail = async (id: string) => {
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

// 加载每木调查数据
const loadTreeList = async (id: string) => {
  if (treeListLoading.value) return;

  treeListLoading.value = true;
  try {
    const res = await service({
      url: `/gu_shus?gsqId=${id}&page=1&size=999`,
      method: 'GET',
    });

    if (res && res.data) {
      // 如果返回的是数组
      if (Array.isArray(res.data.data)) {
        treeList.value = res.data.data;
      } else {
        treeList.value = [];
      }
      console.log('每木调查数据:', treeList.value);
    } else {
      treeList.value = [];
    }
  } catch (error: any) {
    console.error('加载每木调查数据失败:', error);
    uni.showToast({
      title: error.message || '加载每木调查失败',
      icon: 'none',
    });
    treeList.value = [];
  } finally {
    treeListLoading.value = false;
  }
};

// 加载样方调查数据
const loadPlotList = async (id: string) => {
  if (plotListLoading.value) return;

  plotListLoading.value = true;
  try {
    const res = await service({
      url: `/gu_shu_qun_chou_yangs?gsqId=${id}&page=1&size=999`,
      method: 'GET',
    });

    if (res && res.data) {
      // 如果返回的是数组
      if (Array.isArray(res.data.data)) {
        plotList.value = res.data.data;
      } else {
        plotList.value = [];
      }
      console.log('样方调查数据:', plotList.value);
    } else {
      plotList.value = [];
    }
  } catch (error: any) {
    console.error('加载样方调查数据失败:', error);
    uni.showToast({
      title: error.message || '加载样方调查失败',
      icon: 'none',
    });
    plotList.value = [];
  } finally {
    plotListLoading.value = false;
  }
};

// 切换 Tab
const handleTabChange = (tab: string) => {
  activeTab.value = tab;

  // 切换到每木调查时，如果数据为空则加载
  if (tab === 'treeSurvey' && clusterId.value) {
    loadTreeList(clusterId.value);
  }

  // 切换到样方调查时，如果数据为空则加载
  if (tab === 'plotSurvey' && clusterId.value) {
    loadPlotList(clusterId.value);
  }
};

// 页面加载
onLoad((options: any) => {
  if (options && options.id) {
    clusterId.value = options.id;
    loadDetail(options.id);
  } else {
    uni.showToast({
      title: '缺少ID参数',
      icon: 'none',
    });
  }

  // 模拟每木调查数据
  treeList.value = [];

  // 模拟样方调查数据
  plotList.value = [];
});
onShow(() => {
  if (clusterId.value) {
    loadDetail(clusterId.value);
    if (activeTab.value === 'treeSurvey') {
      loadTreeList(clusterId.value);
    } else if (activeTab.value === 'plotSurvey') {
      loadPlotList(clusterId.value);
    }
  }
});
</script>

<template>
  <view class="w-full h-full flex flex-col bg-#f5f5f5">
    <!-- 加载中 -->
    <view v-if="loading" class="flex-1 flex items-center justify-center">
      <uni-load-more status="loading"></uni-load-more>
    </view>

    <!-- 详情内容 -->
    <scroll-view v-else scroll-y class="flex-1 overflow-hidden bg-#f5f5f5">
      <view :class="showEditButton ? 'pb-100px' : 'pb-20px'">
        <!-- 头部卡片 -->
        <view class="mx-15px mt-15px bg-#fff rounded-12px p-20px">
          <view class="flex items-center justify-between mb-15px">
            <text class="text-20px font-bold color-#333">{{ basicInfo.gsqbh || '未命名古树群' }}</text>
            <view class="px-12px py-4px rounded-20px" :style="{ backgroundColor: statusColor + '20' }">
              <text class="text-12px font-bold" :style="{ color: statusColor }">{{ statusText }}</text>
            </view>
          </view>

          <view class="flex items-center mb-8px">
            <uni-icons type="location" size="16" color="#666"></uni-icons>
            <text class="ml-5px text-14px color-#666"> {{ basicInfo.xz || '-' }} {{ basicInfo.cun || '-' }} {{ basicInfo.xdm || '-' }} </text>
          </view>

          <view class="flex items-center">
            <uni-icons type="info" size="16" color="#666"></uni-icons>
            <text class="ml-5px text-14px color-#666"> 古树株数：{{ basicInfo.gszs || '-' }}株 </text>
          </view>
        </view>

        <!-- Tab切换 -->
        <view class="mx-15px mt-15px bg-#fff rounded-12px p-15px">
          <view class="flex items-center gap-10px">
            <view
              @click="handleTabChange('basicInfo')"
              :class="['px-20px h-36px fc rounded-6px flex-1', activeTab === 'basicInfo' ? 'bg-#01bd8d' : 'bg-#f5f5f5']"
            >
              <text :class="['text-14px', activeTab === 'basicInfo' ? 'color-#fff' : 'color-#666']">基本信息</text>
            </view>
            <view
              @click="handleTabChange('treeSurvey')"
              :class="['px-20px h-36px fc rounded-6px flex-1', activeTab === 'treeSurvey' ? 'bg-#01bd8d' : 'bg-#f5f5f5']"
            >
              <text :class="['text-14px', activeTab === 'treeSurvey' ? 'color-#fff' : 'color-#666']">每木调查</text>
            </view>
            <view
              @click="handleTabChange('plotSurvey')"
              :class="['px-20px h-36px fc rounded-6px flex-1', activeTab === 'plotSurvey' ? 'bg-#01bd8d' : 'bg-#f5f5f5']"
            >
              <text :class="['text-14px', activeTab === 'plotSurvey' ? 'color-#fff' : 'color-#666']">样方调查</text>
            </view>
          </view>
        </view>

        <!-- 基本信息Tab -->
        <view v-if="activeTab === 'basicInfo'" class="mx-15px mt-15px bg-#fff rounded-12px p-20px">
          <view class="mb-15px">
            <text class="text-16px font-bold color-#333">详细信息</text>
          </view>

          <!-- 按顺序显示重要字段 -->
          <template v-for="(value, key) in basicInfo" :key="key">
            <!-- 跳过不需要显示的字段 -->
            <view
              v-if="!['id', 'status', 'geom', 'fieldImageLongShot', 'fieldImageCloseUp', 'fieldImageHabitat', 'zysz'].includes(key)"
              class="flex justify-between py-12px border-b-1px border-#f0f0f0 last:border-b-0"
            >
              <text class="text-14px color-#666 flex-shrink-0">{{ fieldNameMap[key] || key }}</text>
              <text class="text-14px color-#333 ml-20px text-right flex-1">{{ formatFieldValue(key, value) }}</text>
            </view>
          </template>

          <!-- 主要树种组成特殊处理 -->
          <view v-if="basicInfo.zysz && Array.isArray(basicInfo.zysz) && basicInfo.zysz.length > 0" class="mt-15px pt-15px border-t-1px border-#f0f0f0">
            <view class="mb-10px">
              <text class="text-14px color-#666">主要树种组成</text>
            </view>
            <view class="bg-#f5f5f5 px-12px py-10px rounded-4px">
              <view v-for="(item, index) in basicInfo.zysz" :key="index" class="mb-8px last:mb-0">
                <text class="text-14px color-#333"> {{ item.name || '—' }} {{ item.quantity || '—' }}株 {{ item.ratio ? item.ratio + '%' : '—' }} </text>
              </view>
            </view>
          </view>
        </view>

        <!-- 照片/视频展示 -->
        <view
          v-if="
            activeTab === 'basicInfo' && (basicInfo.fieldImageLongShot?.length || basicInfo.fieldImageCloseUp?.length || basicInfo.fieldImageHabitat?.length)
          "
          class="mx-15px mt-15px bg-#fff rounded-12px p-20px"
        >
          <view class="mb-15px">
            <text class="text-16px font-bold color-#333">影像资料</text>
          </view>

          <!-- 远景照片 -->
          <view v-if="basicInfo.fieldImageLongShot?.length" class="mb-15px">
            <text class="text-14px color-#666 mb-10px block">远景照片</text>
            <view class="flex flex-wrap gap-10px">
              <view v-for="(item, index) in basicInfo.fieldImageLongShot" :key="index" class="w-100px h-100px rounded-8px overflow-hidden relative">
                <!-- 图片 -->
                <image
                  v-if="checkIsImage(item.path || item.fileType)"
                  :src="item.url || item.tempFilePath || item.path"
                  mode="aspectFill"
                  class="w-full h-full"
                  @click="previewImage(item.url || item.tempFilePath || item.path, basicInfo.fieldImageLongShot)"
                />
                <!-- 视频 -->
                <view
                  v-else-if="checkIsVideo(item.path || item.fileType)"
                  class="w-full h-full bg-#000 flex items-center justify-center"
                  @click="handleVideoPlay(item.url || item.tempFilePath || item.path)"
                >
                  <image v-if="item.thumbTempFilePath" :src="item.thumbTempFilePath" class="w-full h-full object-cover" mode="aspectFill" />
                  <view class="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <view class="w-30px h-30px rounded-full bg-rgba(255,255,255,0.8) flex items-center justify-center">
                      <uni-icons type="play-filled" size="20" color="#333"></uni-icons>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 近景照片 -->
          <view v-if="basicInfo.fieldImageCloseUp?.length" class="mb-15px">
            <text class="text-14px color-#666 mb-10px block">近景照片</text>
            <view class="flex flex-wrap gap-10px">
              <view v-for="(item, index) in basicInfo.fieldImageCloseUp" :key="index" class="w-100px h-100px rounded-8px overflow-hidden relative">
                <!-- 图片 -->
                <image
                  v-if="checkIsImage(item.path || item.fileType)"
                  :src="item.url || item.tempFilePath || item.path"
                  mode="aspectFill"
                  class="w-full h-full"
                  @click="previewImage(item.url || item.tempFilePath || item.path, basicInfo.fieldImageCloseUp)"
                />
                <!-- 视频 -->
                <view
                  v-else-if="checkIsVideo(item.path || item.fileType)"
                  class="w-full h-full bg-#000 flex items-center justify-center"
                  @click="handleVideoPlay(item.url || item.tempFilePath || item.path)"
                >
                  <image v-if="item.thumbTempFilePath" :src="item.thumbTempFilePath" class="w-full h-full object-cover" mode="aspectFill" />
                  <view class="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <view class="w-30px h-30px rounded-full bg-rgba(255,255,255,0.8) flex items-center justify-center">
                      <uni-icons type="play-filled" size="20" color="#333"></uni-icons>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 群内生境照片 -->
          <view v-if="basicInfo.fieldImageHabitat?.length">
            <text class="text-14px color-#666 mb-10px block">群内生境</text>
            <view class="flex flex-wrap gap-10px">
              <view v-for="(item, index) in basicInfo.fieldImageHabitat" :key="index" class="w-100px h-100px rounded-8px overflow-hidden relative">
                <!-- 图片 -->
                <image
                  v-if="checkIsImage(item.path || item.fileType)"
                  :src="item.url || item.tempFilePath || item.path"
                  mode="aspectFill"
                  class="w-full h-full"
                  @click="previewImage(item.url || item.tempFilePath || item.path, basicInfo.fieldImageHabitat)"
                />
                <!-- 视频 -->
                <view
                  v-else-if="checkIsVideo(item.path || item.fileType)"
                  class="w-full h-full bg-#000 flex items-center justify-center"
                  @click="handleVideoPlay(item.url || item.tempFilePath || item.path)"
                >
                  <image v-if="item.thumbTempFilePath" :src="item.thumbTempFilePath" class="w-full h-full object-cover" mode="aspectFill" />
                  <view class="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <view class="w-30px h-30px rounded-full bg-rgba(255,255,255,0.8) flex items-center justify-center">
                      <uni-icons type="play-filled" size="20" color="#333"></uni-icons>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 每木调查Tab -->
        <view v-if="activeTab === 'treeSurvey'" class="mx-15px mt-15px">
          <!-- 加载中状态 -->
          <view v-if="treeListLoading" class="bg-#fff rounded-12px p-40px">
            <view class="w-full fc flex-col">
              <uni-icons type="spinner-cycle" size="40" color="#01bd8d" class="animate-spin"></uni-icons>
              <text class="text-14px color-#999 mt-10px">加载中...</text>
            </view>
          </view>

          <!-- 数据列表 -->
          <view v-else>
            <view
              v-for="(item, index) in treeList"
              :key="index"
              class="bg-#fff rounded-12px p-15px mb-12px flex items-center gap-12px"
              @click="handleTreeItemClick(item)"
            >
              <!-- 右侧内容 -->
              <view class="flex-1 flex flex-col gap-6px">
                <!-- 第一行：编号和状态 -->
                <view class="flex items-center justify-between">
                  <text class="text-15px font-bold color-#333">{{ item.gsmmbh || item.code || '未知编号' }}</text>
                  <view class="px-10px py-4px rounded-20px" :style="{ backgroundColor: getStatusColor(item.submitType) + '20' }">
                    <text class="text-11px font-bold" :style="{ color: getStatusColor(item.submitType) }">{{ getStatusText(item.submitType) }}</text>
                  </view>
                </view>

                <!-- 第二行：详细信息 -->
                <view class="flex items-center gap-10px flex-wrap">
                  <text class="text-13px color-#666">胸径: {{ item.xj || item.breastHeight || '—' }}cm</text>
                  <text class="text-13px color-#666">树高: {{ item.sg || item.treeHeight || '—' }}m</text>
                </view>
                <view v-if="item.zwm">
                  <text class="text-13px color-#666">树种: {{ item.zwm }}</text>
                </view>
                <view v-if="item.createdAt" class="mt-2px">
                  <text class="text-12px color-#999">创建时间: {{ item.createdAt }}</text>
                </view>
              </view>

              <!-- 右侧箭头 -->
              <view class="flex-shrink-0">
                <uni-icons type="right" size="18" color="#ccc"></uni-icons>
              </view>
            </view>

            <!-- 无数据提示 -->
            <view v-if="treeList.length === 0" class="bg-#fff rounded-12px p-40px">
              <view class="w-full fc flex-col">
                <uni-icons type="info" size="60" color="#ddd"></uni-icons>
                <text class="text-14px color-#999 mt-10px">暂无每木调查数据</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 样方调查Tab -->
        <view v-if="activeTab === 'plotSurvey'" class="mx-15px mt-15px">
          <!-- 加载中状态 -->
          <view v-if="plotListLoading" class="bg-#fff rounded-12px p-40px">
            <view class="w-full fc flex-col">
              <uni-icons type="spinner-cycle" size="40" color="#01bd8d" class="animate-spin"></uni-icons>
              <text class="text-14px color-#999 mt-10px">加载中...</text>
            </view>
          </view>

          <!-- 数据列表 -->
          <view v-else>
            <view
              v-for="(item, index) in plotList"
              :key="index"
              class="bg-#fff rounded-12px p-15px mb-12px flex items-center gap-12px"
              @click="handlePlotItemClick(item)"
            >
              <!-- 右侧内容 -->
              <view class="flex-1 flex flex-col gap-6px">
                <!-- 第一行：编号和状态 -->
                <view class="flex items-center justify-between">
                  <text class="text-15px font-bold color-#333">{{ item.cydch || item.code || '未知编号' }}</text>
                  <view class="px-10px py-4px rounded-20px" :style="{ backgroundColor: getStatusColor(item.submitType) + '20' }">
                    <text class="text-11px font-bold" :style="{ color: getStatusColor(item.submitType) }">{{ getStatusText(item.submitType) }}</text>
                  </view>
                </view>

                <!-- 第二行：详细信息 -->
                <view class="flex items-center gap-10px flex-wrap">
                  <text class="text-13px color-#666">面积: {{ item.cyMj ? item.cyMj + '㎡' : '—' }}</text>
                  <text class="text-13px color-#666">{{ item.cyff || '—' }}</text>
                </view>
                <view v-if="item.createdAt" class="mt-2px">
                  <text class="text-12px color-#999">创建时间: {{ item.createdAt }}</text>
                </view>
              </view>

              <!-- 右侧箭头 -->
              <view class="flex-shrink-0">
                <uni-icons type="right" size="18" color="#ccc"></uni-icons>
              </view>
            </view>

            <!-- 无数据提示 -->
            <view v-if="plotList.length === 0" class="bg-#fff rounded-12px p-40px">
              <view class="w-full fc flex-col">
                <uni-icons type="info" size="60" color="#ddd"></uni-icons>
                <text class="text-14px color-#999 mt-10px">暂无样方调查数据</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 视频播放弹窗 -->
    <VideoPlayerPopup ref="videoPlayerPopupRef" />

    <!-- 底部按钮区域 -->
    <view v-if="!loading" class="fixed bottom-0 left-0 right-0 px-15px py-15px bg-#fff border-t-1px border-#f0f0f0">
      <!-- 基本信息Tab：显示编辑按钮 -->
      <view v-if="activeTab === 'basicInfo' && showEditButton" class="w-full">
        <view @click="handleEdit" class="w-full h-48px bg-#01bd8d rounded-8px fc">
          <text class="text-16px color-#fff font-bold">编辑</text>
        </view>
      </view>

      <!-- 每木调查/样方调查Tab：显示新增按钮 -->
      <view v-else-if="activeTab !== 'basicInfo'" class="w-full">
        <view @click="activeTab === 'treeSurvey' ? handleAddTreeSurvey() : handleAddPlotSurvey()" class="w-full h-48px bg-#01bd8d rounded-8px fc">
          <text class="text-16px color-#fff font-bold">
            {{ activeTab === 'treeSurvey' ? '新增古树' : '新增样方调查' }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped></style>
