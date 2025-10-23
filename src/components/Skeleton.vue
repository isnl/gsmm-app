<template>
  <view
    class="skeleton-container"
    :class="{ 'skeleton-animated': animated }"
    v-if="loading"
  >
    <!-- 头像部分 -->
    <view
      v-if="avatar"
      class="skeleton-avatar"
      :class="{
        'skeleton-avatar-circle': avatarShape === 'circle',
        'skeleton-avatar-square': avatarShape === 'square',
      }"
      :style="{
        width: typeof avatarSize === 'number' ? `${avatarSize}px` : avatarSize,
        height: typeof avatarSize === 'number' ? `${avatarSize}px` : avatarSize,
      }"
    ></view>

    <view class="skeleton-content" :style="{ width: contentWidth }">
      <!-- 标题部分 -->
      <view
        v-if="title"
        class="skeleton-title"
        :style="{
          width: titleWidth,
          height:
            typeof titleHeight === 'number' ? `${titleHeight}px` : titleHeight,
        }"
      ></view>

      <!-- 行部分 -->
      <view
        v-for="i in rows"
        :key="i"
        class="skeleton-row"
        :style="{
          width: getRowWidth(i),
          height: typeof rowHeight === 'number' ? `${rowHeight}px` : rowHeight,
          marginTop: i !== 1 || !title ? rowSpacing : titleSpacing,
        }"
      ></view>
    </view>
  </view>

  <!-- 实际内容 -->
  <view v-else>
    <slot></slot>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  // 是否显示骨架屏
  loading: {
    type: Boolean,
    default: true,
  },
  // 是否显示头像
  avatar: {
    type: Boolean,
    default: false,
  },
  // 头像形状: circle, square
  avatarShape: {
    type: String,
    default: 'circle',
  },
  // 头像大小
  avatarSize: {
    type: [String, Number],
    default: 40,
  },
  // 是否显示标题
  title: {
    type: Boolean,
    default: true,
  },
  // 标题宽度
  titleWidth: {
    type: String,
    default: '40%',
  },
  // 标题高度
  titleHeight: {
    type: [String, Number],
    default: 20,
  },
  // 标题与行的间距
  titleSpacing: {
    type: [String, Number],
    default: '20px',
  },
  // 行数量
  rows: {
    type: Number,
    default: 3,
  },
  // 行高度
  rowHeight: {
    type: [String, Number],
    default: 16,
  },
  // 行间距
  rowSpacing: {
    type: [String, Number],
    default: '16px',
  },
  // 内容宽度
  contentWidth: {
    type: String,
    default: '100%',
  },
  // 是否显示动画效果
  animated: {
    type: Boolean,
    default: true,
  },
  // 行宽度配置，可以是数组或者对象
  rowWidth: {
    type: [Array, Object, String],
    default: '100%',
  },
});

// 计算每行的宽度
const getRowWidth = index => {
  if (typeof props.rowWidth === 'string') {
    return props.rowWidth;
  } else if (Array.isArray(props.rowWidth)) {
    return props.rowWidth[index - 1] || '100%';
  } else {
    return props.rowWidth[index] || '100%';
  }
};
</script>

<style>
.skeleton-container {
  display: flex;
  align-items: flex-start;
  width: 100%;
}

.skeleton-avatar {
  flex-shrink: 0;
  margin-right: 16px;
  background-color: #f2f2f2;
}

.skeleton-avatar-circle {
  border-radius: 50%;
}

.skeleton-avatar-square {
  border-radius: 4px;
}

.skeleton-content {
  flex: 1;
}

.skeleton-title,
.skeleton-row {
  background-color: #f2f2f2;
  border-radius: 4px;
}

.skeleton-animated .skeleton-title,
.skeleton-animated .skeleton-row,
.skeleton-animated .skeleton-avatar {
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.skeleton-animated .skeleton-title::after,
.skeleton-animated .skeleton-row::after,
.skeleton-animated .skeleton-avatar::after {
  content: '';
  position: absolute;
  top: 0;
  right: -150%;
  bottom: 0;
  left: -150%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: skeleton-loading 1.5s infinite;
  z-index: 2;
}

@keyframes skeleton-loading {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
