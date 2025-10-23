<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { useSurveyListStore } from '@/stores/survey_list';
import { useSurveyEditStore } from '@/stores/survey_edit';
import { useGlobalStore } from '@/stores/global';
import { storeToRefs } from 'pinia';
import DistrictSelector from '@/pages/survey/components/DistrictSelector.vue';
import TreeDetailPopup from '@/pages/survey/components/TreeDetailPopup.vue';
import { formatInvestigateStatus, getInvestigateStatusClass } from '@/utils';
import dayjs from 'dayjs';

// 类型定义
interface PopupRef {
  open: (type: string) => void;
  close: () => void;
}
const globalStore = useGlobalStore();
const { batchDict } = storeToRefs(globalStore);

const surveyListStore = useSurveyListStore();
const { setCurrentEditData, clearCurrentEditData } = useSurveyEditStore();
const props = defineProps({
  noToggleTabbar: {
    type: Boolean,
    default: false,
  },
  addinvestigate: {
    type: Boolean,
    default: false,
  },
  initStatus: {
    type: String,
    default: '',
  },
});

// 筛选后的完整列表（不分页）
const filteredSurveyList = computed(() => {
  let filteredList = [...surveyListStore.surveyList];

  // 根据调查状态筛选
  if (selectedStatus.value) {
    filteredList = filteredList.filter(item => {
      return formatInvestigateStatus(item.investigateStatus) === selectedStatus.value;
    });
  }

  // 根据批次筛选
  if (selectedBatch.value) {
    filteredList = filteredList.filter(item => {
      return item.batch === selectedBatch.value;
    });
  }

  // 根据行政区筛选
  if (selectedDistrict.value) {
    filteredList = filteredList.filter(item => {
      return item.areaCode === selectedDistrict.value;
    });
  }

  // 根据树种编号筛选
  if (searchValue.value && searchValue.value.trim()) {
    const keyword = searchValue.value.trim().toLowerCase();
    filteredList = filteredList.filter(item => {
      return item.treeCode && item.treeCode.toLowerCase().includes(keyword);
    });
  }

  return filteredList;
});

// 总数计算属性
const totalCount = computed(() => {
  return filteredSurveyList.value.length;
});

// 分页显示的列表
const paginatedSurveyList = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return filteredSurveyList.value.slice(startIndex, endIndex);
});

// 总页数
const totalPages = computed(() => {
  return Math.ceil(totalCount.value / pageSize.value);
});

// 筛选状态
const currentFilter = ref('全部');
const currentStatus = ref(props.initStatus || '调查状态');
const currentBatch = ref('批次');
const currentDistrict = ref('行政区');

// 筛选选中状态
const selectedStatus = ref(props.initStatus || '');
const selectedBatch = ref('');
const selectedDistrict = ref('');

// 弹窗控制
const statusPopupRef = ref<PopupRef | null>(null);
const batchPopupRef = ref<PopupRef | null>(null);
const districtSelectorRef = ref<any>(null);
const showDistrictPopup = ref(false);

// 树木详情弹窗相关
const showTreeDetailPopup = ref(false);
const selectedTreeItem = ref<any>(null);

// 调查状态选项
const statusOptions = [
  { label: '已调查', value: '已调查' },
  { label: '待调查', value: '待调查' },
  { label: '调查中', value: '调查中' },
];

const searchValue = ref('');
const searchVisible = ref(false);
const onToggleSearchVisible = () => {
  searchVisible.value = !searchVisible.value;
};

// 取消搜索时重置状态
const onCancelSearch = () => {
  searchVisible.value = false;
  searchValue.value = '';
};

// 分页相关
const currentPage = ref(1);
const pageSize = ref(50);

const onSearch = () => {
  // 搜索功能通过 computed 属性 filterSurveyList 自动触发
  // 当 searchValue 变化时，列表会自动更新
};

// 判断是否有任何筛选项被选中
const hasAnyFilter = computed(() => {
  return selectedStatus.value || selectedBatch.value || selectedDistrict.value || (searchValue.value && searchValue.value.trim());
});

// 筛选功能方法
// 分页控制方法
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

// 重置分页到第一页（当筛选条件改变时）
const resetPagination = () => {
  currentPage.value = 1;
};

const handleAllFilter = () => {
  // 重置所有筛选
  selectedStatus.value = '';
  selectedBatch.value = '';
  selectedDistrict.value = '';
  searchValue.value = '';
  currentStatus.value = '调查状态';
  currentBatch.value = '批次';
  currentDistrict.value = '行政区';
  currentFilter.value = '全部';
  searchVisible.value = false;
  resetPagination();
};

const openStatusPopup = () => {
  statusPopupRef.value?.open('bottom');
  // if (!props.addinvestigate) {
  //   uni.hideTabBar();
  // }
};
const closePopup = () => {
  // if (!props.addinvestigate) {
  //   uni.showTabBar();
  // }
};

const openBatchPopup = () => {
  batchPopupRef.value?.open('bottom');
  // if (!props.addinvestigate) {
  //   uni.hideTabBar();
  // }
};

const openDistrictPopup = () => {
  districtSelectorRef.value?.openPopup();
  // if (!props.addinvestigate) {
  //   uni.hideTabBar();
  // }
};

const selectStatus = (option: any) => {
  selectedStatus.value = option.value;
  currentStatus.value = option.label;
  statusPopupRef.value?.close();
  // if (!props.addinvestigate) {
  //   uni.showTabBar();
  // }
  resetPagination();
};

const selectBatch = (option: any) => {
  selectedBatch.value = option.value;
  currentBatch.value = option.text;
  batchPopupRef.value?.close();
  // if (!props.addinvestigate) {
  //   uni.showTabBar();
  // }
  resetPagination();
};
// 新增调查
const addNewSurvey = () => {
  clearCurrentEditData();
  uni.navigateTo({
    url: `/pages/location_picker/index`,
  });
};

// 列表项点击
const handleItemClick = (item: any) => {
  // 设置选中的树木项
  selectedTreeItem.value = item;
  // 显示树木详情弹窗
  showTreeDetailPopup.value = true;
};

// 监听筛选条件变化，重置分页
watch([selectedStatus, selectedBatch, selectedDistrict, searchValue], () => {
  resetPagination();
});
</script>

<template>
  <view class="w-full flex-1 flex flex-col px-18px bg-#f9f9fb rounded-t-24px overflow-hidden">
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
        <uni-icons type="down" size="12" :color="selectedStatus ? '#01bd8d' : '#516280'"></uni-icons>
      </view>

      <!-- 批次 -->
      <view
        class="flex flex-1 justify-center items-center gap-4px cursor-pointer"
        :class="{
          'text-#01bd8d': selectedBatch,
          'text-#516280': !selectedBatch,
        }"
        @click="openBatchPopup"
      >
        <text class="text-15px">{{ currentBatch }}</text>
        <uni-icons type="down" size="12" :color="selectedBatch ? '#01bd8d' : '#516280'"></uni-icons>
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
        <uni-icons type="down" size="12" :color="selectedDistrict ? '#01bd8d' : '#516280'"></uni-icons>
      </view>
      <view class="w-50px fc" @click="onToggleSearchVisible">
        <uni-icons type="search" size="24" color="#999"></uni-icons>
      </view>
    </view>
    <view class="w-full" v-if="searchVisible">
      <uni-search-bar
        radius="100"
        placeholder="请输入树种编号"
        @confirm="onSearch"
        bgColor="#EEEEEE"
        :focus="true"
        v-model="searchValue"
        @cancel="onCancelSearch"
        @clear="searchValue = ''"
      >
      </uni-search-bar>
    </view>

    <!-- 列表区域 -->
    <view class="flex-1 overflow-hidden rounded-t-24px pb-10px">
      <scroll-view :scroll-y="true" v-if="totalCount > 0" class="h-full">
        <view
          v-for="item in paginatedSurveyList"
          :key="item.id"
          class="bg-#fff rounded-10px mt-12px first-mt-0 px-16px shadow-[0_5px_12px_1px_rgba(18,62,55,0.06)]"
          @click="handleItemClick(item)"
        >
          <!-- 标题和状态 -->
          <view class="flex h-54px items-center relative">
            <view class="flex-1">
              <text class="text-16px font-medium text-#333 mb-4px block">{{ item.treeCode + item.treeSpecies }}</text>
            </view>
            <view
              class="fc w-75px h-25px absolute top-0 -right-16px rounded-rt-10px rounded-lb-25px"
              :class="{
                'bg-#999': ['待调查', '待完成'].includes(item.investigateStatus),
                'bg-#225ed5': ['调查中', '进行中'].includes(item.investigateStatus),
                'bg-#00bf9f': ['已调查', '已完成'].includes(item.investigateStatus),
              }"
            >
              <text class="text-12px text-white">{{ formatInvestigateStatus(item.investigateStatus) }}</text>
            </view>
          </view>

          <!-- 行政区和时间 -->
          <view class="flex flex-col py-10px items-center justify-between b-t-(1px solid #eee)">
            <view class="w-full gap-8px h-full flex justify-between items-center">
              <text v-if="item.finishDate" class="text-12px text-#999">调查时间：{{ dayjs(item.finishDate).format('YYYY-MM-DD HH:mm') }}</text>
              <text class="text-12px text-#666" v-if="item.codeNumber">挂牌编号：{{ item.codeNumber }}</text>
            </view>
            <view class="w-full flex justify-between items-center gap-5px">
              <text v-if="item.updateDate" class="text-12px text-#999">修改时间：{{ dayjs(item.updateDate).format('YYYY-MM-DD HH:mm') }}</text>
              <text class="text-12px text-#666">{{ item.areaName }}</text>
            </view>
          </view>
        </view>
      </scroll-view>

      <view v-else class="w-full min-h-400px fc text-#555 text-14px">暂无数据</view>
    </view>

    <!-- 分页组件 -->
    <view v-if="totalCount > 0 && totalPages > 1" class="w-full pb-15px">
      <!-- 分页信息和控制 -->
      <view class="w-full flex justify-between items-center px-20px">
        <!-- 分页信息 -->
        <text class="text-12px text-#666"> 共 {{ totalCount }} 条数据，第 {{ currentPage }} / {{ totalPages }} 页 </text>

        <!-- 分页控制按钮 -->
        <view class="flex items-center gap-10px">
          <!-- 上一页 -->
          <view
            class="w-60px h-32px rounded-6px border-1px border-#ddd fc cursor-pointer"
            :class="{
              'bg-#f5f5f5 text-#ccc': currentPage <= 1,
              'bgPrimary text-#fff': currentPage > 1,
            }"
            @click="prevPage"
          >
            <text class="text-14px">上一页</text>
          </view>

          <!-- 下一页 -->
          <view
            class="w-60px h-32px rounded-6px border-1px border-#ddd fc cursor-pointer"
            :class="{
              'bg-#f5f5f5 text-#ccc': currentPage >= totalPages,
              'bgPrimary text-#fff': currentPage < totalPages,
            }"
            @click="nextPage"
          >
            <text class="text-14px">下一页</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部新增按钮 -->
    <view v-if="addinvestigate" class="w-full h-46px bg-[rgba(34,94,213,0.28)] rounded-4px b-(1px dashed #225ed5) mb-15px fc" @click="addNewSurvey">
      <text class="text-14px text-#225ed5 font-medium">新增调查</text>
    </view>
  </view>

  <!-- 调查状态选择弹窗 -->
  <uni-popup ref="statusPopupRef" type="bottom" :is-mask-click="true" @maskClick="closePopup">
    <view class="bg-white rounded-t-20px">
      <view class="py-20px px-20px border-b-1px border-b-#f0f0f0">
        <text class="text-18px font-medium text-#333">选择调查状态</text>
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

  <!-- 批次选择弹窗 -->
  <uni-popup ref="batchPopupRef" type="bottom" :is-mask-click="true" @maskClick="closePopup">
    <view class="bg-white rounded-t-20px">
      <view class="py-20px px-20px border-b-1px border-b-#f0f0f0">
        <text class="text-18px font-medium text-#333">选择批次</text>
      </view>
      <view class="px-20px py-10px">
        <view v-for="option in batchDict" :key="option.value" class="flex items-center justify-between py-15px cursor-pointer" @click="selectBatch(option)">
          <text
            class="text-16px"
            :class="{
              'text-#01bd8d': selectedBatch === option.value,
              'text-#333': selectedBatch !== option.value,
            }"
          >
            {{ option.value }}
          </text>
          <view v-if="selectedBatch === option.value" class="w-20px h-20px rounded-full bg-#01bd8d fc">
            <uni-icons type="checkmarkempty" size="14" color="#fff"></uni-icons>
          </view>
        </view>
      </view>
    </view>
  </uni-popup>

  <!-- 行政区选择弹窗 -->
  <DistrictSelector
    ref="districtSelectorRef"
    :addinvestigate="addinvestigate"
    v-model:visible="showDistrictPopup"
    v-model:selectedDistrict="selectedDistrict"
    v-model:currentDistrict="currentDistrict"
  />

  <!-- 树木详情弹窗 -->
  <TreeDetailPopup :noToggleTabbar="noToggleTabbar" v-model:visible="showTreeDetailPopup" :tree-item="selectedTreeItem" />
</template>
