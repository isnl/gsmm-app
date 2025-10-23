<script lang="ts" setup>
import { ref } from 'vue';
import { useGlobalStore } from '@/stores/global';
import { useGermplasmStore } from '@/stores/germplasm';
import { storeToRefs } from 'pinia';
import TagSelectorPopup from '@/components/TagSelectorPopup.vue';

// 定义 props
interface Props {
  formData: {
    codeNumber: string;
    collectTime: string;
    weather: string;
    collectTeam: string;
    collectPersonnel: string;
    parentHealthStatus?: string;
    hasPestsDiseases?: string;
    phenotypeDescription?: string;
    communityEnvironment?: string;
    [key: string]: any;
  };
  isHistory: boolean;
  historyInfo: {
    treeCode: string; // 古树编号
    codeNumber: string; // 挂牌编号
    family: string; // 科
    genus: string; // 属
    treeSpecies: string; // 树种
    latinName: string;
  };
}

const props = defineProps<Props>();

// 定义 emits
const emit = defineEmits<{
  'update:formData': [formData: Props['formData']];
}>();

const globalStore = useGlobalStore();
const germplasmStore = useGermplasmStore();
const { healthStatusDict } = storeToRefs(globalStore);
const { lastInputs } = storeToRefs(germplasmStore);

// 病虫害选项
const pestDiseaseOptions = ref([{ text: '无', value: '无', key: '无' }]);

// 弹窗控制
const healthStatusPopup = ref(false);
const pestDiseasePopup = ref(false);

// 弹窗引用
const healthStatusPopupRef = ref<any>(null);
const pestDiseasePopupRef = ref<any>(null);

// 打开健康状况选择弹窗
const openHealthStatusPopup = () => {
  if (props.isHistory) return;
  healthStatusPopup.value = true;
  healthStatusPopupRef.value?.open('bottom');
};

// 打开病虫害选择弹窗
const openPestDiseasePopup = () => {
  if (props.isHistory) return;
  pestDiseasePopup.value = true;
  pestDiseasePopupRef.value?.open('bottom');
};

// 更新表单数据的辅助函数
const updateFormData = (key: string, value: string) => {
  const newFormData = { ...props.formData };
  (newFormData as any)[key] = value;
  emit('update:formData', newFormData);
};

// 健康状况确认
const onHealthStatusConfirm = (value: string) => {
  updateFormData('parentHealthStatus', value);
  healthStatusPopup.value = false;
};

// 健康状况关闭
const onHealthStatusClose = () => {
  healthStatusPopup.value = false;
};

// 病虫害确认
const onPestDiseaseConfirm = (value: string) => {
  updateFormData('hasPestsDiseases', value);
  pestDiseasePopup.value = false;
};

// 病虫害关闭
const onPestDiseaseClose = () => {
  pestDiseasePopup.value = false;
};

// 快速填写应用
const applyLastInputValue = (key: string, value: string) => {
  updateFormData(key, value);
};

// 保存表单数据到store（在保存/完成调查时调用）
const saveFormDataToStore = () => {
  const newInputs: Record<string, string> = {};
  if (props.formData.hasPestsDiseases && props.formData.hasPestsDiseases.trim()) {
    newInputs.hasPestsDiseases = props.formData.hasPestsDiseases.trim();
  }
  if (props.formData.phenotypeDescription && props.formData.phenotypeDescription.trim()) {
    newInputs.phenotypeDescription = props.formData.phenotypeDescription.trim();
  }
  if (Object.keys(newInputs).length > 0) {
    germplasmStore.setLastInputs(newInputs);
  }
};

// 暴露给父组件调用
defineExpose({
  saveFormDataToStore,
});
</script>

<template>
  <view class="w-full px-15px pb-10px bg-#fff rounded-8px">
    <!-- 不可修改的基本信息 -->
    <uni-forms-item label="古树编号" class="!mb-0">
      <view class="flex-1 h-full flex items-center">
        <text class="text-#666">{{ historyInfo.treeCode ? historyInfo.treeCode : '' }}</text>
      </view>
    </uni-forms-item>

    <uni-forms-item label="挂牌编号" class="!mb-0">
      <view class="flex-1 h-full flex items-center">
        <text class="text-#666">{{ historyInfo.codeNumber ? historyInfo.codeNumber : '' }}</text>
      </view>
    </uni-forms-item>

    <uni-forms-item label="科" class="!mb-0">
      <view class="flex-1 h-full flex items-center">
        <text class="text-#666">{{ historyInfo.family ? historyInfo.family : '' }}</text>
      </view>
    </uni-forms-item>

    <uni-forms-item label="属" class="!mb-0">
      <view class="flex-1 h-full flex items-center">
        <text class="text-#666">{{ historyInfo.genus ? historyInfo.genus : '' }}</text>
      </view>
    </uni-forms-item>

    <uni-forms-item label="树种" class="!mb-0">
      <view class="flex-1 h-full flex items-center">
        <text class="text-#666">{{ historyInfo.treeSpecies ? historyInfo.treeSpecies : '' }}</text>
      </view>
    </uni-forms-item>

    <uni-forms-item label="拉丁学名" class="!mb-0">
      <view class="flex-1 h-full flex items-center">
        <text class="text-#666">{{ historyInfo.latinName ? historyInfo.latinName : '' }}</text>
      </view>
    </uni-forms-item>
    <!-- 健康状况 -->
    <uni-forms-item label="健康状况" name="parentHealthStatus" required class="!mb-20px">
      <view
        class="flex b-(1px solid #e5e5e5) items-center justify-between px-12px py-8px rounded-4px cursor-pointer"
        :class="isHistory ? 'bg-#F7F6F6' : 'bg-#fff'"
        @click="openHealthStatusPopup"
      >
        <text class="text-14px" :class="!props.formData.parentHealthStatus || isHistory ? 'text-#d5d5d5' : 'text-#333'">
          {{ props.formData.parentHealthStatus || '请选择健康状况' }}
        </text>
        <uni-icons type="right" size="16" color="#c0c4cc"></uni-icons>
      </view>
    </uni-forms-item>

    <!-- 病虫害 -->
    <uni-forms-item label="病虫害" name="hasPestsDiseases" class="!mb-20px" required>
      <view
        class="flex b-(1px solid #e5e5e5) items-center justify-between px-12px py-8px rounded-4px cursor-pointer"
        :class="isHistory ? 'bg-#F7F6F6' : 'bg-#fff'"
        @click="openPestDiseasePopup"
      >
        <text class="text-14px" :class="!props.formData.hasPestsDiseases || isHistory ? 'text-#d5d5d5' : 'text-#333'">
          {{ props.formData.hasPestsDiseases || '请选择或输入病虫害情况' }}
        </text>
        <uni-icons type="right" size="16" color="#c0c4cc"></uni-icons>
      </view>
    </uni-forms-item>
    <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputs.hasPestsDiseases && !isHistory" required>
      <text>病虫害上次输入：</text>
      <view class="flex-1 textEllipsis">{{ lastInputs.hasPestsDiseases }}</view>
      <button class="w-60px h-25px fc text-#fff bgPrimary text-12px" @click="applyLastInputValue('hasPestsDiseases', lastInputs.hasPestsDiseases)">应用</button>
    </view>

    <!-- 表型特征描述 -->
    <uni-forms-item label="表型特征" name="phenotypeDescription" class="!mb-20px" required>
      <uni-easyinput
        :disabled="isHistory"
        :value="props.formData.phenotypeDescription"
        @input="(value: string) => updateFormData('phenotypeDescription', value)"
        type="textarea"
        placeholder="请输入表型特征描述"
        :clearable="false"
        maxlength="500"
      />
    </uni-forms-item>
    <view class="w-full flex items-center text-12px text-#888 mb-10px" v-if="lastInputs.phenotypeDescription && !isHistory">
      <text>表型特征描述上次输入：</text>
      <view class="flex-1 textEllipsis">{{ lastInputs.phenotypeDescription }}</view>
      <button class="w-60px h-25px fc text-#fff bgPrimary text-12px" @click="applyLastInputValue('phenotypeDescription', lastInputs.phenotypeDescription)">
        应用
      </button>
    </view>

    <!-- 健康状况选择弹窗 -->
    <uni-popup ref="healthStatusPopupRef" type="bottom" background-color="transparent" @change="(e: any) => (healthStatusPopup = e.show)">
      <TagSelectorPopup
        title="健康状况"
        :options="healthStatusDict"
        :model-value="props.formData.parentHealthStatus"
        placeholder="请选择健康状况"
        :allow-custom="false"
        @confirm="onHealthStatusConfirm"
        @close="onHealthStatusClose"
      />
    </uni-popup>

    <!-- 病虫害选择弹窗 -->
    <uni-popup ref="pestDiseasePopupRef" type="bottom" background-color="transparent" @change="(e: any) => (pestDiseasePopup = e.show)">
      <TagSelectorPopup
        title="病虫害"
        :options="pestDiseaseOptions"
        :model-value="props.formData.hasPestsDiseases"
        placeholder="若有，请简述"
        :allow-custom="true"
        :max-custom-length="20"
        @confirm="onPestDiseaseConfirm"
        @close="onPestDiseaseClose"
      />
    </uni-popup>
  </view>
</template>
