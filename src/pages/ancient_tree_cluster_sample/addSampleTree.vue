<script lang="ts" setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

// 抽样古树信息数据
const formData = ref({
  id: '',
  gsbh: '', // 古树编号
  sz: '', // 树种
  sl: '', // 树龄
  xj: '', // 胸径/cm
  sg: '', // 树高/m
  pjgf: '', // 平均冠幅/m
  jd: '', // 经度
  wd: '', // 纬度
});

// 判断是新增还是编辑
const isEdit = ref(false);

// 页面加载
onLoad((options: any) => {
  if (options?.id) {
    isEdit.value = true;
    formData.value.id = options.id;
  } else {
    formData.value.id = Date.now().toString();
  }
});

// 生成随机数字
const randomNumber = (min: number, max: number, decimals: number = 0) => {
  const num = Math.random() * (max - min) + min;
  return decimals > 0 ? num.toFixed(decimals) : Math.floor(num).toString();
};

// 生成测试数据
const generateTestData = () => {
  formData.value = {
    id: formData.value.id, // 保留原ID
    gsbh: `GSQ${Date.now().toString().slice(-6)}`,
    sz: `测试树种${randomNumber(1, 100)}`,
    sl: randomNumber(100, 500),
    xj: randomNumber(30, 150, 1),
    sg: randomNumber(5, 30, 1),
    pjgf: randomNumber(3, 20, 1),
    jd: randomNumber(80, 85, 6),
    wd: randomNumber(40, 45, 6),
  };

  uni.showToast({
    title: '测试数据已生成',
    icon: 'success',
  });
};

// 获取当前位置
const getCurrentLocation = () => {
  uni.showLoading({ title: '获取位置中...' });
  uni.getLocation({
    type: 'gcj02',
    success: res => {
      formData.value.jd = res.longitude.toFixed(6);
      formData.value.wd = res.latitude.toFixed(6);
      uni.hideLoading();
      uni.showToast({ title: '位置获取成功', icon: 'success' });
    },
    fail: () => {
      uni.hideLoading();
      uni.showToast({ title: '位置获取失败', icon: 'none' });
    },
  });
};

// 保存并返回
const handleSave = () => {
  // 验证必填项
  if (!formData.value.gsbh) {
    uni.showToast({ title: '请输入古树编号', icon: 'none' });
    return;
  }
  // if (!formData.value.sz) {
  //   uni.showToast({ title: '请输入树种', icon: 'none' });
  //   return;
  // }
  // if (!formData.value.sl) {
  //   uni.showToast({ title: '请输入树龄', icon: 'none' });
  //   return;
  // }
  // if (!formData.value.xj) {
  //   uni.showToast({ title: '请输入胸径', icon: 'none' });
  //   return;
  // }
  // if (!formData.value.sg) {
  //   uni.showToast({ title: '请输入树高', icon: 'none' });
  //   return;
  // }
  // if (!formData.value.pjgf) {
  //   uni.showToast({ title: '请输入平均冠幅', icon: 'none' });
  //   return;
  // }
  if (!formData.value.jd) {
    uni.showToast({ title: '请输入经度', icon: 'none' });
    return;
  }
  if (!formData.value.wd) {
    uni.showToast({ title: '请输入纬度', icon: 'none' });
    return;
  }

  // 通过事件传递数据回上一页
  // @ts-ignore
  uni.$emit('addSampleTreeData', formData.value);

  uni.showToast({
    title: isEdit.value ? '保存成功' : '添加成功',
    icon: 'success',
    duration: 1500,
    success: () => {
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    },
  });
};

// 取消返回
const handleCancel = () => {
  uni.navigateBack();
};
</script>

<template>
  <view class="w-full min-h-100vh bg-#f5f5f5">
    <!-- 表单内容 -->
    <view class="px-20px py-20px">
      <view class="bg-#fff rounded-8px p-20px">
        <!-- 古树编号 -->
        <view class="mb-20px">
          <view class="mb-8px">
            <text class="text-14px color-#666">古树编号</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-easyinput v-model="formData.gsbh" placeholder="请输入古树编号" :clearable="true"></uni-easyinput>
        </view>

        <!-- 树种 -->
        <view class="mb-20px">
          <view class="mb-8px">
            <text class="text-14px color-#666">树种</text>
          </view>
          <uni-easyinput v-model="formData.sz" placeholder="请输入树种" :clearable="true"></uni-easyinput>
        </view>

        <!-- 树龄 -->
        <view class="mb-20px">
          <view class="mb-8px">
            <text class="text-14px color-#666">树龄</text>
          </view>
          <uni-easyinput v-model="formData.sl" type="number" placeholder="请输入树龄" :clearable="true"></uni-easyinput>
        </view>

        <!-- 胸径 -->
        <view class="mb-20px">
          <view class="mb-8px">
            <text class="text-14px color-#666">胸径</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="formData.xj" type="digit" placeholder="请输入胸径" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">cm</text>
          </view>
        </view>

        <!-- 树高 -->
        <view class="mb-20px">
          <view class="mb-8px">
            <text class="text-14px color-#666">树高</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="formData.sg" type="digit" placeholder="请输入树高" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">m</text>
          </view>
        </view>

        <!-- 平均冠幅 -->
        <view class="mb-20px">
          <view class="mb-8px">
            <text class="text-14px color-#666">平均冠幅</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="formData.pjgf" type="digit" placeholder="请输入平均冠幅" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">m</text>
          </view>
        </view>

        <!-- 经度 -->
        <view class="mb-20px">
          <view class="mb-8px flex items-center justify-between">
            <view>
              <text class="text-14px color-#666">经度</text>
              <text class="text-12px color-red ml-5px">*</text>
            </view>
            <!-- <view class="px-10px py-4px bg-#01bd8d rounded-4px" @click="getCurrentLocation">
              <text class="text-12px color-#fff">获取当前位置</text>
            </view> -->
          </view>
          <uni-easyinput v-model="formData.jd" type="digit" placeholder="保留6位小数" :clearable="true"></uni-easyinput>
        </view>

        <!-- 纬度 -->
        <view class="mb-20px">
          <view class="mb-8px">
            <text class="text-14px color-#666">纬度</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-easyinput v-model="formData.wd" type="digit" placeholder="保留6位小数" :clearable="true"></uni-easyinput>
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-#fff p-20px">
      <!-- 测试数据按钮 -->
      <!-- <view class="mb-10px">
        <view @click="generateTestData" class="w-full h-40px fc rounded-8px bg-#ff9800">
          <text class="text-14px color-#fff">生成测试数据</text>
        </view>
      </view> -->

      <!-- 保存和取消按钮 -->
      <view class="flex items-center gap-15px">
        <view class="flex-1 py-12px bg-#f5f5f5 rounded-8px text-center" @click="handleCancel">
          <text class="text-16px color-#666">取消</text>
        </view>
        <view class="flex-1 py-12px bg-#01bd8d rounded-8px text-center" @click="handleSave">
          <text class="text-16px color-#fff">保存</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped></style>
