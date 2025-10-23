import { service } from '@/service';
import { useSurveyListStore } from '@/stores/survey_list';
import { useGlobalStore } from '@/stores/global';
import { useGermplasmLisStore } from '@/stores/germplasm_list';
import { usePlantTaskListStore } from '@/stores/plant_task';
import { useSurveyStore } from '@/stores/survey';
import { JSONbig } from '@/utils';

/**
 * 检查是否处于离线状态
 * @returns Promise<boolean> 是否离线
 */
export const isOffline = (): Promise<boolean> => {
  return new Promise(resolve => {
    uni.getNetworkType({
      success: res => {
        // 网络类型为 'none' 表示离线状态
        resolve(res.networkType === 'none');
      },
      fail: () => {
        // 获取网络状态失败，默认认为是离线状态
        resolve(true);
      },
    });
  });
};

export const getAllSyncData = async () => {
  // 在线状态，使用Promise.all并行获取数据
  const res = await Promise.all([getSurveyList(), getAllDictList(), getPlantTaskList(), getCommonPlantsInfo(), getFamilyGenusSpecies(), getAllGermplasmList()]);
  return res;
};
// 常见植物信息
export const getCommonPlantsInfo = async () => {
  const res = await service({
    url: '/app/query/common_plants_info/all',
    method: 'GET',
  });
  if (res.data) {
    const globalStore = useGlobalStore();
    globalStore.setCommonPlantsInfoApi(res.data);
  }
  return res;
};
// 科属种数据
export const getFamilyGenusSpecies = async () => {
  const res = await service({
    url: '/app/query/family_genus/all',
    method: 'GET',
  });
  if (res.data) {
    const globalStore = useGlobalStore();
    globalStore.setFamilyGenusSpeciesApi(res.data);
  }
  return res;
};

/**
 * 获取调查列表
 */
export const getSurveyList = async () => {
  const res = await service({
    url: '/app/investigate/find/ancient_tree/all',
    method: 'GET',
    dataType: 'String',
  });
  if (res.data) {
    let parseData = JSONbig.parse(res.data);
    console.log('古树名木信息', parseData);
    const surveyListStore = useSurveyListStore();
    /*************大数据量测试专用********************/
    // const randomInt = (min: number, max: number): number => {
    //   return Math.floor(Math.random() * (max - min + 1)) + min;
    // };
    // const generateRandomCoordinates = () => {
    //   const longitude = '93.76' + randomInt(0, 9999).toString().padStart(4, '0');
    //   const latitude = '29.23' + randomInt(0, 9999).toString().padStart(4, '0');
    //   return { longitude, latitude };
    // };
    // parseData = [
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    //   ...parseData,
    // ].map(item => {
    //   const latlng = generateRandomCoordinates();
    //   return {
    //     ...item,
    //     location: {
    //       x: latlng.longitude,
    //       y: latlng.latitude,
    //     },
    //   };
    // });
    /*************大数据量测试专用********************/
    surveyListStore.setSurveyList(parseData);
  }
  return res;
};
/**
 * 获取调查列表
 */
export const getPlantTaskList = async () => {
  const res = await service({
    url: '/app/task_manage',
    method: 'GET',
  });
  if (res.data) {
    console.log('移栽任务', res);
    const plantTaskListStore = usePlantTaskListStore();
    plantTaskListStore.setplantTaskList(res.data);
  }
  return res;
};
/**
 * 获取字典列表
 */
export const getAllDictList = async () => {
  const res = await service({
    url: `/common/dict_all`,
    method: 'GET',
  });
  if (res.data) {
    const globalStore = useGlobalStore();
    globalStore.setDictList(res.data);
  }
  return res;
};

export const getAllGermplasmList = async () => {
  const res = await service({
    url: `/app/germplasm_resources_collect`,
    method: 'GET',
    dataType: 'String',
  });
  if (res.data) {
    const germplasmLisStore = useGermplasmLisStore();
    let parseData = JSONbig.parse(res.data);
    germplasmLisStore.setGermplasmListHistory(parseData);
  }
  return res;
};
