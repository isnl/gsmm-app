/**
 * 导航工具类
 * 用于打开外部地图应用进行导航
 */
import { wgs84ToGcj02 } from './coordtransform';
/**
 * 地图类型
 */
export type MapType = 'gaode' | 'baidu' | 'tencent' | 'auto';

/**
 * 打开外部导航应用
 * @param latitude 纬度
 * @param longitude 经度
 * @param name 地点名称，默认为"古树位置"
 * @param mapType 地图类型，默认为自动选择
 */
export const openNavigation = (latitude: number | string, longitude: number | string, name: string = '古树位置', mapType: MapType = 'auto') => {
  // 参数验证
  if (!latitude || !longitude) {
    uni.showToast({
      title: '经纬度信息不完整，无法导航',
      icon: 'none',
    });
    return;
  }

  // #ifdef APP-PLUS
  // 根据地图类型选择相应的导航方式
  switch (mapType) {
    case 'gaode':
      openGaodeMap(Number(longitude), Number(latitude), name);
      break;
    case 'baidu':
      openBaiduMap(Number(longitude), Number(latitude), name);
      break;
    case 'tencent':
      openTencentMap(Number(longitude), Number(latitude), name);
      break;
    case 'auto':
    default:
      // 自动选择模式：优先高德，其次百度，最后腾讯
      openGaodeMap(Number(longitude), Number(latitude), name, () => {
        openBaiduMap(Number(longitude), Number(latitude), name, () => {
          openTencentMap(Number(longitude), Number(latitude), name, () => {
            uni.showToast({
              title: '未安装地图应用，无法导航',
              icon: 'none',
            });
          });
        });
      });
      break;
  }
  // #endif

  // #ifdef H5
  // H5环境下提示用户
  uni.showToast({
    title: 'H5环境暂不支持导航功能',
    icon: 'none',
  });
  // #endif
};

/**
 * 打开高德地图导航
 */
const openGaodeMap = (longitude: number, latitude: number, name: string, onError?: () => void) => {
  const gaodeLatlng = wgs84ToGcj02(longitude, latitude);
  const url = `androidamap://viewMap?sourceApplication=古树名木调查&poiname=${encodeURIComponent(name)}&lat=${gaodeLatlng[1]}&lon=${gaodeLatlng[0]}&dev=0`;

  plus.runtime.openURL(url, err => {
    if (err && onError) {
      onError();
    } else if (err) {
      uni.showToast({
        title: '未安装高德地图',
        icon: 'none',
      });
    }
  });
};

/**
 * 打开百度地图导航
 */
const openBaiduMap = (longitude: number, latitude: number, name: string, onError?: () => void) => {
  const url = `baidumap://map/marker?location=${latitude},${longitude}&title=${encodeURIComponent(name)}&coord_type=wgs84&src=古树名木调查`;

  plus.runtime.openURL(url, err => {
    if (err && onError) {
      onError();
    } else if (err) {
      uni.showToast({
        title: '未安装百度地图',
        icon: 'none',
      });
    }
  });
};

/**
 * 打开腾讯地图导航
 */
const openTencentMap = (longitude: number, latitude: number, name: string, onError?: () => void) => {
  const gcjLatlng = wgs84ToGcj02(longitude, latitude);
  const url = `qqmap://map/marker?type=drive&from=我的位置&to=${encodeURIComponent(name)}&tocoord=${gcjLatlng[1]},${gcjLatlng[0]}&walk=walk`;

  plus.runtime.openURL(url, err => {
    if (err && onError) {
      onError();
    } else if (err) {
      uni.showToast({
        title: '未安装腾讯地图',
        icon: 'none',
      });
    }
  });
};
