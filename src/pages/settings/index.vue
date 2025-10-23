<script lang="ts" setup>
import { useLocationStore } from '@/stores/location';
import { usePointLogoStore } from '@/stores/point_logo';
import { useGlobalStore } from '@/stores/global';
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { storeToRefs } from 'pinia';
import { goBack } from '@/utils';
import { ref, onMounted } from 'vue';

const locationStore = useLocationStore();
const { getCurrentLocationModeName } = locationStore;
const { statusBarHeight } = useStatusBarHeight();

const globalStore = useGlobalStore();
const { apiAddress } = storeToRefs(globalStore);
const { setApiAddress } = globalStore;

const pointLogoStore = usePointLogoStore();
const { setPointLogoType, setPointLogoState } = pointLogoStore;
const { currentPointLogoType, pointLogoState } = storeToRefs(pointLogoStore);

// 本地输入框的值
const localApiAddress = ref('');

// 跳转到定位方式页面
const goLocationSettings = () => {
  uni.navigateTo({
    url: '/pages/location_settings/index',
  });
};

// 跳转到地图瓦片缓存页面
const goMapCache = () => {
  uni.navigateTo({
    url: '/pages/map-cache/index',
  });
};

const goVectorArea = () => {
  uni.navigateTo({
    url: '/pages/vector_area/index',
  });
};

const goTest = () => {
  uni.navigateTo({
    url: '/pages/test/index',
  });
};

// 页面加载时获取已保存的API地址
onMounted(() => {
  localApiAddress.value = apiAddress.value;
});

// 保存API地址
const saveApiAddress = () => {
  uni.showModal({
    title: '提示',
    content: '确认保存API地址吗？',
    success: res => {
      if (res.confirm) {
        setApiAddress(localApiAddress.value);
        uni.showToast({
          title: '保存成功',
          icon: 'success',
        });
      }
    },
  });
};

// 清空API地址
const clearApiAddress = () => {
  uni.showModal({
    title: '提示',
    content: '确认清空API地址吗？',
    success: res => {
      if (res.confirm) {
        localApiAddress.value = '';
        setApiAddress('');
        uni.showToast({
          title: '已清空API地址',
          icon: 'success',
        });
      }
    },
  });
};
// 点位标识选项
const pointLogoType = [
  {
    name: '树种名称',
    value: 'treeSpecies',
  },
  {
    name: '挂牌标号',
    value: 'codeNumber',
  },
  {
    name: '古树编号',
    value: 'treeCode',
  },
  {
    name: '树高',
    value: 'treeHeight',
  },
  {
    name: '冠幅',
    value: 'crownWidth',
  },
];

// 弹窗引用
const pointLogoPopup = ref(null);

// 打开点位标识选择弹窗
const setPointLogo = () => {
  pointLogoPopup.value?.open();
};

// 选择点位标识类型
const selectPointLogoType = (value: string) => {
  setPointLogoType(value);
  pointLogoPopup.value?.close();
  uni.showToast({
    title: '设置成功',
    icon: 'success',
  });
};

// 切换点位标识开关状态
const togglePointLogoState = (event: any) => {
  const isOpen = event.detail.value;
  setPointLogoState(isOpen);
  uni.showToast({
    title: isOpen ? '点位标识已开启' : '点位标识已关闭',
    icon: 'success',
  });
};

// 获取当前点位标识类型的名称
const getPointLogoTypeName = () => {
  const currentType = pointLogoType.find(item => item.value === currentPointLogoType.value);
  return currentType ? currentType.name : '古树编号';
};

const goSignature = () => {
  uni.navigateTo({
    url: '/pages/signature_management/index',
  });
};
</script>

<template>
  <view class="w-full h-full flex flex-col bg-gradient-to-b from-#08bd92 to-#07a47f">
    <!-- 自定义导航栏 -->
    <view
      class="w-full"
      :style="{
        paddingTop: statusBarHeight + 12 + 'px',
      }"
    >
      <view class="flex items-center gap-10px px-10px py-24px">
        <view class="w-auto flex items-center" @click="goBack">
          <uni-icons type="left" size="30" color="#fff"></uni-icons>
          <text class="text-#fff text-18px font-bold">设置</text>
        </view>
      </view>
    </view>

    <!-- 页面内容 -->
    <view class="flex-1 p-4 bg-#f9f9fb">
      <!-- 设置选项区域 -->
      <view class="bg-white rounded-lg">
        <uni-list :border="false">
          <!-- 定位方式 -->
          <uni-list-item :clickable="true" showArrow @click="goLocationSettings">
            <template v-slot:header>
              <view class="w-full flex items-center">
                <text class="iconfont icon-position-mark text-20px text-#777"></text>
                <view class="flex items-center ml-15px">
                  <text class="text-base text-#333">定位方式</text>
                  <text class="text-sm text-#999 ml-2">({{ getCurrentLocationModeName() }})</text>
                </view>
              </view>
            </template>
          </uni-list-item>

          <!-- 业务分区 -->
          <uni-list-item :clickable="true" showArrow @click="goVectorArea">
            <template v-slot:header>
              <view class="w-full flex items-center">
                <text class="iconfont icon-a-zu15837 text-#777"></text>
                <view class="flex items-center ml-15px">
                  <text class="text-base text-#333">业务分区管理</text>
                </view>
              </view>
            </template>
          </uni-list-item>

          <uni-list-item :clickable="true" showArrow @click="goSignature">
            <template v-slot:header>
              <view class="w-full flex items-center">
                <text class="iconfont icon-gangbigongju text-#777"></text>
                <view class="flex items-center ml-15px">
                  <text class="text-base text-#333">签名管理</text>
                </view>
              </view>
            </template>
          </uni-list-item>

          <!-- 点位标识 -->
          <uni-list-item :clickable="true" @click="setPointLogo">
            <template v-slot:header>
              <view class="w-full flex items-center justify-between">
                <view class="flex items-center" @click.stop="setPointLogo">
                  <uni-icons type="map-pin-ellipse" size="20" color="#777"></uni-icons>
                  <view class="flex items-center ml-15px">
                    <text class="text-base text-#333">点位标识</text>
                    <text class="text-sm text-#999 ml-2">({{ getPointLogoTypeName() }})</text>
                  </view>
                </view>
                <view class="mr--20px" @click.stop>
                  <switch style="transform: scale(0.7)" :checked="pointLogoState" @change="togglePointLogoState" color="#08bd92" />
                </view>
              </view>
            </template>
          </uni-list-item>

          <!-- <uni-list-item :clickable="true" showArrow @click="goTest">
            <template v-slot:header>
              <view class="w-full flex items-center">
                <text class="iconfont icon-a-zu15837 text-#777"></text>
                <view class="flex items-center ml-15px">
                  <text class="text-base text-#333">测试</text>
                </view>
              </view>
            </template>
          </uni-list-item> -->
        </uni-list>
      </view>

      <!-- API配置区域 -->
      <view class="mt-6">
        <view class="mb-3">
          <text class="text-lg font-semibold text-gray-700">API配置</text>
        </view>

        <!-- 后端API地址配置 -->
        <view class="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-4">
          <view class="mb-4">
            <uni-easyinput v-model="localApiAddress" placeholder="请输入后端请求API地址" class="w-full" />
          </view>

          <view class="flex gap-3">
            <button class="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg text-sm font-medium active:bg-blue-600" @click="saveApiAddress">保存</button>
            <button
              class="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg text-sm font-medium border border-gray-200 active:bg-gray-200"
              @click="clearApiAddress"
            >
              清空
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 点位标识选择弹窗 -->
    <uni-popup ref="pointLogoPopup" type="bottom" background-color="#fff">
      <view class="bg-white rounded-t-lg p-4">
        <view class="flex items-center justify-between mb-4">
          <text class="text-lg font-semibold text-gray-800">选择点位标识类型</text>
          <view @click="pointLogoPopup?.close()" class="p-2">
            <uni-icons type="close" size="20" color="#999"></uni-icons>
          </view>
        </view>

        <view class="border-t border-gray-100">
          <view
            v-for="(item, index) in pointLogoType"
            :key="index"
            class="flex items-center justify-between py-4 border-b border-gray-50 last:border-b-0"
            @click="selectPointLogoType(item.value)"
          >
            <text class="text-base text-gray-800">{{ item.name }}</text>
            <view v-if="currentPointLogoType === item.value" class="w-5 h-5">
              <uni-icons type="checkmarkempty" size="20" color="#08bd92"></uni-icons>
            </view>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<style scoped>
/* 自定义样式 */
</style>
