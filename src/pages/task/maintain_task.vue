<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { onLoad } from '@dcloudio/uni-app';
import { goBack } from '@/utils';

const { statusBarHeight } = useStatusBarHeight();

onLoad((options: any) => {});
</script>

<template>
  <view class="w-full h-full flex flex-col bg-gradient-to-b from-#08bd92 to-#07a47f">
    <view
      class="w-full"
      :style="{
        paddingTop: statusBarHeight + 12 + 'px',
      }"
    >
      <view class="flex items-center gap-10px px-10px py-24px">
        <view class="w-auto flex items-center" @click="goBack">
          <uni-icons type="left" size="30" color="#fff"></uni-icons>
          <text class="text-#fff text-18px font-bold">养护任务</text>
        </view>
      </view>
    </view>
    <view class="flex-1 p-4 bg-#f9f9fb"> </view>
  </view>
</template>
