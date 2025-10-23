<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { onLoad } from '@dcloudio/uni-app';
const { statusBarHeight } = useStatusBarHeight();

const menuList = [
  { name: '调查任务', url: '/pages/task/survey_task' },
  { name: '种质资源采集任务', url: '/pages/task/collect_task' },
  { name: '移栽任务', url: '/pages/task/transplant_task' },
  { name: '采伐任务', url: '/pages/task/log_task' },
  { name: '养护任务', url: '/pages/task/maintain_task' },
];

// 列表项点击
const handleItemClick = (item: any) => {
  uni.navigateTo({
    url: item.url,
  });
};
</script>

<template>
  <view class="w-full h-full flex flex-col bg-gradient-to-b from-#08bd92 to-#07a47f">
    <!-- 顶部统计区域 -->
    <view
      class="w-full"
      :style="{
        paddingTop: statusBarHeight + 'px',
      }"
    >
      <view class="flex items-center gap-10px px-10px py-24px pb-10px">
        <view class="w-full fc">
          <text class="text-#fff text-18px font-bold">任务</text>
        </view>
      </view>
    </view>
    <view class="flex-1 p-4 bg-#f9f9fb">
      <!-- 设置选项区域 -->
      <view class="bg-white rounded-lg">
        <uni-list :border="false">
          <uni-list-item :clickable="true" showArrow @click="handleItemClick(item)" v-for="(item, index) in menuList" :key="index">
            <template v-slot:header>
              <view class="w-full flex items-center">
                <view class="flex items-center ml-15px">
                  <text class="text-base text-#333">{{ item.name }}</text>
                </view>
              </view>
            </template>
          </uni-list-item>
        </uni-list>
      </view>
    </view>
  </view>
</template>
