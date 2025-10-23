import { useGlobalStore } from '@/stores/global';

// 随机选择数组中的一个元素
const getRandomItem = (array: any[]) => {
  if (!array || array.length === 0) return '';
  return array[Math.floor(Math.random() * array.length)];
};

// 生成随机中文描述
const generateRandomDescription = () => {
  const descriptions = [
    '叶片呈椭圆形，边缘有锯齿，叶面光滑，叶色深绿，叶脉清晰可见',
    '树干挺直，树皮粗糙，有明显的纵向裂纹，树冠呈圆锥形',
    '枝条粗壮，分枝较多，新梢呈红褐色，老枝呈灰褐色',
    '花朵较小，呈白色或淡黄色，花期较长，香味浓郁',
    '果实呈球形或椭圆形，成熟时呈红色或黄色，果肉厚实',
    '根系发达，主根明显，侧根较多，适应性强',
    '整体生长状况良好，枝叶茂盛，无明显病虫害症状',
    '叶片较大，质地厚实，表面有光泽，背面有细毛',
  ];
  return getRandomItem(descriptions);
};

// 生成随机环境描述
const generateRandomEnvironment = () => {
  const environments = [
    '周围植被茂密，主要为阔叶林，林下灌木丰富，生态环境良好',
    '位于山坡中部，周围有零星分布的同种植物，土壤肥沃',
    '生长在河谷地带，水源充足，周围伴生植物种类丰富',
    '处于林缘地带，光照充足，通风良好，周围植被稀疏',
    '位于山顶附近，海拔较高，气候凉爽，周围多为高山植物',
    '生长在平缓坡地，土层深厚，排水良好，周围植被覆盖率高',
    '处于沟谷底部，湿度较大，土壤湿润，周围多为湿生植物',
    '位于阳坡，光照条件好，土壤较干燥，植被相对稀疏',
  ];
  return getRandomItem(environments);
};

export const randomFill = (formData: any) => {
  const globalStore = useGlobalStore();

  // 获取字典数据
  const weatherDict = globalStore.getDictListByCode('zzzy_weather');
  const healthStatusDict = globalStore.getDictListByCode('szs');

  // 随机填充表单数据
  formData.value = {
    ...formData.value,
    // 挂牌编号：生成随机编号
    codeNumber: `QM-${new Date().getFullYear()}${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,

    // 天气状况：从字典中随机选择
    weather: getRandomItem(weatherDict)?.key || '晴',

    // 单位/团队：随机生成
    collectTeam: getRandomItem(['林业科学研究院', '植物保护研究所', '森林资源调查队', '生态环境监测站', '种质资源保护中心', '林木种苗管理站']),

    // 采集人员：随机生成
    collectPersonnel: getRandomItem(['张三、李四', '王五、赵六', '陈七、刘八', '杨九、周十', '吴一、郑二', '孙三、朱四']),

    // 健康状况：从字典中随机选择
    parentHealthStatus: getRandomItem(healthStatusDict)?.key || '正常',

    // 病虫害：随机选择
    hasPestsDiseases: getRandomItem(['无', '轻微虫害', '叶片有少量病斑', '枝干有轻微损伤', '根部有轻微腐烂']),

    // 表型特征描述：随机生成
    phenotypeDescription: generateRandomDescription(),

    // 群落环境描述：随机生成
    communityEnvironment: generateRandomEnvironment(),
  };
};
