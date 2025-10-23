<script lang="ts" setup>
import { ref } from 'vue';
import { useSurveyTokenStore } from '@/stores/token';
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { storeToRefs } from 'pinia';

const { statusBarHeight } = useStatusBarHeight();

const surveyTokenStore = useSurveyTokenStore();
const { clearToken } = surveyTokenStore;
const { accountNumber } = storeToRefs(surveyTokenStore);

// 退出登录确认弹窗引用
const logoutConfirmRef = ref(null);

// 打开退出登录确认弹窗
const openLogoutConfirm = () => {
  if (logoutConfirmRef.value) {
    // @ts-ignore
    logoutConfirmRef.value.open();
  }
};

// 执行退出登录操作
const handleLogout = () => {
  try {
    // 清除存储的用户数据（参考login页面中存储的数据）
    clearToken();

    uni.showToast({
      title: '退出成功',
      icon: 'success',
    });

    uni.reLaunch({
      url: '/pages/login/index',
    });
  } catch (e) {
    console.error('退出登录失败:', e);
    uni.showToast({
      title: '退出失败，请重试',
      icon: 'none',
    });
  } finally {
    // 关闭确认弹窗
    if (logoutConfirmRef.value) {
      // @ts-ignore
      logoutConfirmRef.value.close();
    }
  }
};

const goLogin = () => {
  if (!accountNumber.value) {
    uni.navigateTo({
      url: '/pages/login/index',
    });
  }
};

let debuggerNumberCount = 0;
let debuggerTimer: ReturnType<typeof setTimeout> | null = null;

const goDebugger = () => {
  // 清除之前的定时器
  if (debuggerTimer !== null) {
    clearTimeout(debuggerTimer);
  }

  // 设置新的3秒定时器
  debuggerTimer = setTimeout(() => {
    debuggerNumberCount = 0;
    debuggerTimer = null;
  }, 3000);

  // 累加点击次数
  debuggerNumberCount++;

  // 达到条件时跳转
  if (debuggerNumberCount > 10) {
    debuggerNumberCount = 0;
    if (debuggerTimer !== null) {
      clearTimeout(debuggerTimer);
      debuggerTimer = null;
    }
    uni.navigateTo({
      url: '/pages/debugger/index',
    });
  }
};

const goAbout = () => {
  uni.navigateTo({
    url: '/pages/about/index',
  });
};
</script>

<template>
  <view class="w-full h-full bg-gray-50 flex flex-col">
    <!-- 用户信息区域 -->
    <view
      class="w-full bg-gradient-to-b from-#08bd92 to-#07a47f px-4 pb-30px"
      :style="{
        paddingTop: statusBarHeight + 50 + 'px',
      }"
    >
      <view class="flex items-center" @click="goLogin">
        <image src="@/static/images/icons/user.png" mode="widthFix" class="w-75px"></image>
        <view class="ml-15px">
          <text class="text-lg font-medium text-#fff">
            {{ accountNumber ? accountNumber : '游客' }}
          </text>
          <view class="text-sm text-#eee flex items-center mt-1 gap-5px ml-2px">
            <text v-if="!accountNumber">去登录</text>
            <text v-else>欢迎您</text>
          </view>
        </view>
      </view>
    </view>
    <!-- 功能列表 -->
    <view class="w-93% bg-white mt-20px mx-auto rounded-8px">
      <uni-list :border="false">
        <uni-list-item :clickable="true" showArrow @click="goAbout">
          <template v-slot:header>
            <view class="w-full flex items-center">
              <image src="/static/images/icons/gy.png" mode="widthFix" class="w-26px h-26px"></image>
              <view class="flex items-center ml-15px">
                <text class="text-base text-#333">关于</text>
              </view>
            </view>
          </template>
        </uni-list-item>
        <uni-list-item :clickable="true" showArrow @click="openLogoutConfirm" v-if="accountNumber">
          <template v-slot:header>
            <view class="w-full flex items-center">
              <image src="/static/images/icons/tcdl.png" mode="widthFix" class="w-22px"></image>
              <view class="flex items-center ml-15px">
                <text class="text-base text-#333">退出登录</text>
              </view>
            </view>
          </template>
        </uni-list-item>
        <!-- <uni-list-item :clickable="true">
          <template v-slot:header>
            <view class="w-full flex items-center">
              <view class="flex items-center ml-15px">
                <view class="text-base text-14px text-#666"
                  >APP授权将于 <text class="text-yellow-400">{{ dayjs(expiredTime).format('YYYY-MM-DD') }}</text> 日过期</view
                >
              </view>
            </view>
          </template>
        </uni-list-item> -->
      </uni-list>
    </view>
    <view class="w-full flex-1 relative">
      <view class="absolute bottom-0 right-0 w-100px h-100px" @click="goDebugger"> </view>
    </view>

    <!-- 退出登录确认弹窗 -->
    <uni-popup ref="logoutConfirmRef" type="dialog">
      <uni-popup-dialog type="warn" title="确认退出" content="确定要退出登录吗？" :before-close="false" @confirm="handleLogout"></uni-popup-dialog>
    </uni-popup>
  </view>
</template>
