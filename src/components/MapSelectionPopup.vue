<script lang="ts" setup>
import { ref, watch } from 'vue';
import { openNavigation as navigateTo } from '@/utils';

interface Props {
  visible: boolean;
  latitude?: number | string;
  longitude?: number | string;
  locationName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  locationName: '位置',
});

const emit = defineEmits(['update:visible']);

const mapSelectionPopupRef = ref<any>(null);

// 监听弹窗显示状态
watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      // 检查经纬度是否有效
      if (props.latitude && props.longitude) {
        mapSelectionPopupRef.value?.open();
      } else {
        uni.showToast({
          title: '经纬度信息不完整，无法导航',
          icon: 'none',
        });
        emit('update:visible', false);
      }
    } else {
      mapSelectionPopupRef.value?.close();
    }
  },
);

// 弹窗状态变化处理
const onPopupChange = (e: any) => {
  emit('update:visible', e.show);
};

// 打开指定地图应用
const openMap = (mapType: 'gaode' | 'baidu' | 'tencent') => {
  const latitude = props.latitude;
  const longitude = props.longitude;
  const name = props.locationName;

  if (latitude && longitude) {
    navigateTo(latitude, longitude, name, mapType);
  }

  // 关闭地图选择弹窗
  emit('update:visible', false);
};
</script>

<template>
  <!-- 地图选择弹窗 -->
  <uni-popup ref="mapSelectionPopupRef" type="share" :mask-click="true" @change="onPopupChange">
    <view class="bg-white rounded-t-12px pb-safe">
      <view class="px-20px py-16px text-center border-b border-#f0f0f0">
        <text class="text-16px text-#999">选择地图应用</text>
      </view>
      <view>
        <view class="w-full h-56px fc border-b border-b-solid border-#f0f0f0 active:bg-#f5f5f5" hover-class="bg-#f8f8f8" @click="openMap('gaode')">
          <text class="text-18px text-#333">高德地图</text>
        </view>
        <view class="w-full h-56px fc border-b border-b-solid border-#f0f0f0 active:bg-#f5f5f5" hover-class="bg-#f8f8f8" @click="openMap('baidu')">
          <text class="text-18px text-#333">百度地图</text>
        </view>
        <view class="w-full h-56px fc active:bg-#f5f5f5" hover-class="bg-#f8f8f8" @click="openMap('tencent')">
          <text class="text-18px text-#333">腾讯地图</text>
        </view>
      </view>
    </view>
  </uni-popup>
</template>
