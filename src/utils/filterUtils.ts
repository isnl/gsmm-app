import dayjs from 'dayjs';
import * as turf from '@turf/turf';
import type { Survey } from '@/stores/survey_list';

// 筛选选项接口
export interface FilterOptions {
  surveyTimeRange: {
    startDate: string;
    endDate: string;
  };
  surveyStatus: string[];
  treeCode: string; // 树种编号筛选
  isResultDataDemo: boolean; // 成果数据演示开关
}

/**
 * 判断点位是否在多边形内
 * @param point 点位坐标 {x: 经度, y: 纬度}
 * @param geometry GeoJSON 多边形几何对象
 * @returns 是否在多边形内
 */
export function isPointInPolygon(point: { x: number; y: number }, geometry: any): boolean {
  try {
    if (!point || !geometry || !point.x || !point.y) {
      return false;
    }

    // 创建 turf 点
    const turfPoint = turf.point([point.x, point.y]);

    // 处理不同类型的几何对象
    let polygon;
    if (geometry.type === 'Polygon') {
      polygon = turf.polygon(geometry.coordinates);
    } else if (geometry.type === 'MultiPolygon') {
      // 对于 MultiPolygon，检查点是否在任一多边形内
      for (const coords of geometry.coordinates) {
        const singlePolygon = turf.polygon(coords);
        if (turf.booleanPointInPolygon(turfPoint, singlePolygon)) {
          return true;
        }
      }
      return false;
    } else if (geometry.type === 'Feature') {
      return isPointInPolygon(point, geometry.geometry);
    } else {
      console.warn('不支持的几何类型:', geometry.type);
      return false;
    }

    // 使用 turf 判断点是否在多边形内
    return turf.booleanPointInPolygon(turfPoint, polygon);
  } catch (error) {
    console.error('判断点位是否在多边形内时出错:', error);
    return false;
  }
}

/**
 * 根据调查时间筛选数据
 * @param surveys 调查数据列表
 * @param startDate 开始日期 (YYYY-MM-DD)
 * @param endDate 结束日期 (YYYY-MM-DD)
 * @returns 筛选后的数据
 */
export function filterBySurveyTime(surveys: Survey[], startDate: string, endDate: string): Survey[] {
  if (!startDate && !endDate) {
    return surveys;
  }

  return surveys.filter(survey => {
    // 检查 finishDate 是否存在且有效
    if (!survey.finishDate) {
      return false;
    }

    const surveyDate = dayjs(survey.finishDate);

    // 检查日期是否有效
    if (!surveyDate.isValid()) {
      return false;
    }

    // 检查开始日期
    if (startDate) {
      const start = dayjs(startDate);
      if (start.isValid() && surveyDate.isBefore(start, 'day')) {
        return false;
      }
    }

    // 检查结束日期
    if (endDate) {
      const end = dayjs(endDate);
      if (end.isValid() && surveyDate.isAfter(end, 'day')) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 根据调查状态筛选数据
 * @param surveys 调查数据列表
 * @param statusList 状态列表
 * @returns 筛选后的数据
 */
export function filterBySurveyStatus(surveys: Survey[], statusList: string[]): Survey[] {
  if (!statusList || statusList.length === 0) {
    return surveys;
  }

  return surveys.filter(survey => {
    return statusList.includes(survey.investigateStatus);
  });
}

/**
 * 根据树种编号筛选数据（模糊匹配）
 * @param surveys 调查数据列表
 * @param treeCode 树种编号关键词
 * @returns 筛选后的数据
 */
export function filterByTreeCode(surveys: Survey[], treeCode: string): Survey[] {
  if (!treeCode || treeCode.trim() === '') {
    return surveys;
  }

  const keyword = treeCode.trim().toLowerCase();
  return surveys.filter(survey => {
    if (!survey.treeCode) {
      return false;
    }

    return survey.treeCode.toLowerCase().includes(keyword);
  });
}

/**
 * 根据行政区筛选数据（点位在面内判断）
 * @param surveys 调查数据列表
 * @param geometry 行政区几何对象
 * @returns 筛选后的数据
 */
export function filterByDistrict(surveys: Survey[], geometry: any): Survey[] {
  if (!geometry || Object.keys(geometry).length === 0) {
    return surveys;
  }

  return surveys.filter(survey => {
    if (!survey.location) {
      return false;
    }

    return isPointInPolygon(survey.location, geometry);
  });
}

/**
 * 综合筛选函数
 * @param surveys 调查数据列表
 * @param filters 筛选条件
 * @param districtGeometry 行政区几何对象
 * @param resultDataList 成果数据列表
 * @returns 筛选后的数据
 */
export function applySurveyFilters(surveys: Survey[], filters: FilterOptions, districtGeometry?: any, resultDataList?: Survey[]): Survey[] {
  // 如果开启成果数据演示，直接返回成果数据
  if (filters.isResultDataDemo && resultDataList && resultDataList.length > 0) {
    return [...resultDataList];
  }

  let filteredSurveys = [...surveys];

  // 按行政区筛选  性能压力大，注释了
  // if (districtGeometry && Object.keys(districtGeometry).length > 0) {
  //   filteredSurveys = filterByDistrict(filteredSurveys, districtGeometry);
  // }

  // 按调查时间筛选
  if (filters.surveyTimeRange.startDate || filters.surveyTimeRange.endDate) {
    filteredSurveys = filterBySurveyTime(filteredSurveys, filters.surveyTimeRange.startDate, filters.surveyTimeRange.endDate);
  }

  // 按调查状态筛选
  if (filters.surveyStatus.length > 0) {
    filteredSurveys = filterBySurveyStatus(filteredSurveys, filters.surveyStatus);
  }

  // 按树种编号筛选
  if (filters.treeCode && filters.treeCode.trim() !== '') {
    filteredSurveys = filterByTreeCode(filteredSurveys, filters.treeCode);
  }

  return filteredSurveys;
}
