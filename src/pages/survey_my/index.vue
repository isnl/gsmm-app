<script lang="ts" setup>
import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { goBack } from '@/utils';
import { useSyncSurveyStore } from '@/stores/sync_survey';
import { type Survey } from '@/stores/survey_list';
import TreeDetailPopup from '../survey/components/TreeDetailPopup.vue';
import { storeToRefs } from 'pinia';

const syncSurveyStore = useSyncSurveyStore();
const { removeSyncItem } = syncSurveyStore;
const { syncPendingAndErrorList } = storeToRefs(syncSurveyStore);
const { statusBarHeight } = useStatusBarHeight();

const reverseSyncList = computed(() => {
  return syncPendingAndErrorList.value.sort((a, b) => b.createdAt! - a.createdAt!);
});

// tmep
const showTreeDetailPopup = ref(false); // 添加树木详情弹窗控制变量
const selectedTreeItem = ref<Survey | null>(null); // 当前选中的树木详情
const syncItem = ref<any>(null);

const handleItemClick = (item: any) => {
  syncItem.value = item;
  selectedTreeItem.value = item.data;
  showTreeDetailPopup.value = true;
};
const handleDeleteSyncItem = () => {
  uni.showModal({
    title: '提示',
    content: '确定删除这条同步记录吗？',
    success: res => {
      if (res.confirm) {
        showTreeDetailPopup.value = false;
        removeSyncItem(syncItem.value.id);
        syncItem.value = null;
        uni.showToast({
          title: '删除成功',
          icon: 'success',
        });
      }
    },
  });
};

const getStatusClass = (item: any) => {
  switch (item.status) {
    case 'pending':
      return '!bg-#999';
    case 'success':
      return '!bg-#00bf9f';
    case 'error':
      return '!bg-#ff6a6a';
    default:
      break;
  }
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
          <text class="text-#fff text-18px font-bold">我的调查</text>
        </view>
      </view>
    </view>

    <view class="w-full flex-1 flex flex-col px-18px bg-#f9f9fb rounded-t-24px overflow-hidden pt-20px">
      <view class="w-full bg-[rgba(34,94,213,0.28)] rounded-4px b-(1px solid #225ed5) text-#225ed5 p-5px text-14px">
        注：我的调查只展示待同步与同步失败的数据，可对未同步数据进行编辑与删除
      </view>
      <!-- 列表区域 -->
      <view class="flex-1 overflow-hidden rounded-t-24px pb-20px">
        <scroll-view v-if="reverseSyncList.length" :scroll-y="true" class="h-full pt-20px">
          <view
            v-for="item in reverseSyncList"
            :key="item.id"
            class="bg-#fff rounded-10px mt-12px first-mt-0 px-16px shadow-[0_5px_12px_1px_rgba(18,62,55,0.06)]"
            @click="handleItemClick(item)"
          >
            <!-- 标题和状态 -->
            <view class="flex items-center relative">
              <view class="flex-1 pt-16px">
                <text class="text-16px pr-80px font-medium text-#333 mb-4px block">{{ item.data.treeCode + item.data.treeSpecies }}</text>
              </view>
              <view class="fc w-80px h-25px absolute top-0 -right-16px rounded-rt-10px rounded-lb-25px text-12px text-#fff" :class="getStatusClass(item)">
                {{ item.status === 'error' ? '同步失败' : '待同步' }}
              </view>
            </view>

            <!-- 行政区和时间 -->
            <view class="flex h-47px items-center justify-between b-t-(1px solid #eee)">
              <view class="gap-8px h-full flex items-center">
                <!-- <image
                  src="/static/images/icons/latlng.png"
                  class="w-16px h-16px"
                /> -->
                <text class="text-12px text-#666">{{ item.data.areaName }}</text>
              </view>
              <text v-if="item.createdAt" class="text-12px text-#999">{{ dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</text>
            </view>
          </view>
        </scroll-view>

        <view v-else class="w-full min-h-400px fc mt-20px rounded-8px text-#555 text-14px b-(1px dashed #ccc)">暂无数据</view>
      </view>
    </view>
  </view>

  <!-- 树木详情弹窗 -->
  <TreeDetailPopup
    :noToggleTabbar="true"
    :mySurvey="true"
    v-model:visible="showTreeDetailPopup"
    :tree-item="selectedTreeItem"
    @handleDeleteSyncItem="handleDeleteSyncItem"
  />
</template>
