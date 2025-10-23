import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { UniStorage } from './storage';

export interface ZipCacheData {
  id: string;
  areaId: string;
  zipFilePath: string; // ZIP文件本地路径
  extractPath: string; // 解压缩目录路径
  fileSize: number; // ZIP文件大小（字节）
  createdAt: number;
  lastUpdated: number;
}

export interface AreaDownloadProgress {
  isActive: boolean;
  isDownloading: boolean;
  progress: number; // 下载进度 0-100
  downloadedSize: number; // 已下载大小（字节）
  totalSize: number; // 总大小（字节）
  status: 'uncached' | 'downloading' | 'extracting' | 'completed' | 'failed';
  downloadTaskId?: string; // uni.downloadFile 返回的任务ID
}

export interface TileData {
  id: string;
  z: number;
  x: number;
  y: number;
  layerType: string;
  data: string; // 文件路径
  createdAt: number;
  fileSize?: number; // 文件大小（字节）
}

export interface SimplifiedAreaCacheData {
  areaId: string;
  zipCache: ZipCacheData | null; // ZIP缓存数据
  tiles: string[];
  downloadProgress: AreaDownloadProgress;
  lastUpdated: number;
}

export interface AreaCacheData {
  areaId: string;
  zipCache: ZipCacheData | null; // ZIP缓存数据
  tiles: Record<string, TileData>; // 瓦片数据，保持兼容性
  downloadProgress: AreaDownloadProgress;
  lastUpdated: number;
}

export const useTileCacheStore = defineStore(
  'tileCache',
  () => {
    // 按业务区ID分组的缓存数据
    const areaCaches = ref<Record<string, AreaCacheData>>({});

    // 获取指定业务区的缓存数据
    const getAreaCache = (areaId: string): AreaCacheData => {
      if (!areaCaches.value[areaId]) {
        areaCaches.value[areaId] = {
          areaId,
          zipCache: null,
          tiles: {},
          downloadProgress: {
            isActive: false,
            isDownloading: false,
            progress: 0,
            downloadedSize: 0,
            totalSize: 0,
            status: 'uncached',
          },
          lastUpdated: Date.now(),
        };
      }
      return areaCaches.value[areaId];
    };

    // 获取指定业务区的缓存统计
    const getAreaStats = (areaId: string) => {
      const areaCache = getAreaCache(areaId);
      return {
        totalSize: areaCache.zipCache?.fileSize || 0, // ZIP文件大小
        status: areaCache.downloadProgress.status,
        hasCache: !!areaCache.zipCache, // 是否有缓存
        zipFilePath: areaCache.zipCache?.zipFilePath || '',
        extractPath: areaCache.zipCache?.extractPath || '',
      };
    };

    // 保存ZIP缓存到指定业务区
    const saveZipCache = (areaId: string, zipFilePath: string, extractPath: string, fileSize: number) => {
      const areaCache = getAreaCache(areaId);
      areaCache.zipCache = {
        id: `zip_${areaId}_${Date.now()}`,
        areaId,
        zipFilePath,
        extractPath,
        fileSize,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };
      areaCache.lastUpdated = Date.now();
    };

    // 获取指定业务区的ZIP缓存
    const getZipCache = (areaId: string): ZipCacheData | null => {
      const areaCache = getAreaCache(areaId);
      return areaCache.zipCache;
    };

    // 检查指定业务区的ZIP缓存是否存在
    const hasZipCache = (areaId: string): boolean => {
      const areaCache = getAreaCache(areaId);
      return !!areaCache.zipCache;
    };

    // 删除指定业务区的ZIP缓存
    const deleteZipCache = (areaId: string) => {
      const areaCache = getAreaCache(areaId);
      areaCache.zipCache = null;
      areaCache.lastUpdated = Date.now();
    };

    // 清空指定业务区的缓存文件
    const clearAreaCacheFiles = async (areaId: string) => {
      // #ifdef APP-PLUS
      const areaCache = getAreaCache(areaId);
      const zipCache = areaCache.zipCache;

      if (zipCache) {
        // 删除ZIP文件
        if (zipCache.zipFilePath) {
          try {
            await new Promise<void>(resolve => {
              plus.io.resolveLocalFileSystemURL(
                zipCache.zipFilePath,
                entry => {
                  entry.remove(
                    () => {
                      console.log(`删除ZIP文件成功: ${zipCache.zipFilePath}`);
                      resolve();
                    },
                    error => {
                      console.warn(`删除ZIP文件失败: ${zipCache.zipFilePath}`, error);
                      resolve(); // 即使删除失败也继续
                    },
                  );
                },
                () => {
                  console.warn(`ZIP文件不存在: ${zipCache.zipFilePath}`);
                  resolve(); // 文件不存在也继续
                },
              );
            });
          } catch (error) {
            console.warn(`删除ZIP文件异常: ${zipCache.zipFilePath}`, error);
          }
        }

        // 删除解压缩目录
        if (zipCache.extractPath) {
          try {
            await new Promise<void>(resolve => {
              plus.io.resolveLocalFileSystemURL(
                zipCache.extractPath,
                entry => {
                  entry.removeRecursively(
                    () => {
                      console.log(`删除解压缩目录成功: ${zipCache.extractPath}`);
                      resolve();
                    },
                    error => {
                      console.warn(`删除解压缩目录失败: ${zipCache.extractPath}`, error);
                      resolve(); // 即使删除失败也继续
                    },
                  );
                },
                () => {
                  console.warn(`解压缩目录不存在: ${zipCache.extractPath}`);
                  resolve(); // 目录不存在也继续
                },
              );
            });
          } catch (error) {
            console.warn(`删除解压缩目录异常: ${zipCache.extractPath}`, error);
          }
        }
      }
      // #endif
    };

    // 清空指定业务区的缓存
    const clearAreaCache = (areaId: string) => {
      const areaCache = getAreaCache(areaId);
      areaCache.zipCache = null;
      areaCache.tiles = {};
      areaCache.downloadProgress = {
        isActive: false,
        isDownloading: false,
        progress: 0,
        downloadedSize: 0,
        totalSize: 0,
        status: 'uncached',
      };
      areaCache.lastUpdated = Date.now();
    };

    // 清空所有缓存
    const clearAllCache = () => {
      areaCaches.value = {};
    };

    // 更新指定业务区的下载进度
    const updateAreaDownloadProgress = (areaId: string, progress: Partial<AreaDownloadProgress>) => {
      const areaCache = getAreaCache(areaId);
      areaCache.downloadProgress = { ...areaCache.downloadProgress, ...progress };
      areaCache.lastUpdated = Date.now();
    };

    // 清空指定业务区的下载进度
    const clearAreaDownloadProgress = (areaId: string) => {
      const areaCache = getAreaCache(areaId);
      areaCache.downloadProgress = {
        isActive: false,
        isDownloading: false,
        progress: 0,
        downloadedSize: 0,
        totalSize: 0,
        status: 'uncached',
      };
      areaCache.lastUpdated = Date.now();
    };

    // 获取指定业务区的下载进度
    const getAreaDownloadProgress = (areaId: string) => {
      const areaCache = getAreaCache(areaId);
      return areaCache.downloadProgress;
    };

    // 更新ZIP文件大小
    const updateZipFileSize = (areaId: string, fileSize: number) => {
      const areaCache = getAreaCache(areaId);
      if (areaCache.zipCache) {
        areaCache.zipCache.fileSize = fileSize;
        areaCache.zipCache.lastUpdated = Date.now();
        areaCache.lastUpdated = Date.now();
      }
    };

    // 扫描解压缩目录并生成tiles数据
    const scanExtractedTiles = async (areaId: string): Promise<void> => {
      const areaCache = getAreaCache(areaId);
      if (!areaCache.zipCache || !areaCache.zipCache.extractPath) {
        console.warn('没有ZIP缓存或解压路径');
        return;
      }

      // #ifdef APP-PLUS
      try {
        const extractPath = areaCache.zipCache.extractPath;
        console.log('开始扫描解压缩目录:', extractPath);

        await new Promise<void>((resolve, reject) => {
          plus.io.resolveLocalFileSystemURL(
            extractPath,
            (entry: any) => {
              const reader = entry.createReader();
              reader.readEntries(
                (entries: any[]) => {
                  console.log(`找到 ${entries.length} 个文件`);

                  entries.forEach((fileEntry: any) => {
                    if (fileEntry.isFile && fileEntry.name.endsWith('.png')) {
                      // 解析文件名获取瓦片坐标
                      // 文件名格式: z_x_y.png 或 img_z_x_y.png
                      const fileName = fileEntry.name.replace('.png', '');
                      const parts = fileName.split('_');

                      let z,
                        x,
                        y,
                        layerType = 'img';
                      if (parts.length === 3) {
                        // 格式: z_x_y.png
                        [z, x, y] = parts.map(Number);
                      } else if (parts.length === 4) {
                        // 格式: img_z_x_y.png
                        [layerType, z, x, y] = parts;
                        z = Number(z);
                        x = Number(x);
                        y = Number(y);
                      } else {
                        console.warn('无法解析文件名:', fileName);
                        return;
                      }

                      // 生成瓦片ID和数据
                      const tileId = `${layerType}_${z}_${x}_${y}`;
                      const tilePath = `${extractPath}/${fileEntry.name}`;

                      areaCache.tiles[tileId] = {
                        id: tileId,
                        z,
                        x,
                        y,
                        layerType,
                        data: tilePath,
                        createdAt: Date.now(),
                      };
                    }
                  });

                  console.log(`扫描完成，生成了 ${Object.keys(areaCache.tiles).length} 个瓦片记录`);
                  areaCache.lastUpdated = Date.now();
                  resolve();
                },
                (error: any) => {
                  console.error('读取目录失败:', error);
                  reject(error);
                },
              );
            },
            (error: any) => {
              console.error('访问解压缩目录失败:', error);
              reject(error);
            },
          );
        });
      } catch (error) {
        console.error('扫描解压缩目录异常:', error);
      }
      // #endif

      // #ifndef APP-PLUS
      console.log('非App平台，跳过目录扫描');
      // #endif
    };

    // 清理过期缓存
    const cleanupOldCache = (daysOld: number) => {
      const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

      Object.values(areaCaches.value).forEach(areaCache => {
        if (areaCache.zipCache && areaCache.zipCache.createdAt < cutoffTime) {
          // 清理过期的ZIP缓存
          clearAreaCacheFiles(areaCache.areaId);
          areaCache.zipCache = null;
          areaCache.tiles = {};
        }
        areaCache.lastUpdated = Date.now();
      });
    };

    // 精简的 areaCaches 数据
    const simplifiedAreaCaches = computed(() => {
      let simplifiedData: Record<string, SimplifiedAreaCacheData> = {};
      for (const key in areaCaches.value) {
        let newTiles = [];
        for (const tileKey in areaCaches.value[key].tiles) {
          const tileInfo = areaCaches.value[key].tiles[tileKey];
          newTiles.push(`${tileInfo.z}_${tileInfo.x}_${tileInfo.y}`);
        }
        simplifiedData[key] = {
          areaId: areaCaches.value[key].areaId,
          zipCache: areaCaches.value[key].zipCache,
          tiles: newTiles,
          downloadProgress: areaCaches.value[key].downloadProgress,
          lastUpdated: areaCaches.value[key].lastUpdated,
        };
      }
      return simplifiedData;
    });

    return {
      areaCaches,
      simplifiedAreaCaches,
      getAreaCache,
      getAreaStats,
      saveZipCache,
      getZipCache,
      hasZipCache,
      deleteZipCache,
      clearAreaCacheFiles,
      clearAreaCache,
      clearAllCache,
      updateAreaDownloadProgress,
      clearAreaDownloadProgress,
      getAreaDownloadProgress,
      updateZipFileSize,
      scanExtractedTiles,
      cleanupOldCache,
    };
  },
  {
    persist: {
      storage: UniStorage,
      key: 'tree_tile_cache',
    },
  },
);
