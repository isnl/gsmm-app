<script lang="ts" setup>
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { goBack } from '@/utils';
import { service } from '@/service';
import { useVectorAreaStore } from '@/stores/vector_area';
import { useTileCacheStore } from '@/stores/tile_cache';
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';
import { JSONbig } from '@/utils';

const { statusBarHeight } = useStatusBarHeight();
const vectorAreaStore = useVectorAreaStore();
const tileCacheStore = useTileCacheStore();

const { lastVectorAreas, lastCreatedAt } = storeToRefs(vectorAreaStore);

// 本地 loading 状态
const loading = ref(false);
const clearingAllCache = ref(false); // 清空所有缓存的loading状态

// 格式化最近更新时间
const formattedLastCreatedAt = computed(() => {
  return lastCreatedAt.value ? dayjs(lastCreatedAt.value).format('YYYY-MM-DD HH:mm:ss') : '暂无数据';
});

const refreshData = async () => {
  loading.value = true;
  try {
    const res = await service({
      url: '/app/query/vector_area/by_user_id',
      method: 'GET',
      dataType: 'String',
    });
    const parseData = JSONbig.parse(res.data);
    if (parseData && parseData.length) {
      vectorAreaStore.setAreas(parseData);
    }
  } catch (error) {
    console.error('获取数据失败:', error);
    uni.showToast({
      title: '获取数据失败',
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};

// 获取缓存按钮样式
const getCacheButtonStyle = (areaId: string) => {
  const downloadProgress = tileCacheStore.getAreaDownloadProgress(areaId.toString());

  if (downloadProgress.isDownloading) {
    return {
      backgroundColor: 'rgba(8, 189, 146, 0.1)',
      color: '#08bd92',
    };
  } else if (downloadProgress.status === 'completed' || downloadProgress.progress >= 100) {
    return {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      color: '#10b981',
    };
  } else if (downloadProgress.progress > 0) {
    return {
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      color: '#f59e0b',
    };
  } else {
    return {
      backgroundColor: '#08bd92',
      color: '#ffffff',
    };
  }
};

// 获取缓存按钮图标
const getCacheButtonIcon = (areaId: string) => {
  const downloadProgress = tileCacheStore.getAreaDownloadProgress(areaId.toString());
  if (downloadProgress.isDownloading) {
    return {
      type: 'spinner-cycle',
      color: '#08bd92',
      class: 'animate-spin',
    };
  } else if (downloadProgress.status === 'completed' || downloadProgress.progress >= 100) {
    return {
      type: 'checkmarkempty',
      color: '#10b981',
      class: '',
    };
  } else if (downloadProgress.progress > 0) {
    return {
      type: 'pauseempty',
      color: '#f59e0b',
      class: '',
    };
  } else {
    return {
      type: 'map',
      color: '#ffffff',
      class: '',
    };
  }
};

// 获取缓存按钮文本
const getCacheButtonText = (areaId: string) => {
  const downloadProgress = tileCacheStore.getAreaDownloadProgress(areaId.toString());
  if (downloadProgress.isDownloading) {
    return '下载中';
  } else if (downloadProgress.status === 'completed' || downloadProgress.progress >= 100) {
    return '已完成';
  } else if (downloadProgress.progress > 0) {
    return '已暂停';
  } else {
    return '缓存';
  }
};

// 跳转到缓存页面
const goToCache = (area: any) => {
  uni.navigateTo({
    url: `/pages/tile_cache/index?id=${area.id}`,
  });
};

// 确认清空所有缓存
const confirmClearAllCache = () => {
  // 如果正在清空中，不允许重复操作
  if (clearingAllCache.value) return;

  uni.showModal({
    title: '确认清空所有缓存',
    content: '此操作将删除所有区域的缓存数据，包括瓦片文件和下载进度，确定要继续吗？',
    confirmText: '确定',
    cancelText: '取消',
    success: res => {
      if (res.confirm) {
        clearAllCache();
      }
    },
  });
};

// 清空所有缓存
const clearAllCache = async () => {
  if (clearingAllCache.value) return;

  try {
    clearingAllCache.value = true;

    try {
      // 直接删除 tile_cache 目录
      const cacheDir = `_doc/tile_cache`;
      await new Promise<void>(resolve => {
        plus.io.resolveLocalFileSystemURL(
          cacheDir,
          entry => {
            entry.removeRecursively(
              () => {
                console.log(`区域目录删除成功: ${cacheDir}`);
                resolve();
              },
              error => {
                console.warn(`区域目录删除失败: ${cacheDir}`, error);
                resolve(); // 即使删除失败也继续
              },
            );
          },
          () => {
            console.warn(`区域目录不存在: ${cacheDir}`);
            resolve(); // 目录不存在也继续
          },
        );
      });
    } catch (error) {
      console.warn(`删除区域目录异常`, error);
    }

    // 最后重置整个 store
    tileCacheStore.clearAllCache();
    console.log('所有缓存已清空');

    uni.showToast({
      title: '所有缓存已清空',
      icon: 'success',
    });
  } catch (error) {
    console.error('清空所有缓存失败:', error);
    uni.showToast({
      title: '清空失败',
      icon: 'none',
    });
  } finally {
    clearingAllCache.value = false;
  }
};
</script>
<template>
  <view class="w-full h-full flex flex-col bg-gradient-to-b from-#08bd92 to-#07a47f">
    <!-- 自定义导航栏 -->
    <view
      class="w-full"
      :style="{
        paddingTop: statusBarHeight + 12 + 'px',
      }"
    >
      <view class="flex items-center gap-10px px-10px py-24px">
        <view class="w-auto flex items-center" @click="goBack">
          <uni-icons type="left" size="30" color="#fff"></uni-icons>
          <text class="text-#fff text-18px font-bold">业务分区</text>
        </view>
        <view class="flex-1"></view>
        <view class="bg-white/20 rounded-6px px-12px py-6px flex items-center" @click="confirmClearAllCache">
          <uni-icons v-if="!clearingAllCache" type="clear" size="18" color="#fff"></uni-icons>
          <uni-icons v-else type="spinner-cycle" size="18" color="#fff" class="animate-spin"></uni-icons>
          <text class="text-#fff text-14px ml-4px">{{ clearingAllCache ? '清空中' : '清空所有缓存' }}</text>
        </view>
        <view class="bg-white/20 rounded-6px px-12px py-6px flex items-center" @click="refreshData">
          <uni-icons :type="loading ? 'loop' : 'refreshempty'" size="18" color="#fff" :class="loading ? 'animate-spin' : ''"></uni-icons>
          <text class="text-#fff text-14px ml-4px">刷新</text>
        </view>
      </view>
    </view>

    <!-- 最近更新时间信息条 -->
    <view v-if="lastCreatedAt" class="bg-white mx-16px mb-8px px-16px py-12px rounded-8px shadow-sm">
      <view class="flex items-center justify-between">
        <text class="text-#666 text-14px">最近更新时间</text>
        <text class="text-#666 text-14px font-medium">{{ formattedLastCreatedAt }}</text>
      </view>
    </view>

    <view class="flex-1 overflow-hidden bg-#f5f7fa p-16px pt-8px">
      <scroll-view :scroll-y="true" class="h-full">
        <view v-if="loading" class="text-center py-40px">
          <uni-icons type="loop" size="30" color="#666" class="animate-spin"></uni-icons>
          <text class="block text-#666 text-14px mt-8px">加载中...</text>
        </view>

        <view v-else-if="lastVectorAreas.length === 0" class="text-center py-40px">
          <text class="text-#999 text-14px">暂无数据</text>
        </view>

        <view v-else class="space-y-12px">
          <view v-for="area in lastVectorAreas" :key="area.id" class="bg-white rounded-8px p-16px shadow-sm relative" @click="goToCache(area)">
            <view v-if="area.geomType" class="absolute top-12px right-12px bg-#f0f0f0 text-#666 text-12px px-6px py-2px rounded-4px">
              {{ area.geomType }}
            </view>

            <view class="flex items-center mb-12px pr-60px">
              <text class="text-#333 text-16px font-bold">{{ area.name }}</text>
            </view>

            <view class="text-#666 text-14px leading-20px mb-8px">
              {{ area.description }}
            </view>

            <!-- 图层名称 -->
            <view class="flex items-center">
              <view v-if="area.layerGroupName" class="bg-#08bd92/10 text-#08bd92 text-12px px-8px py-4px rounded-4px flex items-center mb-10px">
                <text class="mr-2px">图层</text>
                <text class="font-medium">{{ area.layerGroupName }}</text>
              </view>
            </view>
            <!-- 编号-->
            <view class="flex items-center justify-between">
              <view class="flex items-center gap-8px">
                <!-- 编号 -->
                <view class="bg-#08bd92/10 text-#08bd92 text-12px px-8px py-4px rounded-4px flex items-center">
                  <text class="mr-2px">编号</text>
                  <text class="font-medium">{{ area.code }}</text>
                </view>
              </view>

              <!-- 查看缓存按钮 -->
              <view class="text-12px px-10px py-4px rounded-4px flex items-center cursor-pointer" :style="getCacheButtonStyle(area.id)">
                <uni-icons
                  :type="getCacheButtonIcon(area.id).type"
                  size="14"
                  :color="getCacheButtonIcon(area.id).color"
                  :class="getCacheButtonIcon(area.id).class"
                ></uni-icons>
                <text class="ml-4px">{{ getCacheButtonText(area.id) }}</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>
