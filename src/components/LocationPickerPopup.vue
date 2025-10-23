<script lang="ts" setup>
import BaseMap from '@/components/BaseMap.vue';
import { getLocationComplete } from '@/utils/location';
import { useTileCacheStore } from '@/stores/tile_cache';
import { useSelectedAreaStore } from '@/stores/selected_area';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';

const tileCacheStore = useTileCacheStore();
const selectedAreaStore = useSelectedAreaStore();
const { selectedAreaId } = storeToRefs(selectedAreaStore);

const props = defineProps<{
  initialLocation: {
    lng: number | null;
    lat: number | null;
  };
}>();
const emit = defineEmits(['confirm']);

const { simplifiedAreaCaches } = storeToRefs(tileCacheStore);

// 定位loading状态
const isLocating = ref(false);
// BaseMap组件引用
const baseMapRef = ref<any>(null);

// 确认位置
const confirmLocation = () => {
  const { lat, lng } = baseMapRef.value.redIconLatlng;
  emit('confirm', {
    longitude: lng,
    latitude: lat,
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
/**
 * 设置地图中心点 如果有初始位置，使用初始位置
 */
const flyToCurrentLocation = async () => {
  if (props.initialLocation.lng && props.initialLocation.lat) {
    baseMapRef.value.moveToLocation({
      lat: props.initialLocation.lat,
      lng: props.initialLocation.lng,
    });
  }
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
onMounted(() => {
  flyToCurrentLocation();
  startLocationUpdate();
});
onBeforeUnmount(() => {
  // #ifdef APP-PLUS
  locationUpdateTimer.value && clearInterval(locationUpdateTimer.value);
  baseMapRef.value.stopCompass();
  // #endif
});
</script>
<template>
  <view class="w-full h-80vh relative">
    <!-- 地图容器 - 占满整个空间 -->
    <BaseMap
      ref="baseMapRef"
      :selectedAreaId="selectedAreaId"
      :treeMarkerLocation="initialLocation"
      :isLocating="isLocating"
      :latlngStyle="{ top: '20px' }"
      :locationStyle="{ top: '60px' }"
      :cachedTiles="simplifiedAreaCaches"
      @onHandleLocation="onHandleLocation"
    />

    <!-- 底部按钮 - absolute定位 -->
    <view class="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black from-opacity-10 to-transparent z-10">
      <button
        class="w-full h-46px bgPrimary text-white border-none rounded-full text-base font-semibold flex items-center justify-center shadow-lg shadow-primary shadow-opacity-30 active:bg-primary-dark active:translate-y-0.25"
        @click="confirmLocation"
      >
        确认位置
      </button>
    </view>
  </view>
</template>
