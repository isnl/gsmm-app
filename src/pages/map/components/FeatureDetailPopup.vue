<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import { InvestigateType, investigateTypeOptions } from './form/types';
import ArtificialAfforestationForm from './form/ArtificialAfforestationForm.vue';
import MountainClosureForm from './form/MountainClosureForm.vue';
import AerialSeedingForm from './form/AerialSeedingForm.vue';
import DegradedForestRestorationForm from './form/DegradedForestRestorationForm.vue';
import YoungForestTendingForm from './form/YoungForestTendingForm.vue';
import ArtificialGrasslandForm from './form/ArtificialGrasslandForm.vue';
import GrasslandImprovementForm from './form/GrasslandImprovementForm.vue';
import SandyLandTreatmentForm from './form/SandyLandTreatmentForm.vue';
import { service } from '@/service';

// 定义属性项类型
interface PropertyItem {
  name: string;
  value: any;
}

// 定义props类型
interface FeatureData {
  properties?: Record<string, any> | PropertyItem[];
  layerId?: number;
  geometry?: any;
  isInvestigated?: boolean;
}

const props = defineProps<{
  featureData: FeatureData;
}>();

const emit = defineEmits<{
  close: [layerId: number];
}>();

// Tab 切换状态：0-基础数据，1-调查表单
const activeTab = ref(0);

// 本地响应式数据
const localFeatureData = ref<FeatureData>({});

// 基础数据表单数据
const baseFormData = ref<Record<string, any>>({});

// 选中的调查类型
const selectedType = ref<InvestigateType | ''>('');

// 表单数据
const formData = ref({});

// 提交loading状态
const isSubmitting = ref(false);

// 动态组件映射
const formComponentMap = {
  [InvestigateType.ARTIFICIAL_AFFORESTATION]: ArtificialAfforestationForm,
  [InvestigateType.MOUNTAIN_CLOSURE]: MountainClosureForm,
  [InvestigateType.AERIAL_SEEDING]: AerialSeedingForm,
  [InvestigateType.DEGRADED_FOREST_RESTORATION]: DegradedForestRestorationForm,
  [InvestigateType.YOUNG_FOREST_TENDING]: YoungForestTendingForm,
  [InvestigateType.ARTIFICIAL_GRASSLAND]: ArtificialGrasslandForm,
  [InvestigateType.GRASSLAND_IMPROVEMENT]: GrasslandImprovementForm,
  [InvestigateType.SANDY_LAND_TREATMENT]: SandyLandTreatmentForm,
};

// 当前显示的表单组件
const currentFormComponent = computed(() => {
  if (selectedType.value) {
    return formComponentMap[selectedType.value];
  }
  return null;
});

// 调查类型选择变化
const handleTypeChange = (value: any) => {
  // 如果之前已经选择了类型（不是从空类型开始选），并且选择的是不同的类型
  if (selectedType.value && selectedType.value !== value) {
    uni.showModal({
      title: '提示',
      content: '切换调查类型会清空原有表单内容，是否继续？',
      success: res => {
        if (res.confirm) {
          selectedType.value = value;
          formData.value = {}; // 重置表单数据
        }
        // 如果用户取消，uni-data-select 会自动恢复原值，不需要手动处理
      },
    });
  } else {
    // 首次选择，直接设置
    selectedType.value = value;
    formData.value = {};
  }
};

// 表单更新
const handleFormUpdate = (data: any) => {
  formData.value = data;
};

// 从 properties 中获取指定 key 的值
const getPropertiesByKey = (key: string) => {
  const properties = localFeatureData.value.properties;
  if (!properties) return '';

  // 如果 properties 是数组
  if (Array.isArray(properties)) {
    const item = properties.find((p: any) => p.name === key);
    return item?.value || '';
  }

  // 如果 properties 是对象
  return properties[key] || '';
};

// 将 properties 转换为数组格式（用于基础数据表单遍历）
const propertiesArray = computed(() => {
  const properties = localFeatureData.value.properties;
  if (!properties) return [];

  // 如果 properties 是数组
  if (Array.isArray(properties)) {
    // 过滤掉 ogc_fid 字段
    return properties.filter((p: PropertyItem) => p.name !== 'ogc_fid');
  }

  // 如果 properties 是对象，转换为数组格式
  return Object.entries(properties)
    .filter(([key]) => key !== 'ogc_fid')
    .map(([name, value]) => ({ name, value }));
});

// 初始化基础数据表单
const initBaseFormData = () => {
  const properties = localFeatureData.value.properties;
  if (!properties) {
    baseFormData.value = {};
    return;
  }

  const formData: Record<string, any> = {};

  // 如果 properties 是数组
  if (Array.isArray(properties)) {
    properties.forEach((item: PropertyItem) => {
      if (item.name !== 'ogc_fid') {
        formData[item.name] = item.value ?? '';
      }
    });
  } else {
    // 如果 properties 是对象
    Object.entries(properties).forEach(([key, value]) => {
      if (key !== 'ogc_fid') {
        formData[key] = value ?? '';
      }
    });
  }

  baseFormData.value = formData;
};

// 提交基础数据
const handleBaseFormSubmit = async () => {
  // 显示loading
  isSubmitting.value = true;
  uni.showLoading({
    title: '提交中...',
    mask: true,
  });

  try {
    const fid = getPropertiesByKey('ogc_fid');
    const layerId = localFeatureData.value.layerId;

    if (!layerId || !fid) {
      throw new Error('缺少必要参数');
    }

    const submitData = {
      id: layerId,
      fid: fid,
      data: {
        ...baseFormData.value,
        ogc_fid: fid,
      },
    };

    console.log('提交基础数据:', submitData);

    await service({
      url: `/layers/${layerId}/xiao_ban/${fid}`,
      method: 'PUT',
      params: submitData,
    });

    uni.hideLoading();
    uni.showToast({
      title: '提交成功',
      icon: 'success',
    });

    emit('close', layerId as number);
  } catch (error: any) {
    console.error('提交基础数据失败:', error);
    uni.hideLoading();
    uni.showToast({
      title: error.message || '提交失败',
      icon: 'none',
    });
  } finally {
    isSubmitting.value = false;
  }
};

// 验证必填字段
const validateRequiredFields = () => {
  const data = formData.value as any;

  // 根据不同的调查类型，核实面积和合格面积的字段编号不同
  // 但所有表单的核实面积都是 c10 或 c11，合格面积根据表单不同而不同

  // 验证核实面积（人工造林是c11，其他大部分是c10或c11）
  let verifiedAreaField = '';
  let qualifiedAreaField = '';

  // 根据调查类型确定字段
  switch (selectedType.value) {
    case InvestigateType.ARTIFICIAL_AFFORESTATION:
      verifiedAreaField = 'c11'; // 核实面积
      qualifiedAreaField = 'c19'; // 合格面积
      break;
    case InvestigateType.MOUNTAIN_CLOSURE:
      verifiedAreaField = 'c11'; // 核实面积
      qualifiedAreaField = 'c16'; // 合格面积
      break;
    case InvestigateType.AERIAL_SEEDING:
      verifiedAreaField = 'c10'; // 核实面积
      qualifiedAreaField = 'c17'; // 合格面积
      break;
    case InvestigateType.DEGRADED_FOREST_RESTORATION:
      verifiedAreaField = 'c10'; // 核实面积
      qualifiedAreaField = 'c20'; // 合格面积
      break;
    case InvestigateType.YOUNG_FOREST_TENDING:
      verifiedAreaField = 'c10'; // 核实面积
      qualifiedAreaField = 'c20'; // 合格面积
      break;
    case InvestigateType.ARTIFICIAL_GRASSLAND:
      verifiedAreaField = 'c11'; // 核实面积
      qualifiedAreaField = 'c18'; // 合格面积
      break;
    case InvestigateType.GRASSLAND_IMPROVEMENT:
      verifiedAreaField = 'c11'; // 核实面积
      qualifiedAreaField = 'c26'; // 合格面积
      break;
    case InvestigateType.SANDY_LAND_TREATMENT:
      verifiedAreaField = 'c10'; // 核实面积
      qualifiedAreaField = 'c27'; // 合格面积
      break;
  }

  // 验证核实面积
  if (!data[verifiedAreaField] || data[verifiedAreaField] === '') {
    uni.showToast({
      title: '请填写核实面积',
      icon: 'none',
    });
    return false;
  }

  // 验证合格面积
  if (!data[qualifiedAreaField] || data[qualifiedAreaField] === '') {
    uni.showToast({
      title: '请填写合格面积',
      icon: 'none',
    });
    return false;
  }

  return true;
};

// 提交表单
const handleSubmit = async () => {
  if (!selectedType.value) {
    uni.showToast({
      title: '请选择调查类型',
      icon: 'none',
    });
    return;
  }

  // 验证必填字段
  if (!validateRequiredFields()) {
    return;
  }

  // 显示loading
  isSubmitting.value = true;
  uni.showLoading({
    title: '提交中...',
    mask: true,
  });

  try {
    // 获取 fid
    const fid = getPropertiesByKey('ogc_fid');
    const layerId = localFeatureData.value.layerId || '';
    // 准备提交数据（包含表单所有字段）
    const submitData: any = {
      ...formData.value, // 展开所有表单字段 c1, c2, c3...
      layerId,
      type: selectedType.value,
      fid,
    };

    console.log('提交数据:', submitData);

    // 根据 isInvestigated 判断是新建还是修改
    if (localFeatureData.value.isInvestigated) {
      // 已调查，走修改接口 PUT /investigates/{id}
      submitData.id = editId.value; // 添加 id 字段

      await service({
        url: `/investigates/${editId.value}`,
        method: 'PUT',
        params: submitData,
      });

      console.log('修改调查成功');
    } else {
      // 未调查，走新建接口 POST /investigates
      await service({
        url: '/investigates',
        method: 'POST',
        params: submitData,
      });

      console.log('新建调查成功');
    }

    uni.hideLoading();
    uni.showToast({
      title: '提交成功',
      icon: 'success',
    });

    emit('close', layerId as number);
  } catch (error: any) {
    console.error('提交失败:', error);
    uni.hideLoading();
    uni.showToast({
      title: error.message || '提交失败',
      icon: 'none',
    });
  } finally {
    isSubmitting.value = false;
  }
};

// 关闭弹窗
const handleClose = () => {
  const layerId = localFeatureData.value.layerId || '';
  // 如果已经选择了调查类型，提示用户
  if (selectedType.value) {
    uni.showModal({
      title: '提示',
      content: '关闭后将清空所有表单内容，是否继续？',
      success: res => {
        if (res.confirm) {
          // 清空数据
          selectedType.value = '';
          formData.value = {};
          emit('close', layerId as number);
        }
      },
    });
  } else {
    // 没有选择调查类型，直接关闭
    emit('close', layerId as number);
  }
};

// 获取调查详情并回显
const getInvestigatesInfo = async () => {
  // 只有已调查的要素才查询详情
  if (!localFeatureData.value.isInvestigated) {
    console.log('未调查的要素，无需查询详情');
    return;
  }

  const layerId = localFeatureData.value.layerId || '';
  const fid = getPropertiesByKey('ogc_fid');

  try {
    const res = await service({
      url: `/investigates?layerId=${layerId}&fid=${fid}`,
    });

    console.log('获取调查信息', res);

    if (res.data) {
      editId.value = res.data.id;
      const investigateData = res.data;

      // 设置调查类型
      if (investigateData.type) {
        selectedType.value = investigateData.type as InvestigateType;
      }

      // 提取所有 c 开头的字段，回显到表单
      const formFields: any = {};
      Object.keys(investigateData).forEach(key => {
        if (key !== 'createdAt') {
          if (key.startsWith('c') && investigateData[key] !== null && investigateData[key] !== undefined) {
            formFields[key] = investigateData[key];
          }
        }
      });

      // 设置表单数据
      formData.value = formFields;

      console.log('回显的表单数据:', formFields);
    }
  } catch (err) {
    console.error('获取调查详情失败:', err);
  }
};
const editId = ref();
// 监听 featureData 变化，当有新的要素数据时，查询详情
watch(
  () => props.featureData,
  newVal => {
    if (newVal && newVal.layerId) {
      // 重置表单
      selectedType.value = '';
      formData.value = {};
      activeTab.value = 0; // 重置到基础数据 tab

      // 更新本地数据
      localFeatureData.value = newVal;

      // 初始化基础数据表单
      initBaseFormData();

      // 查询详情
      getInvestigatesInfo();
    }
  },
  { immediate: true, deep: true },
);

// 取消按钮
const handleCancel = () => {
  handleClose();
};
</script>

<template>
  <view class="w-full h-full flex flex-col bg-#fff">
    <!-- Tab 切换按钮 -->
    <view class="w-full flex items-center justify-between px-20px py-15px border-b-1px border-#eee">
      <view class="flex items-center gap-10px flex-1">
        <view @click="activeTab = 0" :class="['px-20px h-36px fc rounded-6px', activeTab === 0 ? 'bg-#01bd8d' : 'bg-#f5f5f5']">
          <text :class="['text-14px', activeTab === 0 ? 'color-#fff' : 'color-#666']">基础数据</text>
        </view>
        <view @click="activeTab = 1" :class="['px-20px h-36px fc rounded-6px', activeTab === 1 ? 'bg-#01bd8d' : 'bg-#f5f5f5']">
          <text :class="['text-14px', activeTab === 1 ? 'color-#fff' : 'color-#666']">调查表单</text>
        </view>
      </view>
      <view @click="handleClose" class="w-30px h-30px fc">
        <uni-icons type="closeempty" size="24" color="#666"></uni-icons>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="flex-1 overflow-y-auto">
      <!-- 基础数据 Tab -->
      <view v-if="activeTab === 0" class="px-20px py-20px">
        <!-- 基础数据表单 -->
        <view v-if="propertiesArray.length > 0" class="flex flex-col gap-16px">
          <view v-for="(item, index) in propertiesArray" :key="index" class="flex flex-col gap-8px">
            <view class="flex items-center">
              <text class="text-14px color-#666">{{ item.name }}</text>
            </view>
            <uni-easyinput v-model="baseFormData[item.name]" :placeholder="`请输入${item.name}`"></uni-easyinput>
          </view>
        </view>

        <!-- 无数据提示 -->
        <view v-else class="w-full h-200px fc">
          <text class="text-14px color-#999">暂无基础数据</text>
        </view>
      </view>

      <!-- 调查表单 Tab -->
      <view v-if="activeTab === 1">
        <!-- 调查类型选择 -->
        <view class="px-20px py-20px pb0 border-b-1px border-#eee">
          <view class="mb-10px">
            <text class="text-14px font-bold color-#666">调查类型</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <uni-data-select
            v-model="selectedType"
            :localdata="investigateTypeOptions"
            placeholder="请选择调查类型"
            @change="handleTypeChange"
            :clear="false"
          ></uni-data-select>
        </view>

        <!-- 动态表单区域 -->
        <view v-if="currentFormComponent" class="flex-1">
          <component :is="currentFormComponent" :formData="formData" @update="handleFormUpdate" />
        </view>

        <!-- 未选择提示 -->
        <view v-else class="w-full h-200px fc">
          <text class="text-14px color-#999">请先选择调查类型</text>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="w-full px-20px py-15px border-t-1px border-#eee bg-#fff">
      <view class="flex gap-15px">
        <view @click="handleCancel" :class="['flex-1 h-44px fc rounded-8px', isSubmitting ? 'bg-#f5f5f5 opacity-50' : 'bg-#f5f5f5']">
          <text class="text-15px color-#666">取消</text>
        </view>
        <view
          @click="activeTab === 0 ? handleBaseFormSubmit() : handleSubmit()"
          :class="['flex-1 h-44px fc rounded-8px', isSubmitting ? 'bg-#01bd8d opacity-50' : 'bg-#01bd8d']"
        >
          <text class="text-15px color-#fff">{{ isSubmitting ? '提交中...' : '提交' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped></style>
