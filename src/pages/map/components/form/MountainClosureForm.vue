<script lang="ts" setup>
import { ref, watch } from 'vue';
import MultiSelector from './MultiSelector.vue';
import {
  projectCategoryOptions,
  nonVerificationReasonOptions,
  enclosureFacilityOptions,
  forestryMeasureOptions,
  enclosureEffectOptions,
  mountainClosureUnqualifiedReasonOptions,
  generateYearOptions,
} from './constants';

const props = defineProps<{
  formData: any;
}>();

const emit = defineEmits<{
  update: [data: any];
}>();

// 生成年份选项
const yearOptions = generateYearOptions();

// 本地表单数据
const localFormData = ref({
  c1: '', // 市
  c2: '', // 县、局
  c3: '', // 乡镇（林场）
  c4: '', // 村
  c5: '', // 小班号
  c6: '', // 任务年度
  c7: '', // 作业年度
  c8: '', // 项目类别
  c9: '', // 封育对象
  c10: '', // 设计面积
  c11: '', // 核实面积
  c12: '', // 不核实原因
  c13: '', // 封禁设施（多选，用+号连接）
  c14: '', // 育林措施（多选，用+号连接）
  c15: '', // 封育效果
  c16: '', // 合格面积
  c17: '', // 不合格原因（多选，用+号连接）
  c18: '', // 备注
});

// 监听表单数据变化
watch(
  localFormData,
  newVal => {
    emit('update', newVal);
  },
  { deep: true },
);

// 监听外部传入的formData
watch(
  () => props.formData,
  newVal => {
    if (newVal && Object.keys(newVal).length > 0) {
      Object.assign(localFormData.value, newVal);
    }
  },
  { immediate: true },
);
</script>

<template>
  <view class="w-full">
    <view class="px-20px py-20px">
      <!-- 基本信息 -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">基本信息</text>
        </view>

        <!-- 市 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">市</text>
          </view>
          <uni-easyinput v-model="localFormData.c1" placeholder="以第三次全国国土调查市名称为准" :clearable="true"></uni-easyinput>
        </view>

        <!-- 县、局 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">县、局</text>
          </view>
          <uni-easyinput v-model="localFormData.c2" placeholder="以国土三调县名称为准" :clearable="true"></uni-easyinput>
        </view>

        <!-- 乡镇（林场） -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">乡镇（林场）</text>
          </view>
          <uni-easyinput v-model="localFormData.c3" placeholder="以国土三调乡镇名称为准" :clearable="true"></uni-easyinput>
        </view>

        <!-- 村 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">村</text>
          </view>
          <uni-easyinput v-model="localFormData.c4" placeholder="以国土三调村名称为准" :clearable="true"></uni-easyinput>
        </view>

        <!-- 小班号 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">小班号</text>
          </view>
          <uni-easyinput v-model="localFormData.c5" placeholder="小班编号以县级单位统一编号" :clearable="true"></uni-easyinput>
        </view>

        <!-- 任务年度 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">任务年度</text>
          </view>
          <uni-data-select v-model="localFormData.c6" :localdata="yearOptions" placeholder="选择计划任务的年度"></uni-data-select>
        </view>

        <!-- 作业年度 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">作业年度</text>
          </view>
          <uni-data-select v-model="localFormData.c7" :localdata="yearOptions" placeholder="选择实际作业的年度"></uni-data-select>
        </view>

        <!-- 项目类别 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">项目类别</text>
          </view>
          <uni-data-select v-model="localFormData.c8" :localdata="projectCategoryOptions" placeholder="请选择项目类别"></uni-data-select>
        </view>

        <!-- 封育对象 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">封育对象</text>
          </view>
          <uni-easyinput v-model="localFormData.c9" placeholder="按作业设计填写" :clearable="true"></uni-easyinput>
        </view>

        <!-- 设计面积 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">设计面积</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.c10" type="number" placeholder="按作业设计小班面积填写" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">亩</text>
          </view>
        </view>
      </view>

      <!-- 核实情况 -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">核实情况</text>
        </view>

        <!-- 核实面积 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">核实面积</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.c11" type="number" placeholder="按现地调查结果填写" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">亩</text>
          </view>
        </view>

        <!-- 不核实原因 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">不核实原因</text>
          </view>
          <uni-data-select v-model="localFormData.c12" :localdata="nonVerificationReasonOptions" placeholder="请选择不核实原因"></uni-data-select>
        </view>
      </view>

      <!-- 质量情况 -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">质量情况</text>
        </view>

        <!-- 主要调查因子 -->
        <view class="mb-20px">
          <view class="mb-12px">
            <text class="text-15px font-bold color-#333">主要调查因子</text>
          </view>

          <!-- 封禁设施 -->
          <view class="mb-15px">
            <view class="mb-8px">
              <text class="text-14px color-#666">封禁设施</text>
            </view>
            <MultiSelector v-model="localFormData.c13" :options="enclosureFacilityOptions" placeholder="可多选，用'+'号连接" />
          </view>

          <!-- 育林措施 -->
          <view class="mb-15px">
            <view class="mb-8px">
              <text class="text-14px color-#666">育林措施</text>
            </view>
            <MultiSelector v-model="localFormData.c14" :options="forestryMeasureOptions" placeholder="可多选，用'+'号连接" />
          </view>

          <!-- 封育效果 -->
          <view class="mb-15px">
            <view class="mb-8px">
              <text class="text-14px color-#666">封育效果</text>
            </view>
            <uni-data-select v-model="localFormData.c15" :localdata="enclosureEffectOptions" placeholder="请选择封育效果"></uni-data-select>
          </view>
        </view>

        <!-- 合格面积 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">合格面积</text>
            <text class="text-12px color-red ml-5px">*</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.c16" type="number" placeholder="质量达到合格标准的，合格面积以核实面积计" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">亩</text>
          </view>
        </view>

        <!-- 不合格原因（多选） -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">不合格原因</text>
          </view>
          <MultiSelector v-model="localFormData.c17" :options="mountainClosureUnqualifiedReasonOptions" placeholder="可多选，用'+'号连接" />
        </view>
      </view>

      <!-- 备注 -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">备注</text>
        </view>

        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">备注</text>
          </view>
          <uni-easyinput v-model="localFormData.c18" type="textarea" placeholder="对填写'其他'的情况进行说明" :clearable="true"></uni-easyinput>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped></style>
