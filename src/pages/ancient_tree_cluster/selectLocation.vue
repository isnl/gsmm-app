<script lang="ts">
import { ref, defineComponent } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { service } from '@/service';

export default defineComponent({
  methods: {
    handleMapClick(data: any) {
      this.selectedPoint = data;
    },
  },
  setup() {
    // 页面参数
    const gsqId = ref('');
    const gsqbh = ref('');
    const type = ref<'tree' | 'plot'>('tree');

    // 古树群范围数据
    const clusterPolygon = ref<any>(null);

    // 当前选中的点位
    const selectedPoint = ref<{ lng: number; lat: number } | null>(null);

    // 标题
    const title = ref('选择点位');

    // 加载古树群范围数据
    const loadClusterBoundary = async (id: string) => {
      try {
        uni.showLoading({
          title: '加载中...',
          mask: true,
        });

        const res = await service({
          url: `/gu_shu_quns/${id}`,
          method: 'GET',
        });

        uni.hideLoading();

        if (res && res.data && res.data.geom) {
          clusterPolygon.value = res.data.geom;
          console.log('古树群范围已加载，坐标点数量:', res.data.geom.coordinates[0].length);

          // 不自动设置中心点，等待用户点击
        }
      } catch (error: any) {
        uni.hideLoading();
        console.error('加载古树群范围失败:', error);
        uni.showToast({
          title: error.message || '加载失败',
          icon: 'none',
        });
      }
    };

    // 计算多边形中心点
    const calculatePolygonCenter = (coordinates: number[][]) => {
      if (!coordinates || coordinates.length === 0) return null;

      let totalLng = 0;
      let totalLat = 0;
      const count = coordinates.length;

      for (let i = 0; i < count; i++) {
        totalLng += coordinates[i][0];
        totalLat += coordinates[i][1];
      }

      return {
        lng: totalLng / count,
        lat: totalLat / count,
      };
    };

    // 判断点是否在多边形内（射线法）
    const isPointInPolygon = (point: { lng: number; lat: number }, polygon: number[][]) => {
      if (!polygon || polygon.length === 0) return false;

      const x = point.lng;
      const y = point.lat;
      let inside = false;

      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0];
        const yi = polygon[i][1];
        const xj = polygon[j][0];
        const yj = polygon[j][1];

        const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }

      return inside;
    };

    // 地图点击选点
    const handleMapClick = (point: { lng: number; lat: number }) => {
      selectedPoint.value = point;
      console.log('选中点位:', point);
    };

    // 确认选点
    const handleConfirm = () => {
      // 1. 检查是否已选点
      if (!selectedPoint.value) {
        uni.showToast({
          title: '请先在地图上点击选择点位',
          icon: 'none',
          duration: 2000,
        });
        return;
      }

      // 2. 检查点位是否在古树群范围内
      if (clusterPolygon.value && clusterPolygon.value.coordinates && clusterPolygon.value.coordinates[0]) {
        const isInside = isPointInPolygon(selectedPoint.value, clusterPolygon.value.coordinates[0]);

        if (!isInside) {
          uni.showModal({
            title: '提示',
            content: '选择的点位不在古树群范围内，请重新选择',
            showCancel: false,
            confirmText: '知道了',
          });
          return;
        }
      }

      // 3. 在范围内，跳转到新增页面
      const targetUrl =
        type.value === 'tree'
          ? `/pages/ancient_tree/index?gsqId=${gsqId.value}&gsqbh=${gsqbh.value}&jd=${selectedPoint.value.lng.toFixed(6)}&wd=${selectedPoint.value.lat.toFixed(
              6,
            )}`
          : `/pages/ancient_tree_cluster_sample/index?gsqId=${gsqId.value}&gsqbh=${gsqbh.value}&jd=${selectedPoint.value.lng.toFixed(
              6,
            )}&wd=${selectedPoint.value.lat.toFixed(6)}`;

      uni.redirectTo({
        url: targetUrl,
      });
    };

    // 取消
    const handleCancel = () => {
      uni.navigateBack();
    };

    // 页面加载
    onLoad((options: any) => {
      if (options) {
        gsqId.value = options.gsqId || '';
        gsqbh.value = options.gsqbh || '';
        type.value = options.type || 'tree';

        title.value = type.value === 'tree' ? '选择古树点位' : '选择样方点位';

        if (gsqId.value) {
          setTimeout(() => {
            loadClusterBoundary(gsqId.value);
          }, 1000); // 延长延迟时间，确保地图完全加载
        } else {
          uni.showToast({
            title: '缺少古树群ID参数',
            icon: 'none',
          });
        }
      }
    });

    return {
      gsqId,
      gsqbh,
      type,
      clusterPolygon,
      selectedPoint,
      title,
      handleConfirm,
      handleCancel,
      handleMapClick,
    };
  },
});
</script>

<template>
  <view class="w-full h-full flex flex-col">
    <!-- 顶部标题栏 -->
    <view class="w-full bg-gradient-to-b from-#08bd92 to-#07a47f px-20px pt-30px pb-15px border-b-1px border-#eee">
      <view class="flex items-center justify-between">
        <text class="text-16px font-bold color-#333">{{ title }}</text>
        <view class="px-10px py-4px bg-#e6f7f1 rounded-4px">
          <text class="text-12px color-#01bd8d">{{ gsqbh || '古树群' }}</text>
        </view>
      </view>
    </view>

    <!-- 地图区域 -->
    <view class="flex-1 relative">
      <view
        id="selectMap"
        :selected-point="selectedPoint"
        :change:selected-point="renderjs.receiveSelectedPoint"
        :polygon="clusterPolygon"
        :change:polygon="renderjs.receivePolygon"
        class="w-full h-full renderjs"
      ></view>

      <!-- 坐标显示（仅在选中点位后显示） -->
      <view
        v-if="selectedPoint"
        class="absolute top-15px left-15px bg-#fff px-15px py-12px rounded-10px"
        style="box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); z-index: 1000"
      >
        <text class="text-13px color-#666 block mb-6px font-medium">经度: {{ selectedPoint.lng.toFixed(6) }}</text>
        <text class="text-13px color-#666 block font-medium">纬度: {{ selectedPoint.lat.toFixed(6) }}</text>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="w-full bg-#fff px-20px py-15px border-t-1px border-#eee flex gap-15px">
      <view @click="handleCancel" class="flex-1 h-48px bg-#f5f5f5 fc rounded-8px">
        <text class="text-16px color-#666">取消</text>
      </view>
      <view @click="handleConfirm" class="flex-1 h-48px bg-#01bd8d fc rounded-8px" :class="!selectedPoint ? 'opacity-50' : ''">
        <text class="text-16px color-#fff font-bold">确认选点</text>
      </view>
    </view>
  </view>
</template>

<style scoped></style>

<script module="renderjs" lang="renderjs">
import L from 'leaflet';

let mapInstance = null;
let polygonLayer = null;
let pointMarker = null;

export default {
  mounted() {
    this.link = document.createElement('link');
    this.link.rel = 'stylesheet';
    this.link.href = 'static/leaflet/dist/leaflet.css';
    document.head.appendChild(this.link);

    this.$nextTick(() => {
      this.initMap();
    });
    this.$nextTick(() => {
      this.initMap();
    });
  },
  methods: {
    receiveSelectedPoint(newValue, oldValue, ownerVm, vm) {
      if (newValue && newValue.lng && newValue.lat) {
        this.drawPointMarker(newValue);
      }
    },
    receivePolygon(newValue, oldValue, ownerVm, vm) {
      if (newValue && newValue.coordinates) {
        console.log('接收到多边形数据，开始绘制');
        // 延迟绘制，确保地图已完全加载
        setTimeout(() => {
          this.drawPolygon(newValue);
        }, 300);
      }
    },
    initMap() {
      try {
        const token = '64a7440068a2bbc276c11927b54458f4';

        console.log('初始化地图...');

        // 创建地图实例
        mapInstance = L.map('selectMap', {
          crs: L.CRS.EPSG4326,
          zoomControl: false,
          attributionControl: false,
          minZoom: 1,
          maxZoom: 18,
        }).setView([44.103369, 82.136527], 12);

        console.log('地图实例创建成功');

        // 添加天地图影像图层（关键：zoomOffset: 1）
        const imgUrl = 'https://t{s}.tianditu.gov.cn/img_c/wmts?layer=img&style=default&tilematrixset=c&Service=WMTS&Request=GetTile&Version=1.0.0&Format=tiles&TileMatrix={z}&TileCol={x}&TileRow={y}&tk=' + token;
        L.tileLayer(imgUrl, {
          subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
          maxZoom: 18,
          zoomOffset: 1,  // 关键配置：修正瓦片层级偏移
        }).addTo(mapInstance);

        console.log('影像图层加载成功');

        // 添加天地图影像注记图层（关键：zoomOffset: 1）
        const ciaUrl = 'https://t{s}.tianditu.gov.cn/cia_c/wmts?layer=cia&style=default&tilematrixset=c&Service=WMTS&Request=GetTile&Version=1.0.0&Format=tiles&TileMatrix={z}&TileCol={x}&TileRow={y}&tk=' + token;
        L.tileLayer(ciaUrl, {
          subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
          maxZoom: 18,
          zoomOffset: 1,  // 关键配置：修正瓦片层级偏移
        }).addTo(mapInstance);

        console.log('注记图层加载成功');

        // 监听地图点击事件
        mapInstance.on('click', (e) => {
          const point = {
            lng: e.latlng.lng,
            lat: e.latlng.lat,
          };
          console.log('地图点击:', point);

          // 通知 Vue 层更新选中点位
          this.$ownerInstance.callMethod('handleMapClick', point);

          // 绘制点标记
          this.drawPointMarker(point);
        });

        console.log('地图初始化完成');
      } catch (error) {
        console.error('地图初始化失败:', error);
      }
    },
    drawPointMarker(point) {
      if (!mapInstance || !point) return;

      try {
        // 清除旧的点标记
        if (pointMarker) {
          mapInstance.removeLayer(pointMarker);
          pointMarker = null;
        }

        // 创建红色圆点标记
        pointMarker = L.circleMarker([point.lat, point.lng], {
          radius: 8,              // 圆点半径
          fillColor: '#ff5252',   // 红色填充
          color: '#fff',          // 白色边框
          weight: 3,              // 边框宽度
          opacity: 1,             // 边框不透明度
          fillOpacity: 1,         // 填充不透明度
        }).addTo(mapInstance);

        console.log('点标记绘制成功:', point);
      } catch (error) {
        console.error('绘制点标记失败:', error);
      }
    },
    drawPolygon(geom) {
      if (!mapInstance || !geom || !geom.coordinates || !geom.coordinates[0]) {
        console.error('无法绘制多边形：参数不完整');
        return;
      }

      try {
        const coords = geom.coordinates[0];
        console.log('开始绘制多边形，坐标点数量:', coords.length);

        // 清除旧的多边形
        if (polygonLayer) {
          mapInstance.removeLayer(polygonLayer);
          polygonLayer = null;
        }

        // 如果坐标点太多，进行简化（每隔 N 个点取一个）
        let simplifiedCoords = coords;
        if (coords.length > 100) {
          const step = Math.ceil(coords.length / 100);
          simplifiedCoords = coords.filter((_, index) => index % step === 0);
          // 确保首尾相连
          if (simplifiedCoords[simplifiedCoords.length - 1] !== coords[coords.length - 1]) {
            simplifiedCoords.push(coords[coords.length - 1]);
          }
          console.log('坐标简化: 从', coords.length, '简化到', simplifiedCoords.length);
        }

        // 转换坐标格式 [lng, lat] -> [lat, lng]
        const latlngs = simplifiedCoords.map(coord => [coord[1], coord[0]]);
        console.log('坐标转换完成');

        // 绘制多边形（更醒目的样式 + 优化渲染性能）
        polygonLayer = L.polygon(latlngs, {
          color: '#01bd8d',        // 边框颜色：主题绿色
          fillColor: '#01bd8d',    // 填充颜色：主题绿色
          fillOpacity: 0,       // 填充透明度：稍微提高一点
          weight: 3,               // 边框宽度：加粗到 3px
          opacity: 0.8,            // 边框透明度
          dashArray: '10, 5',      // 虚线样式：10px 实线 + 5px 间隔
          smoothFactor: 1.0,       // 简化线条
          interactive: false,      // 禁用交互，提升性能
        }).addTo(mapInstance);

        console.log('多边形绘制成功');

        // 让地图适应多边形范围
        mapInstance.fitBounds(polygonLayer.getBounds(), {
          padding: [50, 50],
          maxZoom: 15,
          animate: false, // 禁用动画，提升性能
        });

        console.log('地图视野调整完成');
      } catch (error) {
        console.error('绘制多边形失败:', error);
      }
    },
  },
};
</script>
