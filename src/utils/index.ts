import type { Multimedia } from '@/stores/survey_list';
import jsonBig from 'json-bigint';

// 配置 json-bigint 自动将大整数转换为字符串
export const JSONbig = jsonBig({
  storeAsString: true, // 将大整数存储为字符串
});

export const goBack = () => {
  uni.navigateBack();
};

export const jsddFormat = (jsdd: string = '') => {
  return jsdd
    .split(',')
    .map(item => item.trim())
    .join('、');
};

export const goPdfPreview = (file: any) => {
  // if (file.url) {
  //   uni.navigateTo({
  //     url: `/pages/pdf_preview/index?fileUrl=${encodeURIComponent(file.url)}`,
  //   });
  // } else if (file.path) {
  //   uni.navigateTo({
  //     url: `/pages/pdf_preview/index?fileUrl=${encodeURIComponent(file.path)}`,
  //   });
  // }
};

export const getChartsColors = () => {
  return ['#0AA692', '#3B75FB', '#3FCE78', '#FF7878', '#916DC9', '#FFAD5D'];
};

export const getAllImagesFromMultimedia = (multimedia?: Multimedia[]) => {
  if (!multimedia) return [];
  console.log('multimedia', multimedia);

  return multimedia.filter(item => {
    if (item.path) {
      return item.path.includes('.jpeg') || item.path.includes('.jpg') || item.path.includes('.png');
    } else if (item.fileType) {
      if (item.fileType === 'image') {
        return true;
      } else {
        return false;
      }
    }
  });
};

export const checkIsVideo = (path: string = ''): boolean => {
  return path.includes('.mp4') || path.includes('.MP4') || path.includes('.wav') || path.includes('.WAV') || path === 'video';
};

export const checkIsImage = (path: string = ''): boolean => {
  return path.includes('.jpg') || path.includes('.png') || path.includes('.jpeg') || path === 'image';
};

export const uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const formatInvestigateStatus = (status: string) => {
  switch (status) {
    case '待完成':
      return '待调查';
    case '进行中':
      return '调查中';
    case '已完成':
      return '已调查';
    default:
      return status;
  }
};

export const getInvestigateStatusClass = (item: any) => {
  switch (item.investigateStatus) {
    case '待调查':
      return '!bg-#999';
    case '待完成':
      return '!bg-#999';
    case '调查中':
      return '!bg-#225ed5';
    case '进行中':
      return '!bg-#225ed5';
    case '已调查':
      return '!bg-#00bf9f';
    case '已完成':
      return '!bg-#00bf9f';
    default:
      break;
  }
};

// 导出导航工具函数
export { openNavigation } from './navigation';

//坐标系转化
export function transformFromGCJ02ToWGS84(lat: number, lng: number) {
  const EARTH_RADIUS = 6378137.0;
  const PI = Math.PI;

  function transformLat(lng: number, lat: number) {
    let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
    ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0;
    ret += ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) * 2.0) / 3.0;
    ret += ((160.0 * Math.sin((lat / 12.0) * PI) + 320 * Math.sin((lat * PI) / 30.0)) * 2.0) / 3.0;
    return ret;
  }

  function transformLng(lng: number, lat: number) {
    let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
    ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0;
    ret += ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) * 2.0) / 3.0;
    ret += ((150.0 * Math.sin((lng / 12.0) * PI) + 300.0 * Math.sin((lng / 30.0) * PI)) * 2.0) / 3.0;
    return ret;
  }

  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  let radLat = (lat / 180.0) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - 0.00669342162296594323 * Math.pow(magic, 2);
  let sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((EARTH_RADIUS * (1 - 0.006)) / (magic * sqrtMagic)) * PI);
  dLng = (dLng * 180.0) / ((EARTH_RADIUS / sqrtMagic) * Math.cos(radLat) * PI);
  let newLat = lat - dLat;
  let newLng = lng - dLng;

  return {
    lat: newLat,
    lng: newLng,
  };
}

export const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes === 0) return '0 MB';

  const sizeInMB = sizeInBytes / (1024 * 1024);
  if (sizeInMB < 1) {
    const sizeInKB = sizeInBytes / 1024;
    return sizeInKB.toFixed(1) + ' KB';
  } else if (sizeInMB < 1024) {
    return sizeInMB.toFixed(1) + ' MB';
  } else {
    const sizeInGB = sizeInMB / 1024;
    return sizeInGB.toFixed(1) + ' GB';
  }
};
/**
 * 递归删除指定目录数据
 * @returns
 */
export const clearDirectory = async (path: string) => {
  try {
    await new Promise<void>(resolve => {
      plus.io.resolveLocalFileSystemURL(
        path,
        entry => {
          // 递归删除目录及其所有内容
          entry.removeRecursively(
            () => {
              console.log(`递归删除区域目录成功: ${path}`);
              resolve();
            },
            error => {
              console.log(`递归删除区域目录失败: ${path}`, error);
              resolve();
            },
          );
        },
        () => {
          console.log(`区域目录不存在: ${path}`);
          resolve();
        },
      );
    });
  } catch (error) {
    console.warn('删除区域目录异常:', error);
  }
};
