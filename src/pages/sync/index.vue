<script lang="ts" setup>
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { getAllSyncData, getSurveyList, getAllGermplasmList, isOffline } from '@/hooks/useSync';
import { clearDirectory, formatFileSize, goBack, uuid } from '@/utils';
import { ref, computed } from 'vue';
import { useGlobalStore } from '@/stores/global';
import { useSyncSurveyStore, type SyncItem } from '@/stores/sync_survey';
import { useSurveyTokenStore } from '@/stores/token';
import { storeToRefs } from 'pinia';
import { useSyncHistoryStore } from '@/stores/sync_history';
import dayjs from 'dayjs';
import UnifiedFailedPopup from './components/UnifiedFailedPopup.vue';
import { LogCat } from '@/utils/logger';
import { service } from '@/service';
import { JSONbig } from '@/utils';
import { useSyncResultStore } from '@/stores/sync_result';
import type { Survey } from '@/stores/survey_list';
import { useGermplasmLisStore } from '@/stores/germplasm_list';
import { onLoad } from '@dcloudio/uni-app';

const surveyTokenStore = useSurveyTokenStore();
const { checkIsExpires } = surveyTokenStore;

const globalStore = useGlobalStore();
const { setDataSyncResultDownloadTime } = globalStore;
const { addSyncHistory } = useSyncHistoryStore();
const { dataSyncDownloadTime, dataSyncUploadTime, dataSyncResultDownloadTime } = storeToRefs(globalStore);
const syncSurveyStore = useSyncSurveyStore();
const { removeSyncItem, clearErrorSyncList } = syncSurveyStore;
const { syncList, syncPendingList, syncPendingAndErrorList, syncErrorList } = storeToRefs(syncSurveyStore);
const { statusBarHeight } = useStatusBarHeight();

// 计算失败数据数量
const surveyFailedCount = computed(() => syncErrorList.value.length);
const germplasmFailedCount = computed(() => germplasmList.value.filter(item => item.status === 'syncError').length);
const totalFailedCount = computed(() => surveyFailedCount.value + germplasmFailedCount.value);
const hasFailedData = computed(() => totalFailedCount.value > 0);

const syncResultStore = useSyncResultStore();
const { addSyncResult, clearSyncResult, setSyncResultFileInfo } = syncResultStore;
const { syncResultFileInfo, syncResultList } = storeToRefs(syncResultStore);

const germplasmLisStore = useGermplasmLisStore();
const { germplasmList } = storeToRefs(germplasmLisStore);
const { onHandleSyncUploadData } = germplasmLisStore;

// 统一失败数据popup相关
const showUnifiedFailedPopup = ref(false);
const failedPopupDefaultTab = ref<'survey' | 'germplasm'>('survey');

const openTest = () => {
  failedPopupDefaultTab.value = 'germplasm';
  showUnifiedFailedPopup.value = true;
};

// 待上传数据选择相关
const selectedSyncIds = ref<Set<string>>(new Set());
const showUploadList = ref(false);

// tab切换相关
const activeTab = ref<'survey' | 'germplasm'>('survey'); // 默认激活调查tab

// 种质资源待上传数据
const germplasmPendingList = computed(() => {
  return germplasmList.value.filter(item => item.notTempData && item.status === 'done');
});

// 当前激活tab的数据列表
const currentTabList = computed(() => {
  return activeTab.value === 'survey' ? syncPendingList.value : germplasmPendingList.value;
});

// 是否全选
const isAllSelected = computed(() => {
  return currentTabList.value.length > 0 && selectedSyncIds.value.size === currentTabList.value.length;
});

// 是否有选中项
const hasSelected = computed(() => {
  return selectedSyncIds.value.size > 0;
});

// tab切换方法
const switchTab = (tab: 'survey' | 'germplasm') => {
  activeTab.value = tab;
  // 切换tab时清空选择
  selectedSyncIds.value.clear();
};

const syncDownloadTime = computed(() => {
  return dataSyncDownloadTime.value ? dayjs(dataSyncDownloadTime.value).format('YYYY-MM-DD HH:mm:ss') : '- -';
});

const syncResultDownloadTime = computed(() => {
  return dataSyncDownloadTime.value ? dayjs(dataSyncResultDownloadTime.value).format('YYYY-MM-DD HH:mm:ss') : '- -';
});

const syncUploadTime = computed(() => {
  return dataSyncUploadTime.value ? dayjs(dataSyncUploadTime.value).format('YYYY-MM-DD HH:mm:ss') : '- -';
});

const goSyncHistory = () => {
  uni.navigateTo({
    url: '/pages/sync_history/index',
  });
};

// 同步状态
const isDownloading = ref(false);
const isUploading = ref(false);
// 下载系统数据到本地
const handleDownloadData = async () => {
  if (isDownloading.value || isUploading.value) return;

  // 检查 token 是否过期
  if (checkIsExpires()) {
    uni.showModal({
      title: '授权已过期',
      content: '登录授权已过期，请重新登录',
      showCancel: false,
      success: function (res) {
        if (res.confirm) {
          uni.reLaunch({
            url: '/pages/login/index',
          });
        }
      },
    });
    return;
  }

  const nowTime = Date.now();
  try {
    isDownloading.value = true;

    const offline = await isOffline();
    if (offline) {
      uni.showToast({
        title: '当前处于离线状态，无法同步数据',
        icon: 'none',
      });
    }

    uni.showLoading({
      title: '正在同步数据...',
      mask: true,
    });
    const syncRes = await getAllSyncData();
    globalStore.setDataSyncDownloadTime(nowTime);
    uni.hideLoading();
    if (syncRes.every(item => item && item.statusCode === 200)) {
      uni.showToast({
        title: '数据同步成功',
        icon: 'success',
      });
      addSyncHistory({
        id: uuid(),
        createdAt: nowTime,
        type: 'DOWNLOAD',
        success: true,
      });
    } else {
      addSyncHistory({
        id: uuid(),
        createdAt: nowTime,
        type: 'DOWNLOAD',
        success: false,
      });
    }
  } catch (error) {
    console.log('同步error', error);
    addSyncHistory({
      id: uuid(),
      createdAt: nowTime,
      type: 'DOWNLOAD',
      success: false,
    });
    uni.hideLoading();
    uni.showToast({
      title: '同步失败，请重试',
      icon: 'none',
    });
  } finally {
    isDownloading.value = false;
  }
};

// 全选/反选
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedSyncIds.value.clear();
  } else {
    if (activeTab.value === 'survey') {
      syncPendingList.value.forEach(item => {
        selectedSyncIds.value.add(item.id);
      });
    } else {
      germplasmPendingList.value.forEach(item => {
        selectedSyncIds.value.add(item.tempId!);
      });
    }
  }
};

// 切换单个选择状态
const toggleSelectItem = (itemId: string) => {
  if (selectedSyncIds.value.has(itemId)) {
    selectedSyncIds.value.delete(itemId);
  } else {
    selectedSyncIds.value.add(itemId);
  }
};

// 上传列表弹窗引用
const uploadListPopup = ref<any>(null);

// 显示上传列表
const showUploadListModal = () => {
  if (syncPendingList.value.length === 0 && germplasmPendingList.value.length === 0) {
    uni.showToast({
      title: '暂无待上传数据',
      icon: 'none',
    });
    return;
  }
  // 默认全选当前tab的数据
  selectedSyncIds.value.clear();
  if (activeTab.value === 'survey') {
    syncPendingList.value.forEach(item => {
      selectedSyncIds.value.add(item.id);
    });
  } else {
    germplasmPendingList.value.forEach(item => {
      selectedSyncIds.value.add(item.tempId!);
    });
  }
  uploadListPopup.value?.open('bottom');
};

// 关闭上传列表弹窗
const closeUploadListModal = () => {
  uploadListPopup.value?.close();
};

// 弹窗状态变化处理
const onUploadListPopupChange = (e: any) => {
  showUploadList.value = e.show;
};

// 上传本地数据
const handleUploadData = async () => {
  if (isDownloading.value || isUploading.value) return;

  // 检查 token 是否过期
  if (checkIsExpires()) {
    uni.showModal({
      title: '授权已过期',
      content: '登录授权已过期，请重新登录',
      showCancel: false,
      success: function (res) {
        if (res.confirm) {
          uni.reLaunch({
            url: '/pages/login/index',
          });
        }
      },
    });
    closeUploadListModal(); // 关闭选择列表
    return;
  }

  const nowTime = Date.now();
  isUploading.value = true;
  closeUploadListModal(); // 关闭选择列表

  // 只上传选中的数据
  const selectedItems = Array.from(selectedSyncIds.value);
  const uploadLength = selectedItems.length;

  // 处理种质资源数据上传
  if (activeTab.value === 'germplasm') {
    try {
      const res = await onHandleSyncUploadData(selectedItems);
      isUploading.value = false;
      uni.hideLoading();
      const { successCount, errorCount, has401 } = res;

      globalStore.setDataSyncUploadTime(nowTime);
      // #ifdef APP-PLUS
      // 屏幕常亮关闭
      uni.setKeepScreenOn({
        keepScreenOn: false,
      });
      // #endif

      if (has401) {
        addSyncHistory({
          id: uuid(),
          createdAt: nowTime,
          type: 'UPLOAD',
          success: false,
          uploadType: 'GERMPLASM_RESOURCES',
        });
        const noUploadLength = uploadLength - successCount - errorCount;
        uni.showModal({
          title: '授权已过期，请重新登录',
          showCancel: false,
          content: `当前上传成功 ${successCount} 条，上传失败 ${errorCount} 条，待上传数据 ${noUploadLength} 条`,
          success: function (res) {
            if (res.confirm) {
              uni.reLaunch({
                url: '/pages/login/index',
              });
            }
          },
        });
      } else {
        if (errorCount > 0) {
          uni.showToast({
            title: `上传成功 ${successCount} 条，上传失败 ${errorCount} 条`,
            icon: 'none',
            duration: 3000,
          });
          addSyncHistory({
            id: uuid(),
            createdAt: nowTime,
            type: 'UPLOAD',
            success: false,
            uploadType: 'GERMPLASM_RESOURCES',
          });

          // 弹出种质资源失败数据弹窗
          openGermplasmFailedPopup();

          if (successCount > 0) {
            await getAllGermplasmList();
          }
        } else {
          await getAllGermplasmList();
          addSyncHistory({
            id: uuid(),
            createdAt: nowTime,
            type: 'UPLOAD',
            success: true,
            uploadType: 'GERMPLASM_RESOURCES',
          });
          uni.showToast({
            title: `成功上传 ${successCount} 条数据`,
            icon: 'none',
          });
          // 清空选择
          selectedSyncIds.value.clear();
        }
      }
      return;
    } catch (error) {
      // #ifdef APP-PLUS
      // 屏幕常亮关闭
      uni.setKeepScreenOn({
        keepScreenOn: false,
      });
      // #endif
      addSyncHistory({
        id: uuid(),
        createdAt: nowTime,
        type: 'UPLOAD',
        success: false,
        uploadType: 'GERMPLASM_RESOURCES',
      });
      isUploading.value = false;
      uni.hideLoading();
      uni.showToast({
        title: '上传失败，请重试',
        icon: 'none',
      });
      return;
    }
  }

  // #ifdef APP-PLUS
  // 开启屏幕常亮
  uni.setKeepScreenOn({
    keepScreenOn: true,
  });
  // #endif
  uni.showLoading({
    title: `正在上传选中的 ${uploadLength} 条数据`,
    mask: true,
  });

  try {
    const res = await syncSurveyStore.onHandleSyncUploadData(selectedItems);
    isUploading.value = false;
    uni.hideLoading();
    const { has401 } = res;

    // 计算上传结果统计
    const successCount = syncList.value.filter(item => selectedItems.includes(item.id) && item.status === 'success').length;
    const errorCount = syncList.value.filter(item => selectedItems.includes(item.id) && item.status === 'error').length;

    globalStore.setDataSyncUploadTime(nowTime);
    // #ifdef APP-PLUS
    // 屏幕常亮关闭
    uni.setKeepScreenOn({
      keepScreenOn: false,
    });
    // #endif
    if (has401) {
      addSyncHistory({
        id: uuid(),
        createdAt: nowTime,
        type: 'UPLOAD',
        success: false,
        uploadType: 'ANCIENT_TREE',
      });
      const noUploadLength = uploadLength - successCount - errorCount;
      uni.showModal({
        title: '授权已过期，请重新登录',
        showCancel: false,
        content: `当前上传成功 ${successCount} 条，上传失败 ${errorCount} 条，待上传数据 ${noUploadLength} 条`,
        success: function (res) {
          if (res.confirm) {
            uni.reLaunch({
              url: '/pages/login/index',
            });
          }
        },
      });
      // TODO: 有成功的  但是获取列表咋办？
    } else {
      if (errorCount > 0) {
        uni.showToast({
          title: `上传成功 ${successCount} 条，上传失败 ${errorCount} 条`,
          icon: 'none',
          duration: 3000,
        });
        addSyncHistory({
          id: uuid(),
          createdAt: nowTime,
          type: 'UPLOAD',
          success: false,
          uploadType: 'ANCIENT_TREE',
        });

        // 弹出失败数据弹窗
        openFailedPopup();

        if (successCount > 0) {
          await getSurveyList();
        }
        return;
      } else {
        await getSurveyList();
        addSyncHistory({
          id: uuid(),
          createdAt: nowTime,
          type: 'UPLOAD',
          success: true,
          uploadType: 'ANCIENT_TREE',
        });
        uni.showToast({
          title: `成功上传 ${successCount} 条数据`,
          icon: 'none',
        });
        // 清空选择
        selectedSyncIds.value.clear();
      }
    }
  } catch (error) {
    // #ifdef APP-PLUS
    // 屏幕常亮关闭
    uni.setKeepScreenOn({
      keepScreenOn: false,
    });
    // #endif
    LogCat.info(`同步数据try catch的error：`, error);
    addSyncHistory({
      id: uuid(),
      createdAt: nowTime,
      type: 'UPLOAD',
      success: false,
      uploadType: 'ANCIENT_TREE',
    });
    isUploading.value = false;
    uni.hideLoading();
    uni.showToast({
      title: '上传失败，请重试',
      icon: 'none',
    });
  }
};

const openFailedPopup = () => {
  // 根据失败数据情况自动选择默认 tab
  if (surveyFailedCount.value > 0) {
    failedPopupDefaultTab.value = 'survey';
  } else if (germplasmFailedCount.value > 0) {
    failedPopupDefaultTab.value = 'germplasm';
  } else {
    failedPopupDefaultTab.value = 'survey'; // 默认
  }
  showUnifiedFailedPopup.value = true;
};

const openGermplasmFailedPopup = () => {
  failedPopupDefaultTab.value = 'germplasm';
  showUnifiedFailedPopup.value = true;
};

// 处理种质资源编辑
const handleGermplasmEdit = (item: any) => {
  uni.navigateTo({
    url: `/pages/germplasm_resources/index?id=${item.tempId}`,
  });
};

// 处理种质资源单个删除
const handleGermplasmSingleDelete = (item: any) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条种质资源数据吗？删除后无法恢复。',
    success: res => {
      if (res.confirm && item.tempId) {
        germplasmLisStore.removeGermplasm(item.tempId);
        uni.showToast({
          title: '删除成功',
          icon: 'success',
        });
        shouldHideFailedPopup();
      }
    },
  });
};

// 处理种质资源批量删除
const handleGermplasmBatchDelete = () => {
  const failedItems = germplasmList.value.filter(item => item.status === 'syncError');
  if (failedItems.length === 0) return;

  uni.showModal({
    title: '确认批量删除',
    content: `确定要删除所有 ${failedItems.length} 条失败的种质资源数据吗？删除后无法恢复。`,
    success: res => {
      if (res.confirm) {
        failedItems.forEach(item => {
          if (item.tempId) {
            germplasmLisStore.removeGermplasm(item.tempId);
          }
        });
        uni.showToast({
          title: '批量删除成功',
          icon: 'success',
        });
        shouldHideFailedPopup();
      }
    },
  });
};

// 处理单个数据删除
const handleSingleDelete = (item: SyncItem) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除此条失败数据吗？',
    success: res => {
      if (res.confirm) {
        removeSyncItem(item.id);
        shouldHideFailedPopup();
        uni.showToast({
          title: '删除成功',
          icon: 'success',
        });
      }
    },
  });
};

// 处理批量覆盖失败数据
const handleBatchCover = () => {
  uni.showModal({
    title: '确认批量覆盖',
    content: `确定要覆盖所有上传失败的数据吗？`,
    success: res => {
      if (res.confirm) {
        // TODO: 实现批量覆盖逻辑
      }
    },
  });
};

// 处理批量删除失败数据
const handleBatchDelete = () => {
  uni.showModal({
    title: '确认批量删除',
    content: `确定要删除所有上传失败的数据吗？`,
    success: res => {
      if (res.confirm) {
        clearErrorSyncList();
        shouldHideFailedPopup();
        uni.showToast({
          title: '删除成功',
          icon: 'success',
        });
      }
    },
  });
};

const shouldHideFailedPopup = () => {
  // 检查是否还有失败数据，如果没有则关闭弹窗
  if (!hasFailedData.value) {
    showUnifiedFailedPopup.value = false;
  }
};

const ensureCacheDirectory = (treeId: string | number): Promise<PlusIoDirectoryEntry> => {
  return new Promise((resolve, reject) => {
    try {
      // 使用正确的私有文档目录路径
      const cacheDir = `_doc/media_cache/${treeId}`;
      plus.io.resolveLocalFileSystemURL(
        cacheDir,
        entry => {
          // 目录已存在
          resolve(entry);
        },
        () => {
          // 目录不存在，创建目录
          // 使用 requestFileSystem 获取私有文档目录
          plus.io.requestFileSystem(
            plus.io.PRIVATE_DOC,
            fs => {
              if (!fs || !fs.root) {
                console.error('获取文件系统失败');
                reject(new Error('获取文件系统失败'));
                return;
              }
              // 创建 media_cache 目录
              fs.root.getDirectory(
                'media_cache',
                { create: true },
                mediaCacheEntry => {
                  // 创建区域目录
                  mediaCacheEntry.getDirectory(
                    treeId,
                    { create: true },
                    treeEntry => {
                      resolve(treeEntry); // 返回相对路径用于下载器
                    },
                    error => {
                      reject(error);
                    },
                  );
                },
                error => {
                  reject(error);
                },
              );
            },
            error => {
              reject(error);
            },
          );
        },
      );
    } catch (error) {
      reject(error);
    }
  });
};

const checkSizeLoading = ref(false);
const handleDownloadMediaData = async () => {
  if (checkIsExpires()) {
    uni.showModal({
      title: '授权已过期',
      content: '登录授权已过期，请重新登录',
      showCancel: false,
      success: function (res) {
        if (res.confirm) {
          uni.reLaunch({
            url: '/pages/login/index',
          });
        }
      },
    });
    return;
  }
  checkSizeLoading.value = true;
  try {
    const res = await service({
      url: '/app/issue_achievement_data/find/by/user_id',
    });
    checkSizeLoading.value = false;
    const { number, size } = res.data;
    if (number === 0) {
      uni.showToast({
        title: '当前用户暂无成果数据',
        icon: 'none',
      });
      return;
    }
    uni.showModal({
      title: '提示',
      content: `即将下载 ${number} 条成果数据，共 ${size}，是否下载？`,
      success: res => {
        if (res.confirm) {
          setSyncResultFileInfo({ number, size });
          onStartDownloadMediaData();
        }
      },
    });
  } catch (error) {
    checkSizeLoading.value = false;
  }
};
const mediaDownloading = ref(false);
const onStartDownloadMediaData = async () => {
  // 检查 token 是否过期
  mediaDownloading.value = true;
  // 先清除历史数据
  clearSyncResult();
  const path = `_doc/media_cache`;
  // 清除历史目录数据
  await clearDirectory(path);
  uni.setKeepScreenOn({
    keepScreenOn: true,
  });
  try {
    const res = await service({
      url: '/app/issue_achievement_data/find/investigate/succeed/ancient_trees/already/issued',
      method: 'GET',
      dataType: 'String',
    });
    let parseData = JSONbig.parse(res.data);

    // 通过筛选条件构建的 list 列表
    for (let i = 0; i < parseData.length; i++) {
      const item = parseData[i];
      await downloadMediaInfoById(item);
    }
    console.log('下载结束');
    uni.setKeepScreenOn({
      keepScreenOn: false,
    });
    setDataSyncResultDownloadTime();
    mediaDownloading.value = false;
    uni.showToast({
      title: '下载成功',
      icon: 'success',
    });
  } catch (error) {
    uni.setKeepScreenOn({
      keepScreenOn: false,
    });
    console.log('error', error);
    mediaDownloading.value = false;
  }
};

const downloadMediaInfoById = async (item: Survey) => {
  if (item.multimedia && item.multimedia.length) {
    console.log(`开始下载${item.treeCode}`);

    const res = await service({
      url: `/app/issue_achievement_data/find/multimedia/by/${item.id}`,
      method: 'GET',
    });

    const { multimedia } = res.data;
    if (multimedia && multimedia.length) {
      const directory = await ensureCacheDirectory(item.id as number);
      for (let i = 0; i < multimedia.length; i++) {
        const mediaItem = multimedia[i];
        const { notCompressedUrl, path } = mediaItem;
        const downloadRes = await uni.downloadFile({
          url: notCompressedUrl,
        });

        if (downloadRes.statusCode === 200) {
          try {
            const splitArrays = path.split('/');
            const name = splitArrays[splitArrays.length - 1];

            const fileSystemPath = await moveFileToDirectory(downloadRes.tempFilePath, name, directory);
            if (fileSystemPath) {
              mediaItem.url = fileSystemPath;
            }
            console.log(`第${i + 1}条数据下载成功`);
          } catch (error) {
            console.log('移动失败', error);
          }
        } else {
          console.log('下载失败', downloadRes);
        }
      }
      item.multimedia = multimedia;
      addSyncResult(item);
    } else {
      item.multimedia = [];
      addSyncResult(item);
    }
  } else {
    console.log('不存在，跳过');
    item.multimedia = [];
    addSyncResult(item);
  }
};

/**
 * 移动文件
 * @param tempFilePath
 * @param name
 * @param directory
 */
const moveFileToDirectory = (tempFilePath: string, name: string, directory: PlusIoDirectoryEntry) => {
  return new Promise((resolve, reject) => {
    plus.io.resolveLocalFileSystemURL(
      tempFilePath,
      entry => {
        entry.moveTo(directory, name, moveEntry => {
          resolve('file://' + moveEntry.fullPath);
        });
      },
      () => {
        resolve('');
      },
    );
  });
};
</script>

<template>
  <view class="w-full h-full flex flex-col bg-gradient-to-b from-#c4eee6 to-#fff">
    <view
      class="w-full"
      :style="{
        paddingTop: statusBarHeight + 12 + 'px',
      }"
    >
      <view class="flex items-center gap-10px px-10px py-24px">
        <view class="w-auto flex items-center" @click="goBack">
          <uni-icons type="left" size="30" color="#333"></uni-icons>
          <text class="text-#333 text-18px font-bold">数据同步中心</text>
        </view>
      </view>
    </view>

    <view class="w-full flex-1 flex flex-col px-18px gap-20px">
      <!-- 上传数据 -->
      <view
        class="w-full flex flex-col px-12px pb-12px rounded-8px b-(2px solid #fff) shadow-[0_3px_6px_1px_rgba(0,0,0,0.08)] bg-gradient-to-b from-#d4f8ea to-#ebfef8"
      >
        <view class="w-full flex justify-between items-center pt-12px">
          <text class="text-#333 text-17px font-bold">上传本地数据</text>
          <text class="text-#333 text-17px font-bold">{{ syncPendingAndErrorList.length + germplasmPendingList.length }} / 0</text>
        </view>
        <text class="py-12px text-#516280 text-14px">将本地数据同步到系统服务器</text>
        <view class="text-#516280 flex items-center gap-5px pb-12px">
          <uni-icons type="loop" size="16" color="#08bd92"></uni-icons>
          <text class="text-12px">{{ syncUploadTime }}</text>
        </view>
        <!-- 选择上传数据按钮 - 只要有待上传数据就显示 -->
        <button
          v-if="syncPendingList.length > 0 || germplasmPendingList.length > 0"
          :disabled="isUploading"
          class="w-full h-44px fc text-#fff bgPrimary mb-8px"
          :loading="isUploading"
          @click="showUploadListModal"
        >
          选择上传数据
        </button>

        <!-- 上传失败按钮 - 有失败数据时显示 -->
        <view v-if="hasFailedData" class="w-full flex flex-col">
          <view class="text-14px text-#225ed5 decoration-underline text-#ff6a6a fc pt-15px" @click="openFailedPopup"> 查看失败数据 </view>
        </view>

        <!-- 无数据状态 - 既没有待上传数据也没有失败数据时显示 -->
        <button
          v-if="!syncPendingList.length && !germplasmPendingList.length && !hasFailedData"
          class="w-full h-44px fc text-#fff bgPrimary mb-8px"
          @click="openTest"
        >
          暂无待上传数据
        </button>
      </view>

      <!-- 下载数据 -->
      <view
        class="w-full flex flex-col px-12px pb-12px rounded-8px b-(2px solid #fff) shadow-[0_3px_6px_1px_rgba(0,0,0,0.08)] bg-gradient-to-b from-#d4f8ea to-#ebfef8"
      >
        <view class="w-full flex justify-between items-center pt-12px">
          <text class="text-#333 text-17px font-bold">同步系统数据</text>
          <view class="items-center">
            <!-- <uni-data-checkbox multiple v-model="isDownloadMedia" :localdata="[{ text: '视频、图片', value: 1 }]" /> -->
          </view>
        </view>
        <text class="py-12px text-#516280 text-14px">同步最新数据到本地</text>
        <text class="pb-12px text-#516280 text-14px">注：为保证数据精确，请先上传本地数据</text>
        <view class="text-#516280 flex items-center gap-5px pb-12px">
          <uni-icons type="loop" size="16" color="#225ed5"></uni-icons>
          <text class="text-12px">{{ syncDownloadTime }}</text>
        </view>
        <button class="w-full h-44px fc text-#fff bg-#225ed5" @click="handleDownloadData" :loading="isDownloading" :disabled="!!syncPendingAndErrorList.length">
          开始同步
        </button>
      </view>

      <view
        class="w-full flex flex-col px-12px pb-12px rounded-8px b-(2px solid #fff) shadow-[0_3px_6px_1px_rgba(0,0,0,0.08)] bg-gradient-to-b from-#d4f8ea to-#ebfef8"
      >
        <view class="w-full flex justify-between items-center pt-12px">
          <text class="text-#333 text-17px font-bold">同步成果数据包</text>
          <view class="items-center" v-if="syncResultFileInfo && syncResultFileInfo.number"
            >{{ syncResultList.length }} / {{ syncResultFileInfo?.number }}</view
          >
        </view>
        <view class="py-12px text-#516280 text-14px flex justify-between items-center">
          <text>下载成果数据到本地</text>
          <view class="items-center" v-if="syncResultFileInfo && syncResultFileInfo.size">数据大小：{{ formatFileSize(syncResultFileInfo.size) }}</view>
        </view>
        <text class="pb-12px text-#516280 text-14px">注：下载成果数据到本地，包含同步照片或视频，将覆盖原有数据</text>
        <view class="text-#516280 flex items-center gap-5px pb-12px">
          <uni-icons type="loop" size="16" color="green"></uni-icons>
          <text class="text-12px">{{ syncResultDownloadTime }}</text>
        </view>
        <button
          :loading="checkSizeLoading || mediaDownloading"
          class="w-full h-44px fc text-#fff bg-green-500"
          @click="handleDownloadMediaData"
          :disabled="checkSizeLoading || mediaDownloading"
        >
          {{ mediaDownloading ? '正在下载' : '开始下载' }}
        </button>
      </view>

      <!-- 同步历史 -->
      <view class="w-full flex items-center gap-10px px-20px rounded-8px bg-#fff h-50px shadow-[rgba(0_3px_6px_1px_rgba(0,0,0,0.08))]" @click="goSyncHistory">
        <image src="@/static/images/icons/sync_icon.png" class="w-18px h-18px" mode="widthFix"></image>
        <text class="text-#333">同步历史</text>
        <uni-icons class="ml-auto" type="right" size="16" color="#333"></uni-icons>
      </view>
    </view>

    <!-- 统一失败数据弹窗 -->
    <UnifiedFailedPopup
      v-model:visible="showUnifiedFailedPopup"
      :default-tab="failedPopupDefaultTab"
      @handle-single-delete="handleSingleDelete"
      @handle-batch-cover="handleBatchCover"
      @handle-batch-delete="handleBatchDelete"
      @handle-germplasm-edit="handleGermplasmEdit"
      @handle-germplasm-single-delete="handleGermplasmSingleDelete"
      @handle-germplasm-batch-delete="handleGermplasmBatchDelete"
    />

    <!-- 上传数据选择弹窗 -->
    <uni-popup ref="uploadListPopup" type="share" background-color="#fff" @change="onUploadListPopupChange">
      <view class="w-full h-70vh overflow-hidden flex flex-col">
        <!-- 标题栏 -->
        <view class="w-full px-15px py-12px border-b border-#eee flex items-center justify-between">
          <text class="text-18px font-bold text-#333">选择上传数据</text>
          <view class="flex items-center gap-10px">
            <text class="text-14px text-#666">{{ selectedSyncIds.size }}/{{ currentTabList.length }}</text>
            <view class="w-70px fc py-6px text-12px rounded-4px border bgPrimary text-#fff" @click="toggleSelectAll">
              {{ isAllSelected ? '取消全选' : '全选' }}
            </view>
          </view>
        </view>

        <!-- Tab切换 -->
        <view class="w-full px-15px py-8px border-b border-#eee flex items-center gap-20px">
          <view
            class="px-12px py-6px rounded-4px text-14px font-medium cursor-pointer"
            :class="activeTab === 'survey' ? 'bg-#08bd92 text-#fff' : 'text-#666'"
            @click="switchTab('survey')"
          >
            调查 ({{ syncPendingList.length }})
          </view>
          <view
            class="px-12px py-6px rounded-4px text-14px font-medium cursor-pointer"
            :class="activeTab === 'germplasm' ? 'bg-#08bd92 text-#fff' : 'text-#666'"
            @click="switchTab('germplasm')"
          >
            种质资源 ({{ germplasmPendingList.length }})
          </view>
        </view>

        <!-- 待上传数据列表 -->
        <view class="flex-1 overflow-hidden">
          <scroll-view :scroll-y="true" class="h-full px-15px">
            <!-- 调查数据列表 -->
            <template v-if="activeTab === 'survey'">
              <view v-for="item in syncPendingList" :key="item.id" class="py-12px border-b border-b-solid border-b-#eee">
                <view class="flex items-center gap-12px" @click="toggleSelectItem(item.id)">
                  <!-- 选择框 -->
                  <view
                    class="w-20px h-20px rounded-4px border-2 flex items-center justify-center"
                    :class="selectedSyncIds.has(item.id) ? 'border-#08bd92 bg-#08bd92' : 'border-#ccc bg-#f5f5f5'"
                  >
                    <uni-icons v-if="selectedSyncIds.has(item.id)" type="checkmarkempty" size="14" color="#fff" />
                  </view>

                  <!-- 数据信息 -->
                  <view class="flex-1">
                    <text class="text-16px font-bold text-#333">
                      {{ item.data.treeCode || '无编号' }}
                    </text>
                    <view class="text-12px text-#666 mt-2px"> 树种名称：{{ item.data.treeSpecies || '未知树种' }} </view>
                    <view class="text-12px text-#666 mt-2px" v-if="item.data.codeNumber"> 挂牌编号：{{ item.data.codeNumber }} </view>
                  </view>
                </view>
              </view>
            </template>

            <!-- 种质资源数据列表 -->
            <template v-else>
              <view v-for="item in germplasmPendingList" :key="item.tempId" class="py-12px border-b border-b-solid border-b-#eee">
                <view class="flex items-center gap-12px" @click="toggleSelectItem(item.tempId!)">
                  <!-- 选择框 -->
                  <view
                    class="w-20px h-20px rounded-4px border-2 flex items-center justify-center"
                    :class="selectedSyncIds.has(item.tempId!) ? 'border-#08bd92 bg-#08bd92' : 'border-#ccc bg-#f5f5f5'"
                  >
                    <uni-icons v-if="selectedSyncIds.has(item.tempId!)" type="checkmarkempty" size="14" color="#fff" />
                  </view>

                  <!-- 数据信息 -->
                  <view class="flex-1">
                    <text class="text-16px font-bold text-#333">
                      {{ item.codeNumber || '无编号' }}
                    </text>
                    <view class="text-12px text-#666 mt-2px"> 采集时间：{{ item.collectTime || '未知时间' }} </view>
                    <view class="text-12px text-#666 mt-2px" v-if="item.collectTeam"> 采集团队：{{ item.collectTeam }} </view>
                    <view class="text-12px text-#666 mt-2px" v-if="item.details"> 种质资源数量：{{ item.details.length }} 条 </view>
                  </view>
                </view>
              </view>
            </template>

            <!-- 空状态 -->
            <view v-if="currentTabList.length === 0" class="py-40px text-center text-#999"> 暂无待上传数据 </view>
          </scroll-view>
        </view>

        <!-- 底部按钮 -->
        <view class="w-full px-15px py-12px bg-white border-t border-#eee flex items-center gap-12px">
          <button class="flex-1 h-44px text-#666 bg-#f5f5f5 text-16px rounded-5px fc font-bold" @click="closeUploadListModal">取消</button>
          <button class="flex-1 h-44px text-#fff bgPrimary text-16px rounded-5px fc font-bold" :disabled="!hasSelected" @click="handleUploadData">
            开始上传 ({{ selectedSyncIds.size }})
          </button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>
<style>
uni-button[disabled] {
  background-color: #abb6ce !important;
  color: #fff !important;
}
</style>
