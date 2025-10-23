<script lang="ts" setup>
import { ref } from 'vue';

// 定义 props
interface Props {
  formData: {
    codeNumber: string;
    collectTime: string;
    weather: string;
    collectTeam: string;
    collectPersonnel: string;
    parentHealthStatus?: string;
    hasPestsDiseases?: string;
    phenotypeDescription?: string;
    communityEnvironment?: string;
    [key: string]: any;
  };
  isHistory: boolean;
  historyInfo: {
    longitude: string;
    latitude: string;
    aspect: string;
    slopePosition: string;
    slope: string;
    soilTexture: string;
    landform: string;
  };
}

const props = defineProps<Props>();

// 定义 emits
const emit = defineEmits<{
  'update:formData': [formData: Props['formData']];
}>();

// 更新表单数据的辅助函数
const updateFormData = (key: string, value: string) => {
  const newFormData = { ...props.formData };
  (newFormData as any)[key] = value;
  emit('update:formData', newFormData);
};

// 由于土壤质地和地貌改为仅显示，不需要弹窗控制
</script>

<template>
  <view class="w-full px-15px pb-10px bg-#fff rounded-8px">
    <!-- 地理位置信息（仅回显展示） -->
    <uni-forms-item label="经度" class="!mb-0">
      <view class="flex-1 h-full flex items-center">
        <text class="text-#666">{{ historyInfo.longitude ? historyInfo.longitude : '' }}</text>
      </view>
    </uni-forms-item>

    <uni-forms-item label="纬度" class="!mb-0">
      <view class="flex-1 h-full flex items-center">
        <text class="text-#666">{{ historyInfo.latitude ? historyInfo.latitude : '' }}</text>
      </view>
    </uni-forms-item>

    <uni-forms-item label="坡向" class="!mb-0">
      <view class="flex-1 h-full flex items-center">
        <text class="text-#666">{{ historyInfo.aspect ? historyInfo.aspect : '' }}</text>
      </view>
    </uni-forms-item>

    <uni-forms-item label="坡位" class="!mb-0">
      <view class="flex-1 h-full flex items-center">
        <text class="text-#666">{{ historyInfo.slopePosition ? historyInfo.slopePosition : '' }}</text>
      </view>
    </uni-forms-item>

    <uni-forms-item label="坡度" class="!mb-0">
      <view class="flex-1 h-full flex items-center">
        <text class="text-#666">{{ historyInfo.slope ? historyInfo.slope : '' }}</text>
      </view>
    </uni-forms-item>

    <!-- 土壤质地 -->
    <uni-forms-item label="土壤质地" class="!mb-0px">
      <view class="flex-1 h-full flex items-center">
        <text class="text-#666">{{ historyInfo.soilTexture ? historyInfo.soilTexture : '' }}</text>
      </view>
    </uni-forms-item>

    <!-- 地貌 -->
    <uni-forms-item label="地貌" class="!mb-0px">
      <view class="flex-1 h-full flex items-center">
        <text class="text-#666">{{ historyInfo.landform ? historyInfo.landform : '' }}</text>
      </view>
    </uni-forms-item>

    <!-- 群落环境描述 -->
    <uni-forms-item label="群落环境" name="communityEnvironment" class="!mb-20px" required>
      <uni-easyinput
        :disabled="isHistory"
        :value="props.formData.communityEnvironment"
        @input="(value: string) => updateFormData('communityEnvironment', value)"
        type="textarea"
        placeholder="请输入群落环境描述"
        :clearable="false"
        maxlength="500"
      />
    </uni-forms-item>
  </view>
</template>
