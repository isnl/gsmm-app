<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { service } from '@/service';
import { censusRangeOptions, growthStatusOptions } from './constants';

type Status = '待调查' | '调查中' | '已调查';

interface TreeItem {
  id: string;
  title: string; // 编号+名称
  district: string; // 行政区
  time: string; // 时间
  status: Status;
  submitType: number; // 0-调查中, 1-已调查
  gsmmbh?: string; // 古树名木编号
  zwm?: string; // 中文名
  xz?: string; // 乡镇
  cun?: string; // 村
  createdAt?: string; // 创建时间
  updatedAt?: string; // 更新时间
  pcfw?: string; // 普查范围
  szsdj?: string; // 生长势等级
}

// 顶部统计与筛选
const tabs = ref([
  { key: 'all', name: '全部' },
  { key: 'status', name: '调查状态', withArrow: true },
  { key: 'growthStatus', name: '生长势', withArrow: true },
]);
const activeTab = ref('all');

// 筛选条件
const filters = ref({
  status: '' as Status | '', // 调查状态
  growthStatus: '', // 生长势
});

// 筛选弹窗显示状态
const showFilterPopup = ref(false);
const currentFilterType = ref<'status' | 'growthStatus'>('status');
const filterPopup = ref();

// 列表数据
const allList = ref<TreeItem[]>([]);
const loading = ref(false);

// 分页相关
const page = ref(1); // 当前页码
const pageSize = ref(10); // 每页条数
const total = ref(0); // 总条数
const hasMore = computed(() => allList.value.length < total.value); // 是否还有更多数据
const loadMoreStatus = ref<'more' | 'loading' | 'noMore'>('more'); // 加载更多状态

// 统计数据
const statistics = computed(() => {
  const waitCount = allList.value.filter(item => item.status === '待调查').length;
  const doneCount = allList.value.filter(item => item.status === '已调查').length;
  return { waitCount, doneCount };
});

// 筛选后的列表
const filteredList = computed(() => {
  let list = allList.value;

  // 按调查状态筛选
  if (filters.value.status) {
    list = list.filter(item => item.status === filters.value.status);
  }

  // 按生长势筛选
  if (filters.value.growthStatus) {
    list = list.filter(item => item.szsdj === filters.value.growthStatus);
  }

  return list;
});

// 当前激活的筛选项显示文本
const activeFilterText = computed(() => {
  if (activeTab.value === 'status') {
    return filters.value.status || '调查状态';
  } else if (activeTab.value === 'growthStatus') {
    return filters.value.growthStatus || '生长势';
  }
  return '';
});

const getStatusStyle = (status: Status) => {
  console.log(status);
  switch (status) {
    case '已调查':
      return { bg: '#E6F7F1', color: '#01bd8d' };
    case '调查中':
      return { bg: '#EAF2FF', color: '#4D79FF' };
    default:
      return { bg: '#EFF2F5', color: '#99A0AA' };
  }
};

// 转换状态
const getStatus = (submitType: number): Status => {
  if (submitType === 1) return '已调查';
  if (submitType === 0) return '调查中';
  return '待调查';
};

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return '';
  const date = new Date(time);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}.${month}.${day} ${hour}:${minute}:${second}`;
};

// 加载列表数据
const loadList = async (isLoadMore = false) => {
  // 如果是加载更多，设置加载状态
  if (isLoadMore) {
    if (loadMoreStatus.value === 'loading' || !hasMore.value) {
      return;
    }
    loadMoreStatus.value = 'loading';
  } else {
    loading.value = true;
  }

  try {
    const res = await service({
      url: '/gu_shus',
      method: 'GET',
      params: {
        page: page.value,
        size: pageSize.value,
      },
    });

    if (res && res.data) {
      // 更新总数
      total.value = res.data.count || 0;

      // 转换数据格式
      const newData = (Array.isArray(res.data.data) ? res.data.data : []).map((item: any) => {
        const status = getStatus(item.submitType);
        const title = item.gsmmbh ? `${item.gsmmbh} ${item.zwm || ''}`.trim() : item.zwm || '未命名古树';
        const district = [item.xz, item.cun].filter(Boolean).join(' ') || '未知行政区';
        const time = formatTime(item.updatedAt || item.createdAt);

        return {
          ...item, // 先展开原始数据
          id: item.id,
          title,
          district,
          time,
          status, // 覆盖原始的 status，使用转换后的文字状态
          submitType: item.submitType,
        };
      });

      // 如果是加载更多，追加数据；否则替换数据
      if (isLoadMore) {
        allList.value = [...allList.value, ...newData];
      } else {
        allList.value = newData;
      }

      // 更新加载更多状态
      if (allList.value.length >= total.value) {
        loadMoreStatus.value = 'noMore';
      } else {
        loadMoreStatus.value = 'more';
      }
    }
  } catch (error: any) {
    console.error('加载列表失败:', error);
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    });
    loadMoreStatus.value = 'more';
  } finally {
    loading.value = false;
  }
};

// 加载更多
const loadMore = () => {
  if (!hasMore.value || loadMoreStatus.value === 'loading') {
    return;
  }
  page.value++;
  loadList(true);
};

// 下拉刷新
const refreshing = ref(false);
const onRefresh = async () => {
  refreshing.value = true;
  page.value = 1;
  await loadList(false);
  refreshing.value = false;
};

// 筛选选项数据
const statusOptions = ref([
  { text: '待调查', value: '待调查' },
  { text: '调查中', value: '调查中' },
  { text: '已调查', value: '已调查' },
]);

// 获取当前筛选类型的选项列表
const currentFilterOptions = computed(() => {
  if (currentFilterType.value === 'status') {
    return statusOptions.value;
  } else if (currentFilterType.value === 'growthStatus') {
    return growthStatusOptions.map(item => ({ text: item.text, value: item.value }));
  }
  return [];
});

// 点击筛选标签
const onTabClick = (key: string) => {
  if (key === 'all') {
    // 点击全部，清空所有筛选
    activeTab.value = 'all';
    filters.value = {
      status: '',
      growthStatus: '',
    };
  } else {
    activeTab.value = key;
    currentFilterType.value = key as 'status' | 'growthStatus';
    showFilterPopup.value = true;
    filterPopup.value?.open();
  }
};

// 选择筛选项
const selectFilter = (value: string) => {
  if (currentFilterType.value === 'status') {
    filters.value.status = value as Status;
  } else if (currentFilterType.value === 'growthStatus') {
    filters.value.growthStatus = value;
  }
  showFilterPopup.value = false;
  filterPopup.value?.close();
};

// 清除当前筛选
const clearCurrentFilter = () => {
  if (currentFilterType.value === 'status') {
    filters.value.status = '';
  } else if (currentFilterType.value === 'growthStatus') {
    filters.value.growthStatus = '';
  }
  activeTab.value = 'all';
  showFilterPopup.value = false;
  filterPopup.value?.close();
};

// 跳转到详情页
const handleItemClick = (item: TreeItem) => {
  uni.navigateTo({
    url: `/pages/ancient_tree/detail?id=${item.id}`,
  });
};
onShow(() => {
  loadList();
});
// 页面加载时获取数据
// onMounted(() => {
//   loadList();
// });
</script>

<template>
  <view class="w-full h-full bg-#f5f6f7">
    <!-- 顶部统计条 -->
    <!-- <view class="w-full h-56px bg-#01bd8d fc gap-20px">
      <text class="text-16px color-#fff">待调查｜{{ statistics.waitCount }}</text>
      <text class="text-16px color-#fff">已调查｜{{ statistics.doneCount }}</text>
    </view> -->

    <!-- 顶部筛选栏 -->
    <view class="px-14px pt-12px pb-8px bg-#f5f6f7">
      <view class="w-full bg-#fff rounded-12px h-44px flex items-center px-10px gap-8px">
        <view
          v-for="t in tabs"
          :key="t.key"
          class="px-12px h-28px fc rounded-6px"
          :class="activeTab === t.key ? 'bg-#eafaf6' : 'bg-#f5f5f5'"
          @click="onTabClick(t.key)"
        >
          <text class="text-13px" :class="activeTab === t.key ? 'color-#01bd8d' : 'color-#666'">
            {{ activeTab === t.key && activeFilterText ? activeFilterText : t.name }}
          </text>
          <uni-icons v-if="t.withArrow" type="bottom" size="14" :color="activeTab === t.key ? '#01bd8d' : '#999'" class="ml-4px" />
        </view>
      </view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="flex-1 flex items-center justify-center">
      <uni-load-more status="loading"></uni-load-more>
    </view>

    <!-- 列表 -->
    <scroll-view
      v-else
      scroll-y
      class="flex-1 px-14px pb-14px"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
      lower-threshold="100"
    >
      <view
        v-for="item in filteredList"
        :key="item.id"
        class="px-14px mb-12px bg-#fff rounded-12px shadow-[0_2px_8px_rgba(16,70,60,0.06)] overflow-hidden"
        @click="handleItemClick(item)"
      >
        <!-- 顶部标题行 -->
        <view class="pt-12px pb-6px flex items-start justify-between">
          <view class="flex-1 pr-10px">
            <text class="block text-15px font-600 color-#333">{{ item.title }}</text>
          </view>
          <view :style="{ background: getStatusStyle(item.status).bg }" class="px-10px h-22px fc rounded-6px">
            <text :style="{ color: getStatusStyle(item.status).color }" class="text-12px">{{ item.status }}</text>
          </view>
        </view>
        <view class="w-full h-1px bg-#EEEEEE my-10px"></view>
        <!-- 底部信息行 -->
        <view class="pb-12px flex items-center justify-between">
          <text class="text-12px color-#8B8AA1">{{ item.district }}</text>
          <text class="text-12px color-#8B8AA1">{{ item.time }}</text>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!filteredList.length && !loading" class="flex flex-col items-center justify-center py-60px">
        <text class="text-14px color-#999">暂无数据</text>
      </view>

      <!-- 加载更多状态 -->
      <view v-if="filteredList.length" class="py-20px">
        <uni-load-more
          :status="loadMoreStatus"
          :content-text="{ contentdown: '上拉加载更多', contentrefresh: '加载中...', contentnomore: '没有更多了' }"
        ></uni-load-more>
      </view>
    </scroll-view>

    <!-- 筛选弹窗 -->
    <uni-popup ref="filterPopup" type="bottom" :mask-click="true" @maskClick="showFilterPopup = false">
      <view v-if="showFilterPopup" class="bg-#fff rounded-t-20px pb-20px">
        <!-- 弹窗标题 -->
        <view class="flex items-center justify-between px-20px py-15px border-b-1px border-#f0f0f0">
          <text class="text-16px font-bold color-#333">筛选条件</text>
          <view @click="clearCurrentFilter">
            <text class="text-14px color-#01bd8d">清除</text>
          </view>
        </view>

        <!-- 筛选选项列表 -->
        <scroll-view scroll-y class="max-h-400px">
          <view
            v-for="option in currentFilterOptions"
            :key="option.value"
            class="px-20px py-15px flex items-center justify-between border-b-1px border-#f5f5f5"
            @click="selectFilter(option.value)"
          >
            <text class="text-15px color-#333">{{ option.text }}</text>
            <uni-icons
              v-if="
                (currentFilterType === 'status' && filters.status === option.value) ||
                (currentFilterType === 'growthStatus' && filters.growthStatus === option.value)
              "
              type="checkmarkempty"
              size="20"
              color="#01bd8d"
            ></uni-icons>
          </view>
        </scroll-view>

        <!-- 取消按钮 -->
        <view class="px-20px mt-15px">
          <view @click="showFilterPopup = false" class="w-full h-44px fc bg-#f5f5f5 rounded-8px">
            <text class="text-15px color-#666">取消</text>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<style scoped></style>
