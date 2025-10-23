<script lang="ts" setup>
import { ref, computed, onUnmounted } from 'vue';
import { onLoad, onHide } from '@dcloudio/uni-app';
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { goBack } from '@/utils';
import { useVectorAreaStore, type VectorArea } from '@/stores/vector_area';
import { useTileCacheStore } from '../../stores/tile_cache';
import { useGlobalStore } from '@/stores/global';
import { service } from '@/service';

// 页面参数
const areaId = ref<string>('');

const { statusBarHeight } = useStatusBarHeight();
const vectorAreaStore = useVectorAreaStore();
const tileCacheStore = useTileCacheStore();
const globalStore = useGlobalStore();

// 响应式数据
const areaInfo = ref<VectorArea | null>(null);
const isClearing = ref(false); // 清空缓存的loading状态
const isRedownloading = ref(false); // 重新下载的loading状态
const currentDownloadTask = ref<UniApp.DownloadTask | null>(null); // 当前下载任务

// 计算属性
const areaStats = computed(() => {
  if (!areaId.value)
    return {
      totalSize: 0,
      status: 'uncached' as const,
      hasCache: false,
      zipFilePath: '',
      extractPath: '',
    };
  return tileCacheStore.getAreaStats(areaId.value);
});

const downloadProgress = computed(() => {
  if (!areaId.value)
    return {
      isActive: false,
      isDownloading: false,
      progress: 0,
      downloadedSize: 0,
      totalSize: 0,
      status: 'uncached' as const,
    };
  return tileCacheStore.getAreaDownloadProgress(areaId.value);
});

const cacheStatus = computed(() => {
  const status = downloadProgress.value.status;
  switch (status) {
    case 'completed':
      return '已完成';
    case 'downloading':
      return '下载中';
    case 'extracting':
      return '解压中';
    case 'failed':
      return '下载失败';
    case 'uncached':
    default:
      return '未缓存';
  }
});

const isDownloading = computed(() => downloadProgress.value.isDownloading);

// 格式化文件大小的通用函数
const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes === 0) return '0 MB';

  const sizeInMB = sizeInBytes / (1024 * 1024);
  if (sizeInMB < 1) {
    const sizeInKB = sizeInBytes / 1024;
    return sizeInKB.toFixed(1) + ' KB';
  } else if (sizeInMB < 1024) {
    return sizeInMB.toFixed(1) + ' MB';
  } else {
    const sizeInGB = sizeInMB / 1024;
    return sizeInGB.toFixed(1) + ' GB';
  }
};

// 格式化缓存大小
const formattedCacheSize = computed(() => {
  const sizeInBytes = areaStats.value.totalSize;
  return formatFileSize(sizeInBytes);
});

// 格式化下载进度的数据大小
const formattedDownloadSize = computed(() => {
  const downloaded = downloadProgress.value.downloadedSize;
  const total = downloadProgress.value.totalSize;

  if (total === 0) return '';

  const downloadedFormatted = formatFileSize(downloaded);
  const totalFormatted = formatFileSize(total);

  return `${downloadedFormatted} / ${totalFormatted}`;
});

// 格式化预期文件大小
const formattedExpectedSize = computed(() => {
  const expectedSize = downloadProgress.value.totalSize;
  if (expectedSize === 0) return '未知';
  return formatFileSize(expectedSize);
});

// 页面加载时获取页面参数
onLoad(options => {
  console.log('onLoad 获取页面参数:', options);
  console.log('tileCacheStore', tileCacheStore.areaCaches);

  if (options?.id) {
    areaId.value = options.id;
    loadAreaInfo();
  }
});

// 页面隐藏时停止缓存
onHide(() => {
  console.log('页面隐藏，检查是否需要停止缓存');
  if (areaId.value && isDownloading.value && currentDownloadTask.value) {
    console.log('检测到正在下载，停止缓存任务');
    currentDownloadTask.value.abort();
    currentDownloadTask.value = null;
    tileCacheStore.clearAreaDownloadProgress(areaId.value);
    uni.showToast({
      title: '已暂停下载',
      icon: 'none',
      duration: 1500,
    });
  }
});

// 页面销毁时清理下载任务
onUnmounted(() => {
  console.log('页面销毁，清理下载任务');
  if (currentDownloadTask.value) {
    currentDownloadTask.value.abort();
    currentDownloadTask.value = null;
    if (areaId.value) {
      tileCacheStore.clearAreaDownloadProgress(areaId.value);
    }
  }
});
// 获取区域信息 - 使用新的 getAreaById 方法获取完整数据
const loadAreaInfo = async () => {
  const area = vectorAreaStore.getAreaById(areaId.value);
  areaInfo.value = area!;
};

// 停止下载
const stopDownload = () => {
  if (!areaId.value || !currentDownloadTask.value) return;

  // 停止下载任务
  currentDownloadTask.value.abort();
  currentDownloadTask.value = null;

  // 清空下载进度
  tileCacheStore.clearAreaDownloadProgress(areaId.value);

  console.log('下载已停止');
  uni.showToast({ title: '下载已停止', icon: 'none' });
};

// 确认重新下载
const confirmRedownload = () => {
  if (isRedownloading.value) return; // 防止重复操作

  uni.showModal({
    title: '确认重新下载',
    content: '确认重新下载缓存数据吗？',
    confirmText: '确定',
    cancelText: '取消',
    success: res => {
      if (res.confirm) {
        redownload();
      }
    },
  });
};

// 重新下载
const redownload = async () => {
  if (isRedownloading.value) return;

  try {
    isRedownloading.value = true;

    // 先清空现有缓存
    await clearTiles();

    // 重新开始下载
    await downloadAndExtractZip();
  } catch (error) {
    console.error('重新下载失败:', error);
    uni.showToast({
      title: '重新下载失败',
      icon: 'none',
    });
  } finally {
    isRedownloading.value = false;
  }
};

// 确认清空瓦片
const confirmClearTiles = () => {
  // 如果正在清空中，不允许重复操作
  if (isClearing.value) return;

  uni.showModal({
    title: '确认清空瓦片',
    content: '清空瓦片将删除当前区域的所有缓存数据，确定要继续吗？',
    confirmText: '确定',
    cancelText: '取消',
    success: res => {
      if (res.confirm) {
        clearTiles();
      }
    },
  });
};

// 清空瓦片
const clearTiles = async () => {
  if (!areaId.value || isClearing.value) return;

  try {
    // 设置loading状态
    isClearing.value = true;

    // 先终止下载任务
    if (isDownloading.value && currentDownloadTask.value) {
      currentDownloadTask.value.abort();
      currentDownloadTask.value = null;
      tileCacheStore.clearAreaDownloadProgress(areaId.value);
      console.log('清空瓦片：下载任务已终止');
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 删除缓存文件
    await tileCacheStore.clearAreaCacheFiles(areaId.value);

    // 尝试删除整个区域目录
    // #ifdef APP-PLUS
    try {
      const cacheDir = `_doc/tile_cache/${areaId.value}`;
      await new Promise<void>(resolve => {
        plus.io.resolveLocalFileSystemURL(
          cacheDir,
          entry => {
            // 递归删除目录及其所有内容
            entry.removeRecursively(
              () => {
                console.log(`递归删除区域目录成功: ${cacheDir}`);
                resolve();
              },
              error => {
                console.log(`递归删除区域目录失败: ${cacheDir}`, error);
                // 如果递归删除失败，尝试普通删除
                entry.remove(
                  () => {
                    console.log(`普通删除区域目录成功: ${cacheDir}`);
                    resolve();
                  },
                  error2 => {
                    console.log(`删除区域目录完全失败: ${cacheDir}`, error2);
                    resolve(); // 即使失败也继续
                  },
                );
              },
            );
          },
          () => {
            console.log(`区域目录不存在: ${cacheDir}`);
            resolve();
          },
        );
      });
    } catch (error) {
      console.warn('删除区域目录异常:', error);
    }
    // #endif

    // 清空该业务区的所有缓存数据
    tileCacheStore.clearAreaCache(areaId.value);

    uni.showToast({ title: '瓦片已清空', icon: 'success' });
  } catch (error) {
    console.error('清空瓦片失败:', error);
    uni.showToast({ title: '清空失败', icon: 'none' });
  } finally {
    // 无论成功失败都要清除loading状态
    isClearing.value = false;
  }
};

// 确保缓存目录存在
const ensureCacheDirectory = (areaId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    try {
      // 使用正确的私有文档目录路径
      const cacheDir = `_doc/tile_cache/${areaId}`;

      console.log('尝试访问缓存目录:', cacheDir);

      plus.io.resolveLocalFileSystemURL(
        cacheDir,
        () => {
          // 目录已存在
          console.log('缓存目录已存在:', cacheDir);
          resolve(cacheDir);
        },
        () => {
          // 目录不存在，创建目录
          console.log('缓存目录不存在，开始创建');

          // 使用 requestFileSystem 获取私有文档目录
          plus.io.requestFileSystem(
            plus.io.PRIVATE_DOC,
            fs => {
              if (!fs || !fs.root) {
                console.error('获取文件系统失败');
                reject(new Error('获取文件系统失败'));
                return;
              }

              console.log('获取到应用私有文档目录:', fs.root.fullPath);

              // 创建 tile_cache 目录
              fs.root.getDirectory(
                'tile_cache',
                { create: true },
                tileCacheEntry => {
                  console.log('创建tile_cache目录成功:', tileCacheEntry.fullPath);

                  // 创建区域目录
                  tileCacheEntry.getDirectory(
                    areaId,
                    { create: true },
                    areaEntry => {
                      console.log('创建区域目录成功:', areaEntry.fullPath);
                      resolve(cacheDir); // 返回相对路径用于下载器
                    },
                    error => {
                      console.error('创建区域目录失败:', error);
                      reject(error);
                    },
                  );
                },
                error => {
                  console.error('创建tile_cache目录失败:', error);
                  reject(error);
                },
              );
            },
            error => {
              console.error('获取应用私有文档目录失败:', error);
              reject(error);
            },
          );
        },
      );
    } catch (error) {
      console.error('创建缓存目录异常:', error);
      reject(error);
    }
    // #endif

    // #ifndef APP-PLUS
    // 非App平台，返回一个虚拟路径
    resolve(`/tile_cache/${areaId}`);
    // #endif
  });
};

// 获取缓存下载链接
// 并预获取文件大小 TODO: minio 不支持
const getCacheDownloadUrl = async () => {
  if (!areaId.value || !globalStore.apiAddress) return null;

  try {
    const response = await service({
      url: `/app/query/vector_area/by_user_id/${areaId.value}`,
      method: 'GET',
    });

    if (response.statusCode === 200 && response.data) {
      const cacheInfo = {
        cacheUrl: response.data.cacheUrl || '',
        progress: response.data.progress || 0,
      };
      return cacheInfo;
    } else {
      console.error('获取缓存下载链接失败:', response);
      return null;
    }
  } catch (error) {
    console.error('获取缓存下载链接异常:', error);
    uni.showToast({
      title: '获取下载链接失败',
      icon: 'none',
    });
    return null;
  }
};

// 下载并解压ZIP文件
const downloadAndExtractZip = async () => {
  if (!areaId.value || isDownloading.value) return;

  // 检查后端API地址是否已配置
  if (!globalStore.apiAddress) {
    uni.showModal({
      title: '提示',
      content: '请先在设置页面配置后端API地址后再进行下载',
      showCancel: false,
      confirmText: '知道了',
    });
    return;
  }

  try {
    // 设置下载状态
    tileCacheStore.updateAreaDownloadProgress(areaId.value, {
      isDownloading: true,
      status: 'downloading',
      progress: 0,
    });

    // 获取下载链接
    const cacheInfo = await getCacheDownloadUrl();
    if (!cacheInfo) {
      throw new Error('获取下载链接失败');
    }

    // 检查进度是否为100%
    if (cacheInfo.progress != 100) {
      uni.showModal({
        title: '提示',
        content: `缓存文件还未准备完成，当前进度：${cacheInfo.progress}%，请稍后再试`,
        showCancel: false,
        confirmText: '知道了',
      });

      // 重置下载状态
      tileCacheStore.updateAreaDownloadProgress(areaId.value, {
        isDownloading: false,
        status: 'uncached',
      });
      return;
    }

    if (!cacheInfo.cacheUrl) {
      throw new Error('下载链接为空');
    }

    // 开始下载ZIP文件
    await downloadZipFile(cacheInfo.cacheUrl);
  } catch (error: any) {
    console.error('下载失败:', error);
    if (downloadProgress.value.isDownloading) {
      uni.showToast({
        title: error.message || '下载失败',
        icon: 'none',
      });

      // 重置下载状态
      tileCacheStore.updateAreaDownloadProgress(areaId.value, {
        isDownloading: false,
        status: 'failed',
      });
    }
  }
};

// 下载ZIP文件
const downloadZipFile = async (downloadUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 确保缓存目录存在
    ensureCacheDirectory(areaId.value)
      .then(cacheDir => {
        const zipFileName = `cache_${areaId.value}_${Date.now()}.zip`;
        const zipFilePath = `${cacheDir}/${zipFileName}`;
        const extractPath = `${cacheDir}`;

        console.log('开始下载ZIP文件:', downloadUrl);
        console.log('保存路径:', zipFilePath);

        const downloadTask = uni.downloadFile({
          url: downloadUrl,
          success: res => {
            console.log('ZIP文件下载成功:', res);
            currentDownloadTask.value = null; // 清空任务引用

            if (res.statusCode === 200) {
              // 更新下载状态为解压缩中
              tileCacheStore.updateAreaDownloadProgress(areaId.value, {
                status: 'extracting',
                progress: 100,
              });

              // 开始解压缩
              extractZipFile(res.tempFilePath, extractPath)
                .then(async () => {
                  // 保存ZIP缓存信息
                  tileCacheStore.saveZipCache(areaId.value, zipFilePath, extractPath, 0);

                  // 获取文件大小
                  getZipFileSize(res.tempFilePath || zipFilePath).then(fileSize => {
                    tileCacheStore.updateZipFileSize(areaId.value, fileSize);
                  });

                  // 扫描解压缩目录并生成tiles数据
                  try {
                    await tileCacheStore.scanExtractedTiles(areaId.value);
                    console.log('瓦片数据扫描完成');
                  } catch (error) {
                    console.error('扫描瓦片数据失败:', error);
                  }

                  // 下载完成
                  tileCacheStore.updateAreaDownloadProgress(areaId.value, {
                    isActive: false,
                    isDownloading: false,
                    status: 'completed',
                    progress: 100,
                  });

                  uni.showToast({ title: '下载并解压完成', icon: 'success' });
                  resolve();
                })
                .catch(error => {
                  console.error('解压缩失败:', error);
                  currentDownloadTask.value = null; // 清空任务引用
                  reject(new Error('解压缩失败'));
                });
            } else {
              currentDownloadTask.value = null; // 清空任务引用
              reject(new Error(`下载失败，状态码: ${res.statusCode}`));
            }
          },
          fail: error => {
            console.error('ZIP文件下载失败:', error);
            currentDownloadTask.value = null; // 清空任务引用
            reject(new Error('下载失败'));
          },
        });

        // 监听下载进度 - 使用节流避免频繁更新
        let lastUpdateTime = 0;
        downloadTask.onProgressUpdate(res => {
          if (downloadProgress.value.isDownloading) {
            const now = Date.now();
            const progress = Math.floor(res.progress);

            // 节流 每1500ms更新一次
            if (now - lastUpdateTime > 1500) {
              tileCacheStore.updateAreaDownloadProgress(areaId.value, {
                progress: progress,
                downloadedSize: res.totalBytesWritten,
                totalSize: res.totalBytesExpectedToWrite,
              });
              lastUpdateTime = now;
              console.log(`下载进度: ${progress}%, 已下载: ${res.totalBytesWritten} bytes, 总大小: ${res.totalBytesExpectedToWrite} bytes`);
            }
          }
        });

        // 保存下载任务引用用于取消
        currentDownloadTask.value = downloadTask;
      })
      .catch(error => {
        console.error('创建缓存目录失败:', error);
        reject(new Error('创建缓存目录失败'));
      });
  });
};

// 解压缩ZIP文件
const extractZipFile = async (zipFilePath: string, extractPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    try {
      console.log('开始解压缩:', zipFilePath, '到', extractPath);

      // 使用plus.zip.decompress进行解压缩
      plus.zip.decompress(
        zipFilePath,
        plus.io.convertLocalFileSystemURL(extractPath),
        () => {
          console.log('解压缩成功');
          resolve();
        },
        (error: any) => {
          console.error('解压缩失败:', error);
          reject(error);
        },
      );
    } catch (error) {
      console.error('解压缩异常:', error);
      reject(error);
    }
    // #endif

    // #ifndef APP-PLUS
    // 非App平台，模拟解压缩成功
    console.log('非App平台，模拟解压缩成功');
    resolve();
    // #endif
  });
};

// 获取ZIP文件大小
const getZipFileSize = async (filePath: string): Promise<number> => {
  return new Promise(resolve => {
    // #ifdef APP-PLUS
    try {
      plus.io.resolveLocalFileSystemURL(
        filePath,
        (entry: any) => {
          entry.getMetadata(
            (metadata: any) => {
              console.log('ZIP文件大小:', metadata.size);
              resolve(metadata.size);
            },
            () => {
              console.warn('获取文件大小失败');
              resolve(0);
            },
          );
        },
        () => {
          console.warn('文件不存在');
          resolve(0);
        },
      );
    } catch (error) {
      console.warn('获取文件大小异常:', error);
      resolve(0);
    }
    // #endif

    // #ifndef APP-PLUS
    // 非App平台，返回默认大小
    resolve(0);
    // #endif
  });
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
          <text class="text-#fff text-18px font-bold">{{ areaInfo?.name || '瓦片缓存' }}</text>
        </view>
        <view class="flex-1"></view>
      </view>
    </view>

    <!-- 主要内容区域 -->
    <view class="flex-1 overflow-hidden bg-#f5f7fa p-16px">
      <scroll-view :scroll-y="true" class="h-full">
        <!-- 缓存区域信息 -->
        <view v-if="areaInfo" class="bg-white rounded-12px p-16px mb-16px shadow-sm">
          <view class="flex items-center mb-12px">
            <text class="text-16px font-bold text-#333">{{ areaInfo.name }}</text>
            <view v-if="areaInfo.geom?.type" class="ml-auto bg-#f0f0f0 text-#666 text-12px px-6px py-2px rounded-4px">
              {{ areaInfo.geom.type }}
            </view>
          </view>
          <text class="text-14px text-#666 leading-20px mb-8px">{{ areaInfo.description }}</text>
          <view class="flex items-center">
            <view v-if="areaInfo.layerGroupName" class="bg-#08bd92/10 text-#08bd92 text-12px px-8px py-4px rounded-4px my-10px">
              图层: {{ areaInfo.layerGroupName }}
            </view>
          </view>
          <view class="flex items-center">
            <view class="bg-#08bd92/10 text-#08bd92 text-12px px-8px py-4px rounded-4px"> 编号: {{ areaInfo.code }} </view>
          </view>
        </view>

        <!-- 统计信息卡片 -->
        <view class="bg-white rounded-12px p-16px mb-16px shadow-sm">
          <view class="grid grid-cols-3 gap-12px">
            <view class="text-center">
              <text class="text-20px font-bold text-#08bd92 block">{{ formattedCacheSize }}</text>
              <text class="text-12px text-#999">本地缓存大小</text>
            </view>
            <view class="text-center">
              <text class="text-20px font-bold text-#08bd92 block">{{ cacheStatus }}</text>
              <text class="text-12px text-#999">下载状态</text>
            </view>
            <view class="text-center">
              <text class="text-20px font-bold text-#08bd92 block">{{ formattedExpectedSize }}</text>
              <text class="text-12px text-#999">预期文件大小</text>
            </view>
          </view>
        </view>

        <!-- 下载进度显示 -->
        <view v-if="isDownloading" class="bg-white rounded-12px p-16px mb-16px shadow-sm">
          <view class="flex items-center justify-between mb-8px">
            <text class="text-14px text-#333">下载进度</text>
            <text class="text-12px text-#666">{{ downloadProgress.progress }}%</text>
          </view>
          <view class="w-full h-6px bg-#f0f0f0 rounded-3px overflow-hidden">
            <view
              class="h-full bg-gradient-to-r from-#08bd92 to-#07a47f transition-all duration-300"
              :style="{ width: downloadProgress.progress + '%' }"
            ></view>
          </view>
          <view class="mt-8px flex items-center justify-between">
            <text class="text-12px text-#666">
              状态: {{ downloadProgress.status === 'downloading' ? '下载中' : downloadProgress.status === 'extracting' ? '解压缩中' : '处理中' }}
            </text>
            <text v-if="formattedDownloadSize" class="text-12px text-#666">
              {{ formattedDownloadSize }}
            </text>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="space-y-12px">
          <!-- 下载按钮 -->
          <button
            v-if="!isDownloading && areaStats.status !== 'completed'"
            class="w-full h-48px fc rounded-12px text-16px font-medium transition-all duration-200 bg-gradient-to-r from-#08bd92 to-#07a47f text-white"
            @click="downloadAndExtractZip"
          >
            <view class="flex items-center justify-center">
              <uni-icons type="cloud-download" size="18" color="#fff" class="mr-8px"></uni-icons>
              <text>开始下载</text>
            </view>
          </button>

          <!-- 停止下载按钮 -->
          <button
            v-if="isDownloading"
            class="w-full h-48px fc rounded-12px text-16px font-medium transition-all duration-200 bg-#ff6b6b text-white"
            @click="stopDownload"
          >
            <view class="flex items-center justify-center">
              <uni-icons type="close" size="18" color="#fff" class="mr-8px"></uni-icons>
              <text>停止下载</text>
            </view>
          </button>

          <!-- 重新下载按钮 -->
          <button
            v-if="!isDownloading && areaStats.status === 'completed'"
            class="w-full h-48px fc rounded-12px text-16px font-medium transition-all duration-200 bg-gradient-to-r from-#08bd92 to-#07a47f text-white"
            @click="confirmRedownload"
            :disabled="isRedownloading"
          >
            <view class="flex items-center justify-center">
              <uni-icons
                :type="isRedownloading ? 'spinner-cycle' : 'refresh'"
                size="18"
                color="#fff"
                class="mr-8px"
                :class="{ 'animate-spin': isRedownloading }"
              ></uni-icons>
              <text>{{ isRedownloading ? '重新下载中...' : '重新下载' }}</text>
            </view>
          </button>

          <!-- 清空缓存按钮 -->
          <button
            v-if="areaStats.hasCache && !isDownloading"
            class="w-full h-48px fc rounded-12px text-16px font-medium transition-all duration-200 bg-#666 text-white"
            @click="confirmClearTiles"
            :disabled="isClearing"
          >
            <view class="flex items-center justify-center">
              <uni-icons
                :type="isClearing ? 'spinner-cycle' : 'trash'"
                size="18"
                color="#fff"
                class="mr-8px"
                :class="{ 'animate-spin': isClearing }"
              ></uni-icons>
              <text>{{ isClearing ? '清空中...' : '清空缓存' }}</text>
            </view>
          </button>
        </view>
      </scroll-view>
    </view>
  </view>
</template>
