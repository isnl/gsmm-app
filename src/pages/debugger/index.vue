<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSyncSurveyStore } from '@/stores/sync_survey';
import { useSurveyListStore } from '@/stores/survey_list';
import { LogCat } from '@/utils/logger';
import { useGlobalStore } from '@/stores/global';
import { storeToRefs } from 'pinia';

const syncSurveyStore = useSyncSurveyStore();
const surveyListStore = useSurveyListStore();
const globalStore = useGlobalStore();

const { randomFillStatus } = storeToRefs(globalStore);
const { setRandomFillStatus } = globalStore;

// 日志记录功能
const logs = ref<string[]>([]);
const showLogs = ref(false);
const logFilePath = ref('');

// 获取日志文件路径
const getLogFilePath = () => {
  // #ifdef APP-PLUS
  if (LogCat.isInitialized && LogCat.LogPath) {
    // 使用LogCat的日志路径，显示当天的日志文件
    const today = LogCat.getFormatDate(new Date());
    return `${LogCat.LogPath}/log_YYYY-MM-DD.txt`;
  }
  // 兜底方案
  // @ts-ignore
  const docPath = plus.io.convertLocalFileSystemURL('_doc/');
  return docPath + 'sync_debug.log';
  // #endif

  // #ifdef H5
  return 'localStorage: sync_debug_logs';
  // #endif

  return '';
};

// 页面加载时初始化
onMounted(() => {
  logFilePath.value = getLogFilePath();
});

const handleClearSyncList = () => {
  uni.showModal({
    title: '提示',
    content: '确认清空同步列表吗？',
    success: res => {
      if (res.confirm) {
        syncSurveyStore.clearSyncList();
        uni.showToast({
          title: '清空同步列表成功',
          icon: 'success',
        });
      }
    },
  });
};

const handleClearSurveyData = () => {
  uni.showModal({
    title: '提示',
    content: '确认清除调查数据吗？',
    success: res => {
      if (res.confirm) {
        surveyListStore.setSurveyList([]);
        uni.showToast({
          title: '清除调查数据成功',
          icon: 'success',
        });
      }
    },
  });
};

const handleClearAllData = () => {
  uni.showModal({
    title: '提示',
    content: '确认清除全部数据吗？',
    success: res => {
      if (res.confirm) {
        surveyListStore.setSurveyList([]);
        syncSurveyStore.clearSyncList();
        uni.showToast({
          title: '清除全部数据成功',
          icon: 'success',
        });
      }
    },
  });
};

const previewSurveyList = () => {
  uni.navigateTo({
    url: '/pages/static_survey/index',
  });
};

const goHistorySyncData = () => {
  uni.navigateTo({
    url: '/pages/history_sync_data/index',
  });
};

// 清空日志
const clearLogs = () => {
  uni.showModal({
    title: '提示',
    content: '确认清空所有日志文件吗？此操作不可恢复。',
    success: res => {
      if (res.confirm) {
        logs.value = [];

        // #ifdef APP-PLUS
        if (LogCat.isInitialized && LogCat.LogPath && LogCat.File) {
          try {
            // 使用LogCat的Android原生API清空日志文件
            const fileManager = new LogCat.File(LogCat.LogPath);
            const files = fileManager.listFiles();
            let deletedCount = 0;

            if (files) {
              // 删除所有log_开头的日志文件
              for (let i = 0; i < files.length; i++) {
                const fileName = files[i].getName();
                if (fileName.startsWith('log_') && fileName.endsWith('.txt')) {
                  files[i].delete();
                  deletedCount++;
                }
              }
            }

            LogCat.info('手动清空日志文件', { deletedCount });
            uni.showToast({
              title: `已清空${deletedCount}个日志文件`,
              icon: 'success',
            });
          } catch (error) {
            console.error('清空日志文件失败:', error);
            LogCat.error('清空日志文件失败', { error: String(error) });
            uni.showToast({
              title: '清空失败',
              icon: 'none',
            });
          }
        } else {
          // 兜底方案：使用原来的方法
          // @ts-ignore
          plus.io.requestFileSystem(
            plus.io.PRIVATE_DOC,
            (fs: any) => {
              if (fs && fs.root) {
                fs.root.getFile(
                  'sync_debug.log',
                  { create: false },
                  (fileEntry: any) => {
                    fileEntry.remove(
                      () => {
                        uni.showToast({
                          title: '日志已清空',
                          icon: 'success',
                        });
                      },
                      (err: any) => {
                        console.error('删除文件失败:', err);
                        uni.showToast({
                          title: '清空失败',
                          icon: 'none',
                        });
                      },
                    );
                  },
                  (err: any) => {
                    console.error('获取文件失败:', err);
                    uni.showToast({
                      title: '日志文件不存在',
                      icon: 'none',
                    });
                  },
                );
              }
            },
            (err: any) => {
              console.error('请求文件系统失败:', err);
              uni.showToast({
                title: '清空失败',
                icon: 'none',
              });
            },
          );
        }
        // #endif

        // #ifdef H5
        localStorage.removeItem('sync_debug_logs');
        uni.showToast({
          title: '日志已清空',
          icon: 'success',
        });
        // #endif
      }
    },
  });
};

const onToggleRandomFill = () => {
  setRandomFillStatus(!randomFillStatus.value);
};
</script>

<template>
  <view class="p-4 bg-gray-50 min-h-screen">
    <!-- 数据管理卡片组 -->
    <view class="mb-6">
      <view class="mb-3">
        <text class="text-lg font-semibold text-gray-700">数据管理</text>
      </view>
      <view class="grid grid-cols-2 gap-3">
        <view class="bg-white rounded-lg p-4 shadow-sm border border-gray-100 active:bg-gray-50" @click="goHistorySyncData">
          <view class="text-2xl mb-2">📊</view>
          <view class="text-sm font-medium text-gray-800 mb-1">查看历史同步数据</view>
          <view class="text-xs text-gray-500">查看已成功同步的数据</view>
        </view>

        <view class="bg-white rounded-lg p-4 shadow-sm border border-gray-100 active:bg-gray-50" @click="handleClearSyncList">
          <view class="text-2xl mb-2">🔄</view>
          <view class="text-sm font-medium text-gray-800 mb-1">清空同步列表</view>
          <view class="text-xs text-gray-500">清除所有待同步数据</view>
        </view>

        <view class="bg-white rounded-lg p-4 shadow-sm border border-gray-100 active:bg-gray-50" @click="handleClearSurveyData">
          <view class="text-2xl mb-2">📋</view>
          <view class="text-sm font-medium text-gray-800 mb-1">清除调查数据</view>
          <view class="text-xs text-gray-500">清除本地调查数据</view>
        </view>

        <view class="bg-white rounded-lg p-4 shadow-sm border border-gray-100 active:bg-gray-50" @click="handleClearAllData">
          <view class="text-2xl mb-2">🗑️</view>
          <view class="text-sm font-medium text-gray-800 mb-1">清除全部数据</view>
          <view class="text-xs text-gray-500">清除所有本地数据</view>
        </view>

        <view class="bg-white rounded-lg p-4 shadow-sm border border-gray-100 active:bg-gray-50" @click="previewSurveyList">
          <view class="text-2xl mb-2">👁️</view>
          <view class="text-sm font-medium text-gray-800 mb-1">查看调查数据</view>
          <view class="text-xs text-gray-500">预览调查因子列表</view>
        </view>
      </view>
    </view>

    <!-- 日志管理卡片组 -->
    <view class="mb-6">
      <view class="mb-3">
        <text class="text-lg font-semibold text-gray-700">日志管理</text>
      </view>

      <!-- 日志文件路径信息 -->
      <view class="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
        <view class="flex items-center mb-2">
          <view class="text-lg mr-2">📍</view>
          <text class="text-sm font-medium text-blue-800">日志文件位置</text>
        </view>
        <text class="text-xs text-blue-600 font-mono break-all">{{ logFilePath }}</text>
        <view class="text-xs text-blue-500 mt-1"> 日志按日期分文件存储（log_YYYY-MM-DD.txt），自动清理14天前的旧日志 </view>
      </view>

      <view class="grid grid-cols-2 gap-3">
        <view class="bg-white rounded-lg p-4 shadow-sm border border-gray-100 active:bg-gray-50" @click="clearLogs">
          <view class="text-2xl mb-2">🧹</view>
          <view class="text-sm font-medium text-gray-800 mb-1">清空日志文件</view>
          <view class="text-xs text-gray-500">清除所有日志记录</view>
        </view>
      </view>
    </view>

    <!-- 其他 -->
    <view class="mb-6">
      <view class="mb-3">
        <text class="text-lg font-semibold text-gray-700">其他</text>
      </view>
      <view class="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <view class="flex items-center mb-4">
          <view class="text-2xl mr-3">🌐</view>
          <view class="text-base font-medium text-gray-800">其他配置</view>
        </view>

        <view class="flex gap-3">
          <button class="flex-1 bgPrimary text-white py-3 px-4 rounded-lg text-sm font-medium" @click="onToggleRandomFill">
            {{ randomFillStatus ? '关闭' : '开启' }}随机填充数据(快速测试)
          </button>
        </view>
      </view>
    </view>

    <!-- 日志显示弹窗 -->
    <uni-popup ref="logPopup" v-model:show="showLogs" type="center">
      <view class="w-80vw max-w-600px h-70vh bg-white rounded-lg flex flex-col">
        <view class="flex justify-between items-center p-4 border-b border-gray-200">
          <text class="text-lg font-bold text-gray-800">同步日志</text>
          <button class="w-12 h-12 bg-gray-100 border-none rounded-full text-lg text-gray-600 fc" @click="showLogs = false">×</button>
        </view>
        <scroll-view class="flex-1 p-4 text-xs leading-relaxed" scroll-y>
          <view v-for="(log, index) in logs" :key="index" class="mb-2 p-2 bg-gray-50 rounded word-break-all font-mono">
            {{ log }}
          </view>
          <view v-if="!logs.length" class="text-center text-gray-500 py-10">暂无日志</view>
        </scroll-view>
        <view class="flex p-4 border-t border-gray-200">
          <button class="flex-1 py-3 rounded-lg text-sm text-center border-none bg-red-500 text-white" @click="clearLogs">清空日志</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>
