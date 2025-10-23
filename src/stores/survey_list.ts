import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { UniStorage } from './storage';
import { formatInvestigateStatus } from '@/utils';

export interface Coordinate {
  x: number;
  y: number;
}
// {
//   "treeSpecies": {
//     "type": "string",
//     "description": "树种名称",
//     "minLength": 1
//   },
//   "treeCode": {
//     "type": "string",
//     "description": "古树唯一编号",
//     "minLength": 1
//   },
//   "commonName": {
//     "type": "string",
//     "description": "俗名/当地俗称"
//   },
//   "latinName": {
//     "type": "string",
//     "description": "拉丁学名"
//   },
//   "family": {
//     "type": "string",
//     "description": "科"
//   },
//   "genus": {
//     "type": "string",
//     "description": "属"
//   },
//   "estimatedAge": {
//     "type": "integer",
//     "format": "int32",
//     "description": "估测树龄(年)"
//   },
//   "ownershipUnit": {
//     "type": "string",
//     "description": "权属单位/管理单位"
//   },
//   "location": {
//     "$ref": "#/components/schemas/Coordinate",
//     "description": "纬度经度坐标"
//   },
//   "healthStatus": {
//     "type": "string",
//     "description": "生长势(优/良/中/差)"
//   },
//   "multimedia": {
//     "type": "array",
//     "description": "多媒体资料JSON数组，存储A路径",
//     "items": {
//       "type": "string",
//       "format": "binary"
//     }
//   },
//   "growthEnvironment": {
//     "type": "string",
//     "description": "生长环境详细描述"
//   },
//   "historicalAnecdotes": {
//     "type": "string",
//     "description": "历史典故/传说"
//   },
//   "treeHeight": {
//     "type": "number",
//     "format": "double",
//     "description": "树高(米)"
//   },
//   "diameterAtBreastHeight": {
//     "type": "number",
//     "format": "double",
//     "description": "胸径(厘米)"
//   },
//   "protectionLevel": {
//     "type": "string",
//     "description": "保护等级(一级/二级/三级)"
//   },
//   "isRareSpecies": {
//     "type": "boolean",
//     "description": "是否稀有物种"
//   },
//   "discoveryDate": {
//     "type": "string",
//     "format": "date",
//     "description": "发现/登记日期"
//   },
//   "deleted": {
//     "type": "boolean",
//     "description": "软删除标记"
//   },
//   "areaCode": {
//     "type": "string",
//     "description": "所属行政区划代码"
//   },
//   "batch": {
//     "type": "string",
//     "description": "批次"
//   },
//   "investigatorId": {
//     "type": "integer",
//     "format": "int64",
//     "description": "调查人员ID"
//   },
//   "area": {
//     "type": "number",
//     "description": "分布面积(平方米)"
//   },
//   "quantity": {
//     "type": "integer",
//     "format": "int32",
//     "description": "数量(株)"
//   },
//   "town": {
//     "type": "string",
//     "description": "乡（镇）"
//   },
//   "village": {
//     "type": "string",
//     "description": "村"
//   },
//   "smallPlaceName": {
//     "type": "string",
//     "description": "小地名"
//   },
//   "altitude": {
//     "type": "number",
//     "description": "海拔(米)"
//   },
//   "protectionType": {
//     "type": "string",
//     "description": "植物保护类型/等级(例：保护植物/国家Ⅰ级保护植物)"
//   },
//   "crownWidth": {
//     "type": "number",
//     "description": "冠幅(米)"
//   },
//   "underBranchHeight": {
//     "type": "number",
//     "description": "枝下高(米)"
//   },
//   "baseDiameter": {
//     "type": "number",
//     "description": "地径(厘米)"
//   },
//   "landType": {
//     "type": "string",
//     "description": "地类"
//   },
//   "soilTexture": {
//     "type": "string",
//     "description": "土壤类型"
//   },
//   "slope": {
//     "type": "string",
//     "description": "坡度(平坡/缓坡)"
//   },
//   "aspect": {
//     "type": "string",
//     "description": "坡向(度)"
//   },
//   "slopePosition": {
//     "type": "string",
//     "description": "坡位(河谷平地/下坡位等)"
//   },
//   "relocationPlace": {
//     "type": "string",
//     "description": "迁出地"
//   },
//   "siteConditionDesc": {
//     "type": "string",
//     "description": "立地条件描述"
//   },
//   "protectionMeasureType": {
//     "type": "string",
//     "description": "现有保护措施(迁地保护/就地保护)"
//   },
//   "relocationProtection": {
//     "type": "string",
//     "description": "迁地保护/就地保护技术措施"
//   },
//   "managementMeasures": {
//     "type": "string",
//     "description": "管护措施"
//   },
//   "projectSchedule": {
//     "type": "string",
//     "description": "工程进度安排"
//   },
//   "laborStatistics": {
//     "type": "string",
//     "description": "用工量统计"
//   },
//   "investmentEstimate": {
//     "type": "number",
//     "description": "投资概算(元)"
//   },
//   "attributes": {
//     "$ref": "#/components/schemas/JsonNode",
//     "description": "动态字段JSON对象"
//   },
//   "finishDate": {
//     "type": "string",
//     "format": "date-time"
//   }
// }
export interface Multimedia {
  id: number;
  url: string;
  path: string;
  type: string;
  createdAt: string;
  updatedAt: string | null;

  tempFilePath?: string;
  fileType?: string;
  size?: number;
  thumbTempFilePath?: string;
}

export interface Survey {
  id?: number;
  tempId?: string;
  createdAt: string;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
  type: string | null;
  treeSpecies: string;
  treeCode: string;
  codeNumber: string;
  commonName: string | null;
  latinName: string | null;
  family: string | null;
  familyValue: string | null;
  genus: string | null;
  familyGenus: string | null;
  species: string | null;
  estimatedAge: number | null;
  ownershipUnit: string | null;
  location: Coordinate;
  healthStatus: string | null;
  multimedia?: Multimedia[];
  growthEnvironment: string | null;
  historicalAnecdotes: string | null;
  treeHeight: number | null;
  diameterAtBreastHeight: number | null;
  protectionLevel: string | null;
  isRareSpecies: boolean | string | null;
  discoveryDate: string | null;
  deleted: boolean;
  batch: string;
  soilLayerThickness?: string | number; // 土层厚度(厘米)
  landParcelsName?: string; // 地块名称
  investigatorId: number | null;
  investigatorName: string;
  isInvestigate: string;
  area: number | null;
  quantity: number | null;
  town: string | null;
  village: string | null;
  smallPlaceName: string | null;
  altitude: number | null;
  protectionType: string | null;
  crownWidth: number | null;
  underBranchHeight: number | null;
  baseDiameter: number | null;
  landType: string | null;
  soilTexture: string | null;
  landform: string | null;
  slope: string | null;
  aspect: string | null;
  slopePosition: string | null;
  relocationPlace: string | null;
  siteConditionDesc: string | null;
  protectionMeasureType: string | null;
  team: string | null;
  relocationProtection: string | null;
  managementMeasures: string | null;
  projectSchedule: string | null;
  laborStatistics: string | null;
  investmentEstimate: number | null;
  transplantPlan: string | null;
  measurementDimensionType: string | null;
  measurementInfo: string | null;
  // 新增预估字段
  measurementInfoEstimate: string | number | null;
  measurementDimensionTypeEstimate: string | null;
  specs: string | null;
  isTransplant: string | null;
  notTransplant: string | null;
  areaName: string;
  areaCode: string;
  attributes: Record<string, any> | null;
  investigateStatus: string;
  remarks: string | null; // 备注
  finishDate?: string;
  updateDate?: string;
}

export const useSurveyListStore = defineStore(
  'survey_list',
  () => {
    const surveyList = ref<Survey[]>([]);

    const setSurveyList = (list: Survey[]) => {
      surveyList.value = Array.isArray(list) ? list : [];
    };

    const addNewSurvey = (survey: Survey) => {
      surveyList.value.push(survey);
    };
    const removeSurvey = (id: number | string, type: 'tempId' | 'id') => {
      let findIndex = -1;
      if (type === 'tempId') {
        findIndex = surveyList.value.findIndex(item => item.tempId && item.tempId === id);
      } else if (type === 'id') {
        findIndex = surveyList.value.findIndex(item => item.id && item.id === id);
      }
      if (findIndex > -1) {
        surveyList.value.splice(findIndex, 1);
      }
    };

    const updateSurvey = (survey: Survey, type: 'tempId' | 'id') => {
      let findIndex = -1;
      if (type === 'tempId') {
        findIndex = surveyList.value.findIndex(item => item.tempId && item.tempId === survey.tempId);
      } else if (type === 'id') {
        findIndex = surveyList.value.findIndex(item => item.id && item.id === survey.id);
      }
      if (findIndex > -1) {
        surveyList.value[findIndex] = survey;
      }
    };

    /**
     * 根据 Id 或者 tempId 查找调查数据
     * @param id
     * @returns
     */
    const getSurveyById = (id: string | number) => {
      let findOne;
      for (let i = 0; i < surveyList.value.length; i++) {
        const item = surveyList.value[i];
        if (item.id === id) {
          findOne = item;
        } else if (item.tempId === id) {
          findOne = item;
        }
      }
      return findOne;
    };

    const pannelInfo = computed(() => {
      const daidiaochaCount = surveyList.value.filter(item => formatInvestigateStatus(item.investigateStatus) === '待调查').length;
      const diaochazhongCount = surveyList.value.filter(item => formatInvestigateStatus(item.investigateStatus) === '调查中').length;
      const yidiaochaCount = surveyList.value.filter(item => formatInvestigateStatus(item.investigateStatus) === '已调查').length;
      return {
        daidiaochaCount,
        diaochazhongCount,
        yidiaochaCount,
      };
    });

    return {
      surveyList,
      setSurveyList,
      addNewSurvey,
      updateSurvey,
      removeSurvey,
      pannelInfo,
      getSurveyById,
    };
  },
  {
    persist: {
      storage: UniStorage,
      key: 'tree_survey_list',
    },
  },
);
