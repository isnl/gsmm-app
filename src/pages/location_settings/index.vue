<script lang="ts" setup>
import { ref } from 'vue';
import { useLocationStore, LocationMode } from '@/stores/location';
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { storeToRefs } from 'pinia';
import { goBack } from '@/utils';

const locationStore = useLocationStore();
const { currentLocationMode } = storeToRefs(locationStore);
const { setLocationMode, getLocationModeName } = locationStore;
const { statusBarHeight } = useStatusBarHeight();

// 定位方式选项
const locationModes = [
  {
    mode: LocationMode.AMAP_ONLINE,
    name: '高德在线定位',
    description: '使用高德地图在线定位服务，精度较高',
  },
  {
    mode: LocationMode.SYSTEM,
    name: '系统定位',
    description: '使用系统内置定位服务',
  },
  {
    mode: LocationMode.OFFLINE,
    name: '离线定位',
    description: '使用离线定位方式，无需网络连接',
  },
];

// 选择定位方式
const selectLocationMode = (mode: LocationMode) => {
  setLocationMode(mode);
  uni.showToast({
    title: `${getLocationModeName(mode)}`,
    icon: 'success',
    duration: 1500,
  });
};

// 打开安卓定位设置页面
const openAndroidLocationSettings = () => {
  // #ifdef APP-PLUS
  const main = plus.android.runtimeMainActivity();
  const Intent = plus.android.importClass('android.content.Intent');
  const Settings = plus.android.importClass('android.provider.Settings');
  const intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
  main.startActivity(intent);
  // #endif

  // #ifndef APP-PLUS
  uni.showToast({
    title: '仅在APP中支持此功能',
    icon: 'none',
  });
  // #endif
};

// 打开应用权限配置
const openAppPermissionSettings = () => {
  // #ifdef APP-PLUS
  const main = plus.android.runtimeMainActivity();
  const Intent = plus.android.importClass('android.content.Intent');
  const Settings = plus.android.importClass('android.provider.Settings');
  const Uri = plus.android.importClass('android.net.Uri');
  const intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
  const uri = Uri.fromParts('package', main.getPackageName(), null);
  intent.setData(uri);
  main.startActivity(intent);
  // #endif

  // #ifndef APP-PLUS
  uni.showToast({
    title: '仅在APP中支持此功能',
    icon: 'none',
  });
  // #endif
};
</script>

<template>
  <view class="w-full h-full flex flex-col bg-gradient-to-b from-#08bd92 to-#07a47f">
    <!-- 自定义导航栏 -->
    <view
      class="w-full"
      :style="{
        paddingTop: statusBarHeight + 12 + 'px',
      }"
    >
      <view class="flex items-center gap-10px px-10px py-24px">
        <view class="w-auto flex items-center" @click="goBack">
          <uni-icons type="left" size="30" color="#fff"></uni-icons>
          <text class="text-#fff text-18px font-bold">定位方式</text>
        </view>
      </view>
    </view>

    <!-- 页面内容 -->
    <view class="flex-1 p-4 bg-#f9f9fb">
      <!-- 定位方式选择区域 -->
      <view class="bg-white rounded-lg mb-4 px-10px">
        <view class="p-4 border-b border-gray-100">
          <text class="text-lg font-medium text-#333">选择定位方式</text>
        </view>

        <view class="p-4">
          <view
            v-for="(item, index) in locationModes"
            :key="item.mode"
            class="flex items-center justify-between py-4 px-3 rounded-lg mx--3 mb-2"
            :class="{
              'border-b border-gray-100': index < locationModes.length - 1,
              'bg-green-50': currentLocationMode === item.mode,
            }"
            @click="selectLocationMode(item.mode)"
          >
            <view class="flex-1">
              <view class="flex items-center">
                <text class="text-base font-medium text-#333">{{ item.name }}</text>
                <view v-if="currentLocationMode === item.mode" class="ml-2 bg-#08bd92 px-10px py-2px flex items-center rounded-full">
                  <text class="text-xs text-white">当前</text>
                </view>
              </view>
              <text class="text-sm text-#666">{{ item.description }}</text>
            </view>

            <view class="ml-4">
              <view
                class="w-20px h-20px rounded-full border-2 flex items-center justify-center"
                :class="currentLocationMode === item.mode ? 'border-#08bd92 bg-#08bd92' : 'border-gray-300'"
              >
                <view v-if="currentLocationMode === item.mode" class="w-8px h-8px bg-white rounded-full"></view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 功能区域 -->
      <view class="bg-white rounded-lg">
        <uni-list :border="false">
          <uni-list-item :clickable="true" showArrow @click="openAndroidLocationSettings">
            <template v-slot:header>
              <view class="w-full flex items-center">
                <image src="/static/images/icons/dingwei.png" mode="widthFix" class="w-22px"></image>
                <view class="flex items-center ml-15px">
                  <text class="text-base text-#333">打开安卓定位设置页面</text>
                </view>
              </view>
            </template>
          </uni-list-item>

          <uni-list-item :clickable="true" showArrow @click="openAppPermissionSettings">
            <template v-slot:header>
              <view class="w-full flex items-center">
                <image src="/static/images/icons/gy.png" mode="widthFix" class="w-22px"></image>
                <view class="flex items-center ml-15px">
                  <text class="text-base text-#333">打开应用权限配置</text>
                </view>
              </view>
            </template>
          </uni-list-item>
        </uni-list>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* 自定义样式 */
</style>
