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

// ==================== 古树名木调查表常量 ====================

// 普查范围选项
export const censusRangeOptions = [
  { text: '二普范围', value: '二普范围' },
  { text: '新纳入范围', value: '新纳入范围' },
];

// 分布特点选项
export const distributionTypeOptions = [
  { text: '散生', value: '散生' },
  { text: '群状', value: '群状' },
];

// 分布场所选项
export const distributionPlaceOptions = [
  { text: '城市公园街道', value: '城市公园街道' },
  { text: '单位庭院', value: '单位庭院' },
  { text: '文保单位', value: '文保单位' },
  { text: '乡村', value: '乡村' },
  { text: '远郊野外', value: '远郊野外' },
  { text: '铁路公路', value: '铁路公路' },
  { text: '河湖库', value: '河湖库' },
  { text: '自然森林', value: '自然森林' },
];

// 土壤紧密度选项
export const soilCompactnessOptions = [
  { text: '紧密', value: '紧密' },
  { text: '中等', value: '中等' },
  { text: '疏松', value: '疏松' },
];

// 土层厚度选项
export const soilThicknessOptions = [
  { text: '厚', value: '厚' },
  { text: '中', value: '中' },
  { text: '薄', value: '薄' },
];

// 坡位选项
export const slopePositionOptions = [
  { text: '脊部', value: '脊部' },
  { text: '上部', value: '上部' },
  { text: '中部', value: '中部' },
  { text: '下部', value: '下部' },
  { text: '山谷', value: '山谷' },
  { text: '平地', value: '平地' },
];

// 坡度选项
export const slopeGradeOptions = [
  { text: '平坡', value: '平坡' },
  { text: '缓坡', value: '缓坡' },
  { text: '斜坡', value: '斜坡' },
  { text: '陡坡', value: '陡坡' },
  { text: '急坡', value: '急坡' },
  { text: '险坡', value: '险坡' },
];

// 坡向选项
export const slopeAspectOptions = [
  { text: '北坡', value: '北坡' },
  { text: '东北坡', value: '东北坡' },
  { text: '东坡', value: '东坡' },
  { text: '东南坡', value: '东南坡' },
  { text: '南坡', value: '南坡' },
  { text: '西南坡', value: '西南坡' },
  { text: '西坡', value: '西坡' },
  { text: '西北坡', value: '西北坡' },
  { text: '无坡向', value: '无坡向' },
];

// 生长环境等级选项
export const growthEnvironmentOptions = [
  { text: '良好', value: '良好' },
  { text: '中等', value: '中等' },
  { text: '差', value: '差' },
];

// 树龄测定方法选项
export const ageTestMethodOptions = [
  { text: '文献追踪', value: '文献追踪' },
  { text: '回归预测', value: '回归预测' },
  { text: '访谈估测', value: '访谈估测' },
  { text: '年轮测定', value: '年轮测定' },
];

// 保护等级选项
export const protectionLevelOptions = [
  { text: '一级', value: '一级' },
  { text: '二级', value: '二级' },
  { text: '三级', value: '三级' },
];

// 古树名木类别选项
export const treeCategoryOptions = [
  { text: '古树', value: '古树' },
  { text: '名木', value: '名木' },
  { text: '古树且名木', value: '古树且名木' },
];

// 生长势等级选项
export const growthStatusOptions = [
  { text: '正常', value: '正常' },
  { text: '衰弱', value: '衰弱' },
  { text: '濒危', value: '濒危' },
  { text: '死亡', value: '死亡' },
];

// 树体损伤选项
export const treeDamageOptions = [
  { text: '无', value: '无' },
  { text: '倒伏', value: '倒伏' },
  { text: '倾斜', value: '倾斜' },
  { text: '病斑', value: '病斑' },
  { text: '害虫', value: '害虫' },
  { text: '腐朽或空心', value: '腐朽或空心' },
  { text: '主干或主枝折断', value: '主干或主枝折断' },
];

// 潜在影响因素选项
export const potentialImpactOptions = [
  { text: '无', value: '无' },
  { text: '雷击', value: '雷击' },
  { text: '雪害', value: '雪害' },
  { text: '滑坡', value: '滑坡' },
  { text: '水涝', value: '水涝' },
  { text: '台风', value: '台风' },
  { text: '高温', value: '高温' },
  { text: '干旱', value: '干旱' },
  { text: '硬质铺装', value: '硬质铺装' },
  { text: '踩实板结', value: '踩实板结' },
  { text: '堆放杂物', value: '堆放杂物' },
  { text: '树干深埋', value: '树干深埋' },
];

// 主管部门选项
export const managementDeptOptions = [
  { text: '林业', value: '林业' },
  { text: '城市绿化', value: '城市绿化' },
];

// 权属选项
export const ownershipOptions = [
  { text: '国有', value: '国有' },
  { text: '集体', value: '集体' },
  { text: '个人', value: '个人' },
];

// 日常养护责任人类型选项
export const responsibleTypeOptions = [
  { text: '单位', value: '单位' },
  { text: '个人', value: '个人' },
];

// 保护措施选项
export const protectionMeasureOptions = [
  { text: '无', value: '无' },
  { text: '标牌', value: '标牌' },
  { text: '树池', value: '树池' },
  { text: '围栏', value: '围栏' },
  { text: '挡土墙', value: '挡土墙' },
  { text: '防践踏设施', value: '防践踏设施' },
  { text: '避雷针', value: '避雷针' },
  { text: '根系复壮', value: '根系复壮' },
  { text: '树洞修补', value: '树洞修补' },
  { text: '树体加固', value: '树体加固' },
];

// 重要价值选项
export const importantValueOptions = [
  { text: '历史价值', value: '历史价值' },
  { text: '文化价值', value: '文化价值' },
  { text: '生态价值', value: '生态价值' },
  { text: '景观价值', value: '景观价值' },
  { text: '科学价值', value: '科学价值' },
  { text: '经济价值', value: '经济价值' },
];

// 新增原因选项
export const newIncreaseReasonOptions = [
  { text: '树龄增长', value: '树龄增长' },
  { text: '二普遗漏树木', value: '二普遗漏树木' },
  { text: '异地移入', value: '异地移入' },
];

// 减少原因选项
export const decreaseReasonOptions = [
  { text: '衰老死亡', value: '衰老死亡' },
  { text: '自然灾害死亡', value: '自然灾害死亡' },
  { text: '病虫害死亡', value: '病虫害死亡' },
  { text: '本地移出', value: '本地移出' },
];

// 死亡处置措施选项
export const deathDisposalOptions = [
  { text: '砍伐', value: '砍伐' },
  { text: '保留', value: '保留' },
];
