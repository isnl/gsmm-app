<script lang="ts" setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { service } from '@/service';
import VideoPlayerPopup from '@/components/VideoPlayerPopup.vue';

// 详情数据
const detailData = ref<any>({});
const loading = ref(true);
const treeId = ref('');

// 视频播放弹窗引用
const videoPlayerPopupRef = ref();

// 状态标签文本
const statusText = computed(() => {
  if (detailData.value.submitType === 1) {
    return '已调查';
  } else if (detailData.value.submitType === 0) {
    return '调查中';
  }
  return '未知';
});

// 状态标签颜色
const statusColor = computed(() => {
  if (detailData.value.submitType === 1) {
    return '#01bd8d';
  } else if (detailData.value.submitType === 0) {
    return '#ff9800';
  }
  return '#999';
});

// 是否显示编辑按钮（待调查或调查中状态）
const showEditButton = computed(() => {
  return detailData.value.submitType === 0 || detailData.value.submitType === undefined;
});

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

// 加载详情数据
const loadDetail = async (id: string) => {
  loading.value = true;
  try {
    const res = await service({
      url: `/gu_shus/${id}`,
      method: 'GET',
    });

    if (res && res.data) {
      detailData.value = res.data;
    }
  } catch (error: any) {
    console.error('加载详情失败:', error);
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

// 页面加载
onLoad((options: any) => {
  if (options && options.id) {
    treeId.value = options.id;
    loadDetail(options.id);
  } else {
    uni.showToast({
      title: '缺少ID参数',
      icon: 'none',
    });
  }
});

// 返回
const handleBack = () => {
  uni.navigateBack();
};

// 编辑
const handleEdit = () => {
  uni.navigateTo({
    url: `/pages/ancient_tree/index?id=${treeId.value}`,
  });
};

// 定义字段显示配置
interface FieldConfig {
  label: string;
  key: string;
  unit?: string;
}

const fieldGroups = [
  {
    title: '基本信息',
    fields: [
      { label: '古树名木编号', key: 'gsmmbh' },
      { label: '普查范围', key: 'pcfw' },
      { label: '分布特点', key: 'fbtz' },
      { label: '古树群编号', key: 'gsqbh' },
    ],
  },
  {
    title: '地理位置',
    fields: [
      { label: '乡镇(街道)', key: 'xz' },
      { label: '村(居委会)', key: 'cun' },
      { label: '小地名', key: 'xdm' },
      { label: '分布场所', key: 'fbcs' },
      { label: '经度', key: 'jd' },
      { label: '纬度', key: 'wd' },
    ],
  },
  {
    title: '立地条件',
    fields: [
      { label: '海拔', key: 'hb', unit: 'm' },
      { label: '土壤紧密度', key: 'trjmd' },
      { label: '土层厚度', key: 'tchd' },
      { label: '坡位', key: 'pw' },
      { label: '坡度', key: 'pd' },
      { label: '坡向', key: 'px' },
      { label: '生长环境等级', key: 'szhjdj' },
    ],
  },
  {
    title: '树种信息',
    fields: [
      { label: '科', key: 'ke' },
      { label: '属', key: 'shu' },
      { label: '中文名', key: 'zwm' },
      { label: '学名', key: 'xm' },
      { label: '俗名', key: 'sm' },
      { label: '树龄', key: 'sl', unit: '年' },
      { label: '测定方法', key: 'cdff' },
      { label: '保护等级', key: 'bhdj' },
      { label: '古树名木类别', key: 'gsmmlb' },
    ],
  },
  {
    title: '测树因子',
    fields: [
      { label: '树高', key: 'sg', unit: 'm' },
      { label: '胸径', key: 'xj', unit: 'cm' },
      { label: '地径', key: 'dj', unit: 'cm' },
      { label: '平均冠幅', key: 'pjgf', unit: 'm' },
      { label: '胸围', key: 'xw', unit: 'cm' },
      { label: '地围', key: 'dw', unit: 'cm' },
    ],
  },
  {
    title: '生长与保护',
    fields: [
      { label: '生长势等级', key: 'szsdj' },
      { label: '树体损伤', key: 'stss' },
      { label: '潜在影响因素', key: 'qzyxys' },
      { label: '主管部门', key: 'zgbm' },
      { label: '权属', key: 'qs' },
      { label: '日常养护责任人类型', key: 'rcyhzrrlx' },
      { label: '单位名称或个人名称', key: 'dwmcOrgrmc' },
      { label: '保护措施', key: 'bhcs' },
    ],
  },
  {
    title: '其他信息',
    fields: [
      { label: '重要价值', key: 'zyjz' },
      { label: '价值说明', key: 'zyjzsm' },
      { label: '新增原因', key: 'xzyy' },
      { label: '减少原因', key: 'jsyy' },
      { label: '死亡处置措施', key: 'swczcs' },
      { label: '树木奇特性状', key: 'smqtxz' },
      { label: '照片说明', key: 'zpjsm' },
      { label: '备注', key: 'bz' },
    ],
  },
];
</script>

<template>
  <view class="w-full h-full flex flex-col bg-#f5f5f5">
    <!-- 顶部导航栏 -->
    <!-- <view class="w-full h-44px bg-#01bd8d flex items-center justify-between px-15px">
      <view class="flex items-center" @click="handleBack">
        <uni-icons type="back" size="24" color="#fff"></uni-icons>
        <text class="ml-8px text-16px color-#fff font-bold">古树详情</text>
      </view>
      <view @click="handleEdit">
        <uni-icons type="compose" size="22" color="#fff"></uni-icons>
      </view>
    </view> -->

    <!-- 加载中 -->
    <view v-if="loading" class="flex-1 flex items-center justify-center">
      <uni-load-more status="loading"></uni-load-more>
    </view>

    <!-- 详情内容 -->
    <scroll-view v-else scroll-y class="flex-1 bg-#f5f5f5">
      <view :class="showEditButton ? 'pb-100px' : 'pb-20px'">
        <!-- 头部卡片 -->
        <view class="mx-15px mt-15px bg-#fff rounded-12px p-20px">
          <view class="flex items-center justify-between mb-15px">
            <text class="text-20px font-bold color-#333">{{ detailData.zwm || '未命名' }}</text>
            <view class="px-12px py-4px rounded-20px" :style="{ backgroundColor: statusColor + '20' }">
              <text class="text-12px font-bold" :style="{ color: statusColor }">{{ statusText }}</text>
            </view>
          </view>

          <view class="flex items-center mb-8px">
            <uni-icons type="location" size="16" color="#666"></uni-icons>
            <text class="ml-5px text-14px color-#666"> {{ detailData.xz || '-' }} {{ detailData.cun || '-' }} {{ detailData.xdm || '-' }} </text>
          </view>

          <view class="flex items-center">
            <uni-icons type="info" size="16" color="#666"></uni-icons>
            <text class="ml-5px text-14px color-#666"> 编号：{{ detailData.gsmmbh || '-' }} </text>
          </view>
        </view>

        <!-- 照片/视频展示 -->
        <view
          v-if="detailData.fieldImageParentTree?.length || detailData.fieldImageTrunkBase?.length || detailData.fieldImageCrown?.length"
          class="mx-15px mt-15px bg-#fff rounded-12px p-20px"
        >
          <view class="mb-15px">
            <text class="text-16px font-bold color-#333">影像资料</text>
          </view>

          <!-- 树体全貌 -->
          <view v-if="detailData.fieldImageParentTree?.length" class="mb-15px">
            <text class="text-14px color-#666 mb-10px block">树体全貌</text>
            <view class="flex flex-wrap gap-10px">
              <view v-for="(item, index) in detailData.fieldImageParentTree" :key="index" class="w-100px h-100px rounded-8px overflow-hidden relative">
                <!-- 图片 -->
                <image
                  v-if="checkIsImage(item.path || item.fileType)"
                  :src="item.url || item.tempFilePath || item.path"
                  mode="aspectFill"
                  class="w-full h-full"
                  @click="previewImage(item.url || item.tempFilePath || item.path, detailData.fieldImageParentTree)"
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

          <!-- 特征特写 -->
          <view v-if="detailData.fieldImageTrunkBase?.length" class="mb-15px">
            <text class="text-14px color-#666 mb-10px block">特征特写</text>
            <view class="flex flex-wrap gap-10px">
              <view v-for="(item, index) in detailData.fieldImageTrunkBase" :key="index" class="w-100px h-100px rounded-8px overflow-hidden relative">
                <!-- 图片 -->
                <image
                  v-if="checkIsImage(item.path || item.fileType)"
                  :src="item.url || item.tempFilePath || item.path"
                  mode="aspectFill"
                  class="w-full h-full"
                  @click="previewImage(item.url || item.tempFilePath || item.path, detailData.fieldImageTrunkBase)"
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

          <!-- 生长环境 -->
          <view v-if="detailData.fieldImageCrown?.length">
            <text class="text-14px color-#666 mb-10px block">生长环境</text>
            <view class="flex flex-wrap gap-10px">
              <view v-for="(item, index) in detailData.fieldImageCrown" :key="index" class="w-100px h-100px rounded-8px overflow-hidden relative">
                <!-- 图片 -->
                <image
                  v-if="checkIsImage(item.path || item.fileType)"
                  :src="item.url || item.tempFilePath || item.path"
                  mode="aspectFill"
                  class="w-full h-full"
                  @click="previewImage(item.url || item.tempFilePath || item.path, detailData.fieldImageCrown)"
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

        <!-- 详细信息分组 -->
        <view v-for="(group, groupIndex) in fieldGroups" :key="groupIndex" class="mx-15px mt-15px bg-#fff rounded-12px p-20px">
          <view class="mb-15px">
            <text class="text-16px font-bold color-#333">{{ group.title }}</text>
          </view>

          <view v-for="(field, fieldIndex) in group.fields" :key="fieldIndex">
            <view
              v-if="detailData[field.key]"
              class="flex justify-between py-12px"
              :class="fieldIndex < group.fields.length - 1 ? 'border-b-1px border-#f0f0f0' : ''"
            >
              <text class="text-14px color-#666 flex-shrink-0">{{ field.label }}</text>
              <text class="text-14px color-#333 ml-20px text-right flex-1"> {{ detailData[field.key] }}{{ field.unit ? field.unit : '' }} </text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 视频播放弹窗 -->
    <VideoPlayerPopup ref="videoPlayerPopupRef" />

    <!-- 底部编辑按钮 - 仅在调查中或待调查状态显示 -->
    <view v-if="showEditButton && !loading" class="fixed bottom-0 left-0 right-0 px-15px py-15px bg-#fff border-t-1px border-#f0f0f0">
      <view class="w-full h-48px bg-#01bd8d rounded-8px fc" @click="handleEdit">
        <text class="text-16px color-#fff font-bold">编辑</text>
      </view>
    </view>
  </view>
</template>

<style scoped></style>
