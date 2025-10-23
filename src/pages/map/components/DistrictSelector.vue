<script lang="ts" setup>
import { ref, watch } from "vue";
import { useGlobalStore } from "@/stores/global";
import { storeToRefs } from "pinia";

// 类型定义
interface DistrictItem {
  label: string;
  value: string;
  children?: DistrictItem[];
  geom?: any; // 可选的geometry属性
}

interface PopupRef {
  open: (type: string) => void;
  close: () => void;
}

// Props
interface Props {
  visible: boolean;
  selectedDistrict: string;
  currentDistrict: string;
  toggleBar?: boolean;
  addinvestigate?: boolean;
}

// Emits
interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "update:selectedDistrict", value: string): void;
  (e: "update:currentDistrict", value: string): void;
  (e: "update:selectedGeometry", value: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const globalStore = useGlobalStore();
const { districtInfoWithLabelValueGeom } = storeToRefs(globalStore);

// 弹窗相关
const districtPopupRef = ref<PopupRef | null>(null);
const districtBreadcrumb = ref<DistrictItem[]>([]);
const currentDistrictLevel = ref<DistrictItem[]>(
  districtInfoWithLabelValueGeom.value
);
const selectedDistrictPath = ref<DistrictItem[]>([]);

// 监听弹窗状态
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      if (props.toggleBar) {
        uni.hideTabBar();
      }
      districtPopupRef.value?.open("bottom");
    } else {
      districtPopupRef.value?.close();
      if (props.toggleBar) {
        uni.showTabBar();
      }
    }
  }
);

// 选择行政区项目
const selectDistrictItem = (item: DistrictItem) => {
  if (item.children && item.children.length > 0) {
    // 有子级，进入下一级显示子级列表
    districtBreadcrumb.value.push({
      label: item.label,
      value: item.value,
    });
    currentDistrictLevel.value = item.children;
    selectedDistrictPath.value.push(item);
  } else {
    // 没有子级，选择该项并关闭弹窗
    selectedDistrictPath.value.push(item);

    emit("update:selectedDistrict", item.value);
    emit("update:currentDistrict", item.label);
    emit("update:selectedGeometry", item.geom || {});

    emit("update:visible", false);
    if (!props.addinvestigate) {
      uni.showTabBar();
    }
  }
};

// 弹窗关闭时的处理函数
const onDistrictPopupClose = () => {
  // 如果用户已经进入了某个层级，自动选择当前停留的最后一级
  if (selectedDistrictPath.value.length > 0) {
    const lastSelectedItem =
      selectedDistrictPath.value[selectedDistrictPath.value.length - 1];
    emit("update:selectedDistrict", lastSelectedItem.value);
    emit("update:currentDistrict", lastSelectedItem.label);
    emit("update:selectedGeometry", lastSelectedItem.geom || {});
  }
  emit("update:visible", false);
  if (!props.addinvestigate) {
    uni.showTabBar();
  }
};

// 重置行政区选择状态的方法
const resetDistrictSelection = () => {
  districtBreadcrumb.value = [];
  currentDistrictLevel.value = districtInfoWithLabelValueGeom.value;
  selectedDistrictPath.value = [];
};

// 根据已选择的行政区重建路径和面包屑
const rebuildDistrictPath = () => {
  if (!props.selectedDistrict) {
    resetDistrictSelection();
    return;
  }

  // 递归查找选中项的路径
  const findPath = (
    items: DistrictItem[],
    targetValue: string,
    path: DistrictItem[] = []
  ): DistrictItem[] | null => {
    for (const item of items) {
      const currentPath = [...path, item];

      if (item.value === targetValue) {
        return currentPath;
      }

      if (item.children && item.children.length > 0) {
        const result = findPath(item.children, targetValue, currentPath);
        if (result) {
          return result;
        }
      }
    }
    return null;
  };

  const path = findPath(
    districtInfoWithLabelValueGeom.value,
    props.selectedDistrict
  );

  if (path && path.length > 0) {
    // 重建选择路径
    selectedDistrictPath.value = [...path];

    // 重建面包屑（包含完整路径）
    districtBreadcrumb.value = [...path];

    // 设置当前显示的层级（显示最后一级的子级）
    const lastItem = path[path.length - 1];
    if (lastItem.children && lastItem.children.length > 0) {
      // 如果最后一级有子级，显示子级
      currentDistrictLevel.value = lastItem.children;
    } else {
      // 如果最后一级没有子级，显示其父级的同级列表
      if (path.length > 1) {
        const parentItem = path[path.length - 2];
        currentDistrictLevel.value = parentItem.children || [];
        // 调整面包屑，移除最后一级（因为要显示父级的同级列表）
        districtBreadcrumb.value = path.slice(0, -1);
      } else {
        currentDistrictLevel.value = districtInfoWithLabelValueGeom.value;
        // 调整面包屑为空（因为要显示根级列表）
        districtBreadcrumb.value = [];
      }
    }
  } else {
    // 如果找不到路径，重置到根级
    resetDistrictSelection();
  }
};

const goBackDistrictLevel = (index: number) => {
  if (index === -1) {
    // 返回根级
    districtBreadcrumb.value = [];
    currentDistrictLevel.value = districtInfoWithLabelValueGeom.value;
    selectedDistrictPath.value = [];
  } else {
    // 返回指定级别，显示该级的子级
    districtBreadcrumb.value = districtBreadcrumb.value.slice(0, index + 1);
    selectedDistrictPath.value = selectedDistrictPath.value.slice(0, index + 1);

    const targetItem = selectedDistrictPath.value[index];
    currentDistrictLevel.value = targetItem.children || [];
  }
};

// 打开弹窗时的处理
const openPopup = () => {
  // 如果已经有选择的行政区，需要恢复到对应的层级
  if (props.selectedDistrict) {
    // 根据已选择的行政区重建路径和面包屑
    rebuildDistrictPath();
  } else {
    // 没有选择时，重置到根级
    resetDistrictSelection();
  }
  emit("update:visible", true);
};

// 暴露方法给父组件
defineExpose({
  openPopup,
});
</script>

<template>
  <!-- 行政区选择弹窗 -->
  <uni-popup
    ref="districtPopupRef"
    type="bottom"
    :is-mask-click="true"
    @maskClick="onDistrictPopupClose"
    @change="(e: any) => emit('update:visible', e.show)"
  >
    <view class="bg-white rounded-t-20px max-h-70vh">
      <view class="py-20px px-20px border-b-1px border-b-#f0f0f0">
        <text class="text-18px font-medium text-#333">选择行政区</text>
      </view>

      <!-- 面包屑导航 -->
      <view
        v-if="districtBreadcrumb.length > 0"
        class="px-20px py-15px border-b-1px border-b-#f0f0f0 bg-#fafafa"
      >
        <view class="flex items-center gap-8px flex-wrap">
          <view
            class="px-12px py-6px bg-#01bd8d text-white text-13px rounded-full cursor-pointer"
            @click="goBackDistrictLevel(-1)"
          >
            全部
          </view>
          <template v-for="(item, index) in districtBreadcrumb" :key="index">
            <text class="text-14px text-#ccc">></text>
            <view
              class="px-12px py-6px bg-white border-1px border-#01bd8d text-#01bd8d text-13px rounded-full cursor-pointer"
              @click="goBackDistrictLevel(index)"
            >
              {{ item.label }}
            </view>
          </template>
        </view>
      </view>

      <scroll-view scroll-y class="max-h-50vh">
        <view class="px-20px py-10px">
          <view
            v-for="item in currentDistrictLevel"
            :key="item.value"
            class="flex items-center justify-between py-15px border-b-1px border-b-#f5f5f5 last:border-b-0 cursor-pointer"
            @click="selectDistrictItem(item)"
          >
            <!-- 左侧文本区域 -->
            <view class="flex-1 py-5px">
              <text class="text-16px text-#333">{{ item.label }}</text>
            </view>

            <!-- 右侧箭头 -->
            <view class="flex items-center">
              <uni-icons
                v-if="item.children && item.children.length > 0"
                type="right"
                size="14"
                color="#999"
              ></uni-icons>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </uni-popup>
</template>
