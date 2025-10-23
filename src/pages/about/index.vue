<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { goBack } from '@/utils';
import versionData from '@/stores/version.json';

const { statusBarHeight } = useStatusBarHeight();
const versionInfo = ref<any>(null);

onMounted(async () => {
  try {
    versionInfo.value = versionData;
  } catch (error) {
    console.error('加载版本信息失败:', error);
    // 如果加载失败，使用默认版本信息
    versionInfo.value = {
      version: '2025-08-21 11:00:00',
    };
  }
});
</script>

<template>
  <view class="w-full h-full flex flex-col bg-gradient-to-b from-#08bd92 to-#07a47f">
    <!-- 顶部导航栏 -->
    <view
      class="w-full"
      :style="{
        paddingTop: statusBarHeight + 12 + 'px',
      }"
    >
      <view class="flex items-center gap-10px px-10px py-24px">
        <view class="w-auto flex items-center" @click="goBack">
          <uni-icons type="left" size="30" color="#fff"></uni-icons>
          <text class="text-#fff text-18px font-bold">关于</text>
        </view>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="w-full flex-1 flex flex-col px-18px bg-#f9f9fb rounded-t-24px overflow-hidden pt-20px">
      <!-- 版本信息列表 -->
      <view class="flex-1 overflow-hidden rounded-t-24px pb-20px">
        <view class="bg-#fff rounded-10px mt-12px px-16px shadow-[0_5px_12px_1px_rgba(18,62,55,0.06)]">
          <!-- 版本信息项 -->
          <view class="flex items-center justify-between py-16px">
            <view class="flex items-center">
              <text class="text-16px font-medium text-#333">版本信息</text>
            </view>
            <view class="flex items-center">
              <text class="text-14px text-#666">{{ versionInfo?.version || '加载中...' }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
