import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UniStorage } from './storage';
import dayjs from 'dayjs';
export const useSurveyTokenStore = defineStore(
  'login_token',
  () => {
    const accountNumber = ref('');
    const accessToken = ref('');
    const refreshToken = ref('');

    const setAccountNumber = (an: string) => {
      accountNumber.value = an;
    };

    const setAccessToken = (at: string) => {
      accessToken.value = at;
    };
    const setRefreshToken = (rt: string) => {
      refreshToken.value = rt;
    };
    const clearToken = () => {
      accountNumber.value = '';
      accessToken.value = '';
      refreshToken.value = '';
    };

    return { accountNumber, accessToken, refreshToken, setAccountNumber, setAccessToken, setRefreshToken, clearToken };
  },
  {
    persist: {
      storage: UniStorage,
      key: 'login_token',
    },
  },
);
