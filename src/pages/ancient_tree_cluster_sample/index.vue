<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import TreeClusterSampleInventoryForm from './TreeClusterSampleInventoryForm.vue';
import { service, uploadService } from '@/service';
import { samplingMethodOptions, slopePositionOptions, soilCompactnessOptions, soilThicknessOptions, slopeGradeOptions, slopeAspectOptions } from './constants';

// 表单数据
const formData = ref({});

// 当前编辑的ID
const editId = ref('');

// 是否为编辑模式
const isEditMode = ref(false);

// 加载详情数据
const loadDetail = async (id: string) => {
  uni.showLoading({
    title: '加载中...',
    mask: true,
  });

  try {
    const res = await service({
      url: `/gu_shu_qun_chou_yangs/${id}`,
      method: 'GET',
    });

    if (res && res.data) {
      // 特殊处理照片/视频字段，如果是 null 则转为空数组
      const detailData = {
        ...res.data,
        fieldImageTrunkBase: res.data.fieldImageTrunkBase || [],
      };

      formData.value = detailData;
      isEditMode.value = true;
    }
  } catch (error: any) {
    console.error('加载详情失败:', error);
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    });
  } finally {
    uni.hideLoading();
  }
};

// 读取参数
onLoad(options => {
  console.log('样方调查参数:', options);

  // 如果有传入的参数，设置到表单中
  if (options) {
    formData.value = {
      ...formData.value,
      gsqId: options.gsqId || '',
      gsqbh: options.gsqbh || '',
      jd: options.jd || '',
      wd: options.wd || '',
      geom: {
        type: 'Point',
        coordinates: [Number(options.jd || ''), Number(options.wd || '')],
      },
    } as any;
  }

  // 如果有id参数，则为编辑模式
  if (options && options.id) {
    editId.value = options.id;
    loadDetail(options.id);
  }
});

// 提交loading状态
const isSubmitting = ref(false);

// 表单更新
const handleFormUpdate = (data: any) => {
  formData.value = data;
};

// 从选项数组中随机选择一个值
const randomSelect = (options: any[]) => {
  if (!options || options.length === 0) return '';
  const randomIndex = Math.floor(Math.random() * options.length);
  return options[randomIndex].value;
};

// 生成随机数字
const randomNumber = (min: number, max: number, decimals: number = 0) => {
  const num = Math.random() * (max - min) + min;
  return decimals > 0 ? num.toFixed(decimals) : Math.floor(num).toString();
};

// 生成测试数据
const generateTestData = () => {
  const testData: any = {
    // gsqbh: `GSQ${Date.now().toString().slice(-6)}`,
    cydch: `CYDCH${Date.now().toString().slice(-6)}`,
    cyff: randomSelect(samplingMethodOptions),
    cyMj: `${randomNumber(10, 30)}`,
    pw: randomSelect(slopePositionOptions),
    trjmd: randomSelect(soilCompactnessOptions),
    tchd: randomSelect(soilThicknessOptions),
    pd: randomSelect(slopeGradeOptions),
    px: randomSelect(slopeAspectOptions),
    xnJiao: `${randomNumber(80, 85, 6)}, ${randomNumber(40, 45, 6)}`,
    dbJiao: `${randomNumber(80, 85, 6)}, ${randomNumber(40, 45, 6)}`,
    xbJiao: `${randomNumber(80, 85, 6)}, ${randomNumber(40, 45, 6)}`,
    dnJiao: `${randomNumber(80, 85, 6)}, ${randomNumber(40, 45, 6)}`,
    zpsm: `测试照片说明${randomNumber(1, 100)}`,
    bz: `测试备注${randomNumber(1, 100)}`,
    fieldImageTrunkBase: [],
  };

  // 保留原有的 gsqId、gsqbh、jd、wd（如果有）
  const currentFormData = formData.value as any;
  if (currentFormData.gsqId) testData.gsqId = currentFormData.gsqId;
  if (currentFormData.gsqbh) testData.gsqbh = currentFormData.gsqbh;
  if (currentFormData.jd) testData.jd = currentFormData.jd;
  if (currentFormData.wd) testData.wd = currentFormData.wd;

  formData.value = testData;

  uni.showToast({
    title: '测试数据已生成',
    icon: 'success',
  });
};

// 构建上传文件和表单数据
const buildUploadData = (data: any, submitType: number) => {
  const formData: any = {};
  const uploadFiles: any[] = [];

  // 图片/视频字段名称映射
  const mediaFields = ['fieldImageTrunkBase'];

  // 处理所有字段
  Object.keys(data).forEach(key => {
    // 跳过 submitType 字段，会在最后单独设置
    if (key === 'submitType') {
      return;
    }

    const value = data[key];

    // 处理图片/视频数组字段
    if (Array.isArray(value) && mediaFields.includes(key)) {
      let newFileIndex = 0;

      value.forEach((item: any, index: number) => {
        if (item.tempFilePath) {
          // 新上传的文件
          const uploadKey = `upload${key.charAt(0).toUpperCase()}${key.slice(1)}`;
          uploadFiles.push({
            name: `${uploadKey}[${newFileIndex}]`,
            file: item.tempFilePath,
            uri: item.tempFilePath,
          });
          newFileIndex++;
        } else if (item.id) {
          // 已存在的文件
          formData[`${key}[${index}].id`] = item.id;
          if (item.name) formData[`${key}[${index}].name`] = item.name;
          if (item.path) formData[`${key}[${index}].path`] = item.path;
          if (item.url) formData[`${key}[${index}].url`] = item.url;
          if (item.fileType) formData[`${key}[${index}].fileType`] = item.fileType;
        }
      });
    } else if (key === 'cygsxx' && Array.isArray(value)) {
      // 处理抽样古树信息数组
      value.forEach((item: any, index: number) => {
        if (item && typeof item === 'object') {
          Object.keys(item).forEach(subKey => {
            const subValue = item[subKey];
            if (subValue !== null && subValue !== undefined && subValue !== '') {
              formData[`${key}[${index}].${subKey}`] = subValue;
            }
          });
        }
      });
    } else if (key === 'geom' && value && typeof value === 'object') {
      // 处理 geom 字段
      formData[key] = JSON.stringify(value);
    } else if (value !== null && value !== undefined && value !== '') {
      // 处理普通字段
      if (typeof value === 'boolean') {
        formData[key] = value ? 1 : 0;
      } else if (!Array.isArray(value)) {
        formData[key] = value;
      }
    }
  });

  // 设置 submitType
  formData.submitType = submitType;

  console.log('构建的上传数据:', { formData, uploadFiles, fileCount: uploadFiles.length });
  return { formData, uploadFiles };
};

// 验证必填字段
const validateRequiredFields = () => {
  const data = formData.value as any;

  // 必填字段列表
  const requiredFields = [
    { key: 'gsqbh', label: '古树群编号' },
    { key: 'cydch', label: '抽样调查号' },
    // { key: 'cyMj', label: '面积' },
    // { key: 'pw', label: '坡位' },
    // { key: 'trjmd', label: '土壤紧密度' },
    // { key: 'tchd', label: '土层厚度' },
    // { key: 'pd', label: '坡度' },
    // { key: 'px', label: '坡向' },
    // { key: 'xnJiao', label: '样方（带）西南角' },
    // { key: 'dbJiao', label: '样方（带）东北角' },
    // { key: 'xbJiao', label: '样方（带）西北角' },
    // { key: 'dnJiao', label: '样方（带）东南角' },
  ];

  // 检查必填字段
  for (const field of requiredFields) {
    if (!data[field.key] || data[field.key].toString().trim() === '') {
      uni.showToast({
        title: `请填写${field.label}`,
        icon: 'none',
        duration: 2000,
      });
      return false;
    }
  }

  // 检查是否至少上传一张照片
  // if (!data.fieldImageTrunkBase || data.fieldImageTrunkBase.length === 0) {
  //   uni.showToast({
  //     title: '请至少上传一张照片',
  //     icon: 'none',
  //     duration: 2000,
  //   });
  //   return false;
  // }

  return true;
};

// 通用提交/保存方法
const submitOrSave = async (submitType: number, actionName: string) => {
  // 验证必填字段
  if (!validateRequiredFields()) {
    return;
  }

  // 显示loading
  if (submitType === 1) {
    isSubmitting.value = true;
  }
  uni.showLoading({
    title: `${actionName}中...`,
    mask: true,
  });

  try {
    // 准备数据
    const { formData: submitFormData, uploadFiles } = buildUploadData(formData.value, submitType);

    // 确定请求URL
    const url = isEditMode.value && editId.value ? `/gu_shu_qun_chou_yangs/${editId.value}` : '/gu_shu_qun_chou_yangs';

    console.log(`${actionName}数据:`, { url, formData: submitFormData, filesCount: uploadFiles.length });

    let res;
    if (uploadFiles.length > 0) {
      // 有文件上传，使用 uploadService
      res = await uploadService({
        url,
        files: uploadFiles,
        formData: submitFormData,
      });
    } else {
      // 无文件上传，使用普通 service
      const method = 'POST';
      res = await service({
        url,
        method,
        params: submitFormData,
        header: {
          'content-type': 'application/x-www-form-urlencoded',
        },
      });
    }

    if (res.statusCode === 200) {
      console.log(`${actionName}成功:`, res);

      uni.hideLoading();
      uni.showToast({
        title: `${actionName}成功`,
        icon: 'success',
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 500);
    } else {
      uni.showToast({
        title: res.message || `${actionName}失败`,
        icon: 'none',
      });
      uni.hideLoading();
      return;
    }
  } catch (error: any) {
    console.error(`${actionName}失败:`, error);
    uni.hideLoading();
    uni.showToast({
      title: error.message || `${actionName}失败`,
      icon: 'none',
    });
  } finally {
    if (submitType === 1) {
      isSubmitting.value = false;
    }
  }
};

// 提交表单
const handleSubmit = async () => {
  await submitOrSave(1, '提交');
};

// 保存按钮
const handleSave = async () => {
  await submitOrSave(0, '保存');
};
</script>

<template>
  <view class="w-full h-full flex flex-col bg-#fff">
    <!-- 内容区域 -->
    <view class="flex-1 overflow-y-auto">
      <!-- 动态表单区域 -->
      <TreeClusterSampleInventoryForm :formData="formData" :isEditMode="isEditMode" @update="handleFormUpdate" />
    </view>

    <!-- 底部操作按钮 -->
    <view class="w-full px-20px py-15px border-t-1px border-#eee bg-#fff">
      <!-- 测试数据按钮 -->
      <view class="mb-10px">
        <view @click="generateTestData" class="w-full h-40px fc rounded-8px bg-#ff9800">
          <text class="text-14px color-#fff">生成测试数据</text>
        </view>
      </view>

      <!-- 保存和提交按钮 -->
      <view class="flex gap-15px">
        <view @click="handleSave" :class="['flex-1 h-44px fc rounded-8px', isSubmitting ? 'bg-#f5f5f5 opacity-50' : 'bg-#f5f5f5']">
          <text class="text-15px color-#666">保存</text>
        </view>
        <view @click="handleSubmit()" :class="['flex-1 h-44px fc rounded-8px', isSubmitting ? 'bg-#01bd8d opacity-50' : 'bg-#01bd8d']">
          <text class="text-15px color-#fff">{{ isSubmitting ? '提交中...' : '完成调查' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped></style>
