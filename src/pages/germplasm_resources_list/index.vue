<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { useGermplasmLisStore } from '@/stores/germplasm_list';
import { goBack } from '@/utils';
import DistrictSelector from '@/pages/survey/components/DistrictSelector.vue';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';

// 类型定义
interface PopupRef {
  open: (type: string) => void;
  close: () => void;
}

const germplasmLisStore = useGermplasmLisStore();
const { localGermplasmList, germplasmListHistory } = storeToRefs(germplasmLisStore);

const { statusBarHeight } = useStatusBarHeight();
const tabs = ref([
  {
    name: '采集列表',
    value: 'list',
  },
  {
    name: '历史采集',
    value: 'history',
  },
]);

const currentTab = ref('list');

// 筛选状态
const currentFilter = ref('全部');
const currentStatus = ref('采集状态');
const currentDistrict = ref('行政区');

// 筛选选中状态
const selectedStatus = ref('');
const selectedDistrict = ref('');

// 弹窗控制
const statusPopupRef = ref<PopupRef | null>(null);
const districtSelectorRef = ref<any>(null);
const showDistrictPopup = ref(false);

// 采集状态选项
const statusOptions = [
  { label: '已完成', value: 'completed' },
  { label: '待完成', value: 'pending' },
  { label: '进行中', value: 'surveying' },
];

// 判断是否有任何筛选项被选中
const hasAnyFilter = computed(() => {
  return selectedStatus.value || selectedDistrict.value;
});

const handleTab = (item: { name: string; value: string }) => {
  currentTab.value = item.value;
};
// 筛选功能方法
const handleAllFilter = () => {
  // 重置所有筛选
  selectedStatus.value = '';
  selectedDistrict.value = '';
  currentStatus.value = '采集状态';
  currentDistrict.value = '行政区';
  currentFilter.value = '全部';
};

const openStatusPopup = () => {
  statusPopupRef.value?.open('bottom');
};

const openDistrictPopup = () => {
  districtSelectorRef.value?.openPopup();
};

const selectStatus = (option: any) => {
  selectedStatus.value = option.value;
  currentStatus.value = option.label;
  statusPopupRef.value?.close();
};

// 列表项点击
const handleItemClick = (item: any) => {
  uni.navigateTo({
    url: `/pages/germplasm_resources/index?id=${item.tempId}`,
  });
};

const handleHistoryItemClick = (item: any) => {
  uni.navigateTo({
    url: `/pages/germplasm_resources/index?id=${item.id}&isHistory=true`,
  });
};
</script>

<template>
  <view class="w-full h-full flex flex-col bg-gradient-to-b from-#08bd92 to-#07a47f">
    <!-- 顶部统计区域 -->
    <view
      class="w-full"
      :style="{
        paddingTop: statusBarHeight + 12 + 'px',
      }"
    >
      <view class="flex items-center gap-10px px-10px py-24px">
        <view class="w-auto flex items-center" @click="goBack">
          <uni-icons type="left" size="30" color="#fff"></uni-icons>
          <text class="text-#fff text-18px font-bold">种质资源采集列表</text>
        </view>
      </view>
      <!-- Tab切换 -->
      <view class="w-full flex items-center h-30px mb-12px px-15px">
        <view
          v-for="item in tabs"
          :key="item.value"
          class="flex-1 h-full flex fc bg-[rgba(255,255,255,0.2)] text-#fff first:rounded-l-4px last:rounded-r-4px text-14px"
          :class="{ 'bg-#fff !textPrimary': currentTab === item.value }"
          @click="handleTab(item)"
        >
          {{ item.name }}
        </view>
      </view>
    </view>
    <view class="w-full flex-1 flex flex-col px-18px bg-#f9f9fb rounded-t-24px overflow-hidden">
      <!-- 筛选区域 -->
      <!-- <view class="py-15px border-t-1px border-t-#f0f0f0 flex items-center" v-if="currentTab === 'history'">
        <view
          class="px-12px mr-10px py-8px text-12px font-bold text-15px relative cursor-pointer"
          :class="{
            'text-#374663': !hasAnyFilter,
            'text-#999': hasAnyFilter,
          }"
          @click="handleAllFilter"
        >
          {{ currentFilter }}
          <view
            v-if="!hasAnyFilter"
            class="absolute w-18px h-4px bottom-0 left-1/2 -ml-9px rounded-1px bg-gradient-to-b from-#08bd92 to-#07a47f shadow-[0_2px_3px_1px_rgba(0,0,0,.16)]"
          ></view>
        </view>
        <view
          class="flex flex-1 justify-center items-center gap-4px cursor-pointer"
          :class="{
            'text-#01bd8d': selectedStatus,
            'text-#516280': !selectedStatus,
          }"
          @click="openStatusPopup"
        >
          <text class="text-15px">{{ currentStatus }}</text>
          <uni-icons type="down" size="12" :color="selectedStatus ? '#01bd8d' : '#516280'"></uni-icons>
        </view>
        <view
          class="flex flex-1 justify-center items-center gap-4px cursor-pointer"
          :class="{
            'text-#01bd8d': selectedDistrict,
            'text-#516280': !selectedDistrict,
          }"
          @click="openDistrictPopup"
        >
          <text class="text-15px">{{ currentDistrict }}</text>
          <uni-icons type="down" size="12" :color="selectedDistrict ? '#01bd8d' : '#516280'"></uni-icons>
        </view>
      </view> -->

      <!-- 列表区域 -->
      <view class="flex-1 overflow-hidden rounded-t-24px py-20px" v-if="currentTab === 'list'">
        <scroll-view :scroll-y="true" v-if="localGermplasmList.length > 0" class="h-full">
          <view
            v-for="item in localGermplasmList"
            :key="item.tempId"
            class="bg-#fff rounded-10px mt-12px first-mt-0 px-16px shadow-[0_5px_12px_1px_rgba(18,62,55,0.06)]"
            @click="handleItemClick(item)"
          >
            <!-- 标题和状态 -->
            <view class="flex h-54px items-center relative">
              <view class="flex-1">
                <text class="text-16px font-medium text-#333 mb-4px block">{{ item.codeNumber }}</text>
              </view>
              <view
                class="fc w-75px h-25px absolute top-0 -right-16px rounded-rt-10px rounded-lb-25px"
                :class="{
                  'bg-#00bf9f': item.status === 'done',
                  'bg-#225ed5': item.status === 'saved',
                }"
              >
                <text v-if="item.status === 'saved'" class="text-12px text-white">进行中</text>
                <text v-else-if="item.status === 'done'" class="text-12px text-white">已采集</text>
              </view>
            </view>

            <!-- 行政区和时间 -->
            <view class="flex h-47px items-center justify-end b-t-(1px solid #eee)">
              <text class="text-12px text-#999">{{ dayjs(item.collectTime).format('YYYY-MM-DD HH:mm:ss') }}</text>
            </view>
          </view>
        </scroll-view>

        <view class="w-full min-h-400px fc text-#555 text-14px">暂无数据</view>
      </view>

      <view class="flex-1 overflow-hidden rounded-t-24px py-20px" v-else>
        <scroll-view :scroll-y="true" v-if="germplasmListHistory.length > 0" class="h-full">
          <view
            v-for="item in germplasmListHistory"
            :key="item.tempId"
            class="bg-#fff rounded-10px mt-12px first-mt-0 px-16px shadow-[0_5px_12px_1px_rgba(18,62,55,0.06)]"
            @click="handleHistoryItemClick(item)"
          >
            <!-- 标题和状态 -->
            <view class="flex h-54px items-center relative">
              <view class="flex-1">
                <text class="text-16px font-medium text-#333 mb-4px block">{{ item.codeNumber }}</text>
              </view>
              <view class="fc w-75px h-25px absolute top-0 -right-16px rounded-rt-10px rounded-lb-25px bg-#00bf9f">
                <text class="text-12px text-white">已采集</text>
              </view>
            </view>

            <!-- 行政区和时间 -->
            <view class="flex h-47px items-center justify-end b-t-(1px solid #eee)">
              <text class="text-12px text-#999">{{ dayjs().format('YYYY-MM-DD HH:mm:ss') }}</text>
            </view>
          </view>
        </scroll-view>

        <view class="w-full min-h-400px fc text-#555 text-14px">暂无数据</view>
      </view>
    </view>
    <!-- 采集状态选择弹窗 -->
    <uni-popup v-if="currentTab === 'history'" ref="statusPopupRef" type="bottom" :is-mask-click="true">
      <view class="bg-white rounded-t-20px">
        <view class="py-20px px-20px border-b-1px border-b-#f0f0f0">
          <text class="text-18px font-medium text-#333">选择采集状态</text>
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
            <view v-if="selectedStatus === option.value" class="w-20px h-20px rounded-full bg-#01bd8d fc">
              <uni-icons type="checkmarkempty" size="14" color="#fff"></uni-icons>
            </view>
          </view>
        </view>
      </view>
    </uni-popup>
    <!-- 行政区选择弹窗 -->
    <DistrictSelector
      v-if="currentTab !== 'investigates' && currentTab !== 'planting'"
      ref="districtSelectorRef"
      v-model:visible="showDistrictPopup"
      v-model:selectedDistrict="selectedDistrict"
      v-model:currentDistrict="currentDistrict"
    />
  </view>
</template>
