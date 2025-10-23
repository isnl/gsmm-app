<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import SignatureSelector from '@/components/SignatureSelector.vue';
import { useGlobalStore } from '@/stores/global';
import { useGermplasmLisStore } from '@/stores/germplasm_list';
import { storeToRefs } from 'pinia';

// 定义 props
interface Props {
  currentId: string;
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
}
const props = defineProps<Props>();

// 定义 emits
const emit = defineEmits<{
  'update:formData': [formData: Props['formData']];
}>();

const globalStore = useGlobalStore();
const germplasmLisStore = useGermplasmLisStore();
const { getInfoById, removeGermplasmDetailById } = germplasmLisStore;

const { signatures } = storeToRefs(globalStore);

// 更新表单数据的辅助函数
const updateFormData = (key: string, value: string) => {
  const newFormData = { ...props.formData };
  (newFormData as any)[key] = value;
  emit('update:formData', newFormData);
};

const collectList = computed(() => {
  return getInfoById(props.currentId, props.isHistory)?.details || [];
});

const actionItemOptions = ref([
  {
    text: '删除',
    style: {
      fontSize: '14px',
      backgroundColor: '#F56C6C',
    },
  },
]);

/**
 * 去创建
 */
const goCreateGermplasmResource = () => {
  uni.navigateTo({
    url: `/pages/germplasm_resources_create/index?recordId=${props.currentId}`,
  });
};
/**
 * 去修改
 */
const goEditGermplasmResource = (item: any) => {
  if (props.isHistory) {
    uni.navigateTo({
      url: `/pages/germplasm_resources_create/index?recordId=${props.currentId}&currentId=${item.id}&isHistory=true`,
    });
  } else {
    uni.navigateTo({
      url: `/pages/germplasm_resources_create/index?recordId=${props.currentId}&currentId=${item.tempId}`,
    });
  }
};

const bindClick = (item: any) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除吗？',
    success: res => {
      if (res.confirm) {
        removeGermplasmDetailById(props.currentId, item.tempId);
        uni.showToast({
          title: '删除成功',
          icon: 'success',
        });
      }
    },
  });
};

// 签字相关
const collectorSignatures = ref<(string | any)[]>([]); // 采集人签字（多选，历史数据时可能包含对象）
const recorderSignature = ref<string | any>(''); // 记录人签字（单选，历史数据时可能是对象）

// 签字选择器引用
const collectorSelectorRef = ref();
const recorderSelectorRef = ref();

// 为 SignatureSelector 提供的 collectorSignatures 值（确保始终是字符串数组）
const collectorSignaturesForSelector = computed({
  get: () => {
    // 过滤掉对象（历史数据），只保留字符串ID
    return collectorSignatures.value.filter(item => typeof item === 'string') as string[];
  },
  set: (value: string[]) => {
    collectorSignatures.value = value;
  },
});

// 为 SignatureSelector 提供的 recorderSignature 值（确保始终是字符串）
const recorderSignatureForSelector = computed({
  get: () => {
    // 如果是对象（历史数据），返回空字符串（历史模式下选择器不会被打开）
    if (typeof recorderSignature.value === 'object' && recorderSignature.value) {
      return '';
    }
    return recorderSignature.value;
  },
  set: (value: string) => {
    recorderSignature.value = value;
  },
});

// 获取签字图片
const getSignatureImage = (signatureId: string | any) => {
  // 如果是对象（历史数据），直接返回 url 或 imageUrl
  if (typeof signatureId === 'object' && signatureId) {
    return signatureId.url || signatureId.notCompressedUrl || signatureId.imageUrl || '';
  }
  // 如果是字符串ID，从 signatures store 中查找
  const signature = signatures.value.find(sig => sig.id === signatureId);
  return signature?.imageUrl || '';
};

// 预览签名图片
const previewSignature = (signatureId: string | any) => {
  const imageUrl = getSignatureImage(signatureId);
  if (imageUrl) {
    uni.previewImage({
      urls: [imageUrl],
    });
  }
};

// 打开采集人签字选择
const openCollectorSelector = () => {
  if (props.isHistory) return;
  collectorSelectorRef.value?.open();
};

// 打开记录人签字选择
const openRecorderSelector = () => {
  if (props.isHistory) return;
  recorderSelectorRef.value?.open();
};

// 处理采集人签字确认
const handleCollectorConfirm = (value: string | string[]) => {
  if (Array.isArray(value)) {
    collectorSignatures.value = value;
  }
};

// 处理记录人签字确认
const handleRecorderConfirm = (value: string | string[]) => {
  if (typeof value === 'string') {
    recorderSignature.value = value;
  }
};

// 保存签字数据到 formData
const saveSignaturesToFormData = () => {
  // 将签字ID数组转换为包含id、name、imageUrl的对象数组
  const collectorSignatureData = collectorSignatures.value
    .map(id => {
      const signature = signatures.value.find(sig => sig.id === id);
      return signature
        ? {
            id: signature.id,
            name: signature.name,
            imageUrl: signature.imageUrl,
          }
        : null;
    })
    .filter(Boolean);

  const recorderSignatureData = recorderSignature.value
    ? (() => {
        const signature = signatures.value.find(sig => sig.id === recorderSignature.value);
        return signature
          ? [
              {
                id: signature.id,
                name: signature.name,
                imageUrl: signature.imageUrl,
              },
            ]
          : [];
      })()
    : [];

  // 更新 formData - 直接修改对象属性
  const newFormData = { ...props.formData };
  (newFormData as any).collectorSignature = collectorSignatureData;
  (newFormData as any).recorderSignature = recorderSignatureData;
  emit('update:formData', newFormData);
};

// 初始化签名数据（用于编辑时回显）
const initializeSignatureData = () => {
  const formData = props.formData;

  // 回显采集人签字
  if (formData.collectorSignature && Array.isArray(formData.collectorSignature)) {
    collectorSignatures.value = formData.collectorSignature
      .map((item: any) => {
        // 如果是历史数据对象（包含 url 字段），直接返回整个对象
        if (typeof item === 'object' && item.url) {
          return item;
        }
        // 如果是新格式（包含id、name、imageUrl），直接使用id
        if (typeof item === 'object' && item.id) {
          return item.id;
        }
        // 如果是旧格式（只有imageUrl），尝试通过imageUrl找到对应的签名
        if (typeof item === 'string') {
          const signature = signatures.value.find(sig => sig.imageUrl === item);
          return signature?.id || '';
        }
        return '';
      })
      .filter(Boolean);
  }

  // 回显记录人签字
  if (formData.recorderSignature && Array.isArray(formData.recorderSignature) && formData.recorderSignature.length > 0) {
    const recorderItem = formData.recorderSignature[0];
    // 如果是历史数据对象（包含 url 字段），直接使用整个对象
    if (typeof recorderItem === 'object' && recorderItem.url) {
      recorderSignature.value = recorderItem;
    }
    // 如果是新格式（包含id、name、imageUrl），直接使用id
    else if (typeof recorderItem === 'object' && recorderItem.id) {
      recorderSignature.value = recorderItem.id;
    }
    // 如果是旧格式（只有imageUrl），尝试通过imageUrl找到对应的签名
    else if (typeof recorderItem === 'string') {
      const signature = signatures.value.find(sig => sig.imageUrl === recorderItem);
      recorderSignature.value = signature?.id || '';
    }
  }
};

// 监听formData变化，用于数据回显
watch(
  () => props.formData,
  () => {
    initializeSignatureData();
  },
  { immediate: true, deep: true },
);

// 暴露给父组件调用
defineExpose({
  saveSignaturesToFormData,
});
</script>

<template>
  <view class="w-full pb-10px flex flex-col gap-8px">
    <!-- 种质资源采集列表 -->
    <view class="w-full bg-#fff shadow-[0_5px_12px_1px_rgba(18,62,55,0.06)] rounded-8px">
      <view class="w-full flex items-center p-12px">
        <image src="@/static/images/icons/germplasm.png" mode="widthFix" class="w-16px" />
        <text class="ml-5px text-#333 font-bold text-14px">种质资源采集列表</text>
        <view class="ml-auto w-25px h-25px bg-#08bd92 rounded-4px fc" @click="goCreateGermplasmResource" v-if="!isHistory">
          <uni-icons type="plusempty" size="20" class="font-bold" color="#fff"></uni-icons>
        </view>
      </view>
      <!-- 列表展示 -->
      <view class="w-full p-12px">
        <uni-swipe-action>
          <template v-if="collectList.length">
            <uni-swipe-action-item
              :threshold="0"
              :right-options="isHistory ? [] : actionItemOptions"
              @click="bindClick(item)"
              v-for="item in collectList"
              :key="item.tempId"
            >
              <view class="w-full h-45px flex items-center justify-between b-b-(1px solid #f2f2f2)" @click="goEditGermplasmResource(item)">
                <text class="text-#333">{{ item.germplasmType }} {{ item.germplasmResourcesCode }}</text>
                <text class="iconfont icon-play text-#474d5a"></text>
              </view>
            </uni-swipe-action-item>
          </template>
          <view class="w-full h-45px flex items-center justify-between" v-else @click="goCreateGermplasmResource">
            <text class="text-#a5a3b1">去创建</text>
            <text class="iconfont icon-play text-#474d5a"></text>
          </view>
        </uni-swipe-action>
      </view>

      <view class="px-12px bg-[rgba(189,8,8,0.1)] rounded-b-8px text-14px text-#516280" v-if="collectList.length && !isHistory"> 注： 左滑删除信息 </view>
    </view>

    <!-- 签字确认 -->
    <view class="w-full bg-#fff shadow-[0_5px_12px_1px_rgba(18,62,55,0.06)] rounded-8px p-12px">
      <view class="w-full h-45px flex items-center justify-between gap-100px b-b-(1px solid #f2f2f2)">
        <text class="text-#333">签字日期</text>
        <uni-datetime-picker
          :modelValue="formData.signatureDate"
          :disabled="isHistory"
          @change="(value: string) => updateFormData('signatureDate', value)"
          type="date"
          placeholder="请选择采集日期"
          :clear-icon="false"
        />
      </view>
      <view class="w-full min-h-45px flex flex-col b-b-(1px solid #f2f2f2)">
        <view class="w-full h-45px flex items-center justify-between" @click="openCollectorSelector">
          <text class="text-#333">采集人签字</text>
          <view class="flex items-center gap-8px" v-if="!isHistory">
            <text :class="['text-14px', collectorSignatures.length > 0 ? 'text-#08bd92' : 'text-#999']">
              {{ collectorSignatures.length > 0 ? `已选择${collectorSignatures.length}个签字` : '请选择采集人签字' }}
            </text>
            <text class="iconfont icon-play text-#474d5a"></text>
          </view>
        </view>
        <!-- 采集人签字图片显示 -->
        <view class="w-full flex flex-wrap gap-8px pb-12px" v-if="collectorSignatures.length > 0">
          <view
            v-for="signatureId in collectorSignatures"
            :key="typeof signatureId === 'object' ? signatureId.id : signatureId"
            class="w-80px h-40px border-(1px solid #e5e5e5) rounded-4px overflow-hidden"
            @click="previewSignature(signatureId)"
          >
            <image :src="getSignatureImage(signatureId)" mode="aspectFit" class="w-full h-full" />
          </view>
        </view>
      </view>
      <view class="w-full min-h-45px flex flex-col">
        <view class="w-full h-45px flex items-center justify-between" @click="openRecorderSelector">
          <text class="text-#333">记录人签字</text>
          <view class="flex items-center gap-8px" v-if="!isHistory">
            <text :class="['text-14px', recorderSignature ? 'text-#08bd92' : 'text-#999']">
              {{ recorderSignature ? '已选择签字' : '请选择记录人签字' }}
            </text>
            <text class="iconfont icon-play text-#474d5a"></text>
          </view>
        </view>
        <!-- 记录人签字图片显示 -->
        <view class="w-full pb-12px" v-if="recorderSignature">
          <view class="w-80px h-40px border-(1px solid #e5e5e5) rounded-4px overflow-hidden" @click="previewSignature(recorderSignature)">
            <image :src="getSignatureImage(recorderSignature)" mode="aspectFit" class="w-full h-full" />
          </view>
        </view>
      </view>
    </view>

    <!-- 签字选择器 -->
    <SignatureSelector
      ref="collectorSelectorRef"
      v-model="collectorSignaturesForSelector"
      :multiple="true"
      title="选择采集人签字"
      @confirm="handleCollectorConfirm"
    />

    <SignatureSelector
      ref="recorderSelectorRef"
      v-model="recorderSignatureForSelector"
      :multiple="false"
      title="选择记录人签字"
      @confirm="handleRecorderConfirm"
    />
  </view>
</template>
