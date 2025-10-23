// 调查类型枚举
export enum InvestigateType {
  ARTIFICIAL_AFFORESTATION = 'artificial_afforestation', // 人工造林（更新）
  MOUNTAIN_CLOSURE = 'mountain_closure', // 封山（沙）育林
  AERIAL_SEEDING = 'aerial_seeding', // 飞播造林
  DEGRADED_FOREST_RESTORATION = 'degraded_forest_restoration', // 退化林修复
  YOUNG_FOREST_TENDING = 'young_forest_tending', // 中幼林抚育
  ARTIFICIAL_GRASSLAND = 'artificial_grassland', // 人工种草
  GRASSLAND_IMPROVEMENT = 'grassland_improvement', // 草原改良
  SANDY_LAND_TREATMENT = 'sandy_land_treatment', // 沙化土地综合治理
}

// 调查类型选项
export interface InvestigateTypeOption {
  text: string;
  value: InvestigateType;
}

// 调查类型选项列表
export const investigateTypeOptions: InvestigateTypeOption[] = [
  {
    text: '人工造林（更新）',
    value: InvestigateType.ARTIFICIAL_AFFORESTATION,
  },
  {
    text: '封山（沙）育林',
    value: InvestigateType.MOUNTAIN_CLOSURE,
  },
  {
    text: '飞播造林',
    value: InvestigateType.AERIAL_SEEDING,
  },
  {
    text: '退化林修复',
    value: InvestigateType.DEGRADED_FOREST_RESTORATION,
  },
  {
    text: '中幼林抚育',
    value: InvestigateType.YOUNG_FOREST_TENDING,
  },
  {
    text: '人工种草',
    value: InvestigateType.ARTIFICIAL_GRASSLAND,
  },
  {
    text: '草原改良',
    value: InvestigateType.GRASSLAND_IMPROVEMENT,
  },
  {
    text: '沙化土地综合治理',
    value: InvestigateType.SANDY_LAND_TREATMENT,
  },
];

// 获取调查类型标签
export const getInvestigateTypeLabel = (type: InvestigateType): string => {
  const option = investigateTypeOptions.find(item => item.value === type);
  return option?.text || '';
};
