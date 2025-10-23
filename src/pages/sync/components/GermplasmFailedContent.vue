<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useGermplasmLisStore } from '@/stores/germplasm_list';
import { storeToRefs } from 'pinia';

// 定义 emits
const emit = defineEmits<{
  'handle-edit': [item: any];
  'handle-single-delete': [item: any];
  'handle-batch-delete': [];
}>();

const germplasmLisStore = useGermplasmLisStore();
const { germplasmList } = storeToRefs(germplasmLisStore);
const { updateGermplasmById, removeGermplasm } = germplasmLisStore;

const expandedItems = ref<Set<string>>(new Set());

// 获取同步失败的种质资源数据
const failedGermplasmList = computed(() => {
  return germplasmList.value.filter(item => item.status === 'syncError');
});

// 切换展开/收缩状态
const toggleExpand = (itemId: string) => {
  if (expandedItems.value.has(itemId)) {
    expandedItems.value.delete(itemId);
  } else {
    expandedItems.value.add(itemId);
  }
};

// 处理编辑
const handleEdit = (item: any) => {
  emit('handle-edit', item);
};

// 处理单个数据删除
const handleSingleDelete = (item: any) => {
  emit('handle-single-delete', item);
};

// 批量重置状态为 done
const handleBatchReset = () => {
  failedGermplasmList.value.forEach(item => {
    if (item.tempId) {
      updateGermplasmById(item.tempId, {
        status: 'done',
        syncErrorMessage: undefined,
      });
    }
  });
  uni.showToast({
    title: '批量重置成功',
    icon: 'success',
  });
};

// 处理批量删除按钮点击
const handleBatchDelete = () => {
  emit('handle-batch-delete');
};
</script>

<template>
  <view class="h-full flex flex-col">
    <!-- 失败数据列表 -->
    <view class="flex-1 overflow-hidden">
      <scroll-view :scroll-y="true" class="h-full px-15px">
        <view v-for="item in failedGermplasmList" :key="item.tempId" class="py-12px border-b border-#eee">
          <!-- 数据标题行 -->
          <view class="flex flex-col cursor-pointer" @click="toggleExpand(item.tempId || '')">
            <view class="flex items-center justify-between">
              <view class="flex-1">
                <text class="text-16px font-bold text-#333">{{ item.codeNumber || '无编号' }}</text>
              </view>
              <uni-icons :type="expandedItems.has(item.tempId || '') ? 'bottom' : 'right'" size="20" color="#666" />
            </view>
            <view class="text-12px text-red">失败原因：{{ item.syncErrorMessage || '- -' }}</view>
          </view>

          <!-- 详情数据 -->
          <view v-if="expandedItems.has(item.tempId || '')" class="mt-12px">
            <!-- 基本信息 -->
            <view class="w-full p-15px bg-#f8f8f8 rounded-8px">
              <view class="flex flex-col gap-8px">
                <view class="flex gap-20px">
                  <text class="w-80px text-right text-14px text-#516280">挂牌编号</text>
                  <text class="flex-1 text-14px text-#333">{{ item.codeNumber || '无编号' }}</text>
                </view>
                <view v-if="item.collectTime" class="flex gap-20px">
                  <text class="w-80px text-right text-14px text-#516280">采集时间</text>
                  <text class="flex-1 text-14px text-#333">{{ item.collectTime }}</text>
                </view>
                <view v-if="item.collectTeam" class="flex gap-20px">
                  <text class="w-80px text-right text-14px text-#516280">采集团队</text>
                  <text class="flex-1 text-14px text-#333">{{ item.collectTeam }}</text>
                </view>
                <view v-if="item.collectPersonnel" class="flex gap-20px">
                  <text class="w-80px text-right text-14px text-#516280">采集人员</text>
                  <text class="flex-1 text-14px text-#333">{{ item.collectPersonnel }}</text>
                </view>
                <view v-if="item.weather" class="flex gap-20px">
                  <text class="w-80px text-right text-14px text-#516280">天气状况</text>
                  <text class="flex-1 text-14px text-#333">{{ item.weather }}</text>
                </view>
                <view v-if="item.details && item.details.length > 0" class="flex gap-20px">
                  <text class="w-80px text-right text-14px text-#516280">采集详情</text>
                  <text class="flex-1 text-14px text-#333">{{ item.details.length }} 条记录</text>
                </view>
              </view>
            </view>

            <!-- 单个数据操作按钮 -->
            <view class="flex items-center gap-12px mt-12px pt-12px border-t border-#eee">
              <button class="flex-1 h-36px text-#fff bg-#225ed5 text-14px rounded-5px fc" @click="handleEdit(item)">编辑</button>
              <button class="flex-1 h-36px text-#fff bg-#ff6a6a text-14px rounded-5px fc" @click="handleSingleDelete(item)">删除</button>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="failedGermplasmList.length === 0" class="py-40px text-center text-#999"> 暂无失败数据 </view>
      </scroll-view>
    </view>

    <!-- 底部按钮 -->
    <view v-if="failedGermplasmList.length" class="w-full px-15px py-12px bg-white border-t border-#eee">
      <view class="text-12px text-#666 mb-10px">提示： 批量状态重置可将当前所有失败数据重置为采集完成状态 </view>
      <view class="flex items-center gap-12px">
        <button class="flex-1 h-44px text-#fff bgPrimary text-16px rounded-5px fc font-bold" @click="handleBatchReset">批量状态重置</button>
        <button class="flex-1 h-44px text-#fff bg-#ff6a6a text-16px rounded-5px fc font-bold" @click="handleBatchDelete">批量删除</button>
      </view>
    </view>
  </view>
</template>
