<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import TreeInventoryForm from './TreeInventoryForm.vue';
import { service, uploadService } from '@/service';
import { onLoad } from '@dcloudio/uni-app';
import {
  censusRangeOptions,
  distributionTypeOptions,
  distributionPlaceOptions,
  soilCompactnessOptions,
  soilThicknessOptions,
  slopePositionOptions,
  slopeGradeOptions,
  slopeAspectOptions,
  growthEnvironmentOptions,
  ageTestMethodOptions,
  protectionLevelOptions,
  treeCategoryOptions,
  growthStatusOptions,
  treeDamageOptions,
  potentialImpactOptions,
  managementDeptOptions,
  ownershipOptions,
  responsibleTypeOptions,
  protectionMeasureOptions,
  importantValueOptions,
  newIncreaseReasonOptions,
  decreaseReasonOptions,
  deathDisposalOptions,
} from './constants';

// 本地响应式数据
const localFeatureData = ref<FeatureData>({});

// 表单数据
const formData = ref({});

// 当前编辑的ID
const editId = ref('');

// 是否为编辑模式
const isEditMode = ref(false);

// 是否有古树群ID（来自参数 gsqId）
const hasGsqId = ref(false);

// 古树群ID
const gsqId = ref('');

// 是否禁用古树编号和分布特点（编辑模式下禁用）
const isFieldDisabled = computed(() => isEditMode.value);

// 加载详情数据
const loadDetail = async (id: string) => {
  uni.showLoading({
    title: '加载中...',
    mask: true,
  });

  try {
    const res = await service({
      url: `/gu_shus/${id}`,
      method: 'GET',
    });

    if (res && res.data) {
      // 特殊处理照片/视频字段，如果是 null 则转为空数组
      const detailData = {
        ...res.data,
        fieldImageParentTree: res.data.fieldImageParentTree || [],
        fieldImageTrunkBase: res.data.fieldImageTrunkBase || [],
        fieldImageCrown: res.data.fieldImageCrown || [],
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

  // 判断是否有古树群ID
  if (options && options.gsqId) {
    hasGsqId.value = true;
    // 如果来自古树群，分布特点只能是"群状"，并设置古树群编号
    formData.value = {
      ...formData.value,
      fbtz: '群状',
      gsqbh: options.gsqbh || '',
      gsqId: options.gsqId || '',
    } as any;
  } else {
    // 如果没有 gsqId，分布特点只能是"散生"
    formData.value = {
      ...formData.value,
      fbtz: '散生',
    } as any;
  }

  // 如果有id参数，则为编辑模式
  if (options && options.id) {
    editId.value = options.id;
    loadDetail(options.id);
  } else if (options && (options.jd || options.wd)) {
    // 从地图传入的坐标参数
    formData.value = {
      ...formData.value,
      jd: options.jd || '',
      wd: options.wd || '',
      geom: {
        type: 'Point',
        coordinates: [Number(options.jd || ''), Number(options.wd || '')],
      },
    } as any;
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
    gsmmbh: `GS${Date.now().toString().slice(-8)}`, // 古树名木编号
    pcfw: randomSelect(censusRangeOptions), // 普查范围
    sfzdgylqfw: '0', // 是否重点国有林区范围（不生成）
    sgjt: '', // 森工集团（不生成）
    lyj: '', // 林业局（不生成）
    lcmc: '', // 林场名称（不生成）
    fbtz: randomSelect(distributionTypeOptions), // 分布特点
    gsqbh: '', // 古树群编号（如果是群状再填）

    // 地理位置
    xz: `测试乡镇${randomNumber(1, 100)}`, // 乡镇(街道)
    cun: `测试村${randomNumber(1, 100)}`, // 村(居委会)
    xdm: `测试地名${randomNumber(1, 100)}`, // 小地名
    fbcs: randomSelect(distributionPlaceOptions), // 分布场所
    jd: '', // 经度（不生成，保留用户从地图传入的值）
    wd: '', // 纬度（不生成，保留用户从地图传入的值）

    // 立地条件
    hb: randomNumber(100, 3000), // 海拔(m)
    trjmd: randomSelect(soilCompactnessOptions), // 土壤紧密度
    tchd: randomSelect(soilThicknessOptions), // 土层厚度
    pw: randomSelect(slopePositionOptions), // 坡位
    pd: randomSelect(slopeGradeOptions), // 坡度
    px: randomSelect(slopeAspectOptions), // 坡向
    szhjdj: randomSelect(growthEnvironmentOptions), // 生长环境等级

    // 树种
    ke: `测试科${randomNumber(1, 50)}`, // 科
    shu: `测试属${randomNumber(1, 50)}`, // 属
    zwm: `测试树种${randomNumber(1, 100)}`, // 中文名
    xm: `Test Tree ${randomNumber(1, 100)}`, // 学名
    sm: `俗名${randomNumber(1, 100)}`, // 俗名

    sl: randomNumber(100, 1000), // 树龄(年)
    cdff: randomSelect(ageTestMethodOptions), // 测定方法
    bhdj: randomSelect(protectionLevelOptions), // 保护等级
    gsmmlb: randomSelect(treeCategoryOptions), // 古树名木类别

    // 测树因子
    sg: randomNumber(5, 50, 1), // 树高(m)
    xj: randomNumber(50, 300, 1), // 胸径(cm)
    dj: randomNumber(60, 350, 1), // 地径(cm)
    pjgf: randomNumber(3, 30, 1), // 平均冠幅(m)
    xw: randomNumber(150, 1000, 1), // 胸围(cm)
    dw: randomNumber(200, 1200, 1), // 地围(cm)

    szsdj: randomSelect(growthStatusOptions), // 生长势等级

    // 受损情况
    stss: randomSelect(treeDamageOptions), // 树体损伤
    qzyxys: randomSelect(potentialImpactOptions), // 潜在影响因素

    // 保护现状
    zgbm: randomSelect(managementDeptOptions), // 主管部门
    qs: randomSelect(ownershipOptions), // 权属
    rcyhzrrlx: randomSelect(responsibleTypeOptions), // 日常养护责任人类型
    dwmcOrgrmc: `测试单位${randomNumber(1, 100)}`, // 单位名称或个人名称
    bhcs: randomSelect(protectionMeasureOptions), // 保护措施

    zyjz: randomSelect(importantValueOptions), // 重要价值
    zyjzsm: `价值说明测试文本${randomNumber(1, 100)}`, // 说明
    xzyy: randomSelect(newIncreaseReasonOptions), // 新增原因
    jsyy: randomSelect(decreaseReasonOptions), // 减少原因
    swczcs: randomSelect(deathDisposalOptions), // 死亡处置措施
    smqtxz: `奇特性状描述测试${randomNumber(1, 100)}`, // 树木奇特性状
    zpjsm: `照片说明测试文本${randomNumber(1, 100)}`, // 照片及说明
    bz: `备注测试文本${randomNumber(1, 100)}`, // 备注

    // 保留照片/视频字段为空数组
    fieldImageParentTree: [],
    fieldImageTrunkBase: [],
    fieldImageCrown: [],
  };

  // 如果分布特点是群状，添加古树群编号
  if (testData.fbtz === '群状') {
    testData.gsqbh = `GSQ${Date.now().toString().slice(-6)}`;
  }

  // 保留原有的经纬度（如果从地图传入）
  const currentFormData = formData.value as any;
  if (currentFormData.jd) {
    testData.jd = currentFormData.jd;
  }
  if (currentFormData.wd) {
    testData.wd = currentFormData.wd;
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
  const mediaFields = ['fieldImageParentTree', 'fieldImageTrunkBase', 'fieldImageCrown'];

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
          const uploadKey = `upload${key.charAt(0).toUpperCase()}${key.slice(1)}`; // 如：uploadFieldImageParentTree
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
  // 如果古树群ID存在，则添加到表单数据中
  if (gsqId.value) {
    formData.gsqId = gsqId.value;
  }
  console.log('构建的上传数据:', { formData, uploadFiles, fileCount: uploadFiles.length });
  return { formData, uploadFiles };
};

// 验证必填字段
const validateRequiredFields = () => {
  const data = formData.value as any;

  // 必填字段列表
  const requiredFields = [
    { key: 'gsmmbh', label: '古树名木编号' },
    { key: 'pcfw', label: '普查范围' },
    { key: 'xz', label: '乡镇(街道)' },
    { key: 'cun', label: '村(居委会)' },
    { key: 'fbcs', label: '分布场所' },
    { key: 'jd', label: '经度' },
    { key: 'wd', label: '纬度' },
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

  // 检查胸径和地径至少填写一项
  const hasXj = data.xj && data.xj.toString().trim() !== '';
  const hasDj = data.dj && data.dj.toString().trim() !== '';

  if (!hasXj && !hasDj) {
    uni.showToast({
      title: '胸径和地径至少填写一项',
      icon: 'none',
      duration: 2000,
    });
    return false;
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
    const url = isEditMode.value && editId.value ? `/gu_shus/${editId.value}` : '/gu_shus';

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
      // const method = isEditMode.value && editId.value ? 'PUT' : 'POST';
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
      <TreeInventoryForm :formData="formData" :hasGsqId="hasGsqId" :isEditMode="isEditMode" @update="handleFormUpdate" />
    </view>

    <!-- 底部操作按钮 -->
    <view class="w-full px-20px py-15px border-t-1px border-#eee bg-#fff">
      <!-- 测试数据按钮 -->
      <!-- <view class="mb-10px">
        <view @click="generateTestData" class="w-full h-40px fc rounded-8px bg-#ff9800">
          <text class="text-14px color-#fff">生成测试数据</text>
        </view>
      </view> -->

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
