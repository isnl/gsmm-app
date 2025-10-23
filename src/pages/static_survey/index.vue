<script setup lang="ts">
import { useSyncSurveyStore } from '@/stores/sync_survey';
import { storeToRefs } from 'pinia';

const syncSurveyStore = useSyncSurveyStore();
const { syncPendingAndErrorList } = storeToRefs(syncSurveyStore);

const onCopy = (data: any) => {
  uni.setClipboardData({
    data: JSON.stringify(data),
    success: function () {
      uni.showToast({
        title: '复制成功',
        icon: 'none',
      });
    },
  });
};
</script>

<template>
  <view class="w-full px-20px h-full">
    <scroll-view scroll-y class="h-full" v-if="syncPendingAndErrorList.length">
      <view class="w-full b-b-(1px solid #ccc) py-20px" v-for="(item, index) in syncPendingAndErrorList" :key="item.id">
        <view class="text-bold w-30px h-30px rounded-full fc text-#fff bg-#00bf9f py-10px">{{ index + 1 }}</view>
        <view class="w-full h-50px py-10px">
          <text class="text-bold bgPrimary text-#fff mr-10px px-5px rounded-sm text-14px">状态：</text>
          <text>{{ item.status }}</text>
        </view>
        <view class="w-full h-50px py-10px">
          <text class="text-bold bgPrimary text-#fff mr-10px px-5px rounded-sm text-14px">url：</text>
          <text class="text-12px">{{ item.url }}</text>
        </view>

        <view class="w-full py-10px flex flex-col gap-10px">
          <text class="text-bold bgPrimary text-#fff mr-10px px-5px rounded-sm text-14px">数据：</text>
          <view class="text-12px break-words">{{ JSON.stringify(item.data) }}</view>

          <view class="w-full flex gap-10px">
            <button class="text-14px bgPrimary text-#fff" @click="onCopy(item.data)">复制参数数据到剪贴板</button>
          </view>
        </view>
      </view>
    </scroll-view>
    <view v-else class="w-full h-500px fc text-#333"> 暂无数据 </view>
  </view>
</template>
