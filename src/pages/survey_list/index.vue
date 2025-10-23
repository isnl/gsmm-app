<script lang="ts" setup>
import { ref } from 'vue';
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { useSurveyListStore } from '@/stores/survey_list';
import { goBack } from '@/utils';
import { storeToRefs } from 'pinia';
import investigate from '@/components/investigate.vue';
import { onLoad } from '@dcloudio/uni-app';

const surveyListStore = useSurveyListStore();
const { pannelInfo } = storeToRefs(surveyListStore);
const { statusBarHeight } = useStatusBarHeight();
const initStatus = ref('');
onLoad((options: any) => {
  const { status } = options;
  if (status) {
    initStatus.value = status;
  }
});
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
          <text class="text-#fff text-18px font-bold">调查列表</text>
        </view>
      </view>

      <view class="flex items-center text-#fff p-10px">
        <view class="flex flex-1 justify-center items-center gap-5px">
          <image src="@/static/images/survey_list/daidiaocha.png" mode="widthFix" class="w-10px"></image>
          <text class="text-14px">待调查</text>
          <text class="text-14px">|</text>
          <text class="text-14px font-medium">{{ pannelInfo.daidiaochaCount }}</text>
        </view>
        <view class="flex flex-1 justify-center items-center gap-5px">
          <image src="@/static/images/survey_list/diaochazhong.png" mode="widthFix" class="w-14px"></image>
          <text class="text-14px">调查中</text>
          <text class="text-14px">|</text>
          <text class="text-14px font-medium">{{ pannelInfo.diaochazhongCount }}</text>
        </view>
        <view class="flex flex-1 justify-center items-center gap-5px">
          <image src="@/static/images/survey_list/yidiaocha.png" mode="widthFix" class="w-14px"></image>
          <text class="text-14px">已调查</text>
          <text class="text-14px">|</text>
          <text class="text-14px font-medium">{{ pannelInfo.yidiaochaCount }}</text>
        </view>
      </view>
    </view>
    <investigate :noToggleTabbar="true" :addinvestigate="true" :initStatus="initStatus" />
  </view>
</template>
