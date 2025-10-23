<script lang="ts" setup>
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { useGlobalStore } from '@/stores/global';
import { storeToRefs } from 'pinia';
import { goBack } from '@/utils';
import { ref } from 'vue';

const { statusBarHeight } = useStatusBarHeight();
const globalStore = useGlobalStore();
const { signatures } = storeToRefs(globalStore);
const { deleteSignature } = globalStore;

// 弹窗控制
const showDeleteConfirm = ref(false);
const deleteConfirmPopup = ref();
const currentDeleteId = ref('');

// 跳转到新建签名页面
const goCreateSignature = () => {
  uni.navigateTo({
    url: '/pages/signature_create/index',
  });
};

// 删除签名确认
const confirmDelete = (id: string) => {
  currentDeleteId.value = id;
  showDeleteConfirm.value = true;
  deleteConfirmPopup.value?.open();
};

// 删除图片文件
const deleteImageFile = (imageUrl: string): Promise<void> => {
  return new Promise(resolve => {
    // #ifdef APP-PLUS
    if (imageUrl && imageUrl.startsWith('file://')) {
      plus.io.resolveLocalFileSystemURL(
        imageUrl,
        entry => {
          entry.remove(
            () => {
              console.log('签名图片文件删除成功:', imageUrl);
              resolve();
            },
            error => {
              console.error('删除签名图片文件失败:', error);
              resolve(); // 即使删除失败也继续执行
            },
          );
        },
        error => {
          console.error('找不到签名图片文件:', error);
          resolve(); // 文件不存在也继续执行
        },
      );
    } else {
      resolve();
    }
    // #endif

    // #ifndef APP-PLUS
    resolve();
    // #endif
  });
};

// 执行删除
const handleDelete = async () => {
  if (currentDeleteId.value) {
    // 先找到要删除的签名信息
    const signatureToDelete = signatures.value.find(sig => sig.id === currentDeleteId.value);

    if (signatureToDelete) {
      // 删除图片文件
      await deleteImageFile(signatureToDelete.imageUrl);
    }

    // 删除签名记录
    deleteSignature(currentDeleteId.value);

    uni.showToast({
      title: '删除成功',
      icon: 'success',
    });
  }
  showDeleteConfirm.value = false;
  deleteConfirmPopup.value?.close();
};

// 取消删除
const cancelDelete = () => {
  showDeleteConfirm.value = false;
  deleteConfirmPopup.value?.close();
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
          <text class="text-#fff text-18px font-bold">签名管理</text>
        </view>
      </view>
    </view>

    <!-- 页面内容 -->
    <view class="flex-1 overflow-hidden flex flex-col bg-#f9f9fb">
      <view class="flex-1 overflow-hidden">
        <scroll-view :scroll-y="true" class="h-full">
          <view class="p-15px">
            <!-- 签名列表 -->
            <view class="grid grid-cols-2 gap-15px">
              <view
                v-for="signature in signatures"
                :key="signature.id"
                class="bg-#fff rounded-12px p-10px shadow-[0_4px_12px_rgba(0,0,0,0.08)] border-1px border-#f0f0f0"
              >
                <!-- 签名名称 -->
                <view class="mb-10px">
                  <text class="text-16px font-bold text-#333 block">{{ signature.name }}</text>
                </view>

                <!-- 签名图片 -->
                <view class="w-full aspect-16/9 rounded-8px mb-10px flex items-center justify-center overflow-hidden">
                  <image :src="signature.imageUrl" mode="aspectFit" class="w-full h-full" />
                </view>

                <!-- 删除按钮 -->
                <view class="flex justify-center">
                  <view class="w-full py-6px bg-#ff4757 rounded-4px" @click="confirmDelete(signature.id)">
                    <text class="text-14px text-#fff font-medium text-center block">删除</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- 空状态 -->
            <view v-if="signatures.length === 0" class="w-full py-60px flex flex-col items-center justify-center">
              <uni-icons type="compose" size="60" color="#ccc"></uni-icons>
              <text class="mt-16px text-16px text-#999">暂无签名</text>
              <text class="mt-8px text-14px text-#ccc">点击下方按钮创建您的第一个签名</text>
            </view>
          </view>
        </scroll-view>
      </view>
      <!-- 新建签名按钮 -->
      <view class="w-full mb-15px px-10px fc bg-#f9f9fb">
        <view class="flex-1 py-15px bg-#08bd92 rounded-8px flex gap-5px items-center justify-center" @click="goCreateSignature">
          <uni-icons type="plus" size="20" color="#fff"></uni-icons>
          <text class="text-16px text-#fff">新建签名</text>
        </view>
      </view>
    </view>

    <!-- 删除确认弹窗 -->
    <uni-popup ref="deleteConfirmPopup" type="dialog" :mask-click="false">
      <view class="bg-white rounded-8px p-20px w-280px">
        <view class="text-center mb-20px">
          <text class="text-18px font-medium text-#333">确认删除</text>
        </view>
        <view class="text-center mb-30px">
          <text class="text-14px text-#666">确定要删除这个签名吗？删除后无法恢复。</text>
        </view>
        <view class="flex items-center gap-12px">
          <view class="flex-1 py-12px bg-#f5f5f5 rounded-6px flex items-center justify-center" @click="cancelDelete">
            <text class="text-14px text-#666">取消</text>
          </view>
          <view class="flex-1 py-12px bg-#ff4757 rounded-6px flex items-center justify-center" @click="handleDelete">
            <text class="text-14px text-#fff">删除</text>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>
