<script lang="ts" setup>
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { goBack } from '@/utils';
import { useSyncHistoryStore } from '@/stores/sync_history';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';
import { computed } from 'vue';

const { statusBarHeight } = useStatusBarHeight();
const syncHistoryStore = useSyncHistoryStore();
const { syncHistory } = storeToRefs(syncHistoryStore);

// sortByCreatedAt

const syncHistorySorted = computed(() => {
  return syncHistory.value.sort((a, b) => b.createdAt - a.createdAt);
});

// 获取上传类型文本
const getUploadTypeText = (uploadType?: string) => {
  if (!uploadType) return '';
  return uploadType === 'ANCIENT_TREE' ? '古树调查' : '种质资源调查';
};
</script>

<template>
  <view class="w-full h-full flex flex-col bg-gradient-to-b from-#08bd92 to-#07a47f">
    <!-- 顶部统计区域 -->
    <view
      class="w-full"
      :style="{
        paddingTop: statusBarHeight + 12 + 'px',
      }"
    >
      <view class="flex items-center gap-10px px-10px py-24px">
        <view class="w-auto flex items-center" @click="goBack">
          <uni-icons type="left" size="30" color="#fff"></uni-icons>
          <text class="text-#fff text-18px font-bold">同步历史</text>
        </view>
      </view>
    </view>
    <view class="flex-1 overflow-hidden bg-#f5f5f5">
      <scroll-view class="h-full" scroll-y v-if="syncHistorySorted.length">
        <view class="px-16px py-12px">
          <view class="bg-#fff rounded-12px px-16px py-14px mb-12px shadow-[0_2px_8px_rgba(0,0,0,0.06)]" v-for="item in syncHistorySorted" :key="item.id">
            <!-- 第一行：时间和状态图标 -->
            <view class="flex items-center justify-between mb-8px">
              <text class="text-14px text-#333 font-medium">
                {{ dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss') }}
              </text>
              <uni-icons type="checkmarkempty" size="22" color="#08bd92" v-if="item.success" />
              <uni-icons type="closeempty" size="22" color="#ff4e4e" v-else />
            </view>

            <!-- 第二行：类型和上传类型 -->
            <view class="flex items-center gap-8px">
              <!-- 同步类型标签 -->
              <view class="px-10px py-4px rounded-6px text-12px" :class="item.type === 'UPLOAD' ? 'bg-#e6f7f4 text-#08bd92' : 'bg-#e8f0ff text-#225ed5'">
                {{ item.type === 'UPLOAD' ? '上传' : '同步' }}
              </view>

              <!-- 上传类型标签（仅在有 uploadType 时显示） -->
              <view v-if="item.uploadType" class="px-10px py-4px rounded-6px text-12px bg-#fff3e6 text-#ff8c00">
                {{ getUploadTypeText(item.uploadType) }}
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
      <view class="w-full px-20px" v-else>
        <view class="w-full min-h-400px fc mt-20px rounded-8px text-#555 text-14px b-(1px dashed #ccc)"> 暂无同步数据 </view>
      </view>
    </view>
  </view>
</template>
