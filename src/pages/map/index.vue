<script lang="ts" setup>
import { nextTick, ref, watch } from 'vue';
import BaseMap from '@/components/BaseMap.vue';
import DistrictSelector from './components/DistrictSelector.vue';
import { onHide, onShow } from '@dcloudio/uni-app';
import LayerPopup from './components/LayerPopup.vue';
import FeatureDetailPopup from './components/FeatureDetailPopup.vue';
import AncientTreeClusterDetailPopup from './components/AncientTreeClusterDetailPopup.vue';
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

const hiddenPannel = ref(false);
const pannelInfo = ref({
  daidiaochaCount: 0,
  diaochazhongCount: 0,
  yidiaochaCount: 0,
});
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
  getTreeData();
  if (firstLoad.value) {
    firstLoad.value = false;
    return;
  }
  // 页面首次加载，在BaseMap中startCompass，页面onShow阶段，BaseMap不会触发，所以要在这里加判断
  baseMapRef.value.startCompass();
});

// 古树标记点数据
const treeMarkers = ref<any[]>([]);
// 古树群面数据
const treeClusterPolygons = ref<any[]>([]);

const getTreeData = async () => {
  if (leftTabActive.value === 'ancientTree') {
    try {
      // 先清空地图上的古树标记点和古树群面
      if (baseMapRef.value) {
        baseMapRef.value.clearTreeMarkers();
        baseMapRef.value.clearTreeClusterPolygons();
      }
      treeMarkers.value = [];
      treeClusterPolygons.value = [];

      const res = await service({
        url: '/gu_shus/all',
        method: 'GET',
      });
      if (res.statusCode === 200) {
        console.log('古树数据:', res.data);
        // 过滤出有经纬度的数据并转换为标记点
        const markers = (Array.isArray(res.data) ? res.data : [])
          .filter((item: any) => item.jd && item.wd)
          .map((item: any) => {
            // 根据 status 确定图标
            let iconUrl = '';
            if (item.status === 1) {
              iconUrl = '/static/images/dcz_tree.png'; // 调查中
            } else if (item.status === 2) {
              iconUrl = '/static/images/ydc_tree.png'; // 已调查
            } else {
              iconUrl = '/static/images/ddc_tree.png'; // 待调查
            }

            return {
              id: item.id,
              lat: parseFloat(item.wd), // 纬度
              lng: parseFloat(item.jd), // 经度
              iconUrl,
              data: item, // 保存完整数据
            };
          });

        treeMarkers.value = markers;

        // 添加标记点到地图
        if (baseMapRef.value && markers.length > 0) {
          baseMapRef.value.addTreeMarkers(markers);
        }
      } else {
        console.error('获取古树数据失败:', res.message);
      }
    } catch (error) {
      console.error('获取古树数据异常:', error);
    }
  } else if (leftTabActive.value === 'ancientTreeCluster') {
    // 切换到古树群时，加载古树群面数据
    try {
      // 先清空地图上的古树标记点和古树群面
      if (baseMapRef.value) {
        baseMapRef.value.clearTreeMarkers();
        baseMapRef.value.clearTreeClusterPolygons();
      }
      treeMarkers.value = [];
      treeClusterPolygons.value = [];

      const res = await service({
        url: '/gu_shu_quns/all',
        method: 'GET',
      });
      if (res.statusCode === 200) {
        console.log('古树群数据:', res.data);
        // 过滤出有 geom 数据的面
        const polygons = (Array.isArray(res.data) ? res.data : [])
          .filter((item: any) => item.geom)
          .map((item: any) => {
            // 根据 submitType 确定颜色
            let color = '#0000ff'; // 默认蓝色（调查中）
            if (item.submitType === 1) {
              color = '#00ff00'; // 已调查（绿色）
            } else if (item.submitType === 0) {
              color = '#0000ff'; // 调查中（蓝色）
            }

            return {
              id: item.id,
              geom: item.geom,
              properties: item, // 保存完整数据作为properties
              color,
              submitType: item.submitType,
            };
          });

        treeClusterPolygons.value = polygons;

        // 添加面数据到地图
        if (baseMapRef.value && polygons.length > 0) {
          baseMapRef.value.addTreeClusterPolygons(polygons);
        }
      } else {
        console.error('获取古树群数据失败:', res.message);
      }
    } catch (error) {
      console.error('获取古树群数据异常:', error);
    }
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
onHide(() => {
  // #ifdef APP-PLUS
  locationUpdateTimer.value && clearInterval(locationUpdateTimer.value);
  // #endif
});
const leftTabActive = ref('ancientTree');
const leftTabs = [
  {
    name: '古树',
    value: 'ancientTree',
    icon: '/static/images/ancient_tree.png',
    activeIcon: '/static/images/ancient_tree_active.png',
  },
  {
    name: '古树群',
    value: 'ancientTreeCluster',
    icon: '/static/images/ancient_tree_cluster.png',
    activeIcon: '/static/images/ancient_tree_cluster_active.png',
  },
];

const changeLeftTab = (value: string) => {
  hiddenPannel.value = value === 'ancientTree' ? false : true;
  leftTabActive.value = value;
  getTreeData();
};
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
 * 古树标记点击事件处理（从 BaseMap renderjs 调用）
 */
const handleTreeMarkerClick = (markerData: any) => {
  console.log('古树标记点击:', markerData);

  // 跳转到详情页
  uni.navigateTo({
    url: `/pages/ancient_tree/detail?id=${markerData.id}`,
  });
};

/**
 * 古树标记点击事件处理（从组件 emit 调用）
 */
const onTreeMarkerClick = (markerData: any) => {
  handleTreeMarkerClick(markerData);
};

/**
 * 要素点击事件处理
 */
const featureDetailPopupRef = ref();
const ancientTreeClusterDetailPopupRef = ref();
const featureData = ref({});
const clusterId = ref<string | number>('');
const onFeatureClick = (data: any) => {
  console.log('要素点击数据:', data);
  featureData.value = data;

  // 判断是否是古树群模式，如果是则跳转到古树群详情页
  if (leftTabActive.value === 'ancientTreeCluster') {
    // 从 data 中提取 id
    const id = data.id || data.properties?.id || '';
    if (id) {
      uni.navigateTo({
        url: `/pages/ancient_tree_cluster/detail?id=${id}`,
      });
    } else {
      uni.showToast({
        title: '无法获取古树群ID',
        icon: 'none',
      });
    }
  } else {
    // 打开通用弹窗
    featureDetailPopupRef.value?.open('bottom');
    // 隐藏底部tabBar
    uni.hideTabBar();
  }
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
 * 关闭古树群详情弹窗
 */
const closeAncientTreeClusterDetailPopup = () => {
  ancientTreeClusterDetailPopupRef.value?.close();
  uni.showTabBar();
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
const goList = (status: string) => {
  // uni.navigateTo({
  //   url: `/pages/ancient_tree_list/index?status=${status}`,
  // });
};

// 绘制模式状态
const isDrawingMode = ref(false);
const drawnPolygonData = ref<any>(null);

const onAddPage = () => {
  // 如果是古树群，进入绘制模式
  if (leftTabActive.value === 'ancientTreeCluster') {
    isDrawingMode.value = true;
    // 通知地图组件进入绘制模式
    baseMapRef.value?.startDrawing();
    // 隐藏TabBar
    uni.hideTabBar();
  } else {
    // 古树直接跳转新增页面
    const coord = baseMapRef.value?.redIconLatlng || { lat: '', lng: '' };
    uni.navigateTo({
      url: `/pages/ancient_tree/index?jd=${coord.lng || ''}&wd=${coord.lat || ''}`,
    });
  }
};

const openListPage = () => {
  uni.navigateTo({
    url: '/pages/ancient_tree/treeList',
  });
};
// 完成绘制
const finishDrawing = async () => {
  // 从地图组件获取绘制的多边形数据
  const polygonData = await baseMapRef.value?.finishDrawing();

  console.log('获取到的多边形数据:', polygonData);

  if (!polygonData || !polygonData.coordinates || !polygonData.coordinates[0] || polygonData.coordinates[0].length < 3) {
    uni.showToast({
      title: '请至少绘制3个点',
      icon: 'none',
    });
    // 恢复绘制模式
    isDrawingMode.value = true;
    baseMapRef.value?.startDrawing();
    return;
  }

  drawnPolygonData.value = polygonData;
  isDrawingMode.value = false;
  uni.showTabBar();

  // 跳转到古树群新增页面，携带多边形数据
  uni.navigateTo({
    url: '/pages/ancient_tree_cluster/index',
    success: () => {
      // 通过事件传递多边形数据
      setTimeout(() => {
        // @ts-ignore
        uni.$emit('drawnPolygonData', polygonData);
      }, 100);
    },
  });
};

// 撤销上一个点
const undoLastPoint = () => {
  baseMapRef.value?.undoLastPoint();
};

// 取消绘制
const cancelDrawing = () => {
  isDrawingMode.value = false;
  baseMapRef.value?.cancelDrawing();
  uni.showTabBar();
};
</script>

<template>
  <view class="w-full h-full relative">
    <BaseMap
      :layer-type="currentLayer"
      :currentOperateLayer="currentOperateLayer"
      :latlngStyle="{ bottom: hiddenPannel ? '10px' : '120px' }"
      :layerList="layerList"
      ref="baseMapRef"
      :isLocating="isLocating"
      :geometry="selectedGeometry"
      @onHandleLocation="onHandleLocation"
      @onFeatureClick="onFeatureClick"
      @onTreeMarkerClick="onTreeMarkerClick"
    />
    <!-- 行政区选择器 -->
    <view
      class="absolute left-10px top-10px px-20px flex-1 px-10px w-95% h-40px flex items-center gap-10px bg-#fff shadow-[0px_0px_12px_1px_rgba(16,70,60,0.18)] rounded-[10px]"
    >
      <span class="text-18px color-#000 iconfont icon-a-zu15826"></span>
      <view
        class="flex-1 h-full flex justify-start items-center pl-10px cursor-pointer text-18px"
        :class="selectedDistrict ? 'text-#333' : 'text-#6e7580'"
        @click="openDistrictPopup"
      >
        {{ currentDistrict }}
      </view>
      <!-- 清除按钮 -->
      <uni-icons v-if="selectedDistrict" type="close" size="24" color="#999" class="mr-8px cursor-pointer" @click="clearDistrictFilter"></uni-icons>
      <span v-else class="iconfont icon-a-zu15832 mr-8px !text-8px font-bold text-#00bf9f cursor-pointer" @click="openDistrictPopup"></span>
    </view>
    <view class="absolute right-10px top-58px h-100px bg-#fff w-46px p-10px rounded-10px shadow-[0px_0px_12px_1px_rgba(16,70,60,0.18)]">
      <!-- 一级二级控制 -->
      <view class="flex-1 fc flex-col gap-3px border-rd-b-10px mb-10px" @click="openLayerPopup">
        <image src="/static/images/icons/layer.png" mode="scaleToFill" class="w-20px h-20px"></image>
        <text class="text-10px color-#0F1826">图层</text>
      </view>
      <view class="flex-1 fc flex-col gap-3px border-rd-b-10px" @click="openListPage">
        <image src="/static/images/icons/list.png" mode="scaleToFill" class="w-20px h-20px"></image>
        <text class="text-10px color-#0F1826">列表</text>
      </view>
    </view>
    <view class="absolute right-10px top-165px h-50px bg-#fff w-46px px-10px py-5px rounded-10px shadow-[0px_0px_12px_1px_rgba(16,70,60,0.18)]">
      <view class="flex-1 fc flex-col gap-3px border-rd-b-10px" @click="onAddPage">
        <image v-if="leftTabActive === 'ancientTree'" src="/static/images/add_tree.png" mode="scaleToFill" class="w-20px h-20px"></image>
        <image v-else src="/static/images/add_tree_cluster.png" mode="scaleToFill" class="w-20px h-20px"></image>
        <text class="text-10px color-#0F1826">新增</text>
      </view>
    </view>

    <view class="absolute left-10px top-90px w-46px bg-#fff shadow-[0px_0px_12px_1px_rgba(16,70,60,0.18)] rounded-10px z-1 flex flex-col overflow-hidden">
      <view
        class="h-55px fc flex-col gap-3px"
        v-for="item in leftTabs"
        @click="changeLeftTab(item.value)"
        :key="item.value"
        :class="leftTabActive === item.value ? 'bgPrimary text-#fff' : 'text-#0f1826'"
      >
        <image :src="leftTabActive === item.value ? item.activeIcon : item.icon" mode="scaleToFill" class="w-20px h-20px"></image>
        <span class="text-10px">{{ item.name }}</span>
      </view>
    </view>

    <!-- 绘制模式按钮 -->
    <view v-if="isDrawingMode" class="absolute bottom-50px left-30px transform-translateX--50% flex items-center gap-15px z-10">
      <view class="px-25px py-12px bg-#f5f5f5 rounded-8px flex items-center justify-center" @click="undoLastPoint">
        <uni-icons type="undo" size="20" color="#666"></uni-icons>
        <text class="text-14px color-#666 ml-5px">撤销</text>
      </view>
      <view class="px-25px py-12px bg-red rounded-8px flex items-center justify-center" @click="cancelDrawing">
        <uni-icons type="close" size="20" color="#fff"></uni-icons>
        <text class="text-14px color-#fff ml-5px">取消</text>
      </view>
      <view class="px-25px py-12px bg-#01bd8d rounded-8px flex items-center justify-center" @click="finishDrawing">
        <uni-icons type="checkmarkempty" size="20" color="#fff"></uni-icons>
        <text class="text-14px color-#fff ml-5px">完成</text>
      </view>
    </view>
  </view>
  <!-- 古树调查数据 -->
  <view class="w-full h-100px absolute bottom-10px px-10px" v-if="!hiddenPannel">
    <view class="w-full px-12px h-100px flex flex-col mx-auto bg-#fff rounded-14px">
      <view class="flex py-10px">
        <view class="flex-1 flex items-end gap-10px" @click="goList('待调查')">
          <image src="/static/images/icons/daidiaocha.png" mode="widthFix" class="w-44px h-44px"></image>
          <view class="flex flex-col">
            <text class="text-17px font-bold text-#333">{{ pannelInfo.daidiaochaCount }}</text>
            <text class="text-12px text-#8B8AA1">待调查</text>
          </view>
        </view>
        <view class="flex-1 flex items-center gap-10px" @click="goList('调查中')">
          <image src="/static/images/icons/diaochazhong.png" mode="widthFix" class="w-44px h-44px"></image>
          <view class="flex flex-col">
            <text class="text-17px font-bold text-#333">
              {{ pannelInfo.diaochazhongCount }}
            </text>
            <text class="text-12px text-#8B8AA1">调查中</text>
          </view>
        </view>
        <view class="flex-1 flex items-center gap-10px" @click="goList('已调查')">
          <image src="/static/images/icons/yidiaocha.png" mode="widthFix" class="w-44px h-44px"></image>
          <view class="flex flex-col">
            <text class="text-17px font-bold text-#333">{{ pannelInfo.yidiaochaCount }}</text>
            <text class="text-12px text-#8B8AA1">已调查</text>
          </view>
        </view>
      </view>

      <view class="w-full pt-10px b-t-1px b-t-solid b-t-#eee flex items-center">
        <view class="flex items-center text-12px gap-5px pr-10px">
          <image src="/static/images/icons/people.png" mode="widthFix" class="w-12px"></image>
          <text class="text-#8B8AA1">我的调查</text>
          <text class="text-#333">{{ syncPendingAndErrorList.length }}</text>
        </view>
      </view>
    </view>
  </view>

  <uni-drawer ref="layerPopupRef" mode="right" :width="300">
    <LayerPopup @baseLayerChange="onBaseLayerChange" :active-layer="currentLayer" @layerChange="onLayerChange" @locateLayer="onLocateLayer" />
  </uni-drawer>

  <!-- 行政区选择弹窗 -->
  <DistrictSelector
    ref="districtSelectorRef"
    :toggleBar="true"
    v-model:visible="showDistrictPopup"
    v-model:selectedDistrict="selectedDistrict"
    v-model:currentDistrict="currentDistrict"
    @update:selectedGeometry="onDistrictSelected"
  />

  <!-- 筛选弹窗 -->
  <!-- <MultiFilterPopup v-model:visible="showFilterPopup" @confirm="onFilterConfirm" @reset="onFilterReset" /> -->

  <!-- 要素详情弹窗 -->
  <uni-popup ref="featureDetailPopupRef" type="bottom" :safe-area="false" :mask-click="false">
    <view class="w-full h-80vh bg-#fff rounded-t-20px overflow-hidden">
      <FeatureDetailPopup :featureData="featureData" @close="closeFeatureDetailPopup" />
    </view>
  </uni-popup>

  <!-- 古树群详情弹窗 -->
  <uni-popup ref="ancientTreeClusterDetailPopupRef" type="bottom" :safe-area="false" :mask-click="false">
    <view class="w-full h-80vh bg-#fff rounded-t-20px overflow-hidden">
      <AncientTreeClusterDetailPopup :clusterId="clusterId" @close="closeAncientTreeClusterDetailPopup" />
    </view>
  </uni-popup>
</template>
