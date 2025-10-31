<script lang="ts" setup>
import { onMounted, computed } from 'vue';
import { service } from '@/service';
import { useLayerStore, type LayerItem } from '@/stores/layer';

// 接收外部传入的当前图层类型
const props = defineProps({
  activeLayer: {
    type: String,
    default: 'img',
  },
});

const emit = defineEmits(['baseLayerChange', 'layerChange', 'locateLayer']);

const layerStore = useLayerStore();

const layerList = [
  {
    name: '天地图卫星地图',
    key: 'img',
    img: 'static/images/icons/tdt_image.png',
  },
  {
    name: '天地图电子地图',
    key: 'vec',
    img: 'static/images/icons/tdt_map.png',
  },
];
const checkImg = 'static/images/icons/checked.png';

// 使用 computed 获取图层列表
const apiLayerList = computed(() => layerStore.layerList);

// 节流控制
const throttleMap = new Map<number, number>();
const THROTTLE_DELAY = 1000; // 1秒内只能点击一次

const onLayerChange = (key: 'img' | 'vec') => {
  emit('baseLayerChange', key);
};

// 获取图层列表
const getApiLayerList = () => {
  service<{ data: LayerItem[] }>({
    url: '/layers',
  }).then(res => {
    if (res.statusCode === 200 && res.data) {
      // 如果是第一次加载，使用 setLayerList
      // 如果已有数据，使用 updateLayerList 保留激活状态
      if (layerStore.layerList.length === 0) {
        layerStore.setLayerList(res.data.data);
      } else {
        layerStore.updateLayerList(res.data.data);
      }
    }
  });
};

// 节流函数
const throttle = (id: number): boolean => {
  const now = Date.now();
  const lastTime = throttleMap.get(id) || 0;

  if (now - lastTime < THROTTLE_DELAY) {
    return false;
  }

  throttleMap.set(id, now);
  return true;
};

// 切换图层状态
const toggleLayer = async (layer: LayerItem) => {
  // 如果正在加载，不允许操作
  if (layer.isLoading) {
    return;
  }

  // 节流控制，直接返回不提示
  if (!throttle(layer.id)) {
    return;
  }

  // 如果是关闭状态，直接切换
  if (layer.isActive) {
    layerStore.toggleLayerActive(layer.id, false);
    emit('layerChange', {
      visible: false,
      layerId: layer.id,
      layerInfo: layer.featureData,
    });
    return;
  }

  // 如果是开启状态，需要调用接口
  layerStore.setLayerLoading(layer.id, true);

  try {
    const res = await service({
      url: '/layers/spatial_query',
      method: 'POST',
      params: {
        id: layer.id,
        state: 3, // 已完成的图层
      },
    });

    if (res.statusCode === 200) {
      // 接口请求成功后才切换状态
      layerStore.toggleLayerActive(layer.id, true);
      layerStore.setLayerFeatureData(layer.id, res.data);
      emit('layerChange', {
        visible: true,
        layerId: layer.id,
        layerInfo: res.data,
      });
      console.log('图层要素数据:', res.data);

      // TODO: 这里可以处理返回的要素数据，比如在地图上展示
    } else {
      uni.showToast({
        title: '加载图层失败',
        icon: 'none',
      });
    }
  } catch (error) {
    console.error('查询图层要素失败:', error);
    uni.showToast({
      title: '加载图层失败',
      icon: 'none',
    });
  } finally {
    layerStore.setLayerLoading(layer.id, false);
  }
};

// 定位到图层位置
const locateToLayer = (layer: LayerItem, event: Event) => {
  event.stopPropagation();

  if (!layer.featureData || layer.featureData.length === 0) {
    uni.showToast({
      title: '该图层暂无数据',
      icon: 'none',
    });
    return;
  }

  emit('locateLayer', layer);
};

// onMounted(() => {
//   getApiLayerList();
// });
</script>

<template>
  <view class="w-full h-full flex flex-col pt-30px px-10px overflow-hidden">
    <!-- 底图切换 -->
    <view class="w-full">
      <view class="w-full h-25px flex items-center pl-8px text-12px"> 底图切换 </view>
      <view class="w-full h-92px pl-18px pt-15px bg-#fff flex gap-16px">
        <view class="flex flex-col gap-6px" v-for="(item, index) in layerList" :key="index" @click="onLayerChange(item.key as 'img' | 'vec')">
          <view class="w-64px h-50px relative">
            <img :src="item.img" class="w-64px h-50px border-rd-3px" />
            <view class="absolute left-0 top-0 w-64px h-50px bg-[rgba(15,24,38,.72)] b-rd-3px fc" v-if="activeLayer === item.key">
              <img :src="checkImg" class="w-36px h-36px" />
            </view>
          </view>
          <text class="text-9px color-#000">{{ item.name }}</text>
        </view>
      </view>
    </view>

    <!-- 图层列表 -->
    <!-- <view class="w-full mt-20px flex-1 flex flex-col overflow-hidden">
      <view class="w-full h-25px flex items-center pl-8px text-12px"> 图层列表 </view>
      <view class="w-full flex flex-col flex-1 overflow-hidden">
        <scroll-view height="100%" :scroll-y="true" class="w-full overflow-hidden">
          <view
            v-for="(layer, index) in apiLayerList"
            :key="layer.id"
            class="w-full h-50px flex items-center justify-between px-15px border-b-1px border-#eee transition-all"
            :class="{
              'border-b-0': index === apiLayerList.length - 1,
              'bg-#f0fdf9': layer.isActive,
            }"
          >
            <text class="text-14px flex-1 transition-all" :class="layer.isActive ? 'color-#01bd8d font-500' : 'color-#333'">
              {{ layer.name }}
            </text>

            <view class="flex items-center gap-8px">
              <view
                v-if="layer.isActive"
                class="w-36px h-36px flex items-center justify-center border-rd-4px transition-all active:bg-#e0e0e0"
                @click="locateToLayer(layer, $event)"
              >
                <uni-icons type="location-filled" size="20" color="#01bd8d"></uni-icons>
              </view>

              <view v-if="layer.isLoading" class="w-36px h-36px flex items-center justify-center">
                <uni-icons type="spinner-cycle" size="20" color="#01bd8d"></uni-icons>
              </view>

              <view
                v-else
                class="w-36px h-36px flex items-center justify-center border-rd-4px transition-all"
                :class="layer.isActive ? 'bg-#e6f9f4 active:bg-#d0f3ea' : 'bg-#f5f5f5 active:bg-#e0e0e0'"
                @click="toggleLayer(layer)"
              >
                <uni-icons v-if="layer.isActive" type="eye-filled" size="20" color="#01bd8d"></uni-icons>
                <uni-icons v-else type="eye-slash-filled" size="20" color="#999"></uni-icons>
              </view>
            </view>
          </view>

          <view v-if="apiLayerList.length === 0" class="w-full h-100px flex items-center justify-center">
            <text class="text-12px color-#999">暂无图层数据</text>
          </view>
        </scroll-view>
      </view>
    </view> -->
  </view>
</template>
