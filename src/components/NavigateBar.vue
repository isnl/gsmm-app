<script lang="ts" setup>
import { ref } from 'vue';
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { goBack } from '@/utils';
const { statusBarHeight } = useStatusBarHeight();

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
});
</script>
<template>
  <view
    class="w-full"
    :style="{
      paddingTop: statusBarHeight + 12 + 'px',
    }"
  >
    <view class="flex items-center gap-10px px-10px py-24px pb-10px">
      <view class="w-auto flex items-center" @click="goBack">
        <uni-icons type="left" size="30" color="#fff"></uni-icons>
        <text class="text-#fff text-18px font-bold">{{ title }}</text>
      </view>
    </view>
  </view>
</template>
