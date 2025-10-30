<script lang="ts" setup>
import { ref } from 'vue';

// 视频路径
const videoSrc = ref('');

// 视频上下文ID
const videoId = 'videoPlayer_' + Date.now();

// uni-popup 引用
const popupRef = ref();

// 打开弹窗
const open = (src: string) => {
  console.log('打开视频播放器:', src);
  videoSrc.value = src;
  popupRef.value?.open();
};

// 关闭弹窗
const close = () => {
  console.log('关闭视频播放器');
  // 停止播放
  const videoContext = uni.createVideoContext(videoId);
  if (videoContext) {
    videoContext.pause();
  }
  popupRef.value?.close();
  // 延迟清空视频源，避免闪烁
  setTimeout(() => {
    videoSrc.value = '';
  }, 300);
};

// 暴露方法给父组件
defineExpose({
  open,
  close,
});
</script>

<template>
  <uni-popup ref="popupRef" type="center" :mask-click="true" @maskClick="close">
    <view class="relative bg-#000 rounded-8px overflow-hidden" style="width: 90vw; max-width: 600px">
      <!-- 关闭按钮 -->
      <view class="absolute top-10px right-10px z-10 w-36px h-36px bg-rgba(0,0,0,0.6) rounded-full fc" @click="close">
        <uni-icons type="close" size="24" color="#fff"></uni-icons>
      </view>

      <!-- 视频播放器 -->
      <video
        v-if="videoSrc"
        :id="videoId"
        :src="videoSrc"
        :controls="true"
        :autoplay="true"
        :show-center-play-btn="true"
        :show-fullscreen-btn="true"
        :enable-progress-gesture="true"
        object-fit="contain"
        style="width: 100%; height: 60vh"
      ></video>
    </view>
  </uni-popup>
</template>

<style scoped>
/* 确保视频播放器样式正确 */
video {
  background-color: #000;
}
</style>
