export interface DetailInfo {
  id: number;
  yiJiXiangMuId: number;
  yiJiXiangMuMingCheng: string;
  xiangMuBianHao?: string;
  jianSheXingZhi?: string;
  xiangMuXingZhi?: string;
  jianSheGuiMo?: string;
  jianSheDiDian?: string;
  jianSheDiDianMingCheng?: string;
  jianSheKaiShiNianFen?: string;
  jianSheJieShuNianFen?: string;
  xiaDaPiCi?: string;
  xiangMuFaRen?: string;
  faRenDanWei?: string;
  faRenDianHua?: string;
  riChangJianGuanFuZeRen?: string;
  fuZeRenDanWei?: string;
  fuZeRenDianHua?: string;
  xiangMuFanWei?: string;
  xiangMuMingCheng: string;
  dangAnGuiDangLv?: string;
  jianSheNeiRong?: string;
  xiangMuZhaoPian?: string;
  annexes?: FileItem[];
  keYanAnnexes?: FileItem[];
  chuSheAnnexes?: FileItem[];
  shiGongAnnexes?: FileItem[];
  createdAt: string;
  createdByName: string;
  shenPiZhuangTai: number;
  keYanZhuangTai: number;
  chuSheZhuangTai: number;
  shiGongZhuangTai: number;
  nianDuJiHuaZhuangTai: number;
  nianDuJiHuaNianDu?: string;
  jinDuZhuangTai: number;
  ziJinZhuangTai: number;
  jinDu: number;
  xiaFaBaiFenBi: number;
  boFuBaiFenBi: number;
  ziJin?: string;
  jianSheMianJi: number;
  xiaFaZiJin?: string;
  boFuZiJin: number;
  ziJinLaiYuan?: string;
}

export interface FileItem extends UniApp.ChooseFileSuccessCallbackResultFile {
  id?: number;
  path?: string;
  name: string;
  url: string;
}

export interface MultimediaApi {
  id?: number;
  name: string;
  path: string;
  url: string;
  type?: string;
  screenshotPath?: string;
}

export interface MultimediaLocal extends MultimediaApi {
  tempFilePath?: string;
  fileType?: 'image' | 'video';
  size?: number;
  thumbTempFilePath?: string;
}

export interface SurveyCreateFormData {
  // 基本信息
  type?: string; // 树种类型
  treeSpecies: string; // 树种名称
  treeCode: string; // 古树唯一编号
  codeNumber: string; // 挂牌编号
  commonName: string; // 俗名/当地俗称
  latinName: string; // 拉丁学名
  family: string; // 科
  genus: string; // 属
  species?: string; // 种
  estimatedAge?: number | string; // 估测树龄(年)
  ownershipUnit: string; // 权属单位/管理单位
  batch: string; // 批次
  soilLayerThickness?: string | number; // 土层厚度(厘米)
  landParcelsName?: string; // 地块名称

  location: {
    x: string | number;
    y: string | number;
  };
  areaCode: string | number; // 行政区划代码
  town: string; // 乡（镇）
  village: string; // 村
  smallPlaceName: string; // 小地名
  altitude?: string | number; // 海拔(米)

  // 生长势
  healthStatus: string; // 生长势(优/良/中/差)
  protectionLevel: string; // 古树名木保护等级(一级/二级/三级)
  protectionType: string; // 植物保护类型/等级
  isRareSpecies?: string; // 是否稀有物种

  // 测量数据
  treeHeight?: string | number; // 树高(米)
  crownWidth?: string | number; // 冠幅(米)
  underBranchHeight?: string | number; // 枝下高(米)
  area?: string | number; // 分布面积(平方米)
  quantity?: string | number; // 数量(株)
  transplantPlan?: string; // 移栽方案

  // 测量维度相关字段
  measurementDimensionType?: string; // 测量维度(胸径/地径/丛生)
  measurementInfo?: {
    // 胸径类型时的字段
    chestDiameter?: string | number; // 胸径(厘米)
    // 地径类型时的字段
    groundDiameter?: string | number; // 地径(厘米)
    // 丛生类型时的字段
    distributionDiameter?: string | number; // 分布直径(厘米)
    branchCount?: string | number; // 分支数量
    farthestDiameter?: string | number; // 离中心点最远的树木的胸径/直径(厘米)
  };
  // 新增预估字段（与 measurementInfo 同级）
  measurementInfoEstimate?: string | number; // 预估值
  measurementDimensionTypeEstimate?: string; // 预估类型
  specs?: string | number; // 规格(厘米) - 根据测量信息动态计算

  // 环境信息
  growthEnvironment: string; // 生长环境详细描述
  isTransplant?: string; // 是否具备移植条件
  notTransplant?: string; // 不可移植原因
  landType: string; // 地类
  soilTexture: string; // 土壤类型
  landform?: string; // 地貌
  slope: string; // 坡度
  aspect: string; // 坡向
  slopePosition: string; // 坡位
  siteConditionDesc: string; // 立地条件描述

  // 保护措施
  protectionMeasureType: string; // 现有保护措施(迁地保护/就地保护)
  team: string; // 组员
  relocationProtection: string; // 迁地保护/就地保护技术措施
  managementMeasures: string; // 管护措施
  relocationPlace: string; // 迁出地

  // 项目信息
  projectSchedule: string; // 工程进度安排
  laborStatistics: string; // 用工量统计
  investmentEstimate?: string | number; // 投资概算(元)

  // 其他信息
  historicalAnecdotes: string; // 历史典故/传说
  discoveryDate: string; // 发现/登记日期
  remarks: string; // 备注
  multimedia: MultimediaLocal[]; // 多媒体资料JSON数组，存储照片/视频路径
  investigateStatus?: string; // 调查状态 待调查、调查中、已调查

  // 扩展字段
  id?: string | number;
  investigatorId?: string | number;
  tempId?: string | number;
  taskManageId?: string | number;
  finishDate?: string;
}
export interface PlantTaskCreateFormData {
  // 基本信息
  treeSpecies: string;
  treeCode: string;
  areaName: string | null;
  areaCode: string | null;
  planDate: string | null;
  finishDate: string | null;
  isOverdue: string | null;
  fromLocation: Coordinate;
  toLocation: Coordinate;
  status: string | null;
  taskConfigNodeProgress?: any;
  // 扩展字段
  id?: string | number;
}
