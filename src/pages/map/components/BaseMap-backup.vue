<template>
  <view class="w-full h-full relative">
    <view
      id="map"
      :markers="markers"
      :change:markers="renderjs.receiveMarkers"
      :geometry="geometry"
      :change:geometry="renderjs.receiveGeometry"
      :location="location"
      :change:location="renderjs.receiveLocation"
      ref="mapContainer"
      class="renderjs w-full h-full z-0"
    ></view>
  </view>
</template>

<script>
export default {
  name: 'LeafletMap',
  emits: ['onMarkerClick', 'onMapMove'],
  props: {
    markers: {
      type: Array,
      default: () => [],
    },
    geometry: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      mapId: 'map-' + Date.now().toString() + Math.floor(Math.random() * 1000),
      location: {
        random: Math.random(),
        lat: 0,
        lng: 0,
      },
    };
  },
  methods: {
    moveToLocation({ lat, lng }) {
      this.location = {
        random: Math.random(),
        lat,
        lng,
      };
    },
    onMarkerClick(data) {
      this.$emit('onMarkerClick', data);
    },
    onMapMove({ center, zoom }) {
      this.$emit('onMapMove', { center, zoom });
    },
    // 获取地图中心点
    getMapCenter() {
      return new Promise(resolve => {
        // 创建一个临时的回调函数名
        const callbackName = 'mapCenterCallback_' + Date.now();

        // 在全局注册回调函数
        window[callbackName] = center => {
          resolve(center);
          // 清理回调函数
          delete window[callbackName];
        };

        // 调用renderjs方法
        this.$refs.mapContainer.getMapCenter(callbackName);
      });
    },
  },
};
</script>

<style scoped></style>

<script module="renderjs" lang="renderjs">
import L from 'leaflet';
import * as turf from '@turf/turf';
import { MapTileCache } from '@/utils/mapCache';

// 创建实例
const mapTileCache = new MapTileCache();

let mapInstance;
let crosshairLayer;
let locationMarker;
let isOfflineMode = false;

export default {
  data() {
    return {
      markersLayer: null,
      baseLayers: {},
      currentBaseLayer: null,
      geometryLayer: null,
      isFitMarker: false
    };
  },
  async mounted() {
    this.link = document.createElement('link');
    this.link.rel = 'stylesheet';
    this.link.href = 'static/leaflet/dist/leaflet.css';
    document.head.appendChild(this.link);

    this.$nextTick(async () => {
      await mapTileCache.init();
      await this.checkNetworkStatus();

      // 检查缓存状态
      const stats = await mapTileCache.getCacheStats();
      console.log('缓存统计:', stats);

      this.initMap();
    });
  },
  methods: {
    receiveMarkers(newValue, oldValue, ownerVm, vm) {
      setTimeout(() => {
        this.updateMarkers(newValue);
      }, 10);
    },
    receiveGeometry(newValue, oldValue, ownerVm, vm) {
      this.updateGeometry(newValue);
    },
    receiveLocation(newValue, oldValue, ownerVm, vm) {
      if (newValue && newValue.lat && newValue.lng) {
        this.moveToLocation(newValue);
      }
    },
    // 检查网络状态
    async checkNetworkStatus() {
      try {
        const response = await fetch('https://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=1&TILEROW=0&TILECOL=0&tk=64a7440068a2bbc276c11927b54458f4', {
          method: 'HEAD',
          timeout: 5000
        });
        isOfflineMode = !response.ok;
      } catch (error) {
        isOfflineMode = true;
      }
      console.log('地图模式:', isOfflineMode ? '离线' : '在线');
    },

    initMap() {
      const tiandituKey = '64a7440068a2bbc276c11927b54458f4';
      mapInstance = L.map('map', {
        zoomControl: false,
        attributionControl: false,
        minZoom: 1,
        maxZoom: 18
      }).setView([29.65, 94.25], 12); // 改为林芝米兰市坐标

      // 创建离线优先的瓦片图层
      const OfflineTileLayer = L.TileLayer.extend({
        createTile: function(coords, done) {
          const tile = document.createElement('img');

          // 异步加载瓦片
          this.loadTileAsync(tile, coords, done);

          return tile;
        },

        loadTileAsync: async function(tile, coords, done) {
          try {
            console.log(`请求瓦片: z=${coords.z}, x=${coords.x}, y=${coords.y}`);
            // 将Leaflet瓦片坐标转换为经纬度，再转换为EPSG:4490瓦片坐标
            const tileBounds = this._tileCoordsToBounds(coords);
            const center = tileBounds.getCenter();

            // 使用EPSG:4490的坐标转换方法
            const epsg4490Coords = mapTileCache.deg2tile4490(center.lat, center.lng, coords.z);

            console.log(`坐标转换: Leaflet(${coords.x},${coords.y}) -> 经纬度(${center.lat.toFixed(6)},${center.lng.toFixed(6)}) -> EPSG4490(${epsg4490Coords.x},${epsg4490Coords.y})`);

            // 使用转换后的坐标查询缓存
            const cachedTile = await mapTileCache.getTile(coords.z, epsg4490Coords.x, epsg4490Coords.y);
            // 首先尝试从缓存加载
            // const cachedTile = await mapTileCache.getTile(coords.z, coords.x, coords.y);

            if (cachedTile) {
              // 使用缓存的瓦片
              tile.src = cachedTile;
              console.log('✅ 使用缓存瓦片: ', epsg4490Coords);
              done(null, tile);
              return;
            } else {
              console.log('❌ 缓存中无此瓦片: ', epsg4490Coords);
            }

            // 如果没有缓存且在线，从网络加载（不缓存）
            if (!isOfflineMode) {
              const onlineUrl = `https://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${coords.z}&TILEROW=${coords.y}&TILECOL=${coords.x}&tk=${tiandituKey}`;

              tile.onload = () => {
                done(null, tile);
                console.log('🌐 从网络加载瓦片: ', coords);
              };

              tile.onerror = () => {
                done(new Error('瓦片加载失败'), tile);
              };

              tile.src = onlineUrl;
            } else {
              // 离线模式且无缓存，显示占位图
              tile.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0cHgiIGZpbGw9IiM5OTkiPuemu+e6v+aXoOaVsOaNrjwvdGV4dD48L3N2Zz4=';
              console.log('📱 离线模式，无缓存瓦片: ', coords);
              done(null, tile);
            }

          } catch (error) {
            console.error('瓦片加载失败:', error);
            done(error, tile);
          }
        },
      });

      // 创建影像底图图层
      const tiandituImg = new OfflineTileLayer('', {
        maxZoom: 18,
        attribution: '天地图'
      });

      // 创建影像注记图层
      const tiandituCia = new OfflineTileLayer('', {
        maxZoom: 18,
        attribution: '天地图'
      });

      // 重写注记图层的URL生成
      tiandituCia.loadTileAsync = async function(tile, coords, done) {
        try {
          const cachedTile = await mapTileCache.getTile(coords.z, coords.x, coords.y, 'cia');

          if (cachedTile) {
            tile.src = cachedTile;
            done(null, tile);
            return;
          }

          if (!isOfflineMode) {
            const onlineUrl = `https://t0.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${coords.z}&TILEROW=${coords.y}&TILECOL=${coords.x}&tk=${tiandituKey}`;

            tile.onload = () => {
              done(null, tile);
              // 移除缓存功能
            };

            tile.onerror = () => done(new Error('注记瓦片加载失败'), tile);
            tile.src = onlineUrl;
          } else {
            // 注记图层离线时可以不显示
            tile.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            done(null, tile);
          }
        } catch (error) {
          done(error, tile);
        }
      };

      const imgGroup = L.layerGroup([tiandituImg, tiandituCia]);
      imgGroup.addTo(mapInstance);

      this.markersLayer = L.layerGroup().addTo(mapInstance);
      this.geometryLayer = L.layerGroup().addTo(mapInstance);
      this.createCrosshair();

      mapInstance.on('move', () => {
        const center = mapInstance.getCenter();
        const zoom = mapInstance.getZoom();
        this.$ownerInstance.callMethod('onMapMove', { center, zoom });
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

    updateMarkers(markers) {
      // 清除现有标记
      if(this.markersLayer){
        this.markersLayer.clearLayers();
      }

      if (!markers || markers.length === 0) {
        return;
      }

      // 添加新标记
      markers.forEach((marker, index) => {
        // 创建自定义图标
        let iconUrl = 'static/images/icons/daidiaocha_map_marker.png'; // 默认图标
        if (marker.iconUrl) {
          iconUrl = marker.iconUrl;
        }

        const customIcon = L.icon({
          iconUrl: iconUrl,
          iconSize: [32, 32], // 图标大小
          iconAnchor: [16, 16], // 图标锚点（底部中心）
        });
        const customIcons = L.divIcon({
          className: 'my-div-icon',
          html: `<div class="w-70px color-#fff ml--15px" style="text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000;">${marker.data.treeCode}</div><img class="w-32px h-32px" src="${iconUrl}" alt="">`,
          // iconSize: [32, 32], // 图标大小
          iconAnchor: [16, 32], // 图标锚点（底部中心）
        });
        const m = L.marker([marker.lat, marker.lng], {
          icon: customIcons,
        }).addTo(this.markersLayer);
        // 添加点击事件
        m.on('click', () => {
          console.log('Marker clicked in renderjs:', marker.data);
          this.$ownerInstance.callMethod('onMarkerClick', marker.data);
        });
      });

      // 使用turf库计算所有marker的边界并调整地图视图
      if(!this.isFitMarker){
        this.fitMarkersToView(markers);
        this.isFitMarker = true;
      }
    },

    // 使用turf库计算marker边界并调整地图视图
    fitMarkersToView(markers) {
      if (!markers || markers.length === 0) {
        return;
      }

      try {
        if (markers.length === 1) {
          // 只有一个marker时，直接定位到该点
          const marker = markers[0];
          mapInstance.setView([marker.lat, marker.lng], 16);
          return;
        }

        // 创建turf点集合
        const points = markers.map(marker =>
          turf.point([marker.lng, marker.lat])
        );

        // 创建点集合的FeatureCollection
        const pointCollection = turf.featureCollection(points);

        // 计算边界框
        const bbox = turf.bbox(pointCollection);

        // 将turf的bbox格式转换为Leaflet的bounds格式
        // turf bbox格式: [minX, minY, maxX, maxY] (经度, 纬度)
        // Leaflet bounds格式: [[minY, minX], [maxY, maxX]] (纬度, 经度)
        const bounds = [
          [bbox[1], bbox[0]], // 西南角 [minLat, minLng]
          [bbox[3], bbox[2]]  // 东北角 [maxLat, maxLng]
        ];

        // 调整地图视图以适应所有marker，添加适当的padding
        mapInstance.fitBounds(bounds, {
          padding: [50, 50], // 添加50像素的内边距
          maxZoom: 16 // 限制最大缩放级别，避免过度放大
        });

      } catch (error) {
        console.error('计算marker边界失败:', error);
        // 如果计算失败，使用传统方法
        this.fallbackFitMarkers(markers);
      }
    },

    // 备用方法：使用Leaflet原生方法计算边界
    fallbackFitMarkers(markers) {
      if (!markers || markers.length === 0) {
        return;
      }

      try {
        // 创建一个临时的LatLngBounds对象
        const group = new L.featureGroup();

        markers.forEach(marker => {
          const tempMarker = L.marker([marker.lat, marker.lng]);
          group.addLayer(tempMarker);
        });

        // 调整地图视图
        mapInstance.fitBounds(group.getBounds(), {
          padding: [50, 50],
          maxZoom: 16
        });

      } catch (error) {
        console.error('备用边界计算也失败:', error);
      }
    },

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
            color: '#01bd8d',
            weight: 2,
            opacity: 0.8,
            fillColor: '#01bd8d',
            fillOpacity: 0.2,
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

    // 获取地图中心点
    getMapCenter(callbackName) {
      if (mapInstance) {
        const center = mapInstance.getCenter();
        const centerData = {
          longitude: center.lng,
          latitude: center.lat,
        };

        // 调用全局回调函数
        if (typeof callbackName === 'string' && window[callbackName]) {
          window[callbackName](centerData);
        }

        return centerData;
      }
      return null;
    },

    // 移动地图到指定位置
    moveToLocation(location) {
      if (mapInstance && location && location.lat && location.lng) {
        mapInstance.setView([location.lat, location.lng], 16, {
          animate: true,
          duration: 1.0
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

    // 移除预下载功能，替换为简单的离线检查
    async checkOfflineCache() {
      if (isOfflineMode) {
        console.log('离线模式，将使用缓存瓦片');
        const stats = await mapTileCache.getCacheStats();
        console.log(`可用缓存瓦片数: ${stats.totalTiles}`);
      }
    }
  },
};
</script>
