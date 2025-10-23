<template>
  <view class="w-full h-100vh relative">
    <!-- 地图容器 - 占满整个空间 -->
    <view class="absolute inset-0">
      <view
        id="map"
        :mapCenter="mapCenter"
        :change:mapCenter="renderjs.receiveMapCenter"
        :zoom="zoom"
        :change:zoom="renderjs.receiveZoom"
        :location="location"
        :change:location="renderjs.receiveLocation"
        ref="mapContainer"
        class="renderjs w-full h-full z0"
      ></view>
    </view>

    <!-- 经纬度信息 - absolute定位 -->
    <view
      class="absolute left-0 right-0 bg-black bg-opacity-70 px-5 py-2.5 flex justify-between items-center z-10"
      :style="{
        top: statusBarHeight + 'px',
      }"
    >
      <text class="text-white text-12px font-medium">经度: {{ currentLocation.longitude }}</text>
      <text class="text-white text-12px font-medium">纬度: {{ currentLocation.latitude }}</text>
    </view>

    <!-- 定位按钮 - absolute定位 -->
    <view
      class="absolute right-10px w-46px h-46px bg-#fff shadow-[0px_0px_12px_1px_rgba(16,70,60,0.18)] rounded-10px z-10 flex flex-col items-center justify-center"
      :style="{
        top: statusBarHeight + 60 + 'px',
      }"
      @click="onHandleLocation"
    >
      <view v-if="isLocating" class="w-20px h-20px flex items-center justify-center">
        <uni-icons class="animate-spin text-#333" type="refreshempty" size="20"></uni-icons>
      </view>
      <image v-else class="w-20px h-20px" src="/static/images/icons/dingwei.png" mode="aspectFit"></image>
    </view>

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

<script>
import { getLocationComplete } from '@/utils/location';

export default {
  name: 'LocationPicker',
  data() {
    return {
      statusBarHeight: 0,
      mapCenter: [44.103369, 82.136527], // 默认位置，与BaseMap.vue保持一致
      zoom: 16,
      currentLocation: {
        longitude: 82.136527,
        latitude: 44.103369,
      },
      location: {
        random: 0,
        lat: 0,
        lng: 0,
      },
      isLocating: false, // 定位loading状态
    };
  },

  onLoad() {
    // 获取状态栏高度
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 0;

    // 尝试获取当前位置，失败则使用默认位置
    this.getCurrentLocation();
  },

  methods: {
    // 获取当前位置
    async getCurrentLocation() {
      try {
        const location = await getLocationComplete();
        this.mapCenter = [location.latitude, location.longitude];
        this.currentLocation = {
          longitude: location.longitude,
          latitude: location.latitude,
        };
      } catch (err) {
        console.error('获取位置失败，使用默认位置:', err);
        // 不弹窗，直接使用默认位置
        this.currentLocation = {
          longitude: 82.136527,
          latitude: 44.103369,
        };
      }
    },

    // 定位到当前位置
    async onHandleLocation() {
      if (this.isLocating) return; // 如果正在定位，直接返回

      try {
        this.isLocating = true; // 开始定位

        await new Promise(resolve => setTimeout(resolve, 100));
        const location = await getLocationComplete();

        // 更新当前位置
        this.currentLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
        };

        // 通知地图组件移动到当前位置
        this.location = {
          random: Math.random(),
          lat: location.latitude,
          lng: location.longitude,
        };

        // 更新地图中心
        this.mapCenter = [location.latitude, location.longitude];
      } catch (error) {
        console.error('定位失败：', error);

        uni.showToast({
          title: '定位失败',
          icon: 'none',
        });
      } finally {
        this.isLocating = false; // 定位结束
      }
    },

    // 地图移动事件处理（由renderjs调用）
    onMapMove(center) {
      this.currentLocation = {
        longitude: center.lng.toFixed(6),
        latitude: center.lat.toFixed(6),
      };
    },

    // 确认位置
    confirmLocation() {
      const { longitude, latitude } = this.currentLocation;

      // 关闭当前页面并跳转
      uni.redirectTo({
        url: `/pages/survey_create/index?longitude=${longitude}&latitude=${latitude}`,
      });
    },
  },
};
</script>

<script module="renderjs" lang="renderjs">
import L from 'leaflet';

let mapInstance;
let crosshairLayer;
let locationMarker; // 当前位置标记

export default {
  data() {
    return {
      currentBaseLayer: null,
    };
  },
  mounted() {
    this.link = document.createElement('link');
    this.link.rel = 'stylesheet';
    this.link.href = 'static/leaflet/dist/leaflet.css';
    document.head.appendChild(this.link);

    this.$nextTick(() => {
      this.initMap();
    });
  },
  methods: {
    receiveMapCenter(newValue, oldValue, ownerVm, vm) {
      if (mapInstance && newValue && newValue.length === 2) {
        mapInstance.setView(newValue, mapInstance.getZoom());
      }
    },
    receiveZoom(newValue, oldValue, ownerVm, vm) {
      if (mapInstance && newValue) {
        mapInstance.setZoom(newValue);
      }
    },
    receiveLocation(newValue, oldValue, ownerVm, vm) {
      if (newValue && newValue.lat && newValue.lng) {
        this.moveToLocation(newValue);
      }
    },
    initMap() {
      // 初始化地图
      const tiandituKey = '64a7440068a2bbc276c11927b54458f4';
      mapInstance = L.map('map', {
        zoomControl: false, // 禁用缩放控件
        attributionControl: false, // 禁用版权信息控件
        minZoom: 1,
        maxZoom: 25
      }).setView([44.103369, 82.136527], 16);

      // 添加天地图图层
      const token = '64a7440068a2bbc276c11927b54458f4';
      // 添加天地图影像底图
      const tiandituImg = L.tileLayer(
        'https://t{s}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=' +
          tiandituKey,
        {
          subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
          maxNativeZoom: 18,
          maxZoom: 25
        }
      );

      // 添加天地图影像注记
      const tiandituCia = L.tileLayer(
        'https://t{s}.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=' +
          tiandituKey,
        {
          subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
          maxNativeZoom: 18,
          maxZoom: 25
        }
      );

      const imgGroup = L.layerGroup([tiandituImg, tiandituCia]);
      imgGroup.addTo(mapInstance);

      // 添加官方比例尺控件到左上角位置
      const officialScaleControl = L.control.scale({
        position: 'topleft',
        metric: true,
        imperial: false,
        maxWidth: 200
      });
      officialScaleControl.addTo(mapInstance);

      officialScaleControl._container.style.left = "10px"
      officialScaleControl._container.style.top = "50px"
      officialScaleControl._container.style.marginLeft = "0"

      // 创建十字瞄准镜图层
      this.createCrosshair();

      // 监听地图移动事件
      mapInstance.on('move', () => {
        const center = mapInstance.getCenter();
        this.$ownerInstance.callMethod('onMapMove', {
          lat: center.lat,
          lng: center.lng,
        });
      });

      // 初始化时设置中心点位置
      const center = mapInstance.getCenter();
      this.$ownerInstance.callMethod('onMapMove', {
        lat: center.lat,
        lng: center.lng,
      });
    },

    // 创建十字瞄准镜
    createCrosshair() {
      // 创建十字瞄准镜图层
      crosshairLayer = L.layerGroup().addTo(mapInstance);

      // 获取地图容器的中心点
      const mapContainer = mapInstance.getContainer();
      const mapSize = mapInstance.getSize();
      const centerPoint = mapInstance.containerPointToLatLng([
        mapSize.x / 2,
        mapSize.y / 2,
      ]);

      // 创建十字瞄准镜的SVG图标
      const crosshairIcon = L.divIcon({
        className: 'crosshair-icon',
        html: `
          <svg width="30" height="30" style="pointer-events: none;">
            <line x1="15" y1="5" x2="15" y2="25" stroke="#ff4444" stroke-width="3" opacity="0.8" stroke-linecap="round"/>
            <line x1="5" y1="15" x2="25" y2="15" stroke="#ff4444" stroke-width="3" opacity="0.8" stroke-linecap="round"/>
          </svg>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      // 创建十字瞄准镜标记
      const crosshairMarker = L.marker(centerPoint, {
        icon: crosshairIcon,
        interactive: false, // 不可交互
        zIndexOffset: 1000, // 确保在最上层
      });

      crosshairLayer.addLayer(crosshairMarker);

      // 监听地图移动事件，更新十字瞄准镜位置
      mapInstance.on('move zoom', () => {
        const newCenter = mapInstance.getCenter();
        crosshairMarker.setLatLng(newCenter);
      });
    },

    // 移动地图到指定位置
    moveToLocation(location) {
      if (mapInstance && location && location.lat && location.lng) {
        mapInstance.setView([location.lat, location.lng], 16, {
          animate: true,
          duration: 1.0,
        });

        // 创建当前位置图标
        const locationIcon = L.icon({
          iconUrl: 'static/images/icons/current_location.png',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        // 如果已有位置标记，先移除
        if (locationMarker) {
          mapInstance.removeLayer(locationMarker);
        }

        // 添加当前位置标记
        locationMarker = L.marker([location.lat, location.lng], {
          icon: locationIcon,
          interactive: false, // 不可交互
          zIndexOffset: 900  // 确保在十字瞄准镜下方但在地图上方
        }).addTo(mapInstance);
      }
    },
  },
};
</script>

<style scoped></style>
