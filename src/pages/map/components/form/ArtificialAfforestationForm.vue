<script lang="ts" setup>
import { ref, watch } from 'vue';
import MultiSelector from './MultiSelector.vue';
import { projectCategoryOptions, nonVerificationReasonOptions, tendingManagementOptions, unqualifiedReasonOptions, generateYearOptions } from './constants';

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
  c9: '', // 设计树种
  c10: '', // 设计面积
  c11: '', // 核实面积
  c12: '', // 不核实原因
  c13: '', // 造林树种
  c14: '', // 苗木规格
  c15: '', // 树种组成
  c16: '', // 造林密度
  c17: '', // 抚育管护
  c18: '', // 成活率
  c19: '', // 合格面积
  c20: '', // 不合格原因（多选，用+号连接）
  c21: '', // 备注
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

        <!-- 设计树种 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">设计树种</text>
          </view>
          <uni-easyinput v-model="localFormData.c9" placeholder="按作业设计树种填写" :clearable="true"></uni-easyinput>
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

          <!-- 造林树种 -->
          <view class="mb-15px">
            <view class="mb-8px">
              <text class="text-14px color-#666">造林树种</text>
            </view>
            <uni-easyinput v-model="localFormData.c13" placeholder="按现地调查结果填写，填最主要的3种" :clearable="true"></uni-easyinput>
          </view>

          <!-- 苗木规格 -->
          <view class="mb-15px">
            <view class="mb-8px">
              <text class="text-14px color-#666">苗木规格</text>
            </view>
            <uni-easyinput v-model="localFormData.c14" placeholder="填写苗木地径（cm）、苗高（m）等属性" :clearable="true"></uni-easyinput>
          </view>

          <!-- 树种组成 -->
          <view class="mb-15px">
            <view class="mb-8px">
              <text class="text-14px color-#666">树种组成</text>
            </view>
            <uni-easyinput
              v-model="localFormData.c15"
              type="textarea"
              placeholder="按照十分法表现树种组成，如10云杉，表述云杉纯林。不到5%的树种不记载"
              :clearable="true"
            ></uni-easyinput>
          </view>

          <!-- 造林密度 -->
          <view class="mb-15px">
            <view class="mb-8px">
              <text class="text-14px color-#666">造林密度</text>
            </view>
            <view class="flex items-center gap-10px">
              <view class="flex-1">
                <uni-easyinput v-model="localFormData.c16" type="number" placeholder="按现地调查结果填写" :clearable="true"></uni-easyinput>
              </view>
              <text class="text-14px color-#666">株/亩</text>
            </view>
          </view>

          <!-- 抚育管护 -->
          <view class="mb-15px">
            <view class="mb-8px">
              <text class="text-14px color-#666">抚育管护</text>
            </view>
            <uni-data-select v-model="localFormData.c17" :localdata="tendingManagementOptions" placeholder="请选择抚育管护情况"></uni-data-select>
          </view>

          <!-- 成活率 -->
          <view class="mb-15px">
            <view class="mb-8px">
              <text class="text-14px color-#666">成活率</text>
            </view>
            <view class="flex items-center gap-10px">
              <view class="flex-1">
                <uni-easyinput v-model="localFormData.c18" type="number" placeholder="按现地调查结果填写" :clearable="true"></uni-easyinput>
              </view>
              <text class="text-14px color-#666">%</text>
            </view>
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
              <uni-easyinput v-model="localFormData.c19" type="number" placeholder="质量达到合格标准的，合格面积以核实面积计" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">亩</text>
          </view>
        </view>

        <!-- 不合格原因（多选） -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">不合格原因</text>
          </view>
          <MultiSelector v-model="localFormData.c20" :options="unqualifiedReasonOptions" placeholder="可多选，用'+'号连接" />
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
          <uni-easyinput v-model="localFormData.c21" type="textarea" placeholder="对填写'其他'的情况进行说明" :clearable="true"></uni-easyinput>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped></style>
