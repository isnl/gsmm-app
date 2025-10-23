<script lang="ts" setup>
import { useStatusBarHeight } from '@/hooks/useStatusBarHeight';
import { goBack } from '@/utils';
import { service } from '@/service';
import { useVectorAreaStore } from '@/stores/vector_area';
import { useTileCacheStore } from '@/stores/tile_cache';
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { open } from 'shapefile';

// 添加 TextDecoder polyfill（shapefile 库需要）
import { TextDecoder as TextDecoderPolyfill, TextEncoder as TextEncoderPolyfill } from 'text-encoding';
if (typeof TextDecoder === 'undefined') {
  (global as any).TextDecoder = TextDecoderPolyfill;
  (global as any).TextEncoder = TextEncoderPolyfill;
  console.log('TextDecoder polyfill 已加载');
}

const { statusBarHeight } = useStatusBarHeight();
const vectorAreaStore = useVectorAreaStore();

const { lastVectorAreas } = storeToRefs(vectorAreaStore);

// 本地 loading 状态
const loading = ref(false);
const clearingAllCache = ref(false); // 清空所有缓存的loading状态

// 使用 plus.io 直接读取文件内容为 ArrayBuffer
const readFileAsArrayBuffer = (filePath: string): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    console.log('开始读取文件:', filePath);

    // 使用 plus.io.resolveLocalFileSystemURL 获取文件
    plus.io.resolveLocalFileSystemURL(
      filePath,
      (entry: any) => {
        console.log('文件entry获取成功:', entry.fullPath);

        // 获取文件对象
        entry.file(
          (file: any) => {
            console.log('文件对象获取成功，大小:', file.size);

            // 使用 FileReader 读取
            const reader = new plus.io.FileReader();

            reader.onloadend = function () {
              console.log('FileReader.onloadend 触发');
              console.log('reader.result 类型:', typeof reader.result);
              console.log('reader.result 是否存在:', !!reader.result);

              if (reader.result) {
                // 检查 result 的实际类型
                if (typeof reader.result === 'object' && (reader.result as any).byteLength !== undefined) {
                  console.log('result 是 ArrayBuffer，大小:', (reader.result as ArrayBuffer).byteLength);
                  resolve(reader.result as ArrayBuffer);
                } else if (typeof reader.result === 'string') {
                  console.log('result 是字符串，尝试转换...');
                  // 如果是 base64 字符串，需要转换
                  try {
                    const base64 = reader.result.split(',')[1] || reader.result;
                    const binaryString = atob(base64);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }
                    console.log('转换后的 ArrayBuffer 大小:', bytes.buffer.byteLength);
                    resolve(bytes.buffer);
                  } catch (e) {
                    console.error('base64 转换失败:', e);
                    reject(new Error('数据格式转换失败'));
                  }
                } else {
                  console.error('未知的 result 类型:', reader.result);
                  reject(new Error('读取结果类型错误'));
                }
              } else {
                console.error('reader.result 为空');
                reject(new Error('读取文件失败：result 为空'));
              }
            };

            reader.onerror = function (e: any) {
              console.error('FileReader.onerror 触发:', e);
              reject(new Error('读取文件出错'));
            };

            console.log('使用 readAsDataURL 读取文件（更可靠）...');
            // HTML5+ 在 Android 上 readAsArrayBuffer 可能不触发回调
            // 改用 readAsDataURL，然后转换为 ArrayBuffer
            reader.readAsDataURL(file);
            console.log('readAsDataURL 调用成功');
          },
          (err: any) => {
            console.error('获取文件对象失败:', err);
            reject(new Error('获取文件对象失败'));
          },
        );
      },
      (err: any) => {
        console.error('resolveLocalFileSystemURL 失败:', err);
        reject(new Error('文件不存在: ' + filePath));
      },
    );
  });
};

const testImport = async () => {
  try {
    loading.value = true;

    // 第一步：解压 zip 文件
    const zipPath = '/storage/emulated/0/Download/图斑数据.zip';
    const extractPath = '_doc/shapefile_temp/'; // 解压到应用文档目录

    console.log('第一步：开始解压 zip 文件:', zipPath);

    // 使用 plus.zip.decompress 解压文件
    await new Promise<void>((resolve, reject) => {
      plus.zip.decompress(
        zipPath,
        extractPath,
        () => {
          console.log('解压成功！');
          resolve();
        },
        (error: any) => {
          console.error('解压失败:', error);
          reject(new Error('解压失败: ' + error.message));
        },
      );
    });

    // 第二步：读取解压后的 .shp 和 .dbf 文件
    const shpPath = extractPath + '1111/11111.shp';
    const dbfPath = extractPath + '1111/11111.dbf';

    console.log('第二步：开始读取解压后的 shapefile:', shpPath);

    try {
      // 读取 .shp 文件
      console.log('准备读取 SHP 文件内容...');
      const shpBuffer = await readFileAsArrayBuffer(shpPath);
      console.log('SHP 文件读取成功，大小:', shpBuffer.byteLength, 'bytes');

      // 尝试读取 .dbf 文件（如果存在）
      let dbfBuffer: ArrayBuffer | undefined;
      try {
        console.log('准备读取 DBF 文件内容...');
        dbfBuffer = await readFileAsArrayBuffer(dbfPath);
        console.log('DBF 文件读取成功，大小:', dbfBuffer.byteLength, 'bytes');
      } catch (e) {
        console.log('DBF 文件读取失败，只解析几何信息:', e);
      }

      // 使用 shapefile 库打开并解析
      console.log('开始解析 Shapefile...');
      const source = await open(shpBuffer, dbfBuffer, { encoding: 'gb2312' });
      console.log('Shapefile 打开成功，bbox:', source.bbox);

      // 读取所有要素
      const features: any[] = [];
      let result = await source.read();
      let count = 0;

      while (!result.done) {
        if (result.value) {
          features.push(result.value);
          count++;
          // 只打印前3个要素的详细信息，避免控制台过多输出
          if (count <= 3) {
            console.log(`第 ${count} 个要素:`, result.value);
          }
        }
        result = await source.read();
      }

      console.log('总共读取到', features.length, '个要素');

      // 解析第一个要素查看结构
      if (features.length > 0) {
        console.log('=== 第一个要素详细信息 ===');
        console.log('几何类型:', features[0].geometry?.type);
        console.log('坐标数量:', features[0].geometry?.coordinates?.length);
        console.log('属性信息:', features[0].properties);
      }

      uni.showToast({
        title: `成功读取 ${features.length} 个要素`,
        icon: 'success',
      });

      loading.value = false;
    } catch (parseError: any) {
      console.error('解析 Shapefile 失败:', parseError);
      console.error('错误堆栈:', parseError.stack);
      uni.showToast({
        title: '解析失败: ' + parseError.message,
        icon: 'none',
        duration: 3000,
      });
      loading.value = false;
    }
  } catch (error: any) {
    console.error('导入失败:', error);
    console.error('错误堆栈:', error.stack);

    let errorMsg = error.message || '未知错误';
    if (errorMsg.includes('解压失败')) {
      errorMsg = 'Zip文件解压失败，请检查文件是否存在';
    }

    uni.showToast({
      title: errorMsg,
      icon: 'none',
      duration: 3000,
    });
    loading.value = false;
  }
};

const onHandleImport = () => {};
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
          <text class="text-#fff text-18px font-bold">图斑管理</text>
        </view>
        <view class="flex-1"></view>
        <view class="bg-white/20 rounded-6px px-12px py-6px flex items-center" @click="onHandleImport">
          <uni-icons v-if="!clearingAllCache" type="clear" size="18" color="#fff"></uni-icons>
          <uni-icons v-else type="spinner-cycle" size="18" color="#fff" class="animate-spin"></uni-icons>
          <text class="text-#fff text-14px ml-4px">导入数据</text>
        </view>
        <view class="bg-white/20 rounded-6px px-12px py-6px flex items-center" @click="testImport">
          <uni-icons :type="loading ? 'loop' : 'refreshempty'" size="18" color="#fff" :class="loading ? 'animate-spin' : ''"></uni-icons>
          <text class="text-#fff text-14px ml-4px">测试导入</text>
        </view>
      </view>
    </view>

    <view class="flex-1 overflow-hidden bg-#f5f7fa p-16px pt-8px">
      <scroll-view :scroll-y="true" class="h-full">
        <view v-if="loading" class="text-center py-40px">
          <uni-icons type="loop" size="30" color="#666" class="animate-spin"></uni-icons>
          <text class="block text-#666 text-14px mt-8px">加载中...</text>
        </view>

        <view v-else class="space-y-12px">
          <view v-for="area in lastVectorAreas" :key="area.id" class="bg-white rounded-8px p-16px shadow-sm relative">
            <view v-if="area.geomType" class="absolute top-12px right-12px bg-#f0f0f0 text-#666 text-12px px-6px py-2px rounded-4px">
              {{ area.geomType }}
            </view>

            <view class="flex items-center mb-12px pr-60px">
              <text class="text-#333 text-16px font-bold">{{ area.name }}</text>
            </view>

            <view class="text-#666 text-14px leading-20px mb-8px">
              {{ area.description }}
            </view>

            <!-- 图层名称 -->
            <view class="flex items-center">
              <view v-if="area.layerGroupName" class="bg-#08bd92/10 text-#08bd92 text-12px px-8px py-4px rounded-4px flex items-center mb-10px">
                <text class="mr-2px">图层</text>
                <text class="font-medium">{{ area.layerGroupName }}</text>
              </view>
            </view>
            <!-- 编号-->
            <view class="flex items-center justify-between">
              <view class="flex items-center gap-8px">
                <!-- 编号 -->
                <view class="bg-#08bd92/10 text-#08bd92 text-12px px-8px py-4px rounded-4px flex items-center">
                  <text class="mr-2px">编号</text>
                  <text class="font-medium">{{ area.code }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>
