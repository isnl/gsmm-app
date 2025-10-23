<script lang="ts" setup>
import { ref, computed } from 'vue';

interface Props {
  visible: boolean;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '累加计算',
});

const emit = defineEmits(['update:visible', 'confirm']);

const accumulatorPopup = ref<any>(null);
const currentInput = ref('');
const values = ref<number[]>([]);

// 计算总值
const totalValue = computed(() => {
  return values.value.reduce((sum, val) => sum + val, 0);
});

// 计算过程字符串
const calculationProcess = computed(() => {
  if (values.value.length === 0) return '';
  return values.value.join(' + ');
});

// 监听弹窗显示状态
const handlePopupChange = (e: any) => {
  emit('update:visible', e.show);
  if (!e.show) {
    // 弹窗关闭时重置数据
    reset();
  }
};

// 添加数值(支持回车)
const addValue = () => {
  const num = parseFloat(currentInput.value);
  if (!isNaN(num) && num > 0) {
    values.value.push(num);
    currentInput.value = '';
  } else if (currentInput.value.trim() !== '') {
    uni.showToast({
      title: '请输入有效的正数',
      icon: 'none',
    });
  }
};

// 删除数值
const removeValue = (index: number) => {
  values.value.splice(index, 1);
};

// 清空所有数值
const clearAll = () => {
  values.value = [];
};

// 确认
const confirm = () => {
  if (values.value.length === 0) {
    uni.showToast({
      title: '请至少添加一个数值',
      icon: 'none',
    });
    return;
  }

  emit('confirm', {
    total: totalValue.value,
    process: calculationProcess.value,
  });

  close();
};

// 关闭
const close = () => {
  emit('update:visible', false);
  accumulatorPopup.value?.close();
};

// 重置
const reset = () => {
  currentInput.value = '';
  values.value = [];
};

// 打开弹窗
const open = () => {
  accumulatorPopup.value?.open();
};

// 暴露方法给父组件
defineExpose({
  open,
  close,
});
</script>

<template>
  <uni-popup ref="accumulatorPopup" type="center" background-color="#fff" @change="handlePopupChange">
    <view class="w-80vw max-w-400px bg-white rounded-12px overflow-hidden">
      <!-- 标题栏 -->
      <view class="h-50px flex items-center justify-center bg-#f8f9fa border-b border-#eee">
        <text class="text-16px font-600 text-#333">{{ title }}</text>
      </view>

      <!-- 内容区域 -->
      <view class="p-20px">
        <!-- 输入区域 -->
        <view class="mb-20px">
          <view class="flex items-center gap-10px">
            <uni-easyinput v-model="currentInput" placeholder="请输入数字" type="number" :clearable="false" class="flex-1" @confirm="addValue" />
            <button class="w-64px h-40px bg-#07a47f rounded-6px flex items-center justify-center active:opacity-80" @click="addValue">
              <text class="text-14px text-white">添加</text>
            </button>
          </view>
        </view>

        <!-- 已添加的数值列表 -->
        <view v-if="values.length > 0" class="mb-20px">
          <view class="flex items-center justify-between mb-12px">
            <text class="text-14px text-#666">已添加 {{ values.length }} 项</text>
            <text class="text-13px text-#ff6b6b px-10px py-4px bg-#fff5f5 rounded-4px" @click="clearAll">清空</text>
          </view>
          <view class="flex flex-wrap gap-10px">
            <view v-for="(value, index) in values" :key="index" class="flex items-center gap-8px px-12px py-6px bg-#f5f5f5 rounded-6px">
              <text class="text-15px text-#333">{{ value }}</text>
              <view class="w-20px h-20px bg-#ff6b6b rounded-full flex items-center justify-center active:opacity-80" @click="removeValue(index)">
                <text class="text-14px text-white font-bold leading-none">×</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态提示 -->
        <view v-else class="flex flex-col items-center justify-center py-40px px-20px mb-20px">
          <text class="text-40px mb-10px opacity-50">📝</text>
          <text class="text-14px text-#999">请输入数字并添加</text>
        </view>

        <!-- 计算结果 -->
        <view v-if="values.length > 0" class="mb-20px p-14px bg-#f8f9fa rounded-8px">
          <view class="mb-10px pb-10px border-b border-#e9ecef">
            <text class="text-13px text-#666 mr-6px">计算过程</text>
            <text class="text-14px text-#333">{{ calculationProcess }}</text>
          </view>
          <view class="flex items-baseline gap-10px">
            <text class="text-14px text-#666">总计</text>
            <text class="text-24px font-600 text-#07a47f">{{ totalValue }}</text>
          </view>
        </view>

        <!-- 按钮区域 -->
        <view class="flex gap-10px">
          <button class="flex-1 h-42px rounded-6px text-15px flex items-center justify-center bg-#f5f5f5 text-#666 active:bg-#e8e8e8" @click="close">
            取消
          </button>
          <button class="flex-1 h-42px rounded-6px text-15px flex items-center justify-center bg-#07a47f text-white active:opacity-80" @click="confirm">
            确定
          </button>
        </view>
      </view>
    </view>
  </uni-popup>
</template>

<style scoped></style>
