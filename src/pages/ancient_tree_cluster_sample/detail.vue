<script lang="ts" setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { service } from '@/service';
import VideoPlayerPopup from '@/components/VideoPlayerPopup.vue';

// 详情数据类型定义
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

// 详情数据
const detailData = ref<any>({});
const loading = ref(true);
const sampleId = ref('');

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
      url: `/gu_shu_qun_chou_yangs/${id}`,
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
    sampleId.value = options.id;
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
    url: `/pages/ancient_tree_cluster_sample/index?id=${sampleId.value}`,
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
      { label: '古树群编号', key: 'gsqbh' },
      { label: '抽样调查号', key: 'cydch' },
      { label: '抽样方法', key: 'cyff' },
      { label: '面积', key: 'cyMj', unit: '㎡' },
      { label: '经度', key: 'jd' },
      { label: '纬度', key: 'wd' },
    ],
  },
  {
    title: '样方/样带信息',
    fields: [
      { label: '坡位', key: 'pw' },
      { label: '土壤紧密度', key: 'trjmd' },
      { label: '土层厚度', key: 'tchd' },
      { label: '坡度', key: 'pd' },
      { label: '坡向', key: 'px' },
    ],
  },
  {
    title: '坐标信息',
    fields: [
      { label: '样方（带）西南角', key: 'xnJiao' },
      { label: '样方（带）东北角', key: 'dbJiao' },
      { label: '样方（带）西北角', key: 'xbJiao' },
      { label: '样方（带）东南角', key: 'dnJiao' },
    ],
  },
  {
    title: '其他信息',
    fields: [
      { label: '照片说明', key: 'zpsm' },
      { label: '备注', key: 'bz' },
    ],
  },
];
</script>

<template>
  <view class="w-full h-full flex flex-col bg-#f5f5f5">
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
            <text class="text-20px font-bold color-#333">样方调查详情</text>
            <view class="px-12px py-4px rounded-20px" :style="{ backgroundColor: statusColor + '20' }">
              <text class="text-12px font-bold" :style="{ color: statusColor }">{{ statusText }}</text>
            </view>
          </view>

          <view class="flex items-center mb-8px">
            <uni-icons type="info" size="16" color="#666"></uni-icons>
            <text class="ml-5px text-14px color-#666"> 古树群编号：{{ detailData.gsqbh || '-' }} </text>
          </view>

          <view class="flex items-center">
            <uni-icons type="paperplane" size="16" color="#666"></uni-icons>
            <text class="ml-5px text-14px color-#666"> 抽样调查号：{{ detailData.cydch || '-' }} </text>
          </view>
        </view>

        <!-- 照片/视频展示 -->
        <view v-if="detailData.fieldImageTrunkBase?.length" class="mx-15px mt-15px bg-#fff rounded-12px p-20px">
          <view class="mb-15px">
            <text class="text-16px font-bold color-#333">影像资料</text>
          </view>

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

        <!-- 抽样古树信息 -->
        <view v-if="detailData.cygsxx?.length" class="mx-15px mt-15px bg-#fff rounded-12px p-20px">
          <view class="mb-15px">
            <text class="text-16px font-bold color-#333">抽样古树信息</text>
          </view>

          <view v-for="(item, index) in detailData.cygsxx" :key="index" class="mb-15px last:mb-0">
            <view class="p-15px border-1px border-solid border-#e5e5e5 rounded-8px bg-#f9f9f9">
              <!-- 头部：序号 -->
              <view class="flex items-center justify-between mb-12px pb-6px border-b-1px border-#e5e5e5">
                <text class="text-15px font-bold color-#333">古树 {{ index + 1 }}</text>
              </view>

              <!-- 古树信息 -->
              <view class="space-y-8px">
                <view v-if="item.gsbh" class="flex justify-between py-8px">
                  <text class="text-13px color-#666">古树编号</text>
                  <text class="text-13px color-#333">{{ item.gsbh }}</text>
                </view>
                <view v-if="item.sz" class="flex justify-between py-8px">
                  <text class="text-13px color-#666">树种</text>
                  <text class="text-13px color-#333">{{ item.sz }}</text>
                </view>
                <view v-if="item.sl" class="flex justify-between py-8px">
                  <text class="text-13px color-#666">树龄</text>
                  <text class="text-13px color-#333">{{ item.sl }}年</text>
                </view>
                <view v-if="item.xj" class="flex justify-between py-8px">
                  <text class="text-13px color-#666">胸径</text>
                  <text class="text-13px color-#333">{{ item.xj }} cm</text>
                </view>
                <view v-if="item.sg" class="flex justify-between py-8px">
                  <text class="text-13px color-#666">树高</text>
                  <text class="text-13px color-#333">{{ item.sg }} m</text>
                </view>
                <view v-if="item.pjgf" class="flex justify-between py-8px">
                  <text class="text-13px color-#666">平均冠幅</text>
                  <text class="text-13px color-#333">{{ item.pjgf }} m</text>
                </view>
                <view v-if="item.jd" class="flex justify-between py-8px">
                  <text class="text-13px color-#666">经度</text>
                  <text class="text-13px color-#333">{{ item.jd }}</text>
                </view>
                <view v-if="item.wd" class="flex justify-between py-8px">
                  <text class="text-13px color-#666">纬度</text>
                  <text class="text-13px color-#333">{{ item.wd }}</text>
                </view>
              </view>
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

<style scoped>
.space-y-8px > view + view {
  margin-top: 8px;
}
</style>
