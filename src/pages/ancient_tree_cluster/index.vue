<script lang="ts" setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import TreeClusterInventoryForm from './TreeClusterInventoryForm.vue';
import { service, uploadService } from '@/service';
import {
  censusRangeOptions,
  surveyMethodOptions,
  clusterDistributionPlaceOptions,
  managementDeptOptions,
  clusterOwnershipOptions,
  responsibleTypeOptions,
  unitCategoryOptions,
  protectionMeasureOptions,
  forestStructureOptions,
  importantValueOptions,
  changeReasonOptions,
} from './constants';

// 本地响应式数据
const localFeatureData = ref<FeatureData>({});

// 表单数据
const formData = ref({});

// 绘制的多边形数据
const polygonData = ref<any>(null);

// 当前编辑的ID
const editId = ref('');

// 是否为编辑模式
const isEditMode = ref(false);

// 立即注册事件监听器（在组件创建时就注册，确保不会错过事件）
// @ts-ignore
uni.$on('drawnPolygonData', (data: any) => {
  console.log('✅ 成功接收到绘制的多边形数据:', data);
  polygonData.value = data;
  // 将多边形数据传递给表单组件
  formData.value = {
    ...formData.value,
    geom: data,
  };
});

// 组件卸载时移除监听
onUnmounted(() => {
  console.log('🔴 移除多边形数据监听器');
  // @ts-ignore
  uni.$off('drawnPolygonData');
});

// 加载详情数据
const loadDetail = async (id: string) => {
  uni.showLoading({
    title: '加载中...',
    mask: true,
  });

  try {
    const res = await service({
      url: `/gu_shu_quns/${id}`,
      method: 'GET',
    });

    if (res && res.data) {
      // 特殊处理照片/视频字段，如果是 null 则转为空数组
      const detailData = {
        ...res.data,
        fieldImageLongShot: res.data.fieldImageLongShot || [],
        fieldImageCloseUp: res.data.fieldImageCloseUp || [],
        fieldImageHabitat: res.data.fieldImageHabitat || [],
        zysz: res.data.zysz || [], // 主要树种组成
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
  console.log(options);

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
    // 基本信息
    gsqbh: `GSQ${Date.now().toString().slice(-8)}`, // 古树群编号
    pcfw: randomSelect(censusRangeOptions), // 普查范围
    dcf: randomSelect(surveyMethodOptions), // 调查方法

    // 位置边界
    xz: `测试乡镇${randomNumber(1, 100)}`, // 乡镇(街道)
    cun: `测试村${randomNumber(1, 100)}`, // 村(居委会)
    xdm: `测试地名${randomNumber(1, 100)}`, // 小地名
    fbcs: randomSelect(clusterDistributionPlaceOptions), // 分布场所
    szfwms: `测试四至范围描述${randomNumber(1, 100)}`, // 四至范围描述
    hb: randomNumber(100, 3000), // 海拔(m)

    mj: randomNumber(1, 100, 2), // 面积(hm²)
    gszs: randomNumber(50, 500), // 古树株数(株)

    // 树龄结构
    gt500: randomNumber(10, 40), // >500年(%)
    s300_500: randomNumber(20, 50), // 300-500年(%)
    s100_300: randomNumber(10, 40), // 100-300年(%)

    zysz: [
      {
        id: `species_${Date.now()}_1`,
        name: `测试树种${randomNumber(1, 50)}`,
        quantity: randomNumber(20, 100),
        ratio: '',
      },
    ], // 主要树种组成

    // 保护现状
    zgbm: randomSelect(managementDeptOptions), // 主管部门
    qs: randomSelect(clusterOwnershipOptions), // 权属
    rcyhzrrlx: randomSelect(responsibleTypeOptions), // 日常养护责任人类型
    dwlbOrGrmc: `测试单位${randomNumber(1, 100)}`, // 单位类别或个人名称
    bhcs: randomSelect(protectionMeasureOptions), // 保护措施

    // 林分特征
    lcjgzk: randomSelect(forestStructureOptions), // 林层结构状况
    // 乔木层
    ybd: randomNumber(0.5, 1.0, 2), // 郁闭度
    pjxj: randomNumber(20, 80, 1), // 平均胸径(cm)
    pjsg: randomNumber(5, 30, 1), // 平均树高(m)
    // 灌木层
    gmzl: `测试灌木${randomNumber(1, 30)}`, // 种类
    gmgd: randomNumber(10, 80), // 盖度(%)
    gmhd: randomNumber(1, 5, 1), // 高度(m)
    // 草本/地被物
    cbzl: `测试草本${randomNumber(1, 30)}`, // 种类
    cbgd: randomNumber(10, 80), // 盖度(%)
    cbhd: randomNumber(0.1, 1.5, 1), // 高度(m)

    zyjz: randomSelect(importantValueOptions), // 重要价值
    sm: `价值说明测试文本${randomNumber(1, 100)}`, // 说明

    bhyy: randomSelect(changeReasonOptions), // 变化原因
    zpsm: `照片说明测试文本${randomNumber(1, 100)}`, // 照片说明文字
    bz: `备注测试文本${randomNumber(1, 100)}`, // 备注

    // 保留照片/视频字段为空数组
    fieldImageLongShot: [],
    fieldImageCloseUp: [],
    fieldImageHabitat: [],
  };

  // 保留原有的geom（如果有）
  const currentFormData = formData.value as any;
  if (currentFormData.geom) {
    testData.geom = currentFormData.geom;
  }

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
  const mediaFields = ['fieldImageLongShot', 'fieldImageCloseUp', 'fieldImageHabitat'];

  // 处理所有字段
  Object.keys(data).forEach(key => {
    // 跳过 submitType 字段，会在最后单独设置
    if (key === 'submitType') {
      return;
    }

    const value = data[key];

    // 处理图片/视频数组字段
    if (Array.isArray(value) && mediaFields.includes(key)) {
      let newFileIndex = 0; // 每个字段单独计数新文件索引

      value.forEach((item: any, index: number) => {
        if (item.tempFilePath) {
          // 新上传的文件，字段名加 upload 前缀
          const uploadKey = `upload${key.charAt(0).toUpperCase()}${key.slice(1)}`; // 如：uploadFieldImageLongShot
          uploadFiles.push({
            name: `${uploadKey}[${newFileIndex}]`,
            file: item.tempFilePath,
            uri: item.tempFilePath,
          });
          newFileIndex++;
        } else if (item.id) {
          // 已存在的文件，传递完整信息，字段名不加前缀
          formData[`${key}[${index}].id`] = item.id;
          if (item.name) formData[`${key}[${index}].name`] = item.name;
          if (item.path) formData[`${key}[${index}].path`] = item.path;
          if (item.url) formData[`${key}[${index}].url`] = item.url;
          if (item.fileType) formData[`${key}[${index}].fileType`] = item.fileType;
        }
      });
    } else if (key === 'zysz' && Array.isArray(value)) {
      // 处理主要树种组成数组
      value.forEach((item: any, index: number) => {
        formData[`zysz[${index}].name`] = item.name || '';
        formData[`zysz[${index}].quantity`] = item.quantity || '';
        formData[`zysz[${index}].ratio`] = item.ratio || '';
      });
    } else if (key === 'geom' && value && typeof value === 'object') {
      // 处理 geom 字段，转换为 JSON 字符串
      formData[key] = JSON.stringify(value);
    } else if (value !== null && value !== undefined && value !== '') {
      // 处理普通字段（非空值才添加）
      if (typeof value === 'boolean') {
        formData[key] = value ? 1 : 0;
      } else if (!Array.isArray(value)) {
        formData[key] = value;
      }
    }
  });

  // 最后设置 submitType，确保不被覆盖
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
    { key: 'pcfw', label: '普查范围' },
    { key: 'xz', label: '乡镇(街道)' },
    { key: 'cun', label: '村(居委会)' },
    { key: 'fbcs', label: '分布场所' },
  ];

  // 检查普通必填字段
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
    const url = isEditMode.value && editId.value ? `/gu_shu_quns/${editId.value}` : '/gu_shu_quns';

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

    console.log(`${actionName}成功:`, res);

    uni.hideLoading();
    uni.showToast({
      title: `${actionName}成功`,
      icon: 'success',
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 500);
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
    <!-- 多边形数据提示 -->
    <view v-if="polygonData" class="px-20px py-12px bg-#e6f7f1 border-b-1px border-#01bd8d">
      <view class="flex items-center gap-8px">
        <uni-icons type="checkmarkempty" size="18" color="#01bd8d"></uni-icons>
        <text class="text-14px color-#01bd8d">已接收古树群范围数据（{{ polygonData.coordinates[0].length - 1 }}个点）</text>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="flex-1 overflow-y-auto">
      <!-- 动态表单区域 -->
      <TreeClusterInventoryForm :formData="formData" @update="handleFormUpdate" />
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
