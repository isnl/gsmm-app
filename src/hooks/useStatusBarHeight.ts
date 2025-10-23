import { ref, onMounted } from 'vue';
export function useStatusBarHeight() {
  const statusBarHeight = ref(0);

  // 获取状态栏高度
  onMounted(() => {
    // #ifdef APP-PLUS
    try {
      const systemInfo = uni.getSystemInfoSync();
      statusBarHeight.value = systemInfo.statusBarHeight || 0;
    } catch (error) {
      console.error('获取状态栏高度失败', error);
    }
    // #endif
  });

  return {
    statusBarHeight,
  };
}
