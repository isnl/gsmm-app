<template>
  <view class="map-cache-page bg-#f5f7fa min-h-screen">
    <!-- 顶部统计卡片 -->
    <view class="stats-container px-15px pt-20px pb-10px">
      <view class="stats-grid grid grid-cols-3 gap-10px">
        <view class="stat-card bg-white rounded-12px p-12px shadow-sm">
          <view class="stat-icon w-40px h-40px bg-gradient-to-br from-blue-400 to-blue-600 rounded-10px fc mb-8px">
            <text class="text-white text-18px">📊</text>
          </view>
          <text class="stat-value text-20px font-bold text-#333 block">{{ cacheStats.totalTiles }}</text>
          <text class="stat-label text-12px text-#999">缓存瓦片数</text>
        </view>

        <view class="stat-card bg-white rounded-12px p-12px shadow-sm">
          <view class="stat-icon w-40px h-40px bg-gradient-to-br from-green-400 to-green-600 rounded-10px fc mb-8px">
            <text class="text-white text-18px">💾</text>
          </view>
          <text class="stat-value text-18px font-bold text-#333 block">{{ cacheSize }}</text>
          <text class="stat-label text-12px text-#999">缓存大小</text>
        </view>

        <view class="stat-card bg-white rounded-12px p-12px shadow-sm">
          <view
            class="stat-icon w-40px h-40px rounded-10px fc mb-8px"
            :class="isOnline ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-red-400 to-red-600'"
          >
            <text class="text-white text-18px">{{ isOnline ? '🌐' : '📴' }}</text>
          </view>
          <text class="stat-value text-20px font-bold" :class="isOnline ? 'text-green-600' : 'text-red-600'">
            {{ isOnline ? '在线' : '离线' }}
          </text>
          <text class="stat-label text-12px text-#999">网络状态</text>
        </view>
      </view>
    </view>

    <!-- 米林市缓存卡片 -->
    <view class="city-section mx-15px mt-20px">
      <view class="city-card bg-white rounded-16px overflow-hidden shadow-lg">
        <!-- 卡片头部 -->
        <view class="card-header bg-gradient-to-r from-#01bd8d to-#00a876 p-20px">
          <view class="flex items-center justify-between">
            <view class="flex items-center">
              <view class="city-icon w-50px h-50px bg-white/20 rounded-12px fc mr-15px">
                <text class="text-white text-24px">🏔️</text>
              </view>
              <view>
                <text class="city-name text-white text-20px font-bold block">米林市瓦片服务</text>
                <text class="city-desc text-white/80 text-14px">离线地图缓存</text>
              </view>
            </view>
            <view class="cache-rate-circle w-60px h-60px bg-white/20 rounded-full fc">
              <text class="text-white text-16px font-bold">{{ milancacheRate }}%</text>
            </view>
          </view>
        </view>

        <!-- 卡片内容 -->
        <view class="card-content p-20px">
          <!-- 下载进度 -->
          <view v-if="isDownloading || (downloadProgress > 0 && totalCount > 0)" class="progress-section mb-20px">
            <view class="progress-header flex items-center justify-between mb-10px">
              <text class="text-16px font-medium text-#333">下载进度</text>
              <text class="text-14px text-#666">{{ (downloadProgress * 100).toFixed(1) }}%</text>
            </view>

            <view class="progress-bar-container bg-#f0f0f0 rounded-full h-8px mb-10px overflow-hidden">
              <view
                class="progress-bar bg-gradient-to-r from-#01bd8d to-#00a876 h-full rounded-full transition-all duration-300"
                :style="{ width: downloadProgress * 100 + '%' }"
              ></view>
            </view>

            <view class="progress-info flex items-center justify-between">
              <text class="text-12px text-#999">{{ downloadedCount }}/{{ totalCount }} 瓦片</text>
              <view class="flex items-center">
                <view v-if="isDownloading" class="loading-dot w-6px h-6px bg-#01bd8d rounded-full mr-5px animate-pulse"></view>
                <text class="text-12px" :class="isDownloading ? 'text-#01bd8d' : 'text-#999'">
                  {{ isDownloading ? '下载中...' : '已暂停' }}
                </text>
              </view>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view class="actions space-y-12px">
            <button
              class="download-btn w-full h-48px rounded-12px text-16px font-medium transition-all duration-200"
              :class="!isOnline || isDownloading ? 'bg-#e0e0e0 text-#999' : 'bg-gradient-to-r from-#01bd8d to-#00a876 text-white shadow-lg'"
              @click="downloadMilanTiles"
              :disabled="!isOnline || isDownloading"
            >
              <view class="flex items-center justify-center">
                <text v-if="isDownloading" class="mr-8px">⏸️</text>
                <text v-else-if="downloadProgress > 0" class="mr-8px">▶️</text>
                <text v-else class="mr-8px">⬇️</text>
                <text>{{ isDownloading ? '下载中...' : downloadProgress > 0 ? '继续下载' : '下载瓦片服务' }}</text>
              </view>
            </button>

            <button
              class="clear-btn w-full h-48px bg-white border-2 border-#ff4757 text-#ff4757 rounded-12px text-16px font-medium transition-all duration-200"
              @click="clearMilanCache"
            >
              <view class="flex items-center justify-center">
                <text class="mr-8px">🗑️</text>
                <text>清空米林市缓存</text>
              </view>
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部提示 -->
    <view class="tips-section mx-15px mt-20px mb-30px">
      <view class="tips-card bg-white rounded-12px p-15px shadow-sm">
        <view class="flex items-start">
          <text class="tip-icon text-20px mr-10px">💡</text>
          <view class="flex-1">
            <text class="tip-title text-14px font-medium text-#333 block mb-5px">温馨提示</text>
            <view class="tip-content text-12px text-#666 leading-relaxed"> • 下载过程中可随时暂停，下次继续下载会从断点开始 </view>
            <view class="tip-content text-12px text-#666 leading-relaxed"> • 建议在WiFi环境下进行大量瓦片下载 </view>
            <view class="tip-content text-12px text-#666 leading-relaxed"> • 缓存的地图可在离线状态下正常使用 </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { mapTileCache } from '@/utils/mapCache';
let milanBounds = {
  north: 29.197264,
  south: 29.19569,
  west: 94.109147,
  east: 94.112197,
};
export default {
  data() {
    return {
      cacheStats: { totalTiles: 0 },
      cacheSize: '0 B',
      milancacheRate: 0,
      isOnline: true,
      isDownloading: false,
      downloadProgress: 0,
      downloadedCount: 0,
      totalCount: 0,
    };
  },

  async onLoad() {
    let geometry = {
      type: 'Polygon',
      coordinates: [
        [
          [94.108114, 29.205437],
          [94.108114, 29.191103],
          [94.124851, 29.19136],
          [94.12468, 29.205866],
          [94.108114, 29.205437],
        ],
      ],
    };
    // 根据geometry计算bounds
    milanBounds = this.calculateBoundsFromGeometry(geometry);
    console.log('计算出的瓦片服务边界:', milanBounds);
    await mapTileCache.init();
    await this.updateCacheStats();
    await this.checkNetworkStatus();
    await this.loadDownloadStatus();
  },

  async onShow() {
    // 页面显示时暂停下载
    const status = mapTileCache.getDownloadStatus();
    if (status.isDownloading) {
      mapTileCache.pauseDownload();
    }
    await this.loadDownloadStatus();
  },

  async onHide() {
    // 页面隐藏时暂停下载
    const status = mapTileCache.getDownloadStatus();
    if (status.isDownloading || this.isDownloading) {
      mapTileCache.pauseDownload();
      this.isDownloading = false;
      console.log('页面隐藏，下载已暂停');
    }
  },

  async onUnload() {
    // 页面卸载时暂停下载
    const status = mapTileCache.getDownloadStatus();
    if (status.isDownloading || this.isDownloading) {
      mapTileCache.pauseDownload();
      this.isDownloading = false;
      console.log('页面卸载，下载已暂停');
    }
  },

  methods: {
    // 根据geometry计算边界
    calculateBoundsFromGeometry(geometry) {
      if (!geometry || !geometry.coordinates || !geometry.coordinates[0]) {
        return milanBounds; // 返回默认值
      }

      const coordinates = geometry.coordinates[0];
      let minLng = Infinity,
        maxLng = -Infinity;
      let minLat = Infinity,
        maxLat = -Infinity;

      coordinates.forEach(coord => {
        const [lng, lat] = coord;
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      });

      // 添加一些缓冲区，确保完全覆盖
      // const lngBuffer = maxLng - minLng * 0.1;
      // const latBuffer = maxLat - minLat * 0.1;

      return {
        north: maxLat,
        south: minLat,
        west: minLng,
        east: maxLng,
      };
    },
    // 加载下载状态
    async loadDownloadStatus() {
      const status = mapTileCache.getDownloadStatus();
      if (status.isActive && status.totalCount > 0) {
        this.downloadProgress = status.progress;
        this.downloadedCount = status.downloadedCount;
        this.totalCount = status.totalCount;
        // 只有在没有正在下载时才设置为false
        if (!status.isDownloading) {
          this.isDownloading = false;
        }
      } else {
        // 如果没有活跃的下载任务，重置所有状态
        this.downloadProgress = 0;
        this.downloadedCount = 0;
        this.totalCount = 0;
        this.isDownloading = false;
      }
    },

    async updateCacheStats() {
      this.cacheStats = await mapTileCache.getCacheStats();
      this.cacheSize = await mapTileCache.getCacheSize();

      // 计算瓦片服务缓存率
      const stats = await mapTileCache.getAreaCacheStats(milanBounds, 17, 20);
      this.milancacheRate = parseFloat(stats.cacheRate);
    },

    async downloadMilanTiles() {
      // mapTileCache.testDownloadTile();
      // return;
      if (this.isDownloading) return;

      this.isDownloading = true;

      try {
        // 获取当前状态
        const status = mapTileCache.getDownloadStatus();

        // 如果有活跃的下载任务，使用现有的总数和进度
        if (status.isActive && status.totalCount > 0) {
          this.totalCount = status.totalCount;
          this.downloadProgress = status.progress;
          this.downloadedCount = status.downloadedCount;
        }

        await mapTileCache.downloadCityTiles('米林市', milanBounds, 17, 20, progress => {
          this.downloadProgress = progress;
          // 从mapTileCache获取最新的下载状态
          const currentStatus = mapTileCache.getDownloadStatus();
          this.totalCount = currentStatus.totalCount;
          this.downloadedCount = currentStatus.downloadedCount;
        });

        // 只有在真正下载完成时才显示完成提示
        if (this.isDownloading) {
          await this.updateCacheStats();
          uni.showToast({ title: '下载完成', icon: 'success' });

          // 重置进度显示
          this.downloadProgress = 0;
          this.downloadedCount = 0;
          this.totalCount = 0;
        }
      } catch (error) {
        console.error('下载失败:', error);
        if (error.message !== '下载已暂停') {
          uni.showToast({ title: '下载失败', icon: 'none' });
        }
      } finally {
        this.isDownloading = false;
        // 只在下载完成或出错时重新加载状态
        const status = mapTileCache.getDownloadStatus();
        if (!status.isDownloading) {
          await this.loadDownloadStatus();
        }
      }
    },

    async clearMilanCache() {
      try {
        // 先终止下载任务
        if (this.isDownloading || mapTileCache.getDownloadStatus().isDownloading) {
          mapTileCache.pauseDownload();
          this.isDownloading = false;
          console.log('清空缓存：下载任务已终止');

          // 等待一下确保下载任务完全停止
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        await mapTileCache.clearAreaCache(milanBounds, 17, 20);

        // 清空下载进度
        await mapTileCache.clearDownloadProgress();
        this.downloadProgress = 0;
        this.downloadedCount = 0;
        this.totalCount = 0;

        await this.updateCacheStats();
        uni.showToast({ title: '缓存已清空', icon: 'success' });
      } catch (error) {
        console.error('清空缓存失败:', error);
        uni.showToast({ title: '清空失败', icon: 'none' });
      }
    },

    async cleanupOldCache() {
      try {
        await mapTileCache.cleanupOldCache(30);
        await this.updateCacheStats();
        uni.showToast({ title: '旧缓存已清理', icon: 'success' });
      } catch (error) {
        uni.showToast({ title: '清理失败', icon: 'none' });
      }
    },

    async checkNetworkStatus() {
      try {
        const res = await new Promise((resolve, reject) => {
          uni.getNetworkType({
            success: resolve,
            fail: reject,
          });
        });
        this.isOnline = res.networkType !== 'none';
      } catch (error) {
        console.error('检查网络状态失败:', error);
        this.isOnline = false;
      }
    },

    async clearAllCache() {
      try {
        // 先终止下载任务
        if (this.isDownloading || mapTileCache.getDownloadStatus().isDownloading) {
          mapTileCache.pauseDownload();
          this.isDownloading = false;
          console.log('清空所有缓存：下载任务已终止');
        }

        await mapTileCache.clearAllCache();

        // 清空下载进度
        await mapTileCache.clearDownloadProgress();
        this.downloadProgress = 0;
        this.downloadedCount = 0;
        this.totalCount = 0;

        await this.updateCacheStats();
        uni.showToast({ title: '所有缓存已清空', icon: 'success' });
      } catch (error) {
        console.error('清空所有缓存失败:', error);
        uni.showToast({ title: '清空失败', icon: 'none' });
      }
    },
  },
};
</script>

<style scoped>
.map-cache-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.stat-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.stat-card:active {
  transform: scale(0.98);
}

.city-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.download-btn:not(:disabled):active {
  transform: scale(0.98);
}

.clear-btn:active {
  transform: scale(0.98);
  background-color: #ff4757;
  color: white;
}

.loading-dot {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.progress-bar {
  transition: width 0.3s ease;
}
</style>
