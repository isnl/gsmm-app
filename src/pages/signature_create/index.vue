<script lang="ts" setup>
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { useGlobalStore } from '@/stores/global';
import { goBack } from '@/utils';
import { ref, onMounted, nextTick, getCurrentInstance } from 'vue';
const instance = getCurrentInstance();

const { statusBarHeight } = useStatusBarHeight();
const globalStore = useGlobalStore();
const { addSignature } = globalStore;

// 表单数据
const signatureName = ref('');
const canvasContext = ref<any>(null);
const canvasId = 'signature-canvas';

// 画布相关
const isDrawing = ref(false);
const lastPoint = ref({ x: 0, y: 0 });
const hasSignature = ref(false); // 是否已经签名

// 横屏签名控制
const isLandscape = ref(false);

// 保存状态
const isSaving = ref(false);

// 画布尺寸
const canvasWidth = ref(0);
const canvasHeight = ref(0);

// 初始化画布
const initCanvas = () => {
  const systemInfo = uni.getSystemInfoSync();
  const pixelRatio = systemInfo.pixelRatio || 2;

  canvasContext.value = uni.createCanvasContext(canvasId);

  const query = uni.createSelectorQuery().in(instance?.proxy);
  query
    .select(`#${canvasId}`)
    .boundingClientRect(rect => {
      canvasWidth.value = rect.width * pixelRatio;
      canvasHeight.value = rect.height * pixelRatio;

      if (canvasContext.value) {
        // 设置白色背景
        canvasContext.value.setFillStyle('#ffffff');
        canvasContext.value.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
        canvasContext.value.draw();

        // 设置画笔样式
        canvasContext.value.setStrokeStyle('#000000');
        canvasContext.value.setLineWidth(isLandscape.value ? 4 : 3);
        canvasContext.value.setLineCap('round');
        canvasContext.value.setLineJoin('round');

        // 重置签名状态
        hasSignature.value = false;
      }
    })
    .exec();
};

onMounted(() => {
  initCanvas();
});

// 开始绘制
const startDraw = (e: any) => {
  isDrawing.value = true;
  hasSignature.value = true; // 标记已经开始签名
  const touch = e.touches[0];
  lastPoint.value = {
    x: touch.x,
    y: touch.y,
  };
};

// 绘制过程
const drawing = (e: any) => {
  if (!isDrawing.value || !canvasContext.value) return;

  const touch = e.touches[0];
  const currentPoint = {
    x: touch.x,
    y: touch.y,
  };

  canvasContext.value.beginPath();
  canvasContext.value.moveTo(lastPoint.value.x, lastPoint.value.y);
  canvasContext.value.lineTo(currentPoint.x, currentPoint.y);
  canvasContext.value.stroke();
  canvasContext.value.draw(true);

  lastPoint.value = currentPoint;
};

// 结束绘制
const endDraw = () => {
  isDrawing.value = false;
};

// 清空画布
const clearCanvas = () => {
  if (canvasContext.value) {
    canvasContext.value.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
    // 重新设置白色背景
    canvasContext.value.setFillStyle('#ffffff');
    canvasContext.value.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
    canvasContext.value.draw();

    // 重置签名状态
    hasSignature.value = false;
  }
};

// 直接保存签名
const directSaveSignature = () => {
  // 检查是否正在保存
  if (isSaving.value) {
    return;
  }

  // 检查是否已经签名
  if (!hasSignature.value) {
    uni.showToast({
      title: '请先签名',
      icon: 'none',
    });
    return;
  }

  // 检查签名名称
  if (!signatureName.value.trim()) {
    uni.showToast({
      title: '请输入签名名称',
      icon: 'none',
    });
    return;
  }

  // 直接保存
  saveSignature();
};

// 保存签名
const saveSignature = () => {
  if (!canvasContext.value) {
    uni.showToast({
      title: '画布未初始化',
      icon: 'none',
    });
    return;
  }

  if (!signatureName.value.trim()) {
    uni.showToast({
      title: '请输入签名名称',
      icon: 'none',
    });
    return;
  }

  // 设置保存状态
  isSaving.value = true;
  uni.showLoading({
    title: '保存中...',
  });

  // 将画布内容转为图片
  uni.canvasToTempFilePath({
    canvasId: canvasId,
    fileType: 'png',
    quality: 1,
    success: async res => {
      if (isLandscape.value) {
        // 横屏模式需要旋转图片90度
        rotateImage(res.tempFilePath, rotatedImagePath => {
          addSignature({
            name: signatureName.value.trim(),
            imageUrl: rotatedImagePath,
          });

          uni.hideLoading();
          isSaving.value = false;

          uni.showToast({
            title: '保存成功',
            icon: 'success',
            success() {
              uni.navigateBack();
            },
          });
        });
      } else {
        // 竖屏模式也保存到永久目录
        try {
          // 确保签名目录存在
          const directory = await ensureSignatureDirectory();

          // 生成唯一文件名
          const timestamp = Date.now();
          const fileName = `signature_${timestamp}.png`;

          // 移动文件到永久目录
          const permanentPath = await moveFileToSignatureDirectory(res.tempFilePath, fileName, directory);

          addSignature({
            name: signatureName.value.trim(),
            imageUrl: permanentPath,
          });

          uni.hideLoading();
          isSaving.value = false;

          uni.showToast({
            title: '保存成功',
            icon: 'success',
            success() {
              uni.navigateBack();
            },
          });
        } catch (error) {
          console.error('保存签名图片失败:', error);
          // 如果保存失败，使用临时文件
          addSignature({
            name: signatureName.value.trim(),
            imageUrl: res.tempFilePath,
          });

          uni.hideLoading();
          isSaving.value = false;

          uni.showToast({
            title: '保存成功',
            icon: 'success',
            success() {
              uni.navigateBack();
            },
          });
        }
      }
    },
    fail: err => {
      console.error('保存签名失败:', err);
      uni.hideLoading();
      isSaving.value = false;

      uni.showToast({
        title: '保存失败',
        icon: 'none',
      });
    },
  });
};

// 确保签名目录存在
const ensureSignatureDirectory = (): Promise<PlusIoDirectoryEntry> => {
  return new Promise((resolve, reject) => {
    try {
      // 使用 requestFileSystem 获取私有文档目录
      plus.io.requestFileSystem(
        plus.io.PRIVATE_DOC,
        fs => {
          if (!fs || !fs.root) {
            console.error('获取文件系统失败');
            reject(new Error('获取文件系统失败'));
            return;
          }

          // 创建 signature 目录
          fs.root.getDirectory(
            'signature',
            { create: true },
            signatureEntry => {
              console.log('签名目录创建/获取成功:', signatureEntry.fullPath);
              resolve(signatureEntry);
            },
            error => {
              console.error('创建签名目录失败:', error);
              reject(error);
            },
          );
        },
        error => {
          console.error('获取应用私有文档目录失败:', error);
          reject(error);
        },
      );
    } catch (error) {
      reject(error);
    }
  });
};

// 移动文件到签名目录
const moveFileToSignatureDirectory = (tempFilePath: string, fileName: string, directory: PlusIoDirectoryEntry): Promise<string> => {
  return new Promise((resolve, reject) => {
    plus.io.resolveLocalFileSystemURL(
      tempFilePath,
      entry => {
        entry.moveTo(
          directory,
          fileName,
          moveEntry => {
            resolve('file://' + moveEntry.fullPath);
          },
          error => {
            reject(error);
          },
        );
      },
      error => {
        reject(error);
      },
    );
  });
};

// 旋转图片90度并保存到永久目录
const rotateImage = async (imagePath: string, callback: (rotatedPath: string) => void) => {
  try {
    // 使用 uni.compressImage 旋转图片
    uni.compressImage({
      src: imagePath,
      rotate: 270,
      quality: 100, // 保持原质量
      success: async res => {
        try {
          // 确保签名目录存在
          const directory = await ensureSignatureDirectory();

          // 生成唯一文件名
          const timestamp = Date.now();
          const fileName = `signature_${timestamp}.png`;

          // 移动文件到永久目录
          const permanentPath = await moveFileToSignatureDirectory(res.tempFilePath, fileName, directory);

          callback(permanentPath);
        } catch (error) {
          console.error('保存旋转图片失败:', error);
          // 如果保存失败，使用临时文件
          callback(res.tempFilePath);
        }
      },
      fail: error => {
        console.error('旋转图片失败:', error);
        // 旋转失败，直接使用原图片
        callback(imagePath);
      },
    });
  } catch (error) {
    console.error('rotateImage 异常:', error);
    callback(imagePath);
  }
};

// 进入横屏签名模式
const enterLandscape = () => {
  isLandscape.value = true;

  // 延迟重新初始化画布，等待页面渲染完成
  setTimeout(() => {
    initCanvas();
  }, 100);
};

// 退出横屏签名模式
const exitLandscape = () => {
  isLandscape.value = false;

  // 重新初始化画布为竖屏模式
  setTimeout(() => {
    initCanvas();
  }, 100);
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
          <text class="text-#fff text-18px font-bold">手写签名</text>
        </view>
      </view>
    </view>

    <!-- 页面内容 -->
    <view class="flex-1 overflow-hidden flex flex-col bg-#f9f9fb">
      <view class="p-15px h-full flex flex-col">
        <!-- 签名名称输入 -->
        <view class="w-full bg-#fff rounded-8px p-15px mb-15px shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <view class="mb-8px">
            <text class="text-14px text-#333 font-medium">签名名称</text>
          </view>
          <uni-easyinput v-model="signatureName" placeholder="请输入签名名称" :clearable="true" maxlength="20" />
        </view>

        <!-- 绘制区域 -->
        <view class="w-full flex flex-col overflow-hidden bg-#fff rounded-8px p-15px shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <view class="mb-12px flex items-center justify-between">
            <text class="text-14px text-#333 font-medium">请在下方区域签名</text>
            <view class="flex items-center gap-8px">
              <view class="px-12px h-35px fc bg-#f5f5f5 rounded-4px" @click="clearCanvas()">
                <text class="text-12px text-#666">清空</text>
              </view>
              <view class="w-35px h-35px fc rounded-4px bg-#f5f5f5" @click="isLandscape ? exitLandscape() : enterLandscape()">
                <text v-if="isLandscape" class="text-16px text-#666 iconfont icon-shouqi"> </text>
                <text v-else class="text-16px text-#666 iconfont icon-fangda"> </text>
              </view>
            </view>
          </view>

          <!-- 画布容器 -->
          <view class="w-full bg-#fff rounded-6px border-1px border-dashed border-#ddd flex flex-col items-center justify-center relative overflow-hidden">
            <canvas
              :canvas-id="canvasId"
              :id="canvasId"
              :class="isLandscape ? 'w-full aspect-9/16 rounded-6px' : 'w-full aspect-16/9 rounded-6px'"
              @touchstart="startDraw"
              @touchmove="drawing"
              @touchend="endDraw"
              disable-scroll
            />
            <text class="text-12px text-#ccc absolute pointer-events-none" :style="isLandscape ? 'transform: rotate(90deg);' : ''"> 请在此区域签名 </text>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="w-full mt-20px">
          <view :class="['w-full py-15px rounded-8px flex items-center justify-center', isSaving ? 'bg-#ccc' : 'bg-#08bd92']" @click="directSaveSignature">
            <text class="text-16px text-#fff font-medium">{{ isSaving ? '保存中...' : '保存签名' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
canvas {
  width: 100%;
  height: 100%;
}
</style>
