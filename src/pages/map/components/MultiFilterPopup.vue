<script lang="ts" setup>
import { ref, computed, watch } from 'vue';

interface FilterOptions {
  surveyTimeRange: {
    startDate: string;
    endDate: string;
  };
  surveyStatus: string[];
  treeCode: string; // 树种编号筛选
  isResultDataDemo: boolean; // 成果数据演示开关
}

interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'confirm', filters: FilterOptions): void;
  (e: 'reset'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 弹窗引用
const filterPopupRef = ref<any>(null);

// 筛选条件
const filterOptions = ref<FilterOptions>({
  surveyTimeRange: {
    startDate: '',
    endDate: '',
  },
  surveyStatus: ['待完成', '进行中'],
  treeCode: '', // 树种编号筛选
  isResultDataDemo: false, // 成果数据演示开关，默认关闭
});

// 调查状态选项
const statusOptions = [
  { label: '待调查', value: '待完成' },
  { label: '调查中', value: '进行中' },
  { label: '已调查', value: '已完成' },
];

// 监听弹窗显示状态
watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      filterPopupRef.value?.open('bottom');
      // 隐藏 tabbar
      uni.hideTabBar();
    } else {
      filterPopupRef.value?.close();
      // 显示 tabbar
      uni.showTabBar();
    }
  },
);

// 处理弹窗关闭
const onPopupClose = () => {
  emit('update:visible', false);
  // 确保显示 tabbar
  uni.showTabBar();
};

// 日期选择相关
const startDateValue = computed({
  get: () => filterOptions.value.surveyTimeRange.startDate,
  set: (value: string) => {
    filterOptions.value.surveyTimeRange.startDate = value;
  },
});

const endDateValue = computed({
  get: () => filterOptions.value.surveyTimeRange.endDate,
  set: (value: string) => {
    filterOptions.value.surveyTimeRange.endDate = value;
  },
});

// 处理开始日期选择
const onStartDateChange = (e: any) => {
  startDateValue.value = e.detail.value;
};

// 处理结束日期选择
const onEndDateChange = (e: any) => {
  endDateValue.value = e.detail.value;
};

// 切换调查状态选择
const toggleStatus = (status: string) => {
  const index = filterOptions.value.surveyStatus.indexOf(status);
  if (index > -1) {
    filterOptions.value.surveyStatus.splice(index, 1);
  } else {
    filterOptions.value.surveyStatus.push(status);
  }
};

// 检查状态是否被选中
const isStatusSelected = (status: string) => {
  return filterOptions.value.surveyStatus.includes(status);
};

// 切换成果数据演示开关
const toggleResultDataDemo = () => {
  filterOptions.value.isResultDataDemo = !filterOptions.value.isResultDataDemo;

  // 如果开启成果数据演示，清空其他筛选条件
  if (filterOptions.value.isResultDataDemo) {
    filterOptions.value.surveyTimeRange.startDate = '';
    filterOptions.value.surveyTimeRange.endDate = '';
    filterOptions.value.surveyStatus = [];
    filterOptions.value.treeCode = '';
  }
};

// 重置筛选条件
const resetFilters = () => {
  filterOptions.value = {
    surveyTimeRange: {
      startDate: '',
      endDate: '',
    },
    surveyStatus: [],
    treeCode: '', // 重置树种编号
    isResultDataDemo: false, // 重置成果数据演示开关
  };
  emit('reset');
  onPopupClose();
};

// 确认筛选
const confirmFilters = () => {
  emit('confirm', { ...filterOptions.value });
  onPopupClose();
};

// 计算是否有筛选条件
const hasFilters = computed(() => {
  return (
    filterOptions.value.surveyTimeRange.startDate ||
    filterOptions.value.surveyTimeRange.endDate ||
    filterOptions.value.surveyStatus.length > 0 ||
    (filterOptions.value.treeCode && filterOptions.value.treeCode.trim() !== '') ||
    filterOptions.value.isResultDataDemo
  );
});

// 暴露方法给父组件
defineExpose({
  resetFilters,
});
</script>

<template>
  <uni-popup ref="filterPopupRef" type="bottom" :is-mask-click="true" @maskClick="onPopupClose" @change="(e: any) => emit('update:visible', e.show)">
    <view class="bg-white rounded-t-20px max-h-80vh">
      <!-- 头部 -->
      <view class="py-20px px-20px border-b-1px border-b-#f0f0f0 flex items-center justify-between">
        <text class="text-18px font-medium text-#333">筛选条件</text>
        <view class="flex items-center gap-20px">
          <text class="text-14px text-#666" @click="resetFilters">重置</text>
          <text
            class="text-14px px-20px py-8px rounded-6px font-medium"
            :class="hasFilters ? 'bg-#00bf9f text-white' : 'bg-#f5f5f5 text-#999'"
            @click="confirmFilters"
          >
            确定
          </text>
        </view>
      </view>

      <!-- 筛选内容 -->
      <view class="px-20px py-20px">
        <!-- 成果数据演示开关 -->
        <view class="mb-30px">
          <text class="text-16px font-medium text-#333 block">成果数据</text>
          <view class="text-12px text-#999 my-10px">开启后将只显示成果数据，其他筛选条件将被禁用</view>
          <view class="flex items-center gap-12px">
            <view
              class="px-16px py-8px rounded-8px border-1px transition-all duration-200 cursor-pointer"
              :class="filterOptions.isResultDataDemo ? 'bgPrimary borderPrimary text-white' : 'bg-#f5f5f5 border-#ddd text-#666 hover:bg-#e8e8e8'"
              @click="toggleResultDataDemo"
            >
              <text class="text-14px font-medium">{{ filterOptions.isResultDataDemo ? '已开启' : '已关闭' }}</text>
            </view>
          </view>
        </view>

        <!-- 调查状态 -->
        <view class="mb-30px" :class="{ 'opacity-50 pointer-events-none': filterOptions.isResultDataDemo }">
          <text class="text-16px font-medium text-#333 mb-15px block">调查状态</text>
          <view class="flex flex-wrap gap-12px">
            <view
              v-for="option in statusOptions"
              :key="option.value"
              class="px-16px py-8px rounded-8px border-1px transition-all duration-200 cursor-pointer"
              :class="isStatusSelected(option.value) ? 'bg-#00bf9f border-#00bf9f text-white' : 'bg-#f5f5f5 border-#ddd text-#666 hover:bg-#e8e8e8'"
              @click="!filterOptions.isResultDataDemo && toggleStatus(option.value)"
            >
              <text class="text-14px font-medium">{{ option.label }}</text>
            </view>
          </view>
        </view>
        <!-- 树种编号 -->
        <view class="mb-30px" :class="{ 'opacity-50 pointer-events-none': filterOptions.isResultDataDemo }">
          <text class="text-16px font-medium text-#333 mb-15px block">树种编号</text>
          <view class="h-44px bg-#f8f9fa border-1px border-#e9ecef rounded-8px flex items-center px-15px">
            <input
              v-model="filterOptions.treeCode"
              placeholder="请输入树种编号"
              class="flex-1 text-14px bg-transparent outline-none"
              :class="filterOptions.treeCode ? 'text-#333' : 'text-#999'"
              :disabled="filterOptions.isResultDataDemo"
            />
          </view>
        </view>
        <!-- 调查时间 -->
        <view :class="{ 'opacity-50 pointer-events-none': filterOptions.isResultDataDemo }">
          <text class="text-16px font-medium text-#333 mb-15px block">调查时间</text>
          <view class="flex items-center gap-15px">
            <!-- 开始日期选择器 -->
            <picker mode="date" :value="startDateValue" @change="onStartDateChange" class="flex-1" :disabled="filterOptions.isResultDataDemo">
              <view class="h-44px bg-#f8f9fa border-1px border-#e9ecef rounded-8px flex items-center px-15px">
                <text class="text-14px" :class="filterOptions.surveyTimeRange.startDate ? 'text-#333' : 'text-#999'">
                  {{ filterOptions.surveyTimeRange.startDate || '开始日期' }}
                </text>
              </view>
            </picker>

            <text class="text-14px text-#666">至</text>

            <!-- 结束日期选择器 -->
            <picker mode="date" :value="endDateValue" @change="onEndDateChange" class="flex-1" :disabled="filterOptions.isResultDataDemo">
              <view class="h-44px bg-#f8f9fa border-1px border-#e9ecef rounded-8px flex items-center px-15px">
                <text class="text-14px" :class="filterOptions.surveyTimeRange.endDate ? 'text-#333' : 'text-#999'">
                  {{ filterOptions.surveyTimeRange.endDate || '结束日期' }}
                </text>
              </view>
            </picker>
          </view>
        </view>
      </view>
    </view>
  </uni-popup>
</template>

<style scoped>
.transition-all {
  transition: all 0.2s ease;
}
</style>
