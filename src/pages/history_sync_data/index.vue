<script lang="ts" setup>
import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { goBack } from '@/utils';
import { useSyncSurveyStore } from '@/stores/sync_survey';
import { useSurveyEditStore } from '@/stores/survey_edit';
import { storeToRefs } from 'pinia';

const syncSurveyStore = useSyncSurveyStore();
const { removeSyncItem, resetSyncItemStatus } = syncSurveyStore;
const { syncSuccessList } = storeToRefs(syncSurveyStore);
const { statusBarHeight } = useStatusBarHeight();
const { setCurrentEditData } = useSurveyEditStore();

// 选择相关状态
const selectedItems = ref<Set<string>>(new Set());
const isSelectMode = ref(false);

// 全选状态
const isAllSelected = computed(() => {
  return syncSuccessList.value.length > 0 && selectedItems.value.size === syncSuccessList.value.length;
});

// 切换选择模式
const toggleSelectMode = () => {
  isSelectMode.value = !isSelectMode.value;
  if (!isSelectMode.value) {
    selectedItems.value.clear();
  }
};

// 切换单个项目选择
const toggleItemSelection = (itemId: string) => {
  if (selectedItems.value.has(itemId)) {
    selectedItems.value.delete(itemId);
  } else {
    selectedItems.value.add(itemId);
  }
};

// 全选/取消全选
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value.clear();
  } else {
    selectedItems.value.clear();
    syncSuccessList.value.forEach(item => {
      selectedItems.value.add(item.id);
    });
  }
};

// 批量删除
const handleBatchDelete = () => {
  if (selectedItems.value.size === 0) {
    uni.showToast({
      title: '请先选择要删除的数据',
      icon: 'none',
    });
    return;
  }

  uni.showModal({
    title: '确认批量删除',
    content: `确定要永久删除选中的 ${selectedItems.value.size} 条数据吗？删除后无法恢复。`,
    success: res => {
      if (res.confirm) {
        // 批量删除选中的项目
        Array.from(selectedItems.value).forEach(itemId => {
          removeSyncItem(itemId);
        });

        // 清空选择状态
        selectedItems.value.clear();
        isSelectMode.value = false;

        uni.showToast({
          title: '批量删除成功',
          icon: 'success',
        });
      }
    },
  });
};

// 重置状态
const handleResetStatus = (item: any) => {
  uni.showModal({
    title: '确认重置',
    content: '确定要将此数据的状态重置为待同步吗？',
    success: res => {
      if (res.confirm) {
        resetSyncItemStatus(item.id);
        uni.showToast({
          title: '重置成功',
          icon: 'success',
        });
      }
    },
  });
};

// 再次编辑
const handleEdit = (item: any) => {
  setCurrentEditData(item.data);
  uni.navigateTo({
    url: '/pages/survey_create/index',
  });
};

// 永久删除
const handleDelete = (item: any) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要永久删除这条数据吗？删除后无法恢复。',
    success: res => {
      if (res.confirm) {
        removeSyncItem(item.id);
        uni.showToast({
          title: '删除成功',
          icon: 'success',
        });
      }
    },
  });
};

// 格式化时间
const formatTime = (timestamp: number) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
};
</script>

<template>
  <view class="w-full h-full flex flex-col bg-gradient-to-b from-#08bd92 to-#07a47f">
    <!-- 自定义状态栏 -->
    <view
      class="w-full"
      :style="{
        paddingTop: statusBarHeight + 12 + 'px',
      }"
    >
      <view class="flex items-center justify-between px-10px py-24px">
        <view class="flex items-center" @click="goBack">
          <uni-icons type="left" size="30" color="#fff"></uni-icons>
          <text class="text-#fff text-18px font-bold">历史同步数据</text>
        </view>
        <view v-if="syncSuccessList.length > 0" class="flex items-center gap-8px">
          <text class="text-#fff text-14px px-12px py-6px rounded-4px bg-[rgba(255,255,255,0.2)]" @click="toggleSelectMode">
            {{ isSelectMode ? '取消选择' : '选择' }}
          </text>
        </view>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="w-full flex-1 flex flex-col px-18px bg-#f9f9fb rounded-t-24px overflow-hidden pt-20px">
      <!-- 提示信息 -->
      <view class="w-full bg-[rgba(34,94,213,0.28)] rounded-4px b-(1px solid #225ed5) text-#225ed5 p-5px text-14px mb-20px">
        注：这里展示已成功同步的历史数据，可以重置状态、再次编辑或永久删除
      </view>

      <!-- 选择模式下的操作栏 -->
      <view v-if="isSelectMode && syncSuccessList.length > 0" class="w-full flex items-center justify-between mb-16px p-12px bg-#fff rounded-8px shadow-sm">
        <view class="flex items-center gap-12px">
          <text class="text-14px px-12px py-6px rounded-4px border border-#08bd92 text-#08bd92" @click="toggleSelectAll">
            {{ isAllSelected ? '取消全选' : '全选' }}
          </text>
          <text class="text-12px text-#666">已选择 {{ selectedItems.size }} 项</text>
        </view>
        <view v-if="selectedItems.size > 0" class="text-14px px-12px py-6px rounded-4px bg-#ff6a6a text-#fff" @click="handleBatchDelete"> 批量删除 </view>
      </view>

      <!-- 数据列表 -->
      <view class="flex-1 overflow-hidden">
        <scroll-view v-if="syncSuccessList.length" :scroll-y="true" class="h-full">
          <view
            v-for="item in syncSuccessList"
            :key="item.id"
            class="bg-#fff rounded-10px mb-12px shadow-[0_5px_12px_1px_rgba(18,62,55,0.06)] relative"
            :class="{ 'border-2 border-#08bd92': isSelectMode && selectedItems.has(item.id) }"
          >
            <!-- 选择框 -->
            <view
              v-if="isSelectMode"
              class="absolute top-12px left-12px w-20px h-20px rounded-4px border-2 border-#ddd flex items-center justify-center z-10"
              :class="{ 'bg-#08bd92 border-#08bd92': selectedItems.has(item.id) }"
              @click="toggleItemSelection(item.id)"
            >
              <uni-icons v-if="selectedItems.has(item.id)" type="checkmarkempty" size="14" color="#fff"></uni-icons>
            </view>

            <!-- 内容区域 -->
            <view class="px-16px py-16px" :class="{ 'pl-44px': isSelectMode }" @click="isSelectMode ? toggleItemSelection(item.id) : undefined">
              <!-- 数据信息 -->
              <view class="flex items-center justify-between mb-12px">
                <view class="flex-1">
                  <text class="text-16px font-medium text-#333 mb-4px block">
                    {{ item.data.treeCode || '无编号' }} - {{ item.data.treeSpecies || '未知树种' }}
                  </text>
                  <text class="text-12px text-#666"> 同步时间：{{ formatTime(item.createdAt!) }} </text>
                </view>
                <view class="fc w-60px h-25px rounded-4px text-12px text-#fff bg-#00bf9f"> 已同步 </view>
              </view>

              <!-- 操作按钮 -->
              <view v-if="!isSelectMode" class="flex items-center gap-12px pt-12px border-t border-#eee">
                <view class="flex-1 fc h-36px rounded-6px bg-#f5f5f5 text-#666 text-14px" @click="handleResetStatus(item)"> 重置状态 </view>
                <view class="flex-1 fc h-36px rounded-6px bg-#08bd92 text-#fff text-14px" @click="handleEdit(item)"> 再次编辑 </view>
                <view class="flex-1 fc h-36px rounded-6px bg-#ff6a6a text-#fff text-14px" @click="handleDelete(item)"> 永久删除 </view>
              </view>
            </view>
          </view>
        </scroll-view>

        <!-- 空状态 -->
        <view v-else class="flex-1 fc">
          <text class="text-#999 text-16px">暂无历史同步数据</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.fc {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
