<script lang="ts" setup>
import { ref, computed } from "vue";
import { useStatusBarHeight } from "@/hooks/useStatusBarHeight";
import { usePlantTaskListStore } from "@/stores/plant_task";
import { usePlantTaskEditStore } from "@/stores/plant_task_edit";
import { useGlobalStore } from "@/stores/global";
import { goBack } from "@/utils";
import { storeToRefs } from "pinia";
import { onLoad } from "@dcloudio/uni-app";
import DistrictSelector from "@/pages/survey/components/DistrictSelector.vue";

// 类型定义
interface PopupRef {
  open: (type: string) => void;
  close: () => void;
}
const globalStore = useGlobalStore();
const { batchDictList } = storeToRefs(globalStore);
const plantTaskListStore = usePlantTaskListStore();
const { setCurrentEditData } = usePlantTaskEditStore();
const { statusBarHeight } = useStatusBarHeight();

onLoad((options: any) => {
  const { status } = options;
  if (status) {
    switch (status) {
      case "completed":
        selectedStatus.value = "completed";
        currentStatus.value = "已完成";
        break;
      case "pending":
        selectedStatus.value = "pending";
        currentStatus.value = "待完成";
        break;
      case "surveying":
        selectedStatus.value = "surveying";
        currentStatus.value = "进行中";
        break;
      default:
        selectedStatus.value = "";
        break;
    }
  }
});
const props = defineProps({
  addinvestigate: {
    type: Boolean,
    default: false,
  },
});

const filterSurveyList = computed(() => {
  let filteredList = [...plantTaskListStore.plantTaskList];
  // 根据调查状态筛选
  if (selectedStatus.value) {
    filteredList = filteredList.filter((item) => {
      const status = getItemStatus(item);
      return status === selectedStatus.value;
    });
  }

  // 根据行政区筛选
  if (selectedDistrict.value) {
    filteredList = filteredList.filter((item) => {
      return item.areaCode === selectedDistrict.value;
    });
  }

  return filteredList;
});

// 获取调查项目的状态
const getItemStatus = (item: any) => {
  if (item.status == "进行中") {
    return "surveying"; // 进行中
  } else if (item.status == "已完成") {
    return "completed"; // 已完成
  } else {
    return "pending"; // 待完成
  }
};

// 获取状态样式类
const getStatusClass = (item: any) => {
  if (item.status == "进行中") {
    return "!bg-#225ed5"; // 进行中
  } else if (item.status == "已完成") {
    return "!bg-#00bf9f"; // 已完成
  } else {
    return "!bg-#999"; // 待完成
  }
};

// 计算调查中的数量
const surveyingCount = computed(() => {
  return plantTaskListStore.plantTaskList.filter(
    (item) => getItemStatus(item) === "surveying"
  ).length;
});

// 筛选状态
const currentFilter = ref("全部");
const currentStatus = ref("移栽状态");
const currentBatch = ref("批次");
const currentDistrict = ref("行政区");

// 筛选选中状态
const selectedStatus = ref("");
const selectedDistrict = ref("");

// 弹窗控制
const statusPopupRef = ref<PopupRef | null>(null);
const batchPopupRef = ref<PopupRef | null>(null);
const districtSelectorRef = ref<any>(null);
const showDistrictPopup = ref(false);

// 调查状态选项
const statusOptions = [
  { label: "已完成", value: "completed" },
  { label: "待完成", value: "pending" },
  { label: "进行中", value: "surveying" },
];

// 批次选项 - 使用全局store中的批次字典
const batchOptions = computed(() => {
  return batchDictList.value.map((item) => ({
    label: item.value,
    value: item.key,
  }));
});

// 判断是否有任何筛选项被选中
const hasAnyFilter = computed(() => {
  return selectedStatus.value || selectedDistrict.value;
});

// 筛选功能方法
const handleAllFilter = () => {
  // 重置所有筛选
  selectedStatus.value = "";
  selectedDistrict.value = "";
  currentStatus.value = "调查状态";
  currentBatch.value = "批次";
  currentDistrict.value = "行政区";
  currentFilter.value = "全部";
};

const openStatusPopup = () => {
  statusPopupRef.value?.open("bottom");
  uni.hideTabBar();
};
const closePopup = () => {
  uni.showTabBar();
};

const openDistrictPopup = () => {
  districtSelectorRef.value?.openPopup();
  uni.hideTabBar();
};

const selectStatus = (option: any) => {
  selectedStatus.value = option.value;
  currentStatus.value = option.label;
  statusPopupRef.value?.close();
  uni.showTabBar();
};

// 列表项点击
const handleItemClick = (item: any) => {
  // 将数据存储到pinia中
  setCurrentEditData(item);
  // 跳转到创建/编辑页面
  uni.navigateTo({
    url: `/pages/task_detail/index?id=${item.id}`,
  });
};

const handleLocation = (item: any) => {
  // TODO: 先不做
  // const { location } = item;
  // if (location && location.x && location.y) {
  //   uni.navigateBack();
  // }
};
</script>

<template>
  <view
    class="w-full flex-1 flex flex-col px-18px bg-#f9f9fb rounded-t-24px overflow-hidden"
  >
    <!-- 筛选区域 -->
    <view class="py-15px border-t-1px border-t-#f0f0f0 flex items-center">
      <!-- 全部筛选 -->
      <view
        class="px-12px mr-10px py-8px text-12px font-bold text-15px relative cursor-pointer"
        :class="{
          'text-#374663': !hasAnyFilter,
          'text-#999': hasAnyFilter,
        }"
        @click="handleAllFilter"
      >
        {{ currentFilter }}

        <!-- 指示器 - 只有在没有任何筛选时显示 -->
        <view
          v-if="!hasAnyFilter"
          class="absolute w-18px h-4px bottom-0 left-1/2 -ml-9px rounded-1px bg-gradient-to-b from-#08bd92 to-#07a47f shadow-[0_2px_3px_1px_rgba(0,0,0,.16)]"
        ></view>
      </view>

      <!-- 调查状态 -->
      <view
        class="flex flex-1 justify-center items-center gap-4px cursor-pointer"
        :class="{
          'text-#01bd8d': selectedStatus,
          'text-#516280': !selectedStatus,
        }"
        @click="openStatusPopup"
      >
        <text class="text-15px">{{ currentStatus }}</text>
        <uni-icons
          type="down"
          size="12"
          :color="selectedStatus ? '#01bd8d' : '#516280'"
        ></uni-icons>
      </view>

      <!-- 行政区 -->
      <view
        class="flex flex-1 justify-center items-center gap-4px cursor-pointer"
        :class="{
          'text-#01bd8d': selectedDistrict,
          'text-#516280': !selectedDistrict,
        }"
        @click="openDistrictPopup"
      >
        <text class="text-15px">{{ currentDistrict }}</text>
        <uni-icons
          type="down"
          size="12"
          :color="selectedDistrict ? '#01bd8d' : '#516280'"
        ></uni-icons>
      </view>
    </view>

    <!-- 列表区域 -->
    <view class="flex-1 overflow-hidden rounded-t-24px pb-20px">
      <scroll-view
        :scroll-y="true"
        v-if="filterSurveyList.length > 0"
        class="h-full"
      >
        <view
          v-for="item in filterSurveyList"
          :key="item.id"
          class="bg-#fff rounded-10px mt-12px first-mt-0 px-16px shadow-[0_5px_12px_1px_rgba(18,62,55,0.06)]"
          @click="handleItemClick(item)"
        >
          <!-- 标题和状态 -->
          <view class="flex h-54px items-center relative">
            <view class="flex-1">
              <text class="text-16px font-medium text-#333 mb-4px block">{{
                item.treeCode + item.treeSpecies
              }}</text>
            </view>
            <view
              class="fc w-75px h-25px absolute top-0 -right-16px rounded-rt-10px rounded-lb-25px"
              :class="getStatusClass(item)"
            >
              <text class="text-12px text-white">{{ item.status }}</text>
            </view>
          </view>

          <!-- 行政区和时间 -->
          <view
            class="flex h-47px items-center justify-between b-t-(1px solid #eee)"
          >
            <view
              class="gap-8px h-full flex items-center"
              @click.stop="handleLocation(item)"
            >
              <!-- <image
                  src="/static/images/icons/latlng.png"
                  class="w-16px h-16px"
                /> -->
              <text class="text-12px text-#666">{{ item.areaName }}</text>
            </view>
            <text v-if="item.planDate" class="text-12px text-#999">{{
              item.planDate
            }}</text>
          </view>
        </view>
      </scroll-view>

      <view class="w-full min-h-400px fc text-#555 text-14px">暂无数据</view>
    </view>
    <!-- 调查状态选择弹窗 -->
    <uni-popup
      ref="statusPopupRef"
      type="bottom"
      :is-mask-click="true"
      @maskClick="closePopup"
    >
      <view class="bg-white rounded-t-20px">
        <view class="py-20px px-20px border-b-1px border-b-#f0f0f0">
          <text class="text-18px font-medium text-#333">选择移栽状态</text>
        </view>
        <view class="px-20px py-10px">
          <view
            v-for="option in statusOptions"
            :key="option.value"
            class="flex items-center justify-between py-15px cursor-pointer"
            @click="selectStatus(option)"
          >
            <text
              class="text-16px"
              :class="{
                'text-#01bd8d': selectedStatus === option.value,
                'text-#333': selectedStatus !== option.value,
              }"
            >
              {{ option.label }}
            </text>
            <view
              v-if="selectedStatus === option.value"
              class="w-20px h-20px rounded-full bg-#01bd8d fc"
            >
              <uni-icons
                type="checkmarkempty"
                size="14"
                color="#fff"
              ></uni-icons>
            </view>
          </view>
        </view>
      </view>
    </uni-popup>
    <!-- 行政区选择弹窗 -->
    <DistrictSelector
      ref="districtSelectorRef"
      v-model:visible="showDistrictPopup"
      v-model:selectedDistrict="selectedDistrict"
      v-model:currentDistrict="currentDistrict"
    />
  </view>
</template>
