<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { service } from '@/service';
import { useSurveyTokenStore } from '@/stores/token';

const surveyTokenStore = useSurveyTokenStore();
const { setAccountNumber, setAccessToken, setRefreshToken } = surveyTokenStore;

// 表单数据
const formData = reactive({
  accountNumber: '',
  password: '',
});

// 加载状态
const loading = ref(false);

// 表单校验规则
const rules = {
  accountNumber: {
    rules: [
      {
        required: true,
        errorMessage: '请输入账号',
      },
    ],
  },
  password: {
    rules: [
      {
        required: true,
        errorMessage: '请输入密码',
      },
    ],
  },
};

// 获取表单实例
const formRef = ref<any>(null); // Add ref for the form

// 密码修改弹窗相关
const passwordPopupRef = ref<any>(null);
const passwordFormData = reactive({
  accountNumber: '',
  newPassword: '',
  confirmPassword: '',
});

// 密码修改表单校验规则
const passwordRules = {
  newPassword: {
    rules: [
      {
        required: true,
        errorMessage: '请输入新密码',
      },
      {
        pattern: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[~!@#$%^&*()_+`\-={}:";'<>?,./]).{8,}$/,
        errorMessage: '密码由8位数字、大小写字母和特殊符号组成!',
      },
    ],
  },
  confirmPassword: {
    rules: [
      {
        required: true,
        errorMessage: '请确认新密码',
      },
      {
        validateFunction: function (_rule: any, value: string, _data: any, callback: Function) {
          if (!value) {
            callback('请确认新密码');
          } else if (value !== passwordFormData.newPassword) {
            callback('两次输入的密码不一致');
          } else {
            callback();
          }
          return true;
        },
      },
    ],
  },
};

const passwordFormRef = ref<any>(null);

// 登录API调用逻辑 (extracted)
const performLogin = () => {
  loading.value = true;

  // 对密码进行SM3加密
  // const encryptedPassword = encryptSM3(formData.password);

  // 创建加密后的登录数据
  const loginData = {
    accountNumber: formData.accountNumber,
    password: formData.password,
  };

  service({
    url: '/login',
    method: 'POST',
    params: loginData,
  })
    .then(res => {
      loading.value = false;
      if (res.statusCode === 200 && res.data?.accessToken) {
        try {
          setAccountNumber(formData.accountNumber);
          setAccessToken(res.data.accessToken);
          setRefreshToken(res.data.refreshToken);
          uni.showToast({
            title: '登录成功',
            icon: 'success',
          });
          uni.switchTab({
            url: '/pages/map/index',
          });
        } catch (e) {
          uni.showToast({
            title: '登录处理失败，请稍后重试',
            icon: 'none',
          });
        }
      } else {
        uni.showToast({
          title: '登录失败，请检查账号密码是否正确',
          icon: 'none',
        });
      }
    })
    .catch(err => {});
};

// 触发表单提交和验证
const submitForm = async () => {
  if (loading.value) return; // 防止重复提交

  try {
    // 调用 validate 方法，校验表单数据
    const valid = await formRef.value?.validate?.();
    if (valid) {
      console.log('表单校验成功');
      performLogin(); // 校验成功后执行登录API调用
    } else {
      // uni-forms 会自动处理校验失败的提示
      console.log('表单校验失败', valid);
    }
  } catch (error) {
    // 确保即使校验出错也停止加载状态（如果之前启动了）
    loading.value = false;
  }
};

// 处理密码过期事件
const expiredVisible = ref(false);
const resetLoading = ref(false);
const handlePasswordExpired = (data: { accountNumber: string }) => {
  passwordFormData.accountNumber = data.accountNumber;
  expiredVisible.value = true;
};

// 修改密码API调用
const changePassword = async () => {
  try {
    // 对新密码进行SM3加密
    resetLoading.value = true;
    // const encryptedNewPassword = encryptSM3(passwordFormData.newPassword);
    const encryptedNewPassword = passwordFormData.newPassword;

    const res = await service({
      url: '/system/users/change_password_for_expired',
      method: 'PUT',
      params: {
        accountNumber: formData.accountNumber,
        newPassword: encryptedNewPassword,
      },
    });

    if (res.statusCode === 200) {
      uni.showToast({
        title: '密码修改成功',
        icon: 'success',
      });

      // 关闭弹窗并清空表单
      expiredVisible.value = false;
      passwordFormData.newPassword = '';
      passwordFormData.confirmPassword = '';

      // 清空登录表单密码
      formData.password = '';
    } else {
      uni.showToast({
        title: res.data?.message || '密码修改失败',
        icon: 'none',
      });
    }
    resetLoading.value = false;
  } catch (error) {
    resetLoading.value = false;
    uni.showToast({
      title: '密码修改失败，请稍后重试',
      icon: 'none',
    });
  }
};

// 提交密码修改表单
const submitPasswordForm = async () => {
  try {
    const valid = await passwordFormRef.value?.validate?.();
    if (valid) {
      await changePassword();
    }
  } catch (error) {
    console.error('密码修改表单校验出错:', error);
  }
};
</script>

<template>
  <view class="flex flex-col items-center px-6 py-6 h-full bg-gray-50">
    <view class="w-full flex-col fc" v-if="!expiredVisible">
      <!-- 登录标题 -->
      <view class="w-full text-center mb-10 mt-6">
        <text class="text-3xl font-bold text-#01bd8d">欢迎登录</text>
      </view>

      <!-- 登录表单 -->
      <uni-forms ref="formRef" :model="formData" :rules="rules" class="w-full" style="max-width: 400px">
        <uni-forms-item class="shadow-sm rounded-lg bg-white mb-2" name="accountNumber">
          <uni-easyinput
            v-model="formData.accountNumber"
            type="text"
            placeholder="请输入账号"
            prefixIcon="person"
            :styles="{
              height: '56px',
              borderRadius: '8px',
              paddingLeft: '8px',
            }"
          />
        </uni-forms-item>

        <uni-forms-item class="shadow-sm rounded-lg bg-white" name="password">
          <uni-easyinput
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            prefixIcon="locked"
            :styles="{
              height: '56px',
              borderRadius: '8px',
              paddingLeft: '8px',
            }"
          />
        </uni-forms-item>

        <!-- 登录按钮 -->
        <view class="mt-8 px-4">
          <button @click="submitForm" :loading="loading" class="rounded-full fc h-10 text-base font-medium bg-#01bd8d w-full text-white">登录</button>
        </view>
      </uni-forms>
    </view>

    <view class="w-full rounded-lg" v-else>
      <view class="text-center mb-6">
        <text class="text-lg font-bold text-#01bd8d">密码超过90天未修改</text>
        <text class="text-sm text-gray-600 block mt-2">请修改密码</text>
      </view>

      <uni-forms ref="passwordFormRef" :modelValue="passwordFormData" :rules="passwordRules">
        <uni-forms-item class="shadow-sm rounded-lg bg-gray-50 !mb-32px" name="newPassword" required>
          <uni-easyinput
            v-model="passwordFormData.newPassword"
            type="password"
            placeholder="请输入新密码"
            prefixIcon="locked"
            class="text-#ccc"
            :styles="{
              height: '48px',
              borderRadius: '8px',
              paddingLeft: '8px',
            }"
          />
        </uni-forms-item>

        <uni-forms-item class="shadow-sm rounded-lg bg-gray-50 !mb-8" name="confirmPassword" required>
          <uni-easyinput
            v-model="passwordFormData.confirmPassword"
            type="password"
            placeholder="请确认新密码"
            prefixIcon="locked"
            :styles="{
              height: '48px',
              borderRadius: '8px',
              paddingLeft: '8px',
            }"
          />
        </uni-forms-item>

        <view class="flex gap-3">
          <button @click="submitPasswordForm" :loading="resetLoading" class="rounded-full fc h-10 text-base font-medium bg-#01bd8d w-full text-white">
            确定
          </button>
        </view>
      </uni-forms>
    </view>
  </view>
</template>
