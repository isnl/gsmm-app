/**
 * 植物信息类型定义
 */

// 植物类型枚举
export type PlantType = '灌木' | '草本' | '巨柏' | '乔木';

// 保护类型枚举
export type ProtectionType = '国家一级' | '国家二级' | null;

// 植物信息接口
export interface PlantInfo {
  /** 植物ID */
  id: number;
  /** 植物类型 */
  type: PlantType;
  /** 树种名称 */
  treeSpecies: string;
  /** 树种代码 */
  treeCode: string;
  /** 俗名/别名 */
  commonName: string;
  /** 拉丁学名 */
  latinName: string;
  /** 科名 */
  family: string;
  /** 属名 */
  genus: string;
  /** 保护类型 */
  protectionType: ProtectionType;
  /** 是否为珍稀物种 */
  isRareSpecies: boolean;
  /** 珍稀物种值 */
  isRareSpeciesValue: any; // 根据实际使用情况可以更具体化类型
  /** 备注 */
  remarks: string;
  /** 创建时间 */
  createdAt: string;
}

// 植物信息数据结构
export interface CommonPlantsInfo {
  type: '灌木' | '草本' | '巨柏' | '乔木';
  treeCode: 'GM' | 'CB' | 'JB' | 'QM';
  children: PlantInfo[];
}

// 植物查询参数接口
export interface PlantQueryParams {
  /** 植物类型 */
  type?: PlantType;
  /** 树种名称（模糊查询） */
  treeSpecies?: string;
  /** 拉丁学名（模糊查询） */
  latinName?: string;
  /** 科名 */
  family?: string;
  /** 属名 */
  genus?: string;
  /** 保护类型 */
  protectionType?: ProtectionType;
  /** 是否为珍稀物种 */
  isRareSpecies?: boolean;
}

// 植物统计信息接口
export interface PlantStatistics {
  /** 总数量 */
  total: number;
  /** 各类型数量统计 */
  typeCount: Record<PlantType, number>;
  /** 保护类型数量统计 */
  protectionCount: {
    国家一级: number;
    国家二级: number;
    无保护: number;
  };
  /** 珍稀物种数量 */
  rareSpeciesCount: number;
}

// 植物选项接口（用于下拉选择等场景）
export interface PlantOption {
  /** 植物ID */
  id: number;
  /** 显示标签 */
  label: string;
  /** 植物值 */
  value: string;
  /** 植物类型 */
  type: PlantType;
  /** 拉丁学名 */
  latinName: string;
}

// 科属信息接口
export interface FamilyGenusInfo {
  /** 科名 */
  family: string;
  /** 该科下的属列表 */
  genera: string[];
  /** 该科下的植物数量 */
  count: number;
}

// 导出默认类型
export type { PlantInfo as default };
