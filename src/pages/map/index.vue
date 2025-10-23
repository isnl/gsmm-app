<script lang="ts" setup>
import { nextTick, ref, watch } from 'vue';
import BaseMap from '@/components/BaseMap.vue';
// import DistrictSelector from './components/DistrictSelector.vue';
import { onHide, onShow } from '@dcloudio/uni-app';
import LayerPopup from './components/LayerPopup.vue';
import FeatureDetailPopup from './components/FeatureDetailPopup.vue';
import { getLocationComplete, openGps, checkAndGuideForPreciseLocation } from '@/utils/location';
import { useLayerStore, type LayerItem } from '@/stores/layer';
import { storeToRefs } from 'pinia';
import { service } from '@/service';

const layerStore = useLayerStore();
const { layerList } = storeToRefs(layerStore);

// 定位loading状态
const isLocating = ref(false);
// BaseMap组件引用
const baseMapRef = ref<any>(null);

const currentLayer = ref('img');
const onBaseLayerChange = (key: 'img' | 'vec') => {
  currentLayer.value = key;
};
const layerPopupRef = ref();
const openLayerPopup = () => {
  layerPopupRef.value.open();
};

// 当前操作的Layer
const currentOperateLayer = ref();
const onLayerChange = (layer: LayerItem) => {
  currentOperateLayer.value = layer;
};

// 行政区筛选相关
const selectedDistrict = ref('');
const currentDistrict = ref('行政区');
const showDistrictPopup = ref(false); // 添加行政区弹窗控制变量
const selectedGeometry = ref({});
const districtSelectorRef = ref<any>(null);

// 定义一个定位权限的状态：
const preciseLocationPermissionStatus = ref(false);

const firstLoad = ref(true);
onShow(async () => {
  // #ifdef APP-PLUS
  openGps();
  const status = await checkAndGuideForPreciseLocation();
  preciseLocationPermissionStatus.value = status;
  // #endif
  if (preciseLocationPermissionStatus.value) {
    startLocationUpdate();
  }
  if (firstLoad.value) {
    firstLoad.value = false;
    return;
  }
  // 页面首次加载，在BaseMap中startCompass，页面onShow阶段，BaseMap不会触发，所以要在这里加判断
  baseMapRef.value.startCompass();
});
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
onHide(() => {
  // #ifdef APP-PLUS
  locationUpdateTimer.value && clearInterval(locationUpdateTimer.value);
  // #endif
});

// 行政区选择相关方法
const openDistrictPopup = () => {
  districtSelectorRef.value?.openPopup();
};

// 清除行政区筛选
const clearDistrictFilter = () => {
  selectedDistrict.value = '';
  currentDistrict.value = '行政区';
  selectedGeometry.value = {}; // 清空geometry数据
};

const onDistrictSelected = (districtGeometry: any) => {
  selectedGeometry.value = districtGeometry;
};

const goTbList = () => {
  uni.navigateTo({
    url: '/pages/map_spot/index',
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
 * 要素点击事件处理
 */
const featureDetailPopupRef = ref();
const featureData = ref({});
const onFeatureClick = (data: any) => {
  console.log('要素点击数据:', data);
  featureData.value = data;
  // 打开弹窗
  featureDetailPopupRef.value?.open('bottom');
  // 隐藏底部tabBar
  uni.hideTabBar();
};

/**
 * 关闭要素详情弹窗
 */
const closeFeatureDetailPopup = (layerId: number) => {
  featureDetailPopupRef.value?.close();
  uni.showTabBar();
  refreshLayerData(layerId);
};

/**
 * 刷新图层数据
 */
const refreshLayerData = async (layerId: number) => {
  try {
    // 查找对应的图层
    const layer = layerStore.layerList.find(l => l.id === layerId);
    if (!layer) {
      console.error('未找到对应的图层:', layerId);
      return;
    }

    // 如果图层是激活状态，重新查询数据
    if (layer.isActive) {
      // 设置加载状态
      layerStore.setLayerLoading(layer.id, true);

      const res = await service({
        url: '/layers/spatial_query',
        method: 'POST',
        params: {
          id: layer.id,
          state: 3, // 已完成的图层
        },
      });

      if (res.statusCode === 200) {
        // 更新图层数据
        layerStore.setLayerFeatureData(layer.id, res.data);

        // 通知地图组件更新图层显示
        currentOperateLayer.value = {
          visible: true,
          layerId: layer.id,
          layerInfo: res.data,
        };

        console.log('图层数据刷新成功:', res.data);
      }
    }
  } catch (error) {
    console.error('刷新图层数据失败:', error);
  } finally {
    // 清除加载状态
    const layer = layerStore.layerList.find(l => l.id === layerId);
    if (layer) {
      layerStore.setLayerLoading(layer.id, false);
    }
  }
};

/**
 * 定位到图层位置
 */
const onLocateLayer = (layer: LayerItem) => {
  console.log('定位到图层:', layer);

  if (!layer.isActive) {
    uni.showToast({
      title: '图层未开启',
      icon: 'none',
    });
    return;
  }

  if (!baseMapRef.value) {
    console.error('地图组件未初始化');
    return;
  }

  // 调用地图组件的定位方法
  baseMapRef.value.fitToLayer(layer.id);

  // 可选：关闭图层弹窗
  layerPopupRef.value?.close();
};
</script>

<template>
  <view class="w-full h-full relative">
    <BaseMap
      :layer-type="currentLayer"
      :currentOperateLayer="currentOperateLayer"
      :latlngStyle="{ bottom: '10px' }"
      :layerList="layerList"
      ref="baseMapRef"
      :isLocating="isLocating"
      :geometry="selectedGeometry"
      @onHandleLocation="onHandleLocation"
      @onFeatureClick="onFeatureClick"
    />

    <view class="absolute left-0 top-38px w-full px-20px">
      <!-- 一级二级控制 -->
      <view class="absolute right-10px top-0px w-46px h-50px bg-#fff shadow-[0px_0px_12px_1px_rgba(16,70,60,0.18)] rounded-10px z-1 flex flex-col">
        <view class="flex-1 fc flex-col gap-3px border-rd-b-10px" @click="openLayerPopup">
          <image src="/static/images/icons/add_tree.png" mode="scaleToFill" class="w-20px h-20px"></image>
          <text class="text-10px color-#0F1826">图层</text>
        </view>
      </view>
    </view>
  </view>

  <uni-drawer ref="layerPopupRef" mode="right" :width="300">
    <LayerPopup @baseLayerChange="onBaseLayerChange" :active-layer="currentLayer" @layerChange="onLayerChange" @locateLayer="onLocateLayer" />
  </uni-drawer>

  <!-- 行政区选择弹窗 -->
  <!-- <DistrictSelector
    ref="districtSelectorRef"
    :toggleBar="true"
    v-model:visible="showDistrictPopup"
    v-model:selectedDistrict="selectedDistrict"
    v-model:currentDistrict="currentDistrict"
    @update:selectedGeometry="onDistrictSelected"
  /> -->

  <!-- 筛选弹窗 -->
  <!-- <MultiFilterPopup v-model:visible="showFilterPopup" @confirm="onFilterConfirm" @reset="onFilterReset" /> -->

  <!-- 要素详情弹窗 -->
  <uni-popup ref="featureDetailPopupRef" type="bottom" :safe-area="false" :mask-click="false">
    <view class="w-full h-80vh bg-#fff rounded-t-20px overflow-hidden">
      <FeatureDetailPopup :featureData="featureData" @close="closeFeatureDetailPopup" />
    </view>
  </uni-popup>
</template>
