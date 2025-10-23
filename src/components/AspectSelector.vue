<template>
  <view class="w-full">
    <!-- 显示选择结果的输入框 -->
    <view class="flex b-(1px solid #e5e5e5) items-center justify-between px-12px py-8px rounded-4px bg-white cursor-pointer" @click="openCompassPopup">
      <text class="text-14px" :class="selectedText ? 'text-#333' : 'text-#999'">
        {{ selectedText || placeholder }}
      </text>
      <uni-icons type="right" size="16" color="#c0c4cc"></uni-icons>
    </view>

    <!-- 罗盘选择弹窗 -->
    <uni-popup ref="compassPopupRef" type="center" :mask-click="true" @change="onPopupChange">
      <view class="w-90vw bg-white rounded-12px">
        <!-- 标题 -->
        <view class="text-center py-20px">
          <text class="text-18px font-medium text-#333">请选择坡向</text>
        </view>

        <!-- 罗盘容器 -->
        <view class="relative w-300px h-300px fc mx-auto">
          <!-- 指北针背景图片 - 根据设备方向旋转，使图片上的北方指针始终指向真正的北方 -->
          <view class="w-180px h-180px transition-transform duration-500 ease-out" :style="{ transform: `rotate(${-smoothRotation}deg)` }">
            <image src="/static/images/compass.png" class="w-full h-full" mode="aspectFit" />
          </view>

          <!-- 方向按钮层 - 跟随罗盘一起旋转 -->
          <view class="absolute top-0 left-0 w-full h-full transition-transform duration-500 ease-out" :style="{ transform: `rotate(${-smoothRotation}deg)` }">
            <!-- 北 -->
            <view
              class="absolute top-5px left-1/2 -translate-x-1/2 px-12px py-6px rounded-6px text-14px font-medium text-center cursor-pointer transition-all duration-200 ease backdrop-blur-2px border border-white/30"
              :class="selectedValue === '北坡' ? 'bg-#01bd8d/90 text-white' : 'bg-#f5f5f5/90 text-#666'"
              :style="{ transform: `translateX(-50%) rotate(${smoothRotation}deg)` }"
              @click="selectAspect('北坡')"
            >
              北坡
            </view>

            <!-- 东北 -->
            <view
              class="absolute top-35px right-35px px-12px py-6px rounded-6px text-14px font-medium text-center cursor-pointer transition-all duration-200 ease backdrop-blur-2px border border-white/30"
              :class="selectedValue === '东北坡' ? 'bg-#01bd8d/90 text-white' : 'bg-#f5f5f5/90 text-#666'"
              :style="{ transform: `rotate(${smoothRotation}deg)` }"
              @click="selectAspect('东北坡')"
            >
              东北坡
            </view>

            <!-- 东 -->
            <view
              class="absolute top-1/2 right-15px -translate-y-1/2 px-12px py-6px rounded-6px text-14px font-medium text-center cursor-pointer transition-all duration-200 ease backdrop-blur-2px border border-white/30"
              :class="selectedValue === '东坡' ? 'bg-#01bd8d/90 text-white' : 'bg-#f5f5f5/90 text-#666'"
              :style="{ transform: `translateY(-50%) rotate(${smoothRotation}deg)` }"
              @click="selectAspect('东坡')"
            >
              东坡
            </view>

            <!-- 东南 -->
            <view
              class="absolute bottom-35px right-35px px-12px py-6px rounded-6px text-14px font-medium text-center cursor-pointer transition-all duration-200 ease backdrop-blur-2px border border-white/30"
              :class="selectedValue === '东南坡' ? 'bg-#01bd8d/90 text-white' : 'bg-#f5f5f5/90 text-#666'"
              :style="{ transform: `rotate(${smoothRotation}deg)` }"
              @click="selectAspect('东南坡')"
            >
              东南坡
            </view>

            <!-- 南 -->
            <view
              class="absolute bottom-15px left-1/2 -translate-x-1/2 px-12px py-6px rounded-6px text-14px font-medium text-center cursor-pointer transition-all duration-200 ease backdrop-blur-2px border border-white/30"
              :class="selectedValue === '南坡' ? 'bg-#01bd8d/90 text-white' : 'bg-#f5f5f5/90 text-#666'"
              :style="{ transform: `translateX(-50%) rotate(${smoothRotation}deg)` }"
              @click="selectAspect('南坡')"
            >
              南坡
            </view>

            <!-- 西南 -->
            <view
              class="absolute bottom-35px left-35px px-12px py-6px rounded-6px text-14px font-medium text-center cursor-pointer transition-all duration-200 ease backdrop-blur-2px border border-white/30"
              :class="selectedValue === '西南坡' ? 'bg-#01bd8d/90 text-white' : 'bg-#f5f5f5/90 text-#666'"
              :style="{ transform: `rotate(${smoothRotation}deg)` }"
              @click="selectAspect('西南坡')"
            >
              西南坡
            </view>

            <!-- 西 -->
            <view
              class="absolute top-1/2 left-15px -translate-y-1/2 px-12px py-6px rounded-6px text-14px font-medium text-center cursor-pointer transition-all duration-200 ease backdrop-blur-2px border border-white/30"
              :class="selectedValue === '西坡' ? 'bg-#01bd8d/90 text-white' : 'bg-#f5f5f5/90 text-#666'"
              :style="{ transform: `translateY(-50%) rotate(${smoothRotation}deg)` }"
              @click="selectAspect('西坡')"
            >
              西坡
            </view>

            <!-- 西北 -->
            <view
              class="absolute top-35px left-35px px-12px py-6px rounded-6px text-14px font-medium text-center cursor-pointer transition-all duration-200 ease backdrop-blur-2px border border-white/30"
              :class="selectedValue === '西北坡' ? 'bg-#01bd8d/90 text-white' : 'bg-#f5f5f5/90 text-#666'"
              :style="{ transform: `rotate(${smoothRotation}deg)` }"
              @click="selectAspect('西北坡')"
            >
              西北坡
            </view>
          </view>

          <!-- 无坡向选项 -->
          <view class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <view
              class="px-12px py-6px rounded-6px text-14px font-medium text-center cursor-pointer transition-all duration-200 ease backdrop-blur-2px border border-white/30"
              :class="selectedValue === '无坡向' ? 'bg-#01bd8d/90 text-white' : 'bg-#f5f5f5/90 text-#666'"
              @click="selectAspect('无坡向')"
            >
              无坡向
            </view>
          </view>
        </view>

        <!-- 当前选择显示 -->
        <view class="text-center mt-20px">
          <text class="text-16px text-#333">当前选择：{{ selectedValue || '未选择' }}</text>
        </view>

        <!-- 操作按钮 -->
        <view class="flex justify-center mt-20px py-20px">
          <button
            class="px-20px h-46px fc py-12px bg-#f5f5f5 text-#666 rounded-6px text-14px border-none cursor-pointer transition-all duration-200 ease hover:bg-#e8e8e8"
            @click="closePopup"
          >
            关闭
          </button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue';

interface Props {
  modelValue?: string;
  localdata?: Array<{ diId?: number; key?: string; value: string; text?: string }>;
  placeholder?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择坡向',
});

const emit = defineEmits<Emits>();

// 弹窗引用
const compassPopupRef = ref();

// 选择的坡向值
const selectedValue = ref(props.modelValue || '');

// 罗盘旋转角度
const compassRotation = ref(0);

// 平滑旋转角度
const smoothRotation = ref(0);

// 角度平滑处理函数
const updateSmoothRotation = (newDirection: number) => {
  // 直接使用传感器角度值，避免累加误差
  smoothRotation.value = newDirection;
};

// 显示文本
const selectedText = computed(() => {
  if (!selectedValue.value) return '';
  const item = props.localdata?.find(item => item.value === selectedValue.value);
  return item?.text || item?.key || selectedValue.value;
});

// 打开罗盘弹窗
const openCompassPopup = () => {
  compassPopupRef.value?.open();
  startCompass();
};

// 关闭弹窗
const closePopup = () => {
  compassPopupRef.value?.close();
  stopCompass();
};

// 弹窗状态变化
const onPopupChange = (e: any) => {
  if (!e.show) {
    stopCompass();
  }
};

// 选择坡向 - 选择即确认
const selectAspect = (aspect: string) => {
  selectedValue.value = aspect;
  // 立即确认选择并关闭弹窗
  emit('update:modelValue', aspect);
  closePopup();
};

// 启动罗盘
const startCompass = () => {
  // 初始化角度
  smoothRotation.value = 0;

  // 使用uni-app的罗盘API
  uni.onCompassChange((res: any) => {
    // res.direction: 面对的方向度数，0度为正北，90度为正东，180度为正南，270度为正西
    const direction = res.direction || 0;
    // 修正90度偏移，使北方指针正确指向北方
    const correctedDirection = direction;
    // 更新罗盘方向（方向按钮层反向旋转，保持指北针固定指向北方）
    compassRotation.value = correctedDirection;
    // 使用平滑旋转
    updateSmoothRotation(correctedDirection);
  });

  // 启动罗盘监听
  uni.startCompass({
    success: () => {
      console.log('罗盘启动成功');
    },
    fail: (error: any) => {
      console.error('罗盘启动失败:', error);
      uni.showToast({
        title: '罗盘启动失败',
        icon: 'none',
      });
    },
  });
};

// 停止罗盘
const stopCompass = () => {
  // 停止罗盘监听
  uni.stopCompass({
    success: () => {
      console.log('罗盘停止成功');
    },
    fail: (error: any) => {
      console.error('罗盘停止失败:', error);
    },
  });

  // 移除罗盘变化监听
  uni.offCompassChange(() => {
    console.log('罗盘监听已移除');
  });
};

// 监听props变化
const updateSelectedValue = () => {
  selectedValue.value = props.modelValue || '';
};

// 组件卸载时清理
onUnmounted(() => {
  stopCompass();
});

// 监听modelValue变化
watch(() => props.modelValue, updateSelectedValue, { immediate: true });
</script>
