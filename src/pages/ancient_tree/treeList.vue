<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { service } from '@/service';
import { growthStatusOptions } from './constants';

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

// 顶部筛选
const tabs = ref([
  { key: 'all', name: '全部' },
  { key: 'status', name: '调查状态', withArrow: true },
  { key: 'growthStatus', name: '生长势', withArrow: true },
]);
const activeTab = ref('all');

// 筛选条件
const filters = ref({
  status: '' as Status | '', // 调查状态（前端展示用）
  statusValue: undefined as number | undefined, // 调查状态（后端接口用）0 待调查 1 调查中 2已调查
  growthStatus: '', // 生长势
});

// 筛选弹窗显示状态
const showFilterPopup = ref(false);
const currentFilterType = ref<'status' | 'growthStatus'>('status');
const filterPopup = ref();

// 列表数据
const list = ref<TreeItem[]>([]);
const loading = ref(false);

// 分页相关
const currentPage = ref(1); // 当前页码
const pageSize = ref(10); // 每页条数
const total = ref(0); // 总条数
const totalPages = computed(() => Math.ceil(total.value / pageSize.value)); // 总页数

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
  switch (status) {
    case '已调查':
      return { bg: '#E6F7F1', color: '#01bd8d' };
    case '调查中':
      return { bg: '#EAF2FF', color: '#4D79FF' };
    default:
      return { bg: '#EFF2F5', color: '#99A0AA' };
  }
};

// 转换状态文字
const getStatusText = (status: number): Status => {
  switch (status) {
    case 0:
      return '待调查';
    case 1:
      return '调查中';
    case 2:
      return '已调查';
    default:
      return '待调查';
  }
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
const loadList = async () => {
  loading.value = true;

  try {
    // 构建查询参数
    const params: any = {
      page: currentPage.value,
      size: pageSize.value,
    };

    // 添加筛选条件
    if (filters.value.statusValue !== undefined) {
      params.status = filters.value.statusValue;
    }
    if (filters.value.growthStatus) {
      params.szsdj = filters.value.growthStatus;
    }
    console.log('筛选条件:', params);

    const res = await service({
      url: '/gu_shus',
      method: 'GET',
      params,
    });

    if (res && res.data) {
      console.log('列表数据:', res.data);

      // 更新总数
      total.value = res.data.count || 0;

      // 转换数据格式
      const newData = (Array.isArray(res.data.data) ? res.data.data : []).map((item: any) => {
        const status = getStatusText(item.status);
        const title = item.gsmmbh ? `${item.gsmmbh} ${item.zwm || ''}`.trim() : item.zwm || '未命名古树';
        const district = [item.xz, item.cun].filter(Boolean).join(' ') || '未知行政区';
        const time = formatTime(item.updatedAt || item.createdAt);

        return {
          ...item,
          id: item.id,
          title,
          district,
          time,
          status,
          submitType: item.submitType,
        };
      });

      list.value = newData;
    }
  } catch (error: any) {
    console.error('加载列表失败:', error);
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

// 手动刷新
const refreshList = async () => {
  currentPage.value = 1;
  await loadList();
  uni.showToast({
    title: '刷新成功',
    icon: 'success',
    duration: 1500,
  });
};

// 分页控制
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) {
    return;
  }
  currentPage.value = page;
  loadList();
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadList();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    loadList();
  }
};

// 筛选选项数据
const statusOptions = ref([
  { text: '待调查', value: '待调查', apiValue: 0 },
  { text: '调查中', value: '调查中', apiValue: 1 },
  { text: '已调查', value: '已调查', apiValue: 2 },
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
      statusValue: undefined,
      growthStatus: '',
    };
    // 重置到第一页并重新加载
    currentPage.value = 1;
    loadList();
  } else {
    activeTab.value = key;
    currentFilterType.value = key as 'status' | 'growthStatus';
    showFilterPopup.value = true;
    filterPopup.value?.open();
  }
};

// 选择筛选项
const selectFilter = (option: any) => {
  if (currentFilterType.value === 'status') {
    filters.value.status = option.value as Status;
    filters.value.statusValue = option.apiValue;
  } else if (currentFilterType.value === 'growthStatus') {
    filters.value.growthStatus = option.value;
  }

  // 重置到第一页并重新加载
  currentPage.value = 1;
  loadList();

  showFilterPopup.value = false;
  filterPopup.value?.close();
};

// 清除当前筛选
const clearCurrentFilter = () => {
  if (currentFilterType.value === 'status') {
    filters.value.status = '';
    filters.value.statusValue = undefined;
  } else if (currentFilterType.value === 'growthStatus') {
    filters.value.growthStatus = '';
  }
  activeTab.value = 'all';

  // 重置到第一页并重新加载
  currentPage.value = 1;
  loadList();

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
  currentPage.value = 1;
  loadList();
});
</script>

<template>
  <view class="w-full h-full bg-#f5f6f7 flex flex-col">
    <!-- 顶部筛选栏 - 固定 -->
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

        <!-- 刷新按钮 -->
        <view class="flex-1 flex justify-end">
          <view class="w-28px h-28px fc rounded-6px bg-#f5f5f5" @click="refreshList">
            <uni-icons type="refreshempty" size="18" color="#01bd8d" />
          </view>
        </view>
      </view>
    </view>

    <!-- 列表区域 - 可滚动 -->
    <scroll-view scroll-y class="flex-1 overflow-hidden px-14px">
      <!-- 加载中 -->
      <view v-if="loading" class="flex items-center justify-center py-60px">
        <uni-load-more status="loading"></uni-load-more>
      </view>

      <!-- 列表内容 -->
      <view v-else class="pb-14px">
        <view
          v-for="item in list"
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
        <view v-if="!list.length && !loading" class="flex flex-col items-center justify-center py-60px">
          <text class="text-14px color-#999">暂无数据</text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部分页控制 - 固定 -->
    <view v-if="list.length > 0" class="bg-#fff border-t-1px border-#eee px-14px py-12px">
      <view class="w-full bg-#fff rounded-12px h-44px flex items-center justify-center gap-8px">
        <!-- 上一页 -->
        <view
          class="w-64px h-32px fc rounded-6px border-1px"
          :class="currentPage === 1 ? 'border-#e5e5e5 bg-#f5f5f5' : 'border-#01bd8d bg-#fff'"
          @click="prevPage"
        >
          <text class="text-13px" :class="currentPage === 1 ? 'color-#ccc' : 'color-#01bd8d'">上一页</text>
        </view>

        <!-- 页码显示 -->
        <view class="px-12px h-32px fc">
          <text class="text-13px color-#333">{{ currentPage }} / {{ totalPages }} 页 · 共 {{ total }} 条</text>
        </view>

        <!-- 下一页 -->
        <view
          class="w-64px h-32px fc rounded-6px border-1px"
          :class="currentPage >= totalPages ? 'border-#e5e5e5 bg-#f5f5f5' : 'border-#01bd8d bg-#fff'"
          @click="nextPage"
        >
          <text class="text-13px" :class="currentPage >= totalPages ? 'color-#ccc' : 'color-#01bd8d'">下一页</text>
        </view>
      </view>
    </view>

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
            @click="selectFilter(option)"
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

        <!-- 底部按钮 -->
        <view class="px-20px mt-15px">
          <view
            @click="
              filterPopup?.close();
              showFilterPopup = false;
            "
            class="w-full h-44px fc bg-#f5f5f5 rounded-8px"
          >
            <text class="text-15px color-#666">取消</text>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<style scoped></style>
