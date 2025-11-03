<template>
  <view class="w-full h-full relative">
    <view
      id="map"
      :geometry="geometry"
      :change:geometry="renderjs.receiveGeometry"
      :currentOperateLayer="currentOperateLayer"
      :layerType="layerType"
      :change:layerType="renderjs.receiveLayerType"
      :location="location"
      :change:location="renderjs.receiveLocation"
      :direction="direction"
      :change:direction="renderjs.receiveDirection"
      :currentLocation="currentLocation"
      :change:currentLocation="renderjs.receiveCurrentLocation"
      :fitToLayerId="fitToLayerId"
      :change:fitToLayerId="renderjs.receiveFitToLayerId"
      :isDrawing="isDrawing"
      :change:isDrawing="renderjs.receiveDrawingMode"
      :undoTrigger="undoTrigger"
      :change:undoTrigger="renderjs.receiveUndoTrigger"
      :clearTreeTrigger="clearTreeTrigger"
      :change:clearTreeTrigger="renderjs.receiveClearTreeTrigger"
      :treeMarkersData="treeMarkersData"
      :change:treeMarkersData="renderjs.receiveTreeMarkersData"
      :treeClusterPolygonsData="treeClusterPolygonsData"
      :change:treeClusterPolygonsData="renderjs.receiveTreeClusterPolygonsData"
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
      class="absolute right-10px top-252px gap-3px w-46px h-46px bg-#fff shadow-[0px_0px_12px_1px_rgba(16,70,60,0.18)] rounded-10px z-9 flex flex-col items-center justify-center"
      @click="$emit('onHandleLocation')"
    >
      <view v-if="isLocating" class="w-20px h-20px flex items-center justify-center">
        <uni-icons class="animate-spin text-#333" type="refreshempty" size="30"></uni-icons>
      </view>
      <image v-else src="/static/images/icons/dingwei.png" mode="scaleToFill" class="w-20px h-20px"></image>
    </view>
    <!-- 缩放级别显示 -->
    <view
      :style="{ ...locationStyle, top: `${parseInt(locationStyle.top || '252px') + 52}px` }"
      class="absolute right-10px w-46px h-46px bg-#fff shadow-[0px_0px_12px_1px_rgba(16,70,60,0.18)] rounded-10px z-9 flex flex-col items-center justify-center"
    >
      <text class="text-#333 text-14px font-bold">{{ Math.round(currentZoom) }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'LeafletMap',
  emits: ['onMapMove', 'onHandleLocation', 'onFeatureClick', 'onTreeMarkerClick'],
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

    onTreeMarkerClick(data) {
      this.$emit('onTreeMarkerClick', data);
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

    // 开始绘制
    startDrawing() {
      // 通知 renderjs 层开始绘制
      this.isDrawing = true;
    },

    // 完成绘制 - 接收从 renderjs 层返回的数据
    finishDrawing() {
      // 先触发状态改变，让 renderjs 同步数据
      this.isDrawing = false;
      // 等待下一个 tick，确保 renderjs watch 已经执行
      return new Promise(resolve => {
        this.$nextTick(() => {
          // 稍微延迟一下，确保数据已同步
          setTimeout(() => {
            resolve(this.polygonData);
          }, 50);
        });
      });
    },

    // 取消绘制
    cancelDrawing() {
      this.isDrawing = false;
      this.polygonData = null;
    },

    // 保存多边形数据（由renderjs调用）
    savePolygonData(data) {
      this.polygonData = data;
    },

    // 撤销最后一个点
    undoLastPoint() {
      // 触发 renderjs 层撤销最后一个点
      this.undoTrigger = Math.random();
    },

    // 清除古树标记点和古树群面
    clearTreeMarkers() {
      this.clearTreeTrigger = {
        random: Math.random(),
        type: 'markers',
      };
    },

    clearTreeClusterPolygons() {
      this.clearTreeTrigger = {
        random: Math.random(),
        type: 'polygons',
      };
    },

    // 清除所有古树相关数据（标记点和面）
    clearAllTreeData() {
      this.clearTreeTrigger = {
        random: Math.random(),
        type: 'all',
      };
    },

    // 添加古树标记点
    addTreeMarkers(markers) {
      this.treeMarkersData = {
        random: Math.random(),
        markers: markers,
      };
    },

    // 添加古树群面
    addTreeClusterPolygons(polygons) {
      this.treeClusterPolygonsData = {
        random: Math.random(),
        polygons: polygons,
      };
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
      // 绘制相关
      isDrawing: false,
      polygonData: null,
      undoTrigger: 0,
      // 清除古树相关数据的触发器
      clearTreeTrigger: {
        random: 0,
        type: '',
      },
      // 古树标记点数据
      treeMarkersData: {
        random: 0,
        markers: [],
      },
      // 古树群面数据
      treeClusterPolygonsData: {
        random: 0,
        polygons: [],
      },
    };
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
let crosshairLayer;

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
      layerGroups: {}, // 存储图层组，key为layerId
      highlightedLayer: null, // 当前高亮的图层
      isDrawing: false, // 绘制模式
      drawingPoints: [], // 绘制的点集合
      drawingPolygon: null, // 绘制的多边形对象
      drawingMarkers: [], // 绘制的标记点
      treeMarkersLayer: null, // 古树标记点图层
      treeMarkers: [], // 古树标记点数组
      treeClusterPolygonsLayer: null, // 古树群面图层
      treeClusterPolygons: [], // 古树群面数组
      highlightedTreeClusterPolygon: null // 当前高亮的古树群面
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
    receiveLayerType(newValue, oldValue, ownerVm, vm) {
      if (newValue && mapInstance && this.baseLayers) {
        this.setBaseLayer(newValue);
      }
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
    receiveDrawingMode(newValue, oldValue, ownerVm, vm) {
      if (newValue) {
        this.startDrawingMode();
      } else {
        // 从绘制模式切换到非绘制模式时，先保存数据再停止
        if (oldValue === true) {
          const polygonData = this.getDrawnPolygon();
          this.$ownerInstance.callMethod('savePolygonData', polygonData);
        }
        this.stopDrawingMode();
      }
    },
    receiveUndoTrigger(newValue, oldValue, ownerVm, vm) {
      if (this.isDrawing) {
        this.undoLastDrawingPoint();
      }
    },
    receiveClearTreeTrigger(newValue, oldValue, ownerVm, vm) {
      console.log('receiveClearTreeTrigger 被调用:', newValue);
      if (newValue && newValue.type) {
        if (newValue.type === 'markers') {
          this.renderClearTreeMarkers();
        } else if (newValue.type === 'polygons') {
          this.renderClearTreeClusterPolygons();
        } else if (newValue.type === 'all') {
          // 清除所有古树相关数据
          console.log('准备清除所有古树数据');
          this.renderClearTreeMarkers();
          this.renderClearTreeClusterPolygons();
        }
      }
    },
    receiveTreeMarkersData(newValue, oldValue, ownerVm, vm) {
      if (newValue && newValue.markers) {
        this.renderTreeMarkers(newValue.markers);
      }
    },
    receiveTreeClusterPolygonsData(newValue, oldValue, ownerVm, vm) {
      if (newValue && newValue.polygons) {
        this.renderTreeClusterPolygons(newValue.polygons);
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
      this.setBaseLayer(this.layerType || "img");

      // 添加固定的注记图层
      this.annotationLayer.addTo(mapInstance);
      // 创建十字瞄准镜图层
      this.createCrosshair();
      // 创建geometry图层
      this.geometryLayer = L.layerGroup().addTo(mapInstance);

      // 创建古树标记点图层
      this.treeMarkersLayer = L.layerGroup().addTo(mapInstance);

      // 创建古树群面图层
      this.treeClusterPolygonsLayer = L.layerGroup().addTo(mapInstance);

      // 添加官方比例尺控件到左上角位置
      const officialScaleControl = L.control.scale({
        position: 'topleft',
        metric: true,
        imperial: false,
      });
      officialScaleControl.addTo(mapInstance);
      officialScaleControl._container.style.left = "10px"
      officialScaleControl._container.style.top = "80px"
      officialScaleControl._container.style.marginLeft = "0"

      // 监听地图移动事件
      mapInstance.on('moveend', () => {
        const center = mapInstance.getCenter();
        const zoom = mapInstance.getZoom();
        this.$ownerInstance.callMethod('onMapMove', { center, zoom });
      });

      // 初始化时设置一次中心点坐标
      const initialCenter = mapInstance.getCenter();
      const initialZoom = mapInstance.getZoom();
      this.$ownerInstance.callMethod('onMapMove', {
        center: initialCenter,
        zoom: initialZoom,
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
            <line x1="15" y1="5" x2="15" y2="25" stroke="#ff0000" stroke-width="3" opacity="0.8" stroke-linecap="round"/>
            <line x1="5" y1="15" x2="25" y2="15" stroke="#ff0000" stroke-width="3" opacity="0.8" stroke-linecap="round"/>
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
    },

    // 开始绘制模式
    startDrawingMode() {
      this.isDrawing = true;
      this.drawingPoints = [];
      this.drawingMarkers = [];

      // 添加地图点击事件
      if (mapInstance) {
        mapInstance.on('click', this.onMapClick);
        // 改变鼠标样式
        mapInstance.getContainer().style.cursor = 'crosshair';
      }
    },

    // 停止绘制模式
    stopDrawingMode() {
      this.isDrawing = false;

      // 移除地图点击事件
      if (mapInstance) {
        mapInstance.off('click', this.onMapClick);
        // 恢复鼠标样式
        mapInstance.getContainer().style.cursor = '';
      }

      // 清除绘制的图形
      this.clearDrawing();
    },

    // 地图点击事件 - 添加绘制点
    onMapClick(e) {
      if (!this.isDrawing) return;

      const latlng = e.latlng;
      this.drawingPoints.push([latlng.lng, latlng.lat]);

      // 添加标记点
      const marker = L.circleMarker([latlng.lat, latlng.lng], {
        radius: 6,
        fillColor: '#01bd8d',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 1
      }).addTo(mapInstance);

      this.drawingMarkers.push(marker);

      // 如果已有2个以上的点，绘制多边形
      if (this.drawingPoints.length >= 2) {
        this.updateDrawingPolygon();
      }
    },

    // 更新绘制的多边形
    updateDrawingPolygon() {
      // 移除旧的多边形
      if (this.drawingPolygon) {
        mapInstance.removeLayer(this.drawingPolygon);
      }

      // 创建新的多边形（需要转换坐标格式：lng,lat -> lat,lng）
      const latlngs = this.drawingPoints.map(point => [point[1], point[0]]);

      this.drawingPolygon = L.polygon(latlngs, {
        color: '#01bd8d',
        fillColor: '#01bd8d',
        fillOpacity: 0.3,
        weight: 2
      }).addTo(mapInstance);
    },

    // 清除绘制
    clearDrawing() {
      // 移除所有标记点
      this.drawingMarkers.forEach(marker => {
        mapInstance.removeLayer(marker);
      });
      this.drawingMarkers = [];

      // 移除多边形
      if (this.drawingPolygon) {
        mapInstance.removeLayer(this.drawingPolygon);
        this.drawingPolygon = null;
      }

      this.drawingPoints = [];
    },

    // 获取绘制的多边形数据（供父组件调用）
    getDrawnPolygon() {
      if (this.drawingPoints.length < 3) {
        return null;
      }

      // 返回 GeoJSON 格式的多边形数据
      // 闭合多边形（首尾点相同）
      const coordinates = [...this.drawingPoints, this.drawingPoints[0]];

      return {
        type: 'Polygon',
        coordinates: [coordinates]
      };
    },

    // 撤销最后一个绘制点
    undoLastDrawingPoint() {
      if (this.drawingPoints.length === 0) {
        return;
      }

      // 移除最后一个点
      this.drawingPoints.pop();

      // 移除最后一个标记
      if (this.drawingMarkers.length > 0) {
        const lastMarker = this.drawingMarkers.pop();
        mapInstance.removeLayer(lastMarker);
      }

      // 重新绘制多边形
      if (this.drawingPoints.length >= 2) {
        this.updateDrawingPolygon();
      } else {
        // 如果少于2个点，移除多边形
        if (this.drawingPolygon) {
          mapInstance.removeLayer(this.drawingPolygon);
          this.drawingPolygon = null;
        }
      }
    },

    // 添加古树标记点（在 renderjs 中使用，重命名避免与 Vue 组件方法冲突）
    renderTreeMarkers(markers) {
      if (!this.treeMarkersLayer) {
        return;
      }

      // 清除现有标记点
      this.treeMarkersLayer.clearLayers();
      this.treeMarkers = [];

      // 添加新的标记点
      markers.forEach(markerData => {
        const { lat, lng, iconUrl, id, data, isPlot } = markerData;

        // 创建自定义图标
        const customIcon = L.icon({
          iconUrl: iconUrl,
          iconSize: [26, 28], // 图标大小
          iconAnchor: [13, 14], // 图标锚点（底部中心）
          popupAnchor: [0, -32] // 弹窗锚点
        });

        // 创建标记点
        const marker = L.marker([lat, lng], {
          icon: customIcon
        });

        // 绑定点击事件
        marker.on('click', () => {
          // 通过 $ownerInstance 调用父组件的方法
          this.$ownerInstance.callMethod('onTreeMarkerClick', {
            id,
            lat,
            lng,
            data,
            isPlot
          });
        });

        // 添加到图层
        marker.addTo(this.treeMarkersLayer);

        // 保存引用
        this.treeMarkers.push(marker);
      });

      console.log(`已添加 ${markers.length} 个古树标记点`);
    },

    // 清除古树标记点（在 renderjs 中使用，重命名避免与 Vue 组件方法冲突）
    renderClearTreeMarkers() {
      console.log('清除古树标记点');
      if (this.treeMarkersLayer) {
        this.treeMarkersLayer.clearLayers();
        this.treeMarkers = [];
        console.log('古树标记点已清除');
      } else {
        console.log('古树标记点图层未初始化');
      }
    },

    // 添加古树群面数据（在 renderjs 中使用，重命名避免与 Vue 组件方法冲突）
    renderTreeClusterPolygons(polygons) {
      if (!this.treeClusterPolygonsLayer) {
        console.error('古树群面图层未初始化');
        return;
      }

      // 清空之前的图层
      this.renderClearTreeClusterPolygons();

      polygons.forEach(polygonData => {
        const { id, geom, properties, color } = polygonData;

        // 确保 geom 是 GeoJSON 格式
        if (!geom || !geom.coordinates) {
          console.warn('古树群面数据缺少 geom 字段:', id);
          return;
        }

        // 转换坐标格式 (GeoJSON 格式: [lng, lat])
        const latlngs = geom.coordinates[0].map(coord => [coord[1], coord[0]]);

        // 创建多边形
        const polygon = L.polygon(latlngs, {
          color: color,
          fillColor: color,
          fillOpacity: 0.3,
          weight: 2,
          opacity: 0.8
        });

        // 添加点击事件
        polygon.on('click', (e) => {
          // 如果有之前高亮的面，恢复其原始颜色
          if (this.highlightedTreeClusterPolygon) {
            const originalPolygonData = this.highlightedTreeClusterPolygon.data;
            this.highlightedTreeClusterPolygon.layer.setStyle({
              color: originalPolygonData.color,
              fillColor: originalPolygonData.color,
              fillOpacity: 0.3,
              weight: 2,
              opacity: 0.8
            });
          }

          // 高亮当前点击的面为红色
          e.target.setStyle({
            color: '#ff0000',
            fillColor: '#ff0000',
            fillOpacity: 0.5,
            weight: 3,
            opacity: 1
          });

          // 保存当前高亮的面和其状态信息
          this.highlightedTreeClusterPolygon = {
            layer: e.target,
            data: polygonData
          };

          // 触发父组件事件，传递点击的要素数据
          this.$ownerInstance.callMethod('onFeatureClick', {
            type: 'Feature',
            properties: properties || {},
            geometry: geom,
            id: id
          });
        });

        // 添加到图层
        polygon.addTo(this.treeClusterPolygonsLayer);

        // 保存引用
        this.treeClusterPolygons.push({
          id,
          polygon,
          data: polygonData
        });
      });

      console.log(`已添加 ${polygons.length} 个古树群面`);
    },

    // 清除古树群面（在 renderjs 中使用，重命名避免与 Vue 组件方法冲突）
    renderClearTreeClusterPolygons() {
      console.log('清除古树群面');
      if (this.treeClusterPolygonsLayer) {
        this.treeClusterPolygonsLayer.clearLayers();
        this.treeClusterPolygons = [];
        this.highlightedTreeClusterPolygon = null;
        console.log('古树群面已清除');
      } else {
        console.log('古树群面图层未初始化');
      }
    }
  },
  watch: {
    currentOperateLayer: {
      handler(newVal) {
        this.addOrRemoveLayer(newVal);
      },
      deep: true,
    }
  }
};
</script>
