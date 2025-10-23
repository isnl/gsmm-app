/**
 * 坐标转换工具类
 * 支持 WGS-84、GCJ-02、BD-09 坐标系之间的相互转换
 */

// 坐标点接口定义
export interface Coordinate {
  lng: number;
  lat: number;
}

// 坐标数组类型定义
export type CoordinateArray = [number, number];

// 定义常量
const X_PI: number = (3.14159265358979324 * 3000.0) / 180.0;
const PI: number = 3.1415926535897932384626;
const A: number = 6378245.0;
const EE: number = 0.00669342162296594323;

/**
 * 百度坐标系 (BD-09) 与 火星坐标系 (GCJ-02) 的转换
 * 即 百度 转 谷歌、高德
 * @param bdLng 百度经度
 * @param bdLat 百度纬度
 * @returns 转换后的坐标数组 [经度, 纬度]
 */
export function bd09ToGcj02(bdLng: number, bdLat: number): CoordinateArray {
  const lng = Number(bdLng);
  const lat = Number(bdLat);
  const x = lng - 0.0065;
  const y = lat - 0.006;
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI);
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI);
  const gcjLng = z * Math.cos(theta);
  const gcjLat = z * Math.sin(theta);
  return [gcjLng, gcjLat];
}

/**
 * 火星坐标系 (GCJ-02) 与百度坐标系 (BD-09) 的转换
 * 即 谷歌、高德 转 百度
 * @param lng 火星坐标系经度
 * @param lat 火星坐标系纬度
 * @returns 转换后的坐标数组 [经度, 纬度]
 */
export function gcj02ToBd09(lng: number, lat: number): CoordinateArray {
  const latitude = Number(lat);
  const longitude = Number(lng);
  const z = Math.sqrt(longitude * longitude + latitude * latitude) + 0.00002 * Math.sin(latitude * X_PI);
  const theta = Math.atan2(latitude, longitude) + 0.000003 * Math.cos(longitude * X_PI);
  const bdLng = z * Math.cos(theta) + 0.0065;
  const bdLat = z * Math.sin(theta) + 0.006;
  return [bdLng, bdLat];
}

/**
 * WGS-84 转 GCJ-02
 * @param lng WGS-84经度
 * @param lat WGS-84纬度
 * @returns 转换后的坐标数组 [经度, 纬度]
 */
export function wgs84ToGcj02(lng: number, lat: number): CoordinateArray {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (isOutOfChina(longitude, latitude)) {
    return [longitude, latitude];
  }

  let deltaLat = transformLat(longitude - 105.0, latitude - 35.0);
  let deltaLng = transformLng(longitude - 105.0, latitude - 35.0);
  const radLat = (latitude / 180.0) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  deltaLat = (deltaLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI);
  deltaLng = (deltaLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI);
  const mgLat = latitude + deltaLat;
  const mgLng = longitude + deltaLng;
  return [mgLng, mgLat];
}

/**
 * GCJ-02 转换为 WGS-84
 * @param lng GCJ-02经度
 * @param lat GCJ-02纬度
 * @returns 转换后的坐标数组 [经度, 纬度]
 */
export function gcj02ToWgs84(lng: number, lat: number): CoordinateArray {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (isOutOfChina(longitude, latitude)) {
    return [longitude, latitude];
  }

  let deltaLat = transformLat(longitude - 105.0, latitude - 35.0);
  let deltaLng = transformLng(longitude - 105.0, latitude - 35.0);
  const radLat = (latitude / 180.0) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  deltaLat = (deltaLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI);
  deltaLng = (deltaLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI);
  const mgLat = latitude + deltaLat;
  const mgLng = longitude + deltaLng;
  return [longitude * 2 - mgLng, latitude * 2 - mgLat];
}

/**
 * WGS-84 转 BD-09 (组合转换)
 * @param lng WGS-84经度
 * @param lat WGS-84纬度
 * @returns 转换后的坐标数组 [经度, 纬度]
 */
export function wgs84ToBd09(lng: number, lat: number): CoordinateArray {
  const gcj02 = wgs84ToGcj02(lng, lat);
  return gcj02ToBd09(gcj02[0], gcj02[1]);
}

/**
 * 纬度转换辅助函数
 * @param lng 经度
 * @param lat 纬度
 * @returns 转换后的纬度偏移量
 */
function transformLat(lng: number, lat: number): number {
  const latitude = Number(lat);
  const longitude = Number(lng);
  let ret = -100.0 + 2.0 * longitude + 3.0 * latitude + 0.2 * latitude * latitude + 0.1 * longitude * latitude + 0.2 * Math.sqrt(Math.abs(longitude));
  ret += ((20.0 * Math.sin(6.0 * longitude * PI) + 20.0 * Math.sin(2.0 * longitude * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(latitude * PI) + 40.0 * Math.sin((latitude / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((latitude / 12.0) * PI) + 320 * Math.sin((latitude * PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

/**
 * 经度转换辅助函数
 * @param lng 经度
 * @param lat 纬度
 * @returns 转换后的经度偏移量
 */
function transformLng(lng: number, lat: number): number {
  const latitude = Number(lat);
  const longitude = Number(lng);
  let ret = 300.0 + longitude + 2.0 * latitude + 0.1 * longitude * longitude + 0.1 * longitude * latitude + 0.1 * Math.sqrt(Math.abs(longitude));
  ret += ((20.0 * Math.sin(6.0 * longitude * PI) + 20.0 * Math.sin(2.0 * longitude * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(longitude * PI) + 40.0 * Math.sin((longitude / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((longitude / 12.0) * PI) + 300.0 * Math.sin((longitude / 30.0) * PI)) * 2.0) / 3.0;
  return ret;
}

/**
 * 判断是否在国内，不在国内则不做偏移
 * @param lng 经度
 * @param lat 纬度
 * @returns 是否在中国境外
 */
function isOutOfChina(lng: number, lat: number): boolean {
  const latitude = Number(lat);
  const longitude = Number(lng);
  // 纬度 3.86~53.55, 经度 73.66~135.05
  return !(longitude > 73.66 && longitude < 135.05 && latitude > 3.86 && latitude < 53.55);
}

// 坐标转换工具类
export class CoordTransform {
  /**
   * 百度坐标系转火星坐标系
   */
  static bd09ToGcj02(coordinate: Coordinate): Coordinate;
  static bd09ToGcj02(lng: number, lat: number): CoordinateArray;
  static bd09ToGcj02(lngOrCoord: number | Coordinate, lat?: number): Coordinate | CoordinateArray {
    if (typeof lngOrCoord === 'object') {
      const [lng, latResult] = bd09ToGcj02(lngOrCoord.lng, lngOrCoord.lat);
      return { lng, lat: latResult };
    }
    return bd09ToGcj02(lngOrCoord, lat!);
  }

  /**
   * 火星坐标系转百度坐标系
   */
  static gcj02ToBd09(coordinate: Coordinate): Coordinate;
  static gcj02ToBd09(lng: number, lat: number): CoordinateArray;
  static gcj02ToBd09(lngOrCoord: number | Coordinate, lat?: number): Coordinate | CoordinateArray {
    if (typeof lngOrCoord === 'object') {
      const [lng, latResult] = gcj02ToBd09(lngOrCoord.lng, lngOrCoord.lat);
      return { lng, lat: latResult };
    }
    return gcj02ToBd09(lngOrCoord, lat!);
  }

  /**
   * WGS84坐标系转火星坐标系
   */
  static wgs84ToGcj02(coordinate: Coordinate): Coordinate;
  static wgs84ToGcj02(lng: number, lat: number): CoordinateArray;
  static wgs84ToGcj02(lngOrCoord: number | Coordinate, lat?: number): Coordinate | CoordinateArray {
    if (typeof lngOrCoord === 'object') {
      const [lng, latResult] = wgs84ToGcj02(lngOrCoord.lng, lngOrCoord.lat);
      return { lng, lat: latResult };
    }
    return wgs84ToGcj02(lngOrCoord, lat!);
  }

  /**
   * 火星坐标系转WGS84坐标系
   */
  static gcj02ToWgs84(coordinate: Coordinate): Coordinate;
  static gcj02ToWgs84(lng: number, lat: number): CoordinateArray;
  static gcj02ToWgs84(lngOrCoord: number | Coordinate, lat?: number): Coordinate | CoordinateArray {
    if (typeof lngOrCoord === 'object') {
      const [lng, latResult] = gcj02ToWgs84(lngOrCoord.lng, lngOrCoord.lat);
      return { lng, lat: latResult };
    }
    return gcj02ToWgs84(lngOrCoord, lat!);
  }

  /**
   * WGS84坐标系转百度坐标系
   */
  static wgs84ToBd09(coordinate: Coordinate): Coordinate;
  static wgs84ToBd09(lng: number, lat: number): CoordinateArray;
  static wgs84ToBd09(lngOrCoord: number | Coordinate, lat?: number): Coordinate | CoordinateArray {
    if (typeof lngOrCoord === 'object') {
      const gcj02 = CoordTransform.wgs84ToGcj02(lngOrCoord);
      return CoordTransform.gcj02ToBd09(gcj02);
    }
    const gcj02 = wgs84ToGcj02(lngOrCoord, lat!);
    return gcj02ToBd09(gcj02[0], gcj02[1]);
  }

  /**
   * 百度坐标系转WGS84坐标系
   */
  static bd09ToWgs84(coordinate: Coordinate): Coordinate;
  static bd09ToWgs84(lng: number, lat: number): CoordinateArray;
  static bd09ToWgs84(lngOrCoord: number | Coordinate, lat?: number): Coordinate | CoordinateArray {
    if (typeof lngOrCoord === 'object') {
      const gcj02 = CoordTransform.bd09ToGcj02(lngOrCoord);
      return CoordTransform.gcj02ToWgs84(gcj02);
    }
    const gcj02 = bd09ToGcj02(lngOrCoord, lat!);
    return gcj02ToWgs84(gcj02[0], gcj02[1]);
  }
}
