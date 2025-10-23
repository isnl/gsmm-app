import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { UniStorage } from './storage';
// 字典
import districtStaticData from './district.json';
// 行政区 geomtry
import defaultDictList from './dictionary.json';
// 常见植物信息
import commonPlantsInfoJson from './common_plants_info.json';
// 科属种
import familyGenusSpeciesJson from './family_genus_species.json';

import type { TaxonomyNode } from '@/types/family-genus-species';
import type { CommonPlantsInfo } from '@/types/common-plants';

interface DistrictInfo {
  children?: DistrictInfo[];
  code: string;
  geom: any; // geometry 类型，如果有专门的类型可以替换
  name: string;
  pcode: string;
}

interface DistrictInfoWithoutGeom {
  children?: DistrictInfoWithoutGeom[];
  code: string;
  name: string;
  pcode: string;
}

interface DistrictInfoWithLabelValue {
  children?: DistrictInfoWithLabelValue[];
  value: string;
  label: string;
  pcode: string;
  geom?: any; // 可选的geometry属性
}

interface ApiOneDictItem {
  id: number;
  name: string;
  code: string;
  dictList: DictItem[];
}

interface DictItem {
  diId: number;
  key: string;
  value: string;
  text?: string;
}

export interface SignatureItem {
  id: string;
  name: string;
  imageUrl: string;
}

export const useGlobalStore = defineStore(
  'global',
  () => {
    const randomFillStatus = ref(false);
    const setRandomFillStatus = (status: boolean) => {
      randomFillStatus.value = status;
    };

    // API 配置
    const apiAddress = ref('');
    const setApiAddress = (address: string) => {
      apiAddress.value = address;
    };

    const dataSyncUploadTime = ref<number>(0);
    const setDataSyncUploadTime = (nowTime?: number) => {
      dataSyncUploadTime.value = nowTime ? nowTime : Date.now();
    };

    const dataSyncDownloadTime = ref<number>(0);
    const setDataSyncDownloadTime = (nowTime?: number) => {
      dataSyncDownloadTime.value = nowTime ? nowTime : Date.now();
    };

    const dataSyncResultDownloadTime = ref<number>(0);
    const setDataSyncResultDownloadTime = (nowTime?: number) => {
      dataSyncResultDownloadTime.value = nowTime ? nowTime : Date.now();
    };

    const districtInfo = ref<DistrictInfo[]>([districtStaticData]);
    const setDistrictInfo = (info: DistrictInfo) => {
      districtInfo.value = [info];
    };

    // 上次输入的组员
    const lastInputTeamValue = ref('');
    // 上次输入的坡度
    const lastInputSlope = ref('');
    // 上次输入的坡向
    const lastInputAspect = ref('');
    // 上次输入的坡位
    const lastInputSlopePosition = ref('');
    // 上次输入的批次
    const lastInputBatchValue = ref('');
    // 上次输入的海拔
    const lastInputAltitude = ref('');

    /**
     * 缓存上次输入的数据
     */
    const setLastInputValue = ({
      team,
      slope,
      aspect,
      slopePosition,
      batch,
      altitude,
    }: {
      team: string;
      slope: string;
      aspect: string;
      slopePosition: string;
      batch: string;
      altitude: string;
    }) => {
      lastInputTeamValue.value = team;
      lastInputSlope.value = slope;
      lastInputAspect.value = aspect;
      lastInputSlopePosition.value = slopePosition;
      lastInputBatchValue.value = batch;
      lastInputAltitude.value = altitude;
    };

    const lastCodeNumberFirstValue = ref('');
    const setLastCodeNumberFirstValue = (value: string) => {
      lastCodeNumberFirstValue.value = value;
    };

    // 所有字典
    const allDictList = ref<ApiOneDictItem[]>([]);
    const setDictList = (list: ApiOneDictItem[]) => {
      allDictList.value = list.map(item => {
        return {
          ...item,
          dictList: item.dictList.map(dict => {
            return {
              ...dict,
              text: dict.key,
            };
          }),
        };
      });
    };

    /**
     * 应用程序初始化，加载字典内容
     * 内置 or 同步数据的缓存内容
     */
    const setDefaultDictList = () => {
      if (!allDictList.value.length) {
        setDictList([...defaultDictList]);
      }
    };

    /**
     * 获取字典列表的公共方法
     * @param code 字典代码
     * @returns 对应字典的 dictList
     */
    const getDictListByCode = (code: string) => {
      const dictItem = allDictList.value.find(item => item.code === code);
      if (dictItem && dictItem.dictList && dictItem.dictList.length > 0) {
        return dictItem.dictList;
      }

      // 如果在 allDictList 中没找到，尝试从 defaultDictList 中查找
      const defaultItem = defaultDictList.find(item => item.code === code);
      if (defaultItem && defaultItem.dictList) {
        return defaultItem.dictList.map(dict => ({
          ...dict,
          text: dict.key,
        }));
      }

      return [];
    };

    // 生长势字典
    const healthStatusDict = computed(() => {
      return getDictListByCode('szs');
    });

    // 古树名木保护等级字典
    const protectionLevelDict = computed(() => {
      return getDictListByCode('gsmmbhdj');
    });

    // 批次字典
    const batchDict = computed(() => {
      return getDictListByCode('batch');
    });

    // 保护类型字典
    const protectionTypeDict = computed(() => {
      return getDictListByCode('zwbhlx');
    });

    // 移栽方案字典
    const transplantPlanDict = computed(() => {
      return getDictListByCode('yizaifangan');
    });

    // 生长环境字典
    const growthEnvironmentDict = computed(() => {
      return getDictListByCode('szhjfj');
    });

    // 土壤类型字典
    const soilTextureDict = computed(() => {
      return getDictListByCode('trlx');
    });

    // 坡度字典
    const slopeDict = computed(() => {
      return getDictListByCode('pdhfbz');
    });

    // 坡向字典
    const aspectDict = computed(() => {
      return getDictListByCode('pxhfbz');
    });

    // 坡位字典
    const slopePositionDict = computed(() => {
      return getDictListByCode('pw');
    });

    // 现有保护措施字典
    const protectionMeasureTypeDict = computed(() => {
      return getDictListByCode('bhcs');
    });

    // 科字典
    const familyDict = computed(() => {
      return getDictListByCode('Family');
    });

    // 属字典
    const genusDict = computed(() => {
      return getDictListByCode('genus');
    });

    // 不可移植原因字典
    const nonPortableReasonDict = computed(() => {
      return getDictListByCode('nonPortableReason');
    });

    // 测量维度字典
    const measurementDimensionTypeDict = computed(() => {
      return getDictListByCode('measurementDimensionType');
    });

    // 地貌字典
    const landformDict = computed(() => {
      return getDictListByCode('dimao');
    });

    // 种质资源相关字典
    // 资源类型字典
    const germplasmResourceTypeDict = computed(() => {
      return getDictListByCode('zzzy_zylx');
    });

    // 采集方式字典
    const germplasmCollectionMethodDict = computed(() => {
      return getDictListByCode('zzzy_cjfs');
    });

    // 采集单位字典
    const germplasmCollectionUnitDict = computed(() => {
      return getDictListByCode('zzzy_cjdw');
    });

    // 质量评估字典
    const germplasmQualityAssessmentDict = computed(() => {
      return getDictListByCode('zzzy_zlpg');
    });

    // 成熟度字典
    const germplasmMaturityDict = computed(() => {
      return getDictListByCode('zzzy_csd');
    });

    // 病虫害字典
    const germplasmPestDiseaseDict = computed(() => {
      return getDictListByCode('zzzy_bch');
    });

    // 初步处理字典
    const germplasmInitialProcessingDict = computed(() => {
      return getDictListByCode('zzzy_cbcl');
    });

    // 封装容器字典
    const germplasmPackagingContainerDict = computed(() => {
      return getDictListByCode('zzzy_fzrq');
    });

    // 天气状况字典
    const weatherDict = computed(() => {
      return getDictListByCode('zzzy_weather');
    });

    const districtInfoWithLabelValueGeom = computed(() => {
      const transformToLabelValue = (districts: DistrictInfo[]): DistrictInfoWithLabelValue[] => {
        return districts.map(district => {
          const { name, code, children, pcode, geom } = district;
          return {
            label: name,
            value: code,
            pcode,
            geom,
            ...(children ? { children: transformToLabelValue(children) } : {}),
          };
        });
      };

      return transformToLabelValue(districtInfo.value);
    });

    const districtInfoWithLabelValue = computed(() => {
      const transformToLabelValue = (districts: DistrictInfo[]): DistrictInfoWithLabelValue[] => {
        return districts.map(district => {
          const { name, code, children, pcode } = district;
          return {
            label: name,
            value: code,
            pcode,
            ...(children ? { children: transformToLabelValue(children) } : {}),
          };
        });
      };

      return transformToLabelValue(districtInfo.value);
    });

    // 常见植物信息
    const commonPlantsInfoByApi = ref<CommonPlantsInfo[]>();
    // 优先取 api 获取到的常见植物信息，没有再用默认值
    const commonPlantsInfo = computed(() => {
      return commonPlantsInfoByApi.value || commonPlantsInfoJson;
    });
    const setCommonPlantsInfoApi = (info: CommonPlantsInfo[]) => {
      commonPlantsInfoByApi.value = info;
    };

    // 科属种
    const familyGenusSpeciesByApi = ref<TaxonomyNode[]>();
    const familyGenusSpecies = computed(() => {
      return familyGenusSpeciesByApi.value || familyGenusSpeciesJson;
    });

    const setFamilyGenusSpeciesApi = (info: TaxonomyNode[]) => {
      familyGenusSpeciesByApi.value = info;
    };

    // 签名管理
    const signatures = ref<SignatureItem[]>([]);

    const addSignature = (signature: Omit<SignatureItem, 'id'>) => {
      const newSignature: SignatureItem = {
        ...signature,
        id: Date.now().toString(),
      };
      signatures.value.push(newSignature);
    };

    const deleteSignature = (id: string) => {
      const index = signatures.value.findIndex(sig => sig.id === id);
      if (index > -1) {
        signatures.value.splice(index, 1);
      }
    };

    // 树种类型
    const TREE_TYPES = computed<
      {
        text: string;
        value: string;
        code: string;
      }[]
    >(() => {
      return commonPlantsInfo.value.map(item => ({ text: item.type, value: item.type, code: item.treeCode }));
    });

    return {
      dataSyncUploadTime,
      setDataSyncUploadTime,
      dataSyncDownloadTime,
      setDataSyncDownloadTime,
      dataSyncResultDownloadTime,
      setDataSyncResultDownloadTime,
      districtInfo,
      setDistrictInfo,
      districtInfoWithLabelValueGeom,
      districtInfoWithLabelValue,
      allDictList,
      setDictList,
      setDefaultDictList,
      getDictListByCode,
      lastInputTeamValue,
      lastInputSlope,
      lastInputAspect,
      lastInputSlopePosition,
      lastInputBatchValue,
      lastInputAltitude,
      lastCodeNumberFirstValue,
      setLastInputValue,
      setLastCodeNumberFirstValue,
      // 导出字典计算属性
      healthStatusDict,
      protectionLevelDict,
      batchDict,
      protectionTypeDict,
      transplantPlanDict,
      growthEnvironmentDict,
      soilTextureDict,
      slopeDict,
      aspectDict,
      slopePositionDict,
      protectionMeasureTypeDict,
      familyDict,
      genusDict,
      nonPortableReasonDict,
      measurementDimensionTypeDict,
      landformDict,
      commonPlantsInfo,
      setCommonPlantsInfoApi,
      familyGenusSpecies,
      setFamilyGenusSpeciesApi,
      TREE_TYPES,
      randomFillStatus,
      setRandomFillStatus,
      apiAddress,
      setApiAddress,
      // 种质资源相关字典
      germplasmResourceTypeDict,
      germplasmCollectionMethodDict,
      germplasmCollectionUnitDict,
      germplasmQualityAssessmentDict,
      germplasmMaturityDict,
      germplasmPestDiseaseDict,
      germplasmInitialProcessingDict,
      germplasmPackagingContainerDict,
      weatherDict,
      // 签名管理
      signatures,
      addSignature,
      deleteSignature,
    };
  },
  {
    persist: {
      storage: UniStorage,
      key: 'tree_global',
    },
  },
);
