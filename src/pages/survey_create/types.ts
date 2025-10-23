/**
 * 调查创建页面相关类型定义
 */

// 选项类型
export interface OptionItem {
  text: string;
  value: string;
  key: string;
  id?: string | number;
}

// 树种信息类型
export interface TreeSpeciesItem {
  treeSpecies: string;
  commonName?: string;
  family?: string;
  genus?: string;
  isRareSpeciesValue?: string;
  isRareSpecies?: boolean;
  latinName?: string;
  protectionType?: string;
  remarks?: string;
}

// 媒体文件类型
export interface MediaItem {
  fileType: 'image' | 'video';
  tempFilePath: string;
  size: number;
  id?: string | number;
  path?: string;
  url?: string;
  thumbTempFilePath?: string;
  height?: number;
  width?: number;
  duration?: number;
  byteSize?: number;
}

// Hook 参数类型
export interface UseCreateTestParams {
  formData: any; // 这里使用 any 是因为需要与现有代码兼容
  treeSpeciesOptions: any;
  onTypeChange: (value: string) => void;
  onTreeSpeciesConfirm: (value: string) => void;
  calculateSpecs: () => void;
  codeNumberFirst: any;
  codeNumberSecond: any;
  onCodeNumberChange: () => void;
}

// 常量定义
export const MEASUREMENT_TYPES = ['胸径', '地径', '丛生'] as const;
export const TRANSPLANT_CONDITIONS = ['true', 'false'] as const;
export const RARE_SPECIES_OPTIONS = ['true', 'false'] as const;

export type MeasurementType = (typeof MEASUREMENT_TYPES)[number];
export type TransplantCondition = (typeof TRANSPLANT_CONDITIONS)[number];
export type RareSpeciesOption = (typeof RARE_SPECIES_OPTIONS)[number];
