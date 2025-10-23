<template>
  <view class="w-full flex flex-col gap-10px px-10px pb-10px bg-#fff">
    <text v-if="!loading" class="pt-10px text-16px font-bold">{{ title }}</text>
    <view
      v-else
      class="pt-10px h-16px w-3/4 bg-gray-200 rounded animate-pulse"
    ></view>

    <view v-if="!loading" class="flex items-center">
      <uni-icons type="arrow-up" size="18" color="#225ed5" />
      <span class="ml-0.8 text-[rgba(51,51,51,0.8)]">{{ subTitle }}</span>
    </view>
    <view v-else class="h-18px w-1/2 bg-gray-200 rounded animate-pulse"></view>
  </view>
</template>
<script lang="ts" setup>
const props = defineProps<{
  title?: string;
  subTitle?: string;
  loading?: boolean;
}>();
</script>
