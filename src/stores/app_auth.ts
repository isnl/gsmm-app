import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { UniStorage } from './storage';
import dayjs from 'dayjs';

export const useAppAuthStore = defineStore(
  'app_auth',
  () => {
    // 过期时间
    let expiredTime = ref(dayjs('2025-09-30 00:00:00').valueOf());
    let diffDays = computed(() => dayjs(expiredTime.value).diff(dayjs(), 'day'));

    const shouldShowAppAuthTime = () => {
      if (diffDays.value < 0) {
        uni.showModal({
          title: '提示',
          content: `APP授权已过期，请联系管理员。点击确定将退出应用`,
          showCancel: false,
          success: function (res) {
            if (res.confirm) {
              plus.runtime.quit();
            }
          },
        });
      } else {
        uni.showModal({
          title: '提示',
          content: `APP授权有效期还剩 ${diffDays.value} 天`,
          showCancel: false,
        });
      }
    };

    return {
      expiredTime,
      diffDays,
      shouldShowAppAuthTime,
    };
  },
  {
    persist: {
      storage: UniStorage,
      key: 'tree_app_auth',
    },
  },
);
