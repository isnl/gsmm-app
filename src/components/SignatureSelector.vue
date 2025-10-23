<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useGlobalStore } from '@/stores/global';
import { storeToRefs } from 'pinia';

interface Props {
  modelValue: string | string[]; // 支持单选(string)和多选(string[])
  multiple?: boolean; // 是否多选
  title?: string; // 弹窗标题
}

interface Emits {
  (e: 'update:modelValue', value: string | string[]): void;
  (e: 'confirm', value: string | string[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  title: '选择签名',
});

const emit = defineEmits<Emits>();

const globalStore = useGlobalStore();
const { signatures } = storeToRefs(globalStore);

// 弹窗控制
const popupRef = ref();
const isVisible = ref(false);

// 内部选中状态
const selectedValue = ref<string | string[]>(props.multiple ? [] : '');

// 计算属性：格式化显示的选中签名
const selectedSignatureNames = computed(() => {
  if (props.multiple && Array.isArray(selectedValue.value)) {
    return selectedValue.value
      .map(id => signatures.value.find(sig => sig.id === id)?.name)
      .filter(Boolean)
      .join('、');
  } else if (!props.multiple && typeof selectedValue.value === 'string') {
    const signature = signatures.value.find(sig => sig.id === selectedValue.value);
    return signature?.name || '';
  }
  return '';
});

// 打开弹窗
const open = () => {
  // 初始化选中状态
  selectedValue.value = props.multiple 
    ? (Array.isArray(props.modelValue) ? [...props.modelValue] : [])
    : (typeof props.modelValue === 'string' ? props.modelValue : '');
  
  isVisible.value = true;
  popupRef.value?.open();
};

// 关闭弹窗
const close = () => {
  isVisible.value = false;
  popupRef.value?.close();
};

// 处理签名选择
const handleSignatureSelect = (signatureId: string) => {
  if (props.multiple) {
    const currentSelected = selectedValue.value as string[];
    const index = currentSelected.indexOf(signatureId);
    
    if (index > -1) {
      // 取消选择
      selectedValue.value = currentSelected.filter(id => id !== signatureId);
    } else {
      // 添加选择
      selectedValue.value = [...currentSelected, signatureId];
    }
  } else {
    // 单选模式
    selectedValue.value = signatureId;
  }
};

// 检查是否选中
const isSelected = (signatureId: string) => {
  if (props.multiple && Array.isArray(selectedValue.value)) {
    return selectedValue.value.includes(signatureId);
  } else {
    return selectedValue.value === signatureId;
  }
};

// 确认选择
const handleConfirm = () => {
  emit('update:modelValue', selectedValue.value);
  emit('confirm', selectedValue.value);
  close();
};

// 取消选择
const handleCancel = () => {
  close();
};

// 跳转到签名管理页面
const goSignatureManagement = () => {
  uni.navigateTo({
    url: '/pages/signature_management/index',
  });
};

// 暴露方法给父组件
defineExpose({
  open,
  close,
});
</script>

<template>
  <uni-popup ref="popupRef" type="bottom" :mask-click="false">
    <view class="bg-white rounded-t-12px">
      <!-- 标题栏 -->
      <view class="flex items-center justify-between p-16px border-b-1px border-#f0f0f0">
        <text class="text-18px font-medium text-#333">{{ title }}</text>
        <view class="flex items-center gap-12px">
          <view class="px-12px py-6px bg-#f5f5f5 rounded-6px" @click="goSignatureManagement">
            <text class="text-12px text-#666">管理签名</text>
          </view>
          <view @click="handleCancel">
            <uni-icons type="close" size="20" color="#999"></uni-icons>
          </view>
        </view>
      </view>

      <!-- 签名列表 -->
      <scroll-view :scroll-y="true" class="max-h-400px">
        <view class="p-16px">
          <view v-if="signatures.length === 0" class="py-40px text-center">
            <uni-icons type="compose" size="40" color="#ccc"></uni-icons>
            <text class="block mt-12px text-14px text-#999">暂无签名</text>
            <text class="block mt-4px text-12px text-#ccc">请先创建签名</text>
          </view>
          
          <view v-else class="space-y-8px">
            <view
              v-for="signature in signatures"
              :key="signature.id"
              :class="[
                'flex items-center p-12px rounded-8px border-1px transition-all',
                isSelected(signature.id) 
                  ? 'border-#08bd92 bg-#08bd92/5' 
                  : 'border-#f0f0f0 bg-white'
              ]"
              @click="handleSignatureSelect(signature.id)"
            >
              <!-- 签名图片 -->
              <view class="w-60px h-30px rounded-4px overflow-hidden mr-12px">
                <image :src="signature.imageUrl" mode="aspectFit" class="w-full h-full" />
              </view>
              
              <!-- 签名名称 -->
              <view class="flex-1">
                <text :class="[
                  'text-14px font-medium',
                  isSelected(signature.id) ? 'text-#08bd92' : 'text-#333'
                ]">{{ signature.name }}</text>
              </view>
              
              <!-- 选中状态 -->
              <view v-if="isSelected(signature.id)" class="w-20px h-20px">
                <uni-icons type="checkmarkempty" size="20" color="#08bd92"></uni-icons>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 底部按钮 -->
      <view class="flex items-center gap-12px p-16px border-t-1px border-#f0f0f0">
        <view class="flex-1 py-12px bg-#f5f5f5 rounded-8px" @click="handleCancel">
          <text class="text-14px text-#666 text-center block">取消</text>
        </view>
        <view class="flex-1 py-12px bg-#08bd92 rounded-8px" @click="handleConfirm">
          <text class="text-14px text-white text-center block">确定</text>
        </view>
      </view>
    </view>
  </uni-popup>
</template>

<style scoped>
.space-y-8px > * + * {
  margin-top: 8px;
}
</style>
