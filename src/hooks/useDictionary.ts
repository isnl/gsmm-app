import { ref, onMounted } from 'vue';
import type { Ref } from 'vue';
import { service } from '@/service';
import { onLoad } from '@dcloudio/uni-app';

// 字典项类型定义
export interface DictionaryItem {
  id: number;
  key: string;
  value: string;
  description?: string;
}

export interface DictionaryItem {
  key: string;
  value: string;
}

export interface SelectorItem {
  text: string;
  value: string;
  checked?: boolean;
}

/**
 * 获取系统字典的自定义Hook
 * @param code 字典编码
 * @param immediate 是否立即加载，默认为true
 * @returns 包含字典数据和加载状态的对象
 */
export function useDictionary(code: string, immediate = true) {
  // 字典数据
  const dictionary: Ref<SelectorItem[]> = ref([]);
  // 加载状态
  const loading = ref(false);
  // 错误信息
  const error = ref<string | null>(null);

  /**
   * 获取字典数据
   */
  const fetchDictionary = async () => {
    if (!code) {
      error.value = '字典编码不能为空';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await service<DictionaryItem[]>({
        url: '/common/dict',
        params: { code },
        method: 'GET',
      });

      if (response.statusCode === 200 && response.data) {
        dictionary.value = (response.data || []).map(item => ({
          text: item.key,
          value: item.value,
        }));
      } else {
        error.value = '获取字典数据失败';
      }
    } catch (err) {
      console.error('获取字典数据出错:', err);
      error.value = '获取字典数据出错';
    } finally {
      loading.value = false;
    }
  };

  // 如果设置了立即加载，则在组件挂载时获取字典数据
  if (immediate) {
    onLoad(fetchDictionary);
  }

  return {
    dictionary,
    loading,
    error,
  };
}
