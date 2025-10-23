<template>
  <view class="w-full h-full relative">
    <view
      id="map"
      :geometry="geometry"
      :change:geometry="renderjs.receiveGeometry"
      :currentOperateLayer="currentOperateLayer"
      :location="location"
      :change:location="renderjs.receiveLocation"
      :direction="direction"
      :change:direction="renderjs.receiveDirection"
      :currentLocation="currentLocation"
      :change:currentLocation="renderjs.receiveCurrentLocation"
      :fitToLayerId="fitToLayerId"
      :change:fitToLayerId="renderjs.receiveFitToLayerId"
      ref="mapContainer"
      class="renderjs w-full h-full z-0"
    ></view>
    <view :style="latlngStyle" class="h-30px w-full fc absolute bottom-130px px-10px">
      <view class="w-full fc gap-10px h-30px rounded-8px bg-[rgba(0,0,0,0.5)]">
        <text class="text-#fff text-12px font-bold">经度: {{ redIconLatlng.lng }}</text>
        <text class="text-#fff text-12px font-bold">纬度: {{ redIconLatlng.lat }}</text>
      </view>
    </view>
    <view
      :style="locationStyle"
      class="absolute right-10px top-100px gap-3px w-46px h-46px bg-#fff shadow-[0px_0px_12px_1px_rgba(16,70,60,0.18)] rounded-10px z-9 flex flex-col items-center justify-center"
      @click="$emit('onHandleLocation')"
    >
      <view v-if="isLocating" class="w-20px h-20px flex items-center justify-center">
        <uni-icons class="animate-spin text-#333" type="refreshempty" size="30"></uni-icons>
      </view>
      <image v-else src="/static/images/icons/dingwei.png" mode="scaleToFill" class="w-20px h-20px"></image>
    </view>
    <!-- 缩放级别显示 -->
    <view
      :style="{ ...locationStyle, top: `${parseInt(locationStyle.top || '100px') + 56}px` }"
      class="absolute right-10px w-46px h-46px bg-#fff shadow-[0px_0px_12px_1px_rgba(16,70,60,0.18)] rounded-10px z-9 flex flex-col items-center justify-center"
    >
      <text class="text-#333 text-14px font-bold">{{ Math.round(currentZoom) }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'LeafletMap',
  emits: ['onMapMove', 'onHandleLocation', 'onFeatureClick'],
  props: {
    latlngStyle: {
      type: Object,
      default: () => ({}),
    },
    locationStyle: {
      type: Object,
      default: () => ({}),
    },
    isLocating: {
      type: Boolean,
      defualt: false,
    },
    geometry: {
      type: Object,
      default: () => ({}),
    },
    layerType: {
      type: String,
      default: 'img',
    },
    currentOperateLayer: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      mapId: 'map-' + Date.now().toString() + Math.floor(Math.random() * 1000),
      // 仅用来点击定位后更新地图中心、更新当前位置
      location: {
        random: Math.random(),
        lat: 0,
        lng: 0,
      },
      currentLocation: {
        lat: 0,
        lng: 0,
      },
      redIconLatlng: {
        lat: 0,
        lng: 0,
      },
      currentZoom: 12,
      direction: 0,
      fitToLayerId: {
        random: 0,
        layerId: 0,
      },
    };
  },
  methods: {
    updateCurrentLocation({ lat, lng }) {
      this.currentLocation = {
        lat,
        lng,
      };
    },
    // 设置地图中心点
    moveToLocation({ lat, lng }) {
      this.location = {
        random: Math.random(),
        lat,
        lng,
      };
    },
    moveAndSetLocation({ lat, lng }) {
      this.location = {
        random: Math.random(),
        lat,
        lng,
      };
      this.currentLocation = {
        lat,
        lng,
      };
    },
    // 定位到指定图层
    fitToLayer(layerId) {
      // 通过修改 fitToLayerId 数据来触发 renderjs 层的响应
      this.fitToLayerId = {
        random: Math.random(), // 用于触发 change 事件
        layerId: layerId,
      };
    },
    onMapMove({ center, zoom }) {
      this.redIconLatlng = {
        lat: center.lat.toFixed(6),
        lng: center.lng.toFixed(6),
      };
      this.currentZoom = zoom;
      this.$emit('onMapMove', { center, zoom });
    },
    onFeatureClick(data) {
      this.$emit('onFeatureClick', data);
    },

    compassCallback(res) {
      this.direction = res.direction;
    },

    // 启动罗盘
    startCompass() {
      uni.onCompassChange(this.compassCallback);

      // 启动罗盘监听
      uni.startCompass({
        success: () => {
          console.log('罗盘启动成功');
        },
        fail: error => {
          console.error('罗盘启动失败:', error);
          uni.showToast({
            title: '罗盘启动失败',
            icon: 'none',
          });
        },
      });
    },

    // 停止罗盘
    stopCompass() {
      // 停止罗盘监听
      uni.stopCompass({
        success: () => {
          console.log('罗盘停止成功');
        },
        fail: error => {
          console.error('罗盘停止失败:', error);
        },
      });

      // 移除罗盘变化监听
      uni.offCompassChange(this.compassCallback);
    },
  },
  mounted() {
    this.startCompass();
  },
};
</script>

<style scoped></style>

<script module="renderjs" lang="renderjs">
import L from 'leaflet';
import * as turf from '@turf/turf';

let mapInstance;
let locationMarker; // 当前位置标记

export default {
  data() {
    return {
      baseLayers: {},
      currentBaseLayer: null,
      geometryLayer: null,
      currentDirection: 0,
      currentZoom: 12,
      cachedTilesData: {},
      markersData: [], // 存储标记数据
      selectedAreaId: null, // 选中的区域ID
      baseLayers: {},
      currentBaseLayer: null,
      layerGroups: {}, // 存储图层组，key为layerId
      highlightedLayer: null // 当前高亮的图层
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
    receiveGeometry(newValue, oldValue, ownerVm, vm) {
      this.updateGeometry(newValue);
    },
    receiveLocation(newValue, oldValue, ownerVm, vm) {
      if (newValue && newValue.lat && newValue.lng) {
        this.moveToLocation(newValue);
      }
    },
    receiveDirection(newValue, oldValue, ownerVm, vm) {
      if (mapInstance && newValue !== undefined) {
        this.updateLocationDirection(newValue);
      }
    },
    receiveCurrentLocation(newValue, oldValue, ownerVm, vm) {
      if (newValue && newValue.lat && newValue.lng) {
        // 更新当前位置坐标并创建/更新位置标记
        this.createLocationMarker(newValue.lat, newValue.lng, this.currentDirection || 0);
      }
    },
    receiveFitToLayerId(newValue, oldValue, ownerVm, vm) {
      if (newValue && newValue.layerId) {
        this.fitToLayerById(newValue.layerId);
      }
    },
    initMap() {
      // 初始化地图
      const tiandituKey = '64a7440068a2bbc276c11927b54458f4';
      mapInstance = L.map('map', {
        crs: L.CRS.EPSG4326, // 使用EPSG:4326坐标系
        zoomControl: false, // 禁用缩放控件
        attributionControl: false, // 禁用版权信息控件
        minZoom: 1,
        maxZoom: 20,
      }).setView([44.103369, 82.136527], 12);

      // 添加天地图图层
      const token = '64a7440068a2bbc276c11927b54458f4';

      // 影像图层
      const imgUrl = 'https://t{s}.tianditu.gov.cn/img_c/wmts?layer=img&style=default&tilematrixset=c&Service=WMTS&Request=GetTile&Version=1.0.0&Format=tiles&TileMatrix={z}&TileCol={x}&TileRow={y}&tk=' + token;
      this.baseLayers.img = L.tileLayer(imgUrl, {
        subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
        maxZoom: 18,
        minZoom: 1,
        zoomOffset: 1
      }).setZIndex(1);

      // 矢量图层
      const vecUrl = 'https://t{s}.tianditu.gov.cn/vec_c/wmts?layer=vec&style=default&tilematrixset=c&Service=WMTS&Request=GetTile&Version=1.0.0&Format=tiles&TileMatrix={z}&TileCol={x}&TileRow={y}&tk=' + token;
      this.baseLayers.vec = L.tileLayer(vecUrl, {
        subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
        maxZoom: 18,
        minZoom: 1,
        zoomOffset: 1
      }).setZIndex(1);

      // 注记图层（固定加载，不动态切换）
      const annoUrl = 'https://t{s}.tianditu.gov.cn/cva_c/wmts?layer=cva&style=default&tilematrixset=c&Service=WMTS&Request=GetTile&Version=1.0.0&Format=tiles&TileMatrix={z}&TileCol={x}&TileRow={y}&tk=' + token;
      this.annotationLayer = L.tileLayer(annoUrl, {
        subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
        maxZoom: 18,
        minZoom: 1,
        zoomOffset: 1
      }).setZIndex(2);

      // 设置初始图层
      this.setBaseLayer(this.layerType);

      // 添加固定的注记图层
      this.annotationLayer.addTo(mapInstance);

      // 创建geometry图层
      this.geometryLayer = L.layerGroup().addTo(mapInstance);

      // 添加官方比例尺控件到左上角位置
      const officialScaleControl = L.control.scale({
        position: 'topleft',
        metric: true,
        imperial: false,
      });
      officialScaleControl.addTo(mapInstance);
      officialScaleControl._container.style.left = "10px"
      officialScaleControl._container.style.top = "40px"
      officialScaleControl._container.style.marginLeft = "0"

      // 监听地图移动事件
      mapInstance.on('moveend', () => {
        const center = mapInstance.getCenter();
        const zoom = mapInstance.getZoom();
        this.$ownerInstance.callMethod('onMapMove', { center, zoom });
      });

      // 监听地图缩放结束事件 - 处理缓存瓦片切换
      mapInstance.on('zoomend', () => {
        const zoom = mapInstance.getZoom();
        this.$ownerInstance.callMethod('onMapMove', {
          center: mapInstance.getCenter(),
          zoom
        });
        this.currentZoom = zoom;
      });
    },

    setBaseLayer(type) {
      // 移除当前图层
      if (this.currentBaseLayer) {
        mapInstance.removeLayer(this.currentBaseLayer);
      }
      // 添加新图层
      this.currentBaseLayer = this.baseLayers[type];
      this.currentBaseLayer.addTo(mapInstance);
    },
    // 使用turf库计算marker边界并调整地图视图
    updateGeometry(geometry) {
      // 清除现有geometry
      this.geometryLayer && this.geometryLayer.clearLayers();
      // 如果没有geometry数据或为空对象，直接返回
      if (!geometry || Object.keys(geometry).length === 0) {
        return;
      }

      try {
        // 创建GeoJSON图层
        const geoJsonLayer = L.geoJSON(geometry, {
          style: {
            color: '#1bf330',
            fillColor: '#1bf330', //填充颜色
            fillOpacity: 0, //填充透明度
            weight: 4, //线宽度
            opacity: 1 //线透明度
          },
        }).addTo(this.geometryLayer);

        // 自动缩放到geometry范围
        if (geoJsonLayer.getBounds().isValid()) {
          mapInstance.fitBounds(geoJsonLayer.getBounds(), {
            padding: [20, 20],
          });
        }
      } catch (error) {
        console.error('Error rendering geometry:', error);
      }
    },

    // 移动地图到指定位置
    moveToLocation(location) {
      if (mapInstance && location && location.lat && location.lng) {
        const currentZoom = mapInstance.getZoom();
        mapInstance.setView([location.lat, location.lng], currentZoom);
      }
    },

    // 创建位置标记
    createLocationMarker(lat, lng, direction = 0) {
      // 创建当前位置图标 - 浅蓝色圆圈样式
      const locationIcon = L.divIcon({
        className: 'current-location-icon',
        html: `
          <div style="position: relative; width: 32px; height: 32px;">
            <!-- 方向箭头 -->
            <div style="
              position: absolute;
              top: 0px;
              left: 50%;
              width: 0;
              height: 0;
              border-left: 8px solid transparent;
              border-right: 8px solid transparent;
              border-bottom: 16px solid #4A90E2;
              transform: translateX(-50%) rotate(${direction}deg);
              transform-origin: 50% 100%;
              filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
              z-index: 2;
            "></div>
            <!-- 主圆圈 -->
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              width: 16px;
              height: 16px;
              background-color: #ffffff;
              border: 3px solid #4A90E2;
              border-radius: 50%;
              transform: translate(-50%, -50%);
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              z-index: 3;
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // 如果已有位置标记，先移除
      if (locationMarker) {
        mapInstance.removeLayer(locationMarker);
      }

      // 添加当前位置标记
      locationMarker = L.marker([lat, lng], {
        icon: locationIcon,
        interactive: false, // 不可交互
        zIndexOffset: 900  // 确保在十字瞄准镜下方但在地图上方
      }).addTo(mapInstance);
    },

    // 更新位置标记的方向
    updateLocationDirection(direction) {
      this.currentDirection = direction;
      if (locationMarker) {
        const position = locationMarker.getLatLng();
        this.createLocationMarker(position.lat, position.lng, direction);
      }
    },
    addLayer(layerId, layerInfo) {
      // 如果该图层已存在，先移除
      if (this.layerGroups[layerId]) {
        this.removeLayer(layerId);
      }

      // 重置之前高亮的图层为原始颜色
      if (this.highlightedLayer) {
        const originalColor = this.highlightedLayer.isInvestigated ? '#00ff00' : '#0000ff';
        this.highlightedLayer.layer.setStyle({
          color: originalColor,
          fillColor: originalColor,
          fillOpacity: 0.3,
          weight: 2,
          opacity: 0.8
        });
        this.highlightedLayer = null;
      }

      // 创建新的图层组
      const layerGroup = L.layerGroup();

      // 遍历features数组，为每个feature创建图层
      if (layerInfo && layerInfo.features && Array.isArray(layerInfo.features)) {
        layerInfo.features.forEach((feature) => {
          // 根据isInvestigated确定颜色：true为绿色，false为蓝色
          const color = feature.isInvestigated ? '#00ff00' : '#0000ff';

          // 创建GeoJSON图层
          const geoJsonLayer = L.geoJSON(feature, {
            style: {
              color: color,
              fillColor: color,
              fillOpacity: 0.3,
              weight: 2,
              opacity: 0.8
            },
            pointToLayer: (feature, latlng) => {
              // 如果是点要素，创建圆形标记
              return L.circleMarker(latlng, {
                radius: 6,
                fillColor: color,
                color: color,
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.5
              });
            }
          });

          // 添加点击事件
          geoJsonLayer.on('click', (e) => {
            // 如果有之前高亮的图层，恢复其原始颜色
            if (this.highlightedLayer) {
              const originalColor = this.highlightedLayer.isInvestigated ? '#00ff00' : '#0000ff';
              this.highlightedLayer.layer.setStyle({
                color: originalColor,
                fillColor: originalColor,
                fillOpacity: 0.3,
                weight: 2,
                opacity: 0.8
              });
            }

            // 高亮当前点击的图层为红色
            e.target.setStyle({
              color: '#ff0000',
              fillColor: '#ff0000',
              fillOpacity: 0.5,
              weight: 3,
              opacity: 1
            });

            // 保存当前高亮的图层和其状态信息
            this.highlightedLayer = {
              layer: e.target,
              isInvestigated: feature.isInvestigated
            };

            // 在控制台打印properties和layerId
            console.log('Feature Properties:', feature.properties);
            console.log('Layer ID:', layerId);

            // 触发父组件事件，传递点击的要素数据
            this.$ownerInstance.callMethod('onFeatureClick', {
              ...feature,
              layerId: layerId,
            });
          });

          // 将图层添加到图层组
          layerGroup.addLayer(geoJsonLayer);
        });
      }

      // 将图层组添加到地图
      layerGroup.addTo(mapInstance);

      // 保存图层组引用
      this.layerGroups[layerId] = layerGroup;

      // 自动调整地图视图到该图层的范围
      // 创建一个边界对象来收集所有图层的边界
      let bounds = null;
      layerGroup.eachLayer((layer) => {
        if (layer.getBounds) {
          if (!bounds) {
            bounds = layer.getBounds();
          } else {
            bounds.extend(layer.getBounds());
          }
        } else if (layer.getLatLng) {
          // 对于点图层
          if (!bounds) {
            bounds = L.latLngBounds([layer.getLatLng()]);
          } else {
            bounds.extend(layer.getLatLng());
          }
        }
      });

      if (bounds && bounds.isValid()) {
        mapInstance.fitBounds(bounds, {
          padding: [50, 50], // 添加内边距，使图层不会紧贴边缘
          maxZoom: 16 // 限制最大缩放级别，避免过度放大
        });
      }
    },
    removeLayer(layerId) {
      // 检查图层是否存在
      if (this.layerGroups[layerId]) {
        // 从地图移除图层组
        mapInstance.removeLayer(this.layerGroups[layerId]);

        // 从存储中删除图层组引用
        delete this.layerGroups[layerId];

        // 如果移除的图层包含高亮的要素，清除高亮引用
        if (this.highlightedLayer && this.highlightedLayer._map === null) {
          this.highlightedLayer = null;
        }
      }
    },
    addOrRemoveLayer(data) {
      const { visible, layerId, layerInfo } = data;
      if (visible) {
        this.addLayer(layerId, layerInfo);
      } else {
        this.removeLayer(layerId);
      }
    },
    // 定位到指定图层
    fitToLayerById(layerId) {
      if (!mapInstance || !this.layerGroups[layerId]) {
        console.warn('地图实例或图层不存在:', layerId);
        return;
      }

      const layerGroup = this.layerGroups[layerId];

      // 创建边界对象来收集所有图层的边界
      let bounds = null;
      layerGroup.eachLayer((layer) => {
        if (layer.getBounds) {
          if (!bounds) {
            bounds = layer.getBounds();
          } else {
            bounds.extend(layer.getBounds());
          }
        } else if (layer.getLatLng) {
          // 对于点图层
          if (!bounds) {
            bounds = L.latLngBounds([layer.getLatLng()]);
          } else {
            bounds.extend(layer.getLatLng());
          }
        }
      });

      if (bounds && bounds.isValid()) {
        mapInstance.fitBounds(bounds, {
          padding: [50, 50], // 添加内边距，使图层不会紧贴边缘
          maxZoom: 16, // 限制最大缩放级别，避免过度放大
          animate: true, // 启用动画
          duration: 0.5 // 动画持续时间（秒）
        });
      } else {
        console.warn('图层边界无效:', layerId);
      }
    }
  },
  watch: {
    layerType(newVal) {
      if (mapInstance && this.baseLayers) {
        this.setBaseLayer(newVal);
      }
    },
    currentOperateLayer: {
      handler(newVal) {
        this.addOrRemoveLayer(newVal);
      },
      deep: true,
    }
  }
};
</script>
