<template>
  <view class="w-full p-15px flex justify-between px-10px gap-10px">
    <button
      class="flex-1 bg-#F2F2F6 !b-#F2F2F6 text-16px text-#333 rounded-4px"
      @click="onNextStep"
      :disabled="nextLoading"
      :loading="nextLoading"
    >
      {{ nextLoading ? '处理中...' : '下一步' }}
    </button>
    <button
      class="flex-1 bg-#306AFF b b-#306AFF text-16px text-#fff rounded-4px"
      @click="handleSubmit"
      :disabled="submitLoading"
      :loading="submitLoading"
    >
      {{ submitLoading ? '处理中...' : '完成' }}
    </button>
  </view>
</template>
<script lang="ts" setup>
const props = defineProps({
  nextLoading: {
    type: Boolean,
    default: false,
  },
  submitLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['onNextStep', 'handleSubmit']);
const onNextStep = () => {
  emit('onNextStep');
};
const handleSubmit = () => {
  emit('handleSubmit');
};
</script>
