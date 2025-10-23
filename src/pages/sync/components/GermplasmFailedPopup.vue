<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useGermplasmLisStore } from '@/stores/germplasm_list';
import { storeToRefs } from 'pinia';
import { onLoad } from '@dcloudio/uni-app';

// 定义 props
interface Props {
  visible: boolean;
}
const props = defineProps<Props>();

// 定义 emits
const emit = defineEmits<{
  'update:visible': [visible: boolean];
  'handle-edit': [item: any];
}>();

const germplasmLisStore = useGermplasmLisStore();
const { germplasmList } = storeToRefs(germplasmLisStore);

// 弹窗引用
const germplasmFailedPopup = ref<any>(null);
const expandedItems = ref<Set<string>>(new Set());

// 获取同步失败的种质资源数据
const failedGermplasmList = computed(() => {
  return germplasmList.value.filter(item => item.status === 'syncError');
});

// 监听弹窗显示状态
watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      germplasmFailedPopup.value?.open('bottom');
    } else {
      germplasmFailedPopup.value?.close();
    }
  },
  { immediate: true },
);

// 弹窗状态变化处理
const onPopupChange = (e: any) => {
  emit('update:visible', e.show);
};

// 切换展开/收缩状态
const toggleExpand = (itemId: string) => {
  if (expandedItems.value.has(itemId)) {
    expandedItems.value.delete(itemId);
  } else {
    expandedItems.value.add(itemId);
  }
};

// 关闭弹窗
const closePopup = () => {
  emit('update:visible', false);
};

// 处理编辑
const handleEdit = (item: any) => {
  emit('handle-edit', item);
  closePopup();
};
</script>

<template>
  <uni-popup ref="germplasmFailedPopup" type="share" background-color="#fff" @change="onPopupChange">
    <div class="w-full h-70vh overflow-hidden flex flex-col">
      <!-- 标题栏 -->
      <view class="w-full flex fc justify-between px-15px py-12px border-b border-#eee">
        <text class="text-18px font-bold text-#333">种质资源失败数据</text>
        <text class="text-14px text-#666">共 {{ failedGermplasmList.length }} 条</text>
      </view>

      <!-- 失败数据列表 -->
      <view class="flex-1 overflow-hidden">
        <scroll-view :scroll-y="true" class="h-full px-15px">
          <view v-for="item in failedGermplasmList" :key="item.tempId" class="py-12px border-b border-#eee">
            <!-- 数据标题行 -->
            <view class="flex flex-col cursor-pointer" @click="toggleExpand(item.tempId || '')">
              <view class="flex items-center justify-between">
                <view class="flex-1">
                  <text class="text-16px font-bold text-#333">{{ item.codeNumber || '无编号' }}</text>
                </view>
                <uni-icons :type="expandedItems.has(item.tempId || '') ? 'bottom' : 'right'" size="20" color="#666" />
              </view>
              <view class="text-12px text-red">失败原因：{{ item.syncErrorMessage || '- -' }}</view>
            </view>

            <!-- 详情数据 -->
            <view v-if="expandedItems.has(item.tempId || '')" class="mt-12px">
              <!-- 基本信息 -->
              <view class="w-full p-15px bg-#f8f8f8 rounded-8px">
                <view class="flex flex-col gap-8px">
                  <view class="flex gap-20px">
                    <text class="w-80px text-right text-14px text-#516280">挂牌编号</text>
                    <text class="flex-1 text-14px text-#333">{{ item.codeNumber || '无编号' }}</text>
                  </view>
                  <view v-if="item.collectTime" class="flex gap-20px">
                    <text class="w-80px text-right text-14px text-#516280">采集时间</text>
                    <text class="flex-1 text-14px text-#333">{{ item.collectTime }}</text>
                  </view>
                  <view v-if="item.collectTeam" class="flex gap-20px">
                    <text class="w-80px text-right text-14px text-#516280">采集团队</text>
                    <text class="flex-1 text-14px text-#333">{{ item.collectTeam }}</text>
                  </view>
                  <view v-if="item.collectPersonnel" class="flex gap-20px">
                    <text class="w-80px text-right text-14px text-#516280">采集人员</text>
                    <text class="flex-1 text-14px text-#333">{{ item.collectPersonnel }}</text>
                  </view>
                  <view v-if="item.weather" class="flex gap-20px">
                    <text class="w-80px text-right text-14px text-#516280">天气状况</text>
                    <text class="flex-1 text-14px text-#333">{{ item.weather }}</text>
                  </view>
                  <view v-if="item.details && item.details.length > 0" class="flex gap-20px">
                    <text class="w-80px text-right text-14px text-#516280">采集详情</text>
                    <text class="flex-1 text-14px text-#333">{{ item.details.length }} 条记录</text>
                  </view>
                </view>
              </view>

              <!-- 单个数据操作按钮 -->
              <view class="flex items-center gap-12px mt-12px pt-12px border-t border-#eee">
                <button class="flex-1 h-36px text-#fff bg-#225ed5 text-14px rounded-5px fc" @click="handleEdit(item)">编辑</button>
              </view>
            </view>
          </view>

          <!-- 空状态 -->
          <view v-if="failedGermplasmList.length === 0" class="py-40px text-center text-#999"> 暂无失败数据 </view>
        </scroll-view>
      </view>
    </div>
  </uni-popup>
</template>
