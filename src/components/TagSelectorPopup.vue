<script lang="ts" setup>
import { ref, watch } from 'vue';

interface TagOption {
  text?: string;
  value: string;
  key?: string;
  diId?: number;
}

interface Props {
  title?: string;
  options: TagOption[];
  modelValue?: string;
  placeholder?: string;
  maxCustomLength?: number;
  allowCustom?: boolean;
  multiple?: boolean; // 是否支持多选
  separator?: string; // 多选时的分隔符，默认为逗号
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'confirm', value: string): void;
  (e: 'close'): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: '选择',
  placeholder: '',
  maxCustomLength: 10,
  allowCustom: true,
  multiple: false,
  separator: ',',
});

const emit = defineEmits<Emits>();

// 内部状态
const selectedValue = ref(props.modelValue || '');
const selectedValues = ref<string[]>([]); // 多选时的选中值数组
const customInput = ref('');

// 初始化多选状态
const initializeMultipleState = () => {
  if (props.multiple && props.modelValue) {
    selectedValues.value = props.modelValue.split(props.separator).filter(v => v.trim());
  }
};

// 更新输入状态
const updateInputState = () => {
  if (props.multiple) {
    initializeMultipleState();
  } else {
    const isPresetOption = props.options.some(option => option.value === selectedValue.value);
    if (!isPresetOption && selectedValue.value) {
      customInput.value = selectedValue.value;
    } else if (isPresetOption) {
      customInput.value = '';
    }
  }
};
// 监听外部值变化
watch(
  () => props.modelValue,
  newValue => {
    selectedValue.value = newValue || '';
    if (props.multiple) {
      selectedValues.value = newValue ? newValue.split(props.separator).filter(v => v.trim()) : [];
    }
    updateInputState();
  },
  { immediate: true },
);

// 选择预设选项
const selectOption = (option: TagOption) => {
  if (props.multiple) {
    const index = selectedValues.value.indexOf(option.value);
    if (index > -1) {
      // 如果已选中，则取消选中
      selectedValues.value.splice(index, 1);
    } else {
      // 如果未选中，则添加到选中列表
      selectedValues.value.push(option.value);
    }
    updateValue();
  } else {
    selectedValue.value = option.value;
    customInput.value = ''; // 清空自定义输入
    updateValue();
  }
};

// 自定义输入变化
const onCustomInput = (value: string) => {
  customInput.value = value;
  if (!props.multiple) {
    selectedValue.value = ''; // 清空预设选项的选中状态
    updateValue();
  }
  // 多选模式下不立即更新值，需要用户点击"添加"按钮
};

// 更新值
const updateValue = () => {
  if (props.multiple) {
    const finalValue = selectedValues.value.join(props.separator);
    emit('update:modelValue', finalValue);
  } else {
    const finalValue = customInput.value || selectedValue.value;
    emit('update:modelValue', finalValue);
  }
};

// 确认选择
const handleConfirm = () => {
  if (props.multiple) {
    const finalValue = selectedValues.value.join(props.separator);
    emit('confirm', finalValue);
  } else {
    const finalValue = customInput.value || selectedValue.value;
    emit('confirm', finalValue);
  }
  emit('close');
};

// 取消选择
const handleCancel = () => {
  emit('close');
};

// 添加自定义输入到多选列表
const addCustomToSelection = () => {
  if (props.multiple && customInput.value && !selectedValues.value.includes(customInput.value)) {
    selectedValues.value.push(customInput.value);
    customInput.value = ''; // 清空输入框
    updateValue();
  }
};
</script>

<template>
  <view class="bg-white rounded-t-20px max-h-80vh overflow-hidden">
    <!-- 头部 -->
    <view class="p-15px pb-10px b-b b-b-solid b-b-gray-200">
      <view class="flex items-center justify-between">
        <text class="text-18px font-500 text-gray-800">{{ title }}</text>
        <view class="flex items-center gap-20px">
          <text class="text-14px text-#555" @click="handleCancel">取消</text>
          <text class="text-14px bgPrimary px-20px py-5px text-#fff rounded-4px font-500" @click="handleConfirm">确定</text>
        </view>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="p-20px max-h-60vh overflow-y-auto">
      <!-- 预设选项 -->
      <view class="flex flex-wrap gap-12px mb-30px">
        <view
          v-for="option in options"
          :key="option.value"
          class="px-16px py-8px bg-gray-200 rounded-4px transition-all duration-200"
          :class="{
            '!bg-#01bd8d': multiple ? selectedValues.includes(option.value) : selectedValue === option.value && !customInput,
          }"
          @click="selectOption(option)"
        >
          <text
            class="text-14px text-gray-800"
            :class="{
              '!text-#fff': multiple ? selectedValues.includes(option.value) : selectedValue === option.value && !customInput,
            }"
          >
            {{ option.text || option.key || option.value }}
          </text>
        </view>
      </view>

      <!-- 自定义输入区域 -->
      <view v-if="allowCustom" class="pt-10px b-t-(1px solid #eee)">
        <view class="flex items-center justify-between mb-12px">
          <text class="text-16px text-gray-800 font-500">其他：</text>
          <view class="flex items-center gap-10px flex-1">
            <uni-easyinput
              :value="customInput"
              :placeholder="placeholder ? placeholder : `不超过${maxCustomLength}个字`"
              :maxlength="maxCustomLength"
              :clearable="false"
              @input="onCustomInput"
              class="flex-1"
            />
            <view v-if="multiple && customInput" class="px-12px py-6px bg-#01bd8d text-#fff rounded-4px text-12px cursor-pointer" @click="addCustomToSelection">
              添加
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
