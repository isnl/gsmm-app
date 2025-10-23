// 人工造林（更新）表单常量配置

// 项目类别选项
export const projectCategoryOptions = [
  { text: '"双重"非超长期国债项目', value: '1' },
  { text: '"双重"超长期国债项目', value: '2' },
  { text: '"三北"超长期国债项目', value: '3' },
  { text: '中央财政国土绿化示范项目', value: '4' },
  { text: '中央财政其他国土绿化项目', value: '5' },
  { text: '中央财政造林补贴', value: '6' },
  { text: '其他项目', value: '7' },
];

// 不核实原因选项
export const nonVerificationReasonOptions = [
  { text: '未实施', value: '1' },
  { text: '重复上报', value: '2' },
  { text: '绿化方式与设计不符', value: '3' },
  { text: '位置范围与设计不符', value: '4' },
  { text: '其他', value: '5' },
];

// 抚育管护选项
export const tendingManagementOptions = [
  { text: '采取管护措施', value: '1' },
  { text: '未采取管护措施', value: '2' },
  { text: '有明显人畜破坏', value: '3' },
];

// 不合格原因选项（可多选）
export const unqualifiedReasonOptions = [
  { text: '未按设计施工', value: '1' },
  { text: '成活率不合格', value: '2' },
];

// 生成年份选项（从1990年到当前年份+5年）
export const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const startYear = 1990;
  const endYear = currentYear + 5;
  const years = [];

  for (let year = startYear; year <= endYear; year++) {
    years.push({
      text: `${year}年`,
      value: year.toString(),
    });
  }

  return years.reverse(); // 倒序，最新年份在前
};

// ==================== 封山（沙）育林表单常量 ====================

// 封禁设施选项（可多选）
export const enclosureFacilityOptions = [
  { text: '围栏', value: '1' },
  { text: '管护站', value: '2' },
  { text: '标志牌', value: '3' },
  { text: '界桩', value: '4' },
  { text: '其他', value: '5' },
];

// 育林措施选项（可多选）
export const forestryMeasureOptions = [
  { text: '人工促进更新', value: '1' },
  { text: '补植补播', value: '2' },
  { text: '平茬复壮', value: '3' },
  { text: '沙障固沙', value: '4' },
  { text: '浇水施肥', value: '5' },
  { text: '其他', value: '6' },
];

// 封育效果选项
export const enclosureEffectOptions = [
  { text: '封育效果较好', value: '1' },
  { text: '有明显人畜破坏', value: '2' },
];

// 不合格原因选项（封山育林专用，可多选）
export const mountainClosureUnqualifiedReasonOptions = [
  { text: '未按设计施工', value: '1' },
  { text: '封育效果差', value: '2' },
];

// ==================== 飞播造林表单常量 ====================

// 辅助措施选项（可多选）
export const auxiliaryMeasureOptions = [
  { text: '种子消毒', value: '11' },
  { text: '包衣、丸粒化处理', value: '12' },
  { text: '破壳、脱蜡等机械处理', value: '13' },
  { text: '植被处理', value: '21' },
  { text: '简易整地', value: '22' },
];

// 不合格原因选项（飞播造林专用，可多选）
export const aerialSeedingUnqualifiedReasonOptions = [
  { text: '未按设计施工', value: '1' },
  { text: '有效苗株数不合格', value: '2' },
  { text: '有苗样地频度不合格', value: '3' },
];

// ==================== 退化林修复表单常量 ====================

// 修复方式选项（可多选）
export const restorationMethodOptions = [
  { text: '补植补播', value: '1' },
  { text: '采伐修复', value: '2' },
  { text: '更替修复', value: '3' },
  { text: '平茬复壮', value: '4' },
  { text: '辅助措施', value: '5' },
];

// 采伐修复质量选项
export const cuttingQualityOptions = [
  { text: '合格', value: '1' },
  { text: '不合格', value: '2' },
];

// 不合格原因选项（退化林修复专用，可多选）
export const degradedForestUnqualifiedReasonOptions = [
  { text: '未按设计施工', value: '1' },
  { text: '成活率不合格', value: '2' },
  { text: '采伐修复质量不合格', value: '3' },
];

// ==================== 中幼林抚育表单常量 ====================

// 抚育方式选项（可多选）
export const tendingMethodOptions = [
  { text: '透光伐', value: '1' },
  { text: '疏伐', value: '2' },
  { text: '生长伐', value: '3' },
  { text: '卫生伐', value: '4' },
  { text: '补植', value: '5' },
  { text: '辅助措施', value: '6' },
];

// 不合格原因选项（中幼林抚育专用，可多选）
export const youngForestUnqualifiedReasonOptions = [
  { text: '未按设计施工', value: '1' },
  { text: '成活率不合格', value: '2' },
  { text: '抚育采伐质量不合格', value: '3' },
];

// ==================== 人工种草表单常量 ====================

// 草原区分类选项
export const grasslandTypeOptions = [
  { text: '典型草原区', value: '1' },
  { text: '草甸类草原区', value: '2' },
  { text: '荒漠类草原区', value: '3' },
  { text: '灌丛类草原区', value: '4' },
  { text: '重度盐碱化、高寒、干旱等立地条件区', value: '5' },
];

// 种草措施选项
export const grassPlantingMeasureOptions = [
  { text: '植被重建', value: '1' },
  { text: '多年生人工草地', value: '2' },
];

// 不合格原因选项（人工种草专用，可多选）
export const artificialGrasslandUnqualifiedReasonOptions = [
  { text: '未按设计施工', value: '1' },
  { text: '质量不合格', value: '2' },
];

// ==================== 草原改良表单常量 ====================

// 改良措施选项（可多选）
export const improvementMeasureOptions = [
  { text: '补播种草', value: '1' },
  { text: '其他改良', value: '2' },
  { text: '草原围栏', value: '3' },
  { text: '草种繁育基地', value: '4' },
];

// 生产措施选项
export const productionMeasureOptions = [
  { text: '种草', value: '1' },
  { text: '灌溉', value: '2' },
  { text: '施肥', value: '3' },
  { text: '采种', value: '4' },
  { text: '打草', value: '5' },
];

// 不合格原因选项（草原改良专用，可多选）
export const grasslandImprovementUnqualifiedReasonOptions = [
  { text: '未按设计施工', value: '1' },
  { text: '质量不合格', value: '2' },
];

// ==================== 沙化土地综合治理表单常量 ====================

// 治理措施选项（可多选）
export const sandControlMeasureOptions = [
  { text: '工程固沙', value: '1' },
  { text: '人工造林种草', value: '2' },
];

// 沙障材料选项
export const sandBarrierMaterialOptions = [
  { text: '尼龙网类', value: '1' },
  { text: '板条沙袋', value: '2' },
  { text: '石块粘土', value: '3' },
  { text: '作物秸秆、芦苇', value: '4' },
  { text: '灌木', value: '5' },
  { text: '草本植物', value: '6' },
  { text: '其他', value: '7' },
];

// 沙障配置选项
export const sandBarrierConfigOptions = [
  { text: '条带状', value: '1' },
  { text: '网格状', value: '2' },
  { text: '条带加网格混合状', value: '3' },
];

// 不合格原因选项（沙化土地综合治理专用，可多选）
export const sandyLandUnqualifiedReasonOptions = [
  { text: '未按设计施工', value: '1' },
  { text: '工程固沙质量不合格', value: '2' },
  { text: '人工造林种草质量不合格', value: '3' },
];
