<script lang="ts" setup>
import BaseMap from '@/components/BaseMap.vue';
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { getLocationComplete, openGps, checkAndGuideForPreciseLocation } from '@/utils/location';
import { useTileCacheStore } from '@/stores/tile_cache';
import { useSelectedAreaStore } from '@/stores/selected_area';
import { onHide, onLoad, onShow } from '@dcloudio/uni-app';
import { computed, onBeforeUnmount, ref } from 'vue';
import { storeToRefs } from 'pinia';

const { statusBarHeight } = useStatusBarHeight();
const tileCacheStore = useTileCacheStore();
const selectedAreaStore = useSelectedAreaStore();
const { selectedAreaId } = storeToRefs(selectedAreaStore);

// 定位loading状态
const isLocating = ref(false);
// BaseMap组件引用
const baseMapRef = ref<any>(null);

const { simplifiedAreaCaches } = storeToRefs(tileCacheStore); // 确认位置

// 确认位置
const confirmLocation = () => {
  const { lat, lng } = baseMapRef.value.redIconLatlng;
  // 关闭当前页面并跳转
  uni.redirectTo({
    url: `/pages/survey_create/index?longitude=${lng}&latitude=${lat}`,
  });
};
/**
 * 定位到当前位置
 */
const onHandleLocation = async () => {
  if (isLocating.value) return; // 如果正在定位，直接返回
  try {
    isLocating.value = true; // 开始定位
    const location = await getLocationComplete();

    // 通知地图组件移动到当前位置
    if (baseMapRef.value) {
      baseMapRef.value.moveAndSetLocation({
        lat: location.latitude,
        lng: location.longitude,
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('定位失败：', error);

    uni.showToast({
      title: '定位失败，请检查定位权限',
      icon: 'none',
    });
  } finally {
    isLocating.value = false; // 定位结束
  }
};
onLoad(() => {
  flyToCurrentLocation();
  startLocationUpdate();
});
/**
 * 获取当前位置并定位到此处
 */
const flyToCurrentLocation = async () => {
  const location = await getLocationComplete();
  baseMapRef.value.moveAndSetLocation({
    lat: location.latitude,
    lng: location.longitude,
  });
};
/**
 * 开始定位更新 5s intelval
 */
const locationUpdateTimer = ref<any>(null);
const startLocationUpdate = () => {
  // #ifdef APP-PLUS
  locationUpdateTimer.value = setInterval(async () => {
    try {
      const location = await getLocationComplete();
      // 仅修改当前坐标位置
      if (baseMapRef.value) {
        baseMapRef.value.updateCurrentLocation({
          lat: location.latitude,
          lng: location.longitude,
        });
      }
    } catch (error) {
      console.error('定位失败：', error);
    }
  }, 1000 * 5);
  // #endif
};
onBeforeUnmount(() => {
  // #ifdef APP-PLUS
  locationUpdateTimer.value && clearInterval(locationUpdateTimer.value);
  baseMapRef.value.stopCompass();
  // #endif
});
</script>
<template>
  <view class="w-full h-100vh relative">
    <!-- 地图容器 - 占满整个空间 -->
    <BaseMap
      ref="baseMapRef"
      :selectedAreaId="selectedAreaId"
      :isLocating="isLocating"
      :latlngStyle="{ top: statusBarHeight + 20 + 'px' }"
      :locationStyle="{
        top: statusBarHeight + 60 + 'px',
      }"
      :cachedTiles="simplifiedAreaCaches"
      @onHandleLocation="onHandleLocation"
    />

    <!-- 底部按钮 - absolute定位 -->
    <view class="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black from-opacity-10 to-transparent z-10">
      <button
        class="w-full h-46px bgPrimary text-white border-none rounded-full text-base font-semibold flex items-center justify-center shadow-lg shadow-primary shadow-opacity-30 active:bg-primary-dark active:translate-y-0.25"
        @click="confirmLocation"
      >
        定位古树
      </button>
    </view>
  </view>
</template>
