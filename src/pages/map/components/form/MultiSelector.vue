<script lang="ts" setup>
import { ref, watch, computed } from 'vue';

interface Option {
  text: string;
  value: string;
}

const props = defineProps<{
  modelValue: string; // 改为字符串类型，用+号连接
  options: Option[];
  placeholder?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

// 内部使用数组管理选中的值
const selectedValues = ref<string[]>([]);
const popupRef = ref();

// 将字符串转换为数组
const stringToArray = (str: string): string[] => {
  if (!str || str === '') return [];
  return str.split('+').filter(Boolean);
};

// 将数组转换为字符串
const arrayToString = (arr: string[]): string => {
  return arr.join('+');
};

// 初始化和监听外部变化
watch(
  () => props.modelValue,
  newVal => {
    selectedValues.value = stringToArray(newVal);
  },
  { immediate: true },
);

// 打开弹窗
const openPopup = () => {
  popupRef.value?.open();
};

// 关闭弹窗
const closePopup = () => {
  popupRef.value?.close();
};

// 切换选项
const toggleOption = (value: string) => {
  const index = selectedValues.value.indexOf(value);
  if (index > -1) {
    selectedValues.value.splice(index, 1);
  } else {
    selectedValues.value.push(value);
  }
  // 转换为字符串发送
  emit('update:modelValue', arrayToString(selectedValues.value));
};

// 判断是否选中
const isSelected = (value: string) => {
  return selectedValues.value.includes(value);
};

// 获取显示文本
const displayText = computed(() => {
  if (selectedValues.value.length === 0) {
    return props.placeholder || '请选择';
  }
  const selectedTexts = selectedValues.value.map(val => props.options.find(opt => opt.value === val)?.text).filter(Boolean);
  return selectedTexts.join('+');
});
</script>

<template>
  <view class="multi-selector">
    <view class="selector-display" @click="openPopup">
      <text :class="['display-text', selectedValues.length === 0 ? 'placeholder' : '']">
        {{ displayText }}
      </text>
      <uni-icons type="bottom" size="14" color="#999"></uni-icons>
    </view>

    <uni-popup ref="popupRef" type="bottom">
      <view class="popup-content bg-#fff rounded-t-20px">
        <view class="popup-header h-50px flex items-center justify-between px-20px border-b-1px border-#eee">
          <text class="text-16px font-bold color-#333">{{ placeholder || '请选择' }}</text>
          <view @click="closePopup">
            <uni-icons type="closeempty" size="24" color="#666"></uni-icons>
          </view>
        </view>

        <view class="popup-body px-20px py-20px">
          <view
            v-for="option in options"
            :key="option.value"
            @click="toggleOption(option.value)"
            class="option-item h-44px flex items-center justify-between mb-10px px-15px rounded-8px"
            :class="[isSelected(option.value) ? 'bg-#01bd8d1a border-1px border-#01bd8d' : 'bg-#f5f5f5']"
          >
            <text :class="['text-14px', isSelected(option.value) ? 'color-#01bd8d font-bold' : 'color-#333']">
              {{ option.text }}
            </text>
            <uni-icons v-if="isSelected(option.value)" type="checkmarkempty" size="20" color="#01bd8d"></uni-icons>
          </view>
        </view>

        <view class="popup-footer px-20px pb-20px">
          <view @click="closePopup" class="w-full h-44px fc bg-#01bd8d rounded-8px">
            <text class="text-15px color-#fff">确定</text>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<style scoped>
.selector-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.display-text {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.display-text.placeholder {
  color: #999;
}

.popup-content {
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.popup-body {
  flex: 1;
  overflow-y: auto;
}
</style>
