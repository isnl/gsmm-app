<script lang="ts" setup>
import { ref, watch } from 'vue';
import MultiSelector from './MultiSelector.vue';
import {
  projectCategoryOptions,
  nonVerificationReasonOptions,
  sandControlMeasureOptions,
  sandBarrierMaterialOptions,
  sandBarrierConfigOptions,
  sandyLandUnqualifiedReasonOptions,
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
  c9: '', // 设计面积
  c10: '', // 核实面积
  c11: '', // 不核实原因
  c12: '', // 治理措施（多选，用+号连接）
  c13: '', // 沙障材料
  c14: '', // 沙障配置
  c15: '', // 沙障规格
  c16: '', // 机械沙障完好率
  c17: '', // 植物沙障保苗率
  c18: '', // 造林树种
  c19: '', // 苗木规格
  c20: '', // 造林密度
  c21: '', // 成活率
  c22: '', // 种草草种
  c23: '', // 播种量
  c24: '', // 植被盖度
  c25: '', // 鲜草产量
  c26: '', // 综合植被盖度
  c27: '', // 合格面积
  c28: '', // 不合格原因（多选，用+号连接）
  c29: '', // 备注
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

        <!-- 设计面积 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">设计面积</text>
          </view>
          <view class="flex items-center gap-10px">
            <view class="flex-1">
              <uni-easyinput v-model="localFormData.c9" type="number" placeholder="按作业设计小班面积填写" :clearable="true"></uni-easyinput>
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
              <uni-easyinput v-model="localFormData.c10" type="number" placeholder="按现地调查结果填写" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">亩</text>
          </view>
        </view>

        <!-- 不核实原因 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">不核实原因</text>
          </view>
          <uni-data-select v-model="localFormData.c11" :localdata="nonVerificationReasonOptions" placeholder="请选择不核实原因"></uni-data-select>
        </view>
      </view>

      <!-- 质量情况 -->
      <view class="mb-30px">
        <view class="mb-15px">
          <text class="text-16px font-bold color-#333">质量情况</text>
        </view>

        <!-- 治理措施 -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">治理措施</text>
          </view>
          <MultiSelector v-model="localFormData.c12" :options="sandControlMeasureOptions" placeholder="可多选，用'+'号连接" />
        </view>

        <!-- 主要调查因子 -->
        <view class="mb-20px">
          <view class="mb-12px">
            <text class="text-15px font-bold color-#333">主要调查因子</text>
          </view>

          <!-- 工程固沙 -->
          <view class="mb-20px pl-15px border-l-2px border-#01bd8d">
            <view class="mb-12px">
              <text class="text-14px font-bold color-#333">工程固沙</text>
            </view>

            <!-- 沙障材料 -->
            <view class="mb-15px">
              <view class="mb-8px">
                <text class="text-14px color-#666">沙障材料</text>
              </view>
              <uni-data-select v-model="localFormData.c13" :localdata="sandBarrierMaterialOptions" placeholder="请选择沙障材料"></uni-data-select>
            </view>

            <!-- 沙障配置 -->
            <view class="mb-15px">
              <view class="mb-8px">
                <text class="text-14px color-#666">沙障配置</text>
              </view>
              <uni-data-select v-model="localFormData.c14" :localdata="sandBarrierConfigOptions" placeholder="请选择沙障配置"></uni-data-select>
            </view>

            <!-- 沙障规格 -->
            <view class="mb-15px">
              <view class="mb-8px">
                <text class="text-14px color-#666">沙障规格</text>
              </view>
              <uni-easyinput v-model="localFormData.c15" placeholder="按现地调查结果填写长×宽，如1m×2m" :clearable="true"></uni-easyinput>
            </view>

            <!-- 机械沙障完好率 -->
            <view class="mb-15px">
              <view class="mb-8px">
                <text class="text-14px color-#666">机械沙障完好率</text>
              </view>
              <view class="flex items-center gap-10px">
                <view class="flex-1">
                  <uni-easyinput v-model="localFormData.c16" type="number" placeholder="按现地调查结果填写" :clearable="true"></uni-easyinput>
                </view>
                <text class="text-14px color-#666">%</text>
              </view>
            </view>

            <!-- 植物沙障保苗率 -->
            <view class="mb-15px">
              <view class="mb-8px">
                <text class="text-14px color-#666">植物沙障保苗率</text>
              </view>
              <view class="flex items-center gap-10px">
                <view class="flex-1">
                  <uni-easyinput v-model="localFormData.c17" type="number" placeholder="按现地调查结果填写" :clearable="true"></uni-easyinput>
                </view>
                <text class="text-14px color-#666">%</text>
              </view>
            </view>
          </view>

          <!-- 人工造林种草 -->
          <view class="mb-20px pl-15px border-l-2px border-#01bd8d">
            <view class="mb-12px">
              <text class="text-14px font-bold color-#333">人工造林种草</text>
            </view>

            <!-- 造林（四级嵌套） -->
            <view class="mb-20px pl-15px border-l-2px border-#666">
              <view class="mb-12px">
                <text class="text-13px font-bold color-#333">造林</text>
              </view>

              <!-- 造林树种 -->
              <view class="mb-15px">
                <view class="mb-8px">
                  <text class="text-14px color-#666">造林树种</text>
                </view>
                <uni-easyinput v-model="localFormData.c18" placeholder="按现地调查结果填写，填最主要的3种" :clearable="true"></uni-easyinput>
              </view>

              <!-- 苗木规格 -->
              <view class="mb-15px">
                <view class="mb-8px">
                  <text class="text-14px color-#666">苗木规格</text>
                </view>
                <uni-easyinput v-model="localFormData.c19" placeholder="填写苗木地径（cm）、苗高（m）等属性" :clearable="true"></uni-easyinput>
              </view>

              <!-- 造林密度 -->
              <view class="mb-15px">
                <view class="mb-8px">
                  <text class="text-14px color-#666">造林密度</text>
                </view>
                <view class="flex items-center gap-10px">
                  <view class="flex-1">
                    <uni-easyinput v-model="localFormData.c20" type="number" placeholder="按现地调查结果填写" :clearable="true"></uni-easyinput>
                  </view>
                  <text class="text-14px color-#666">株/亩</text>
                </view>
              </view>

              <!-- 成活率 -->
              <view class="mb-15px">
                <view class="mb-8px">
                  <text class="text-14px color-#666">成活率</text>
                </view>
                <view class="flex items-center gap-10px">
                  <view class="flex-1">
                    <uni-easyinput v-model="localFormData.c21" type="number" placeholder="按现地调查结果填写" :clearable="true"></uni-easyinput>
                  </view>
                  <text class="text-14px color-#666">%</text>
                </view>
              </view>
            </view>

            <!-- 种草（四级嵌套） -->
            <view class="mb-20px pl-15px border-l-2px border-#666">
              <view class="mb-12px">
                <text class="text-13px font-bold color-#333">种草</text>
              </view>

              <!-- 种草草种 -->
              <view class="mb-15px">
                <view class="mb-8px">
                  <text class="text-14px color-#666">种草草种</text>
                </view>
                <uni-easyinput v-model="localFormData.c22" placeholder="按现地调查结果填写" :clearable="true"></uni-easyinput>
              </view>

              <!-- 播种量 -->
              <view class="mb-15px">
                <view class="mb-8px">
                  <text class="text-14px color-#666">播种量</text>
                </view>
                <view class="flex items-center gap-10px">
                  <view class="flex-1">
                    <uni-easyinput v-model="localFormData.c23" type="number" placeholder="通过查阅资料确定" :clearable="true"></uni-easyinput>
                  </view>
                  <text class="text-14px color-#666">g/hm²</text>
                </view>
              </view>

              <!-- 植被盖度 -->
              <view class="mb-15px">
                <view class="mb-8px">
                  <text class="text-14px color-#666">植被盖度</text>
                </view>
                <view class="flex items-center gap-10px">
                  <view class="flex-1">
                    <uni-easyinput v-model="localFormData.c24" type="number" placeholder="按调查结果填写" :clearable="true"></uni-easyinput>
                  </view>
                  <text class="text-14px color-#666">%</text>
                </view>
              </view>

              <!-- 鲜草产量 -->
              <view class="mb-15px">
                <view class="mb-8px">
                  <text class="text-14px color-#666">鲜草产量</text>
                </view>
                <view class="flex items-center gap-10px">
                  <view class="flex-1">
                    <uni-easyinput v-model="localFormData.c25" type="number" placeholder="按调查结果填写" :clearable="true"></uni-easyinput>
                  </view>
                  <text class="text-14px color-#666">kg/hm²</text>
                </view>
              </view>
            </view>

            <!-- 综合植被盖度 -->
            <view class="mb-15px">
              <view class="mb-8px">
                <text class="text-14px color-#666">综合植被盖度</text>
              </view>
              <view class="flex items-center gap-10px">
                <view class="flex-1">
                  <uni-easyinput v-model="localFormData.c26" type="number" placeholder="按调查结果填写" :clearable="true"></uni-easyinput>
                </view>
                <text class="text-14px color-#666">%</text>
              </view>
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
              <uni-easyinput v-model="localFormData.c27" type="number" placeholder="现地调查未达到合格标准的面积" :clearable="true"></uni-easyinput>
            </view>
            <text class="text-14px color-#666">亩</text>
          </view>
        </view>

        <!-- 不合格原因（多选） -->
        <view class="mb-15px">
          <view class="mb-8px">
            <text class="text-14px color-#666">不合格原因</text>
          </view>
          <MultiSelector v-model="localFormData.c28" :options="sandyLandUnqualifiedReasonOptions" placeholder="可多选，用'+'号连接" />
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
          <uni-easyinput v-model="localFormData.c29" type="textarea" placeholder="对填写'其他'的情况进行说明" :clearable="true"></uni-easyinput>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped></style>
