<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { LogCat } from '@/utils/logger';
import { useSurveyTokenStore } from '@/stores/token';
import { storeToRefs } from 'pinia';
const surveyTokenStore = useSurveyTokenStore();
const { accessToken, refreshToken } = storeToRefs(surveyTokenStore);

onLaunch(() => {
  // 锁定竖屏展示
  // #ifdef APP-PLUS
  plus.screen.lockOrientation('portrait-primary');
  // #endif
  // 初始化日志系统
  LogCat.init();

  if (!accessToken.value) {
    uni.reLaunch({
      url: '/pages/login/index',
    });
  }
});
onShow(() => {
  console.log('App Show');
});
onHide(() => {
  console.log('App Hide');
});
</script>
<style>
uni-page-body {
  width: 100%;
  height: 100%;
}
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
}
</style>
