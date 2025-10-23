# 调查表单组件说明

## 文件结构

```
form/
├── types.ts                              # 调查类型枚举和配置
├── index.ts                              # 统一导出文件
├── ArtificialAfforestationForm.vue       # 人工造林（更新）表单
├── MountainClosureForm.vue               # 封山（沙）育林表单
├── AerialSeedingForm.vue                 # 飞播造林表单
├── DegradedForestRestorationForm.vue     # 退化林修复表单
├── YoungForestTendingForm.vue            # 中幼林抚育表单
├── ArtificialGrasslandForm.vue           # 人工种草表单
├── GrasslandImprovementForm.vue          # 草原改良表单
└── SandyLandTreatmentForm.vue            # 沙化土地综合治理表单
```

## 调查类型映射

| 中文名称 | 英文值 (type) | 组件文件 |
|---------|--------------|---------|
| 人工造林（更新） | `artificial_afforestation` | ArtificialAfforestationForm.vue |
| 封山（沙）育林 | `mountain_closure` | MountainClosureForm.vue |
| 飞播造林 | `aerial_seeding` | AerialSeedingForm.vue |
| 退化林修复 | `degraded_forest_restoration` | DegradedForestRestorationForm.vue |
| 中幼林抚育 | `young_forest_tending` | YoungForestTendingForm.vue |
| 人工种草 | `artificial_grassland` | ArtificialGrasslandForm.vue |
| 草原改良 | `grassland_improvement` | GrasslandImprovementForm.vue |
| 沙化土地综合治理 | `sandy_land_treatment` | SandyLandTreatmentForm.vue |

## 组件接口

每个表单组件都遵循统一的接口规范：

### Props
```typescript
interface Props {
  formData: any; // 表单数据
}
```

### Emits
```typescript
interface Emits {
  update: [data: any]; // 表单数据更新事件
}
```

## 使用方式

在 FeatureDetailPopup.vue 中：

```vue
<template>
  <component
    :is="currentFormComponent"
    :formData="formData"
    @update="handleFormUpdate"
  />
</template>
```

## 后续开发

每个表单组件内部需要根据具体的调查类型添加相应的表单字段。

