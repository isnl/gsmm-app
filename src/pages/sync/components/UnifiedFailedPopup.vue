<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useSyncSurveyStore } from '@/stores/sync_survey';
import { useGermplasmLisStore } from '@/stores/germplasm_list';
import UploadFailedContent from './UploadFailedContent.vue';
import GermplasmFailedContent from './GermplasmFailedContent.vue';

// 定义 props
interface Props {
  visible: boolean;
  defaultTab?: 'survey' | 'germplasm';
}
const props = withDefaults(defineProps<Props>(), {
  defaultTab: 'survey',
});

// 定义 emits
const emit = defineEmits<{
  'update:visible': [visible: boolean];
  'handle-single-delete': [item: any];
  'handle-batch-cover': [];
  'handle-batch-delete': [];
  'handle-germplasm-edit': [item: any];
  'handle-germplasm-single-delete': [item: any];
  'handle-germplasm-batch-delete': [];
}>();

const syncSurveyStore = useSyncSurveyStore();
const germplasmLisStore = useGermplasmLisStore();
const { syncErrorList } = storeToRefs(syncSurveyStore);
const { germplasmList } = storeToRefs(germplasmLisStore);

// 弹窗引用
const unifiedFailedPopup = ref<any>(null);

// 当前激活的 tab
const activeTab = ref<'survey' | 'germplasm'>(props.defaultTab);

// 计算失败数据数量
const surveyFailedCount = computed(() => syncErrorList.value.length);
const germplasmFailedCount = computed(() => {
  return germplasmList.value.filter(item => item.status === 'syncError').length;
});

// 总失败数量
const totalFailedCount = computed(() => surveyFailedCount.value + germplasmFailedCount.value);

// tab 配置
const tabs = computed(() => [
  {
    key: 'survey',
    name: '调查',
    count: surveyFailedCount.value,
  },
  {
    key: 'germplasm',
    name: '种质资源',
    count: germplasmFailedCount.value,
  },
]);

// 监听弹窗显示状态
watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      // 根据失败数据情况自动选择默认 tab
      if (props.defaultTab === 'survey' && surveyFailedCount.value === 0 && germplasmFailedCount.value > 0) {
        activeTab.value = 'germplasm';
      } else if (props.defaultTab === 'germplasm' && germplasmFailedCount.value === 0 && surveyFailedCount.value > 0) {
        activeTab.value = 'survey';
      } else {
        activeTab.value = props.defaultTab;
      }
      unifiedFailedPopup.value?.open('bottom');
    } else {
      unifiedFailedPopup.value?.close();
    }
  },
  { immediate: true },
);

// 弹窗状态变化处理
const onPopupChange = (e: any) => {
  emit('update:visible', e.show);
};

// 切换 tab
const switchTab = (tabKey: 'survey' | 'germplasm') => {
  activeTab.value = tabKey;
};

// 转发事件到父组件
const handleSingleDelete = (item: any) => {
  emit('handle-single-delete', item);
};

const handleBatchCover = () => {
  emit('handle-batch-cover');
};

const handleBatchDelete = () => {
  emit('handle-batch-delete');
};

const handleGermplasmEdit = (item: any) => {
  emit('handle-germplasm-edit', item);
};

const handleGermplasmSingleDelete = (item: any) => {
  emit('handle-germplasm-single-delete', item);
};

const handleGermplasmBatchDelete = () => {
  emit('handle-germplasm-batch-delete');
};
</script>

<template>
  <uni-popup ref="unifiedFailedPopup" type="share" background-color="#fff" @change="onPopupChange">
    <div class="w-full h-70vh overflow-hidden flex flex-col">
      <!-- 标题栏 -->
      <view class="w-full flex fc justify-between px-15px py-12px border-b border-#eee">
        <text class="text-18px font-bold text-#333">失败数据</text>
        <text class="text-14px text-#666">共 {{ totalFailedCount }} 条</text>
      </view>

      <!-- Tab 切换栏 -->
      <view class="w-full px-15px py-8px border-b border-#eee flex items-center gap-20px">
        <view
          v-for="tab in tabs"
          :key="tab.key"
          class="px-12px py-6px rounded-4px text-14px font-medium cursor-pointer"
          :class="activeTab === tab.key ? 'bg-#08bd92 text-#fff' : 'text-#666'"
          @click="switchTab(tab.key as 'survey' | 'germplasm')"
        >
          {{ tab.name }} ({{ tab.count }})
        </view>
      </view>

      <!-- Tab 内容区域 -->
      <view class="flex-1 overflow-hidden">
        <!-- 调查失败数据 -->
        <UploadFailedContent
          v-if="activeTab === 'survey'"
          @handle-single-delete="handleSingleDelete"
          @handle-batch-cover="handleBatchCover"
          @handle-batch-delete="handleBatchDelete"
        />

        <!-- 种质资源失败数据 -->
        <GermplasmFailedContent
          v-if="activeTab === 'germplasm'"
          @handle-edit="handleGermplasmEdit"
          @handle-single-delete="handleGermplasmSingleDelete"
          @handle-batch-delete="handleGermplasmBatchDelete"
        />
      </view>
    </div>
  </uni-popup>
</template>
