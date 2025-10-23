/*
 * @Author: Peanut.ZhangHuan
 * @Description:  echarts工具类
 * 请按需引入，如PieChat
 * @Date: 2024-03-01 11:55:01
 * @Last Modified by: gex
 * @Last Modified time: 2024-03-12 16:00:45
 */
import * as echarts from "echarts/core";
import {
  PieChart,
  BarChart,
  PictorialBarChart,
  LineChart,
  RadarChart,
} from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DatasetComponent,
  TransformComponent,
  GraphicComponent,
  ToolboxComponent,
  DataZoomComponent,
} from "echarts/components";
import { LabelLayout, UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
echarts.use([
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  GraphicComponent,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
  PieChart,
  BarChart,
  PictorialBarChart,
  ToolboxComponent,
  DataZoomComponent,
  LineChart,
  RadarChart,
]);
export { echarts };
