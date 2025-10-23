<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useVectorAreaStore, type VectorAreaListItem } from '@/stores/vector_area';
import { useSelectedAreaStore } from '@/stores/selected_area';
import { storeToRefs } from 'pinia';

// 类型定义
interface PopupRef {
  open: (type: string) => void;
  close: () => void;
}

// Props
interface Props {
  visible: boolean;
  currentAreaName: string;
}

// Emits
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'update:currentAreaName', value: string): void;
  (e: 'update:selectedGeometry', value: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const vectorAreaStore = useVectorAreaStore();
const { lastVectorAreas } = storeToRefs(vectorAreaStore);

const selectedAreaStore = useSelectedAreaStore();
const { setSelectedAreaId, clearSelectedAreaId } = selectedAreaStore;
const { selectedAreaId } = storeToRefs(selectedAreaStore);

// 弹窗相关
const areaPopupRef = ref<PopupRef | null>(null);

// 监听弹窗状态
watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      uni.hideTabBar();
      areaPopupRef.value?.open('bottom');
    } else {
      areaPopupRef.value?.close();
      uni.showTabBar();
    }
  },
);

// 选择分区项目
const selectAreaItem = (areaListItem: VectorAreaListItem) => {
  // 根据 ID 获取完整的分区数据（包含 geom）
  const fullArea = vectorAreaStore.getAreaById(areaListItem.id);

  setSelectedAreaId(areaListItem.id);
  emit('update:currentAreaName', areaListItem.name);
  emit('update:selectedGeometry', fullArea?.geom || {});
  emit('update:visible', false);
  uni.showTabBar();
};

// 弹窗关闭时的处理函数
const onAreaPopupClose = () => {
  emit('update:visible', false);
  uni.showTabBar();
};

// 打开弹窗时的处理
const openPopup = () => {
  emit('update:visible', true);
};

// 重置选择
const resetSelection = () => {
  // 如果没有选中的分区，不能点击
  if (!selectedAreaId.value) {
    return;
  }

  // 重置分区选择
  clearSelectedAreaId();
  emit('update:currentAreaName', '分区');
  emit('update:selectedGeometry', {});

  // 关闭弹窗
  emit('update:visible', false);
  uni.showTabBar();
};

// 暴露方法给父组件
defineExpose({
  openPopup,
});
</script>

<template>
  <!-- 分区选择弹窗 -->
  <uni-popup ref="areaPopupRef" type="bottom" :is-mask-click="true" @maskClick="onAreaPopupClose" @change="(e: any) => emit('update:visible', e.show)">
    <view class="bg-white rounded-t-20px max-h-70vh">
      <view class="py-20px px-20px border-b-1px border-b-#f0f0f0 flex items-center justify-between">
        <text class="text-18px font-medium text-#333">选择分区</text>
        <view
          class="px-12px py-6px rounded-8px text-14px cursor-pointer transition-all duration-200"
          :class="selectedAreaId ? 'bgPrimary text-#fff' : 'bg-gray-100 text-gray-400 cursor-not-allowed'"
          @click="resetSelection"
        >
          重置
        </view>
      </view>

      <scroll-view scroll-y class="max-h-60vh">
        <view class="px-16px py-8px">
          <view v-if="lastVectorAreas.length === 0" class="text-center py-60px">
            <uni-icons type="info" size="40" color="#ccc" class="mb-12px"></uni-icons>
            <text class="block text-#999 text-16px">暂无分区数据</text>
            <text class="block text-#ccc text-14px mt-8px">请先在业务分区管理中获取数据</text>
          </view>

          <view
            v-for="area in lastVectorAreas"
            :key="area.id"
            class="bg-white rounded-12px mb-12px p-16px shadow-sm border-1px border-transparent cursor-pointer transition-all duration-200"
            :class="{
              'border-#08bd92 bg-#08bd92/5': selectedAreaId === area.id,
              'hover:shadow-md': selectedAreaId !== area.id,
            }"
            @click="selectAreaItem(area)"
          >
            <!-- 头部：名称和几何类型 -->
            <view class="flex items-center justify-between mb-12px">
              <view class="flex items-center flex-1">
                <text class="text-18px text-#333 font-semibold mr-12px">{{ area.name }}</text>
                <view v-if="area.geomType" class="bg-#e5f3ff text-#1890ff text-12px px-8px py-4px rounded-6px">
                  {{ area.geomType }}
                </view>
              </view>

              <!-- 选中状态图标 -->
              <view class="flex items-center">
                <view v-if="selectedAreaId === area.id" class="w-24px h-24px bg-#08bd92 rounded-full flex items-center justify-center">
                  <uni-icons type="checkmarkempty" size="16" color="#fff"></uni-icons>
                </view>
                <view v-else class="w-24px h-24px border-2px border-#e0e0e0 rounded-full"></view>
              </view>
            </view>

            <!-- 标签区域 -->
            <view class="flex items-center gap-8px mb-12px">
              <!-- 编号 -->
              <view class="bg-#08bd92/10 text-#08bd92 text-13px px-10px py-6px rounded-8px font-medium"> 编号 {{ area.code }} </view>

              <!-- 图层名称 -->
              <view v-if="area.layerGroupName" class="bg-#f0f9ff text-#0369a1 text-13px px-10px py-6px rounded-8px font-medium">
                {{ area.layerGroupName }}
              </view>
            </view>

            <!-- 描述信息 -->
            <text v-if="area.description" class="text-15px text-#666 leading-22px line-clamp-2 block">
              {{ area.description }}
            </text>
          </view>
        </view>
      </scroll-view>
    </view>
  </uni-popup>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
