// @ts-nocheck
import { useLocationStore, LocationMode } from '@/stores/location';
import { transformFromGCJ02ToWGS84 } from '@/utils';

// 位置信息接口
export interface LocationInfo {
  latitude: number;
  longitude: number;
  address?: string;
  provider?: string;
}

// 检查网络连接状态
export const checkNetworkConnection = (): Promise<boolean> => {
  return new Promise(resolve => {
    uni.getNetworkType({
      success: (res: any) => {
        resolve(res.networkType !== 'none');
      },
      fail: () => {
        resolve(false);
      },
    });
  });
};

// 检查定位权限
export const checkLocationPermission = (): boolean => {
  const main = plus.android.runtimeMainActivity();
  const PackageManager = plus.android.importClass('android.content.pm.PackageManager');
  const fineLocationPermission = 'android.permission.ACCESS_FINE_LOCATION';
  const coarseLocationPermission = 'android.permission.ACCESS_COARSE_LOCATION';

  try {
    const fineLocationResult = main.checkSelfPermission(fineLocationPermission);
    const coarseLocationResult = main.checkSelfPermission(coarseLocationPermission);

    // 至少需要有一个位置权限
    return fineLocationResult === PackageManager.PERMISSION_GRANTED || coarseLocationResult === PackageManager.PERMISSION_GRANTED;
  } catch (e) {
    console.error('检查权限失败：', e);
    return false;
  }
};

// 检查是否有精确位置权限
export const checkFineLocationPermission = (): boolean => {
  const main = plus.android.runtimeMainActivity();
  const PackageManager = plus.android.importClass('android.content.pm.PackageManager');
  const permission = 'android.permission.ACCESS_FINE_LOCATION';

  try {
    const checkResult = main.checkSelfPermission(permission);
    return checkResult === PackageManager.PERMISSION_GRANTED;
  } catch (e) {
    console.error('检查精确位置权限失败：', e);
    return false;
  }
};

// 检查是否有后台位置权限
export const checkBackgroundLocationPermission = (): boolean => {
  const main = plus.android.runtimeMainActivity();
  const PackageManager = plus.android.importClass('android.content.pm.PackageManager');
  const permission = 'android.permission.ACCESS_BACKGROUND_LOCATION';

  try {
    const checkResult = main.checkSelfPermission(permission);
    return checkResult === PackageManager.PERMISSION_GRANTED;
  } catch (e) {
    console.error('检查后台位置权限失败：', e);
    return false;
  }
};

// 请求定位权限（同时申请精确和大概位置权限）
export const requestLocationPermission = (): Promise<boolean> => {
  return new Promise(resolve => {
    const main = plus.android.runtimeMainActivity();
    const fineLocationPermission = 'android.permission.ACCESS_FINE_LOCATION';
    const coarseLocationPermission = 'android.permission.ACCESS_COARSE_LOCATION';

    try {
      const Array = plus.android.importClass('java.lang.String[]');
      const permissions = new Array([fineLocationPermission, coarseLocationPermission]);

      // 设置权限申请回调
      const requestCode = 1001;
      main.requestPermissions(permissions, requestCode);

      // 监听权限申请结果
      const onRequestPermissionsResult = (requestCodeResult: number, permissionsResult: any, grantResults: any) => {
        if (requestCodeResult === requestCode) {
          const PackageManager = plus.android.importClass('android.content.pm.PackageManager');
          let hasPermission = false;

          for (let i = 0; i < grantResults.length; i++) {
            if (grantResults[i] === PackageManager.PERMISSION_GRANTED) {
              hasPermission = true;
              break;
            }
          }

          resolve(hasPermission);
        }
      };

      // 注册权限申请结果监听器
      main.onRequestPermissionsResult = onRequestPermissionsResult;
    } catch (e) {
      console.error('请求权限失败：', e);
      resolve(false);
    }
  });
};

// 打开GPS定位权限
export const openGps = (): void => {
  let system = uni.getSystemInfoSync(); // 获取系统信息
  if (system.platform === 'android') {
    // 判断平台
    var context = plus.android.importClass('android.content.Context');
    var locationManager = plus.android.importClass('android.location.LocationManager');
    var main = plus.android.runtimeMainActivity();
    var mainSvr = main.getSystemService(context.LOCATION_SERVICE);
    if (!mainSvr.isProviderEnabled(locationManager.GPS_PROVIDER)) {
      uni.showModal({
        title: '提示',
        content: '请打开定位服务功能',
        showCancel: false, // 不显示取消按钮
        success() {
          var Intent = plus.android.importClass('android.content.Intent');
          var Settings = plus.android.importClass('android.provider.Settings');
          var intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
          main.startActivity(intent); // 打开系统设置GPS服务页面
        },
      });
    }
  }
};

// 打开应用设置页面
export const openAppSettings = (): void => {
  try {
    const main = plus.android.runtimeMainActivity();
    const Intent = plus.android.importClass('android.content.Intent');
    const Settings = plus.android.importClass('android.provider.Settings');
    const Uri = plus.android.importClass('android.net.Uri');

    const intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    const uri = Uri.fromParts('package', main.getPackageName(), null);
    intent.setData(uri);
    main.startActivity(intent);
  } catch (e) {
    console.error('打开应用设置失败：', e);
    uni.showToast({
      title: '请手动前往设置开启定位权限',
      icon: 'none',
      duration: 2000,
    });
  }
};

// 检查并引导用户开启精确位置权限
export const checkAndGuideForPreciseLocation = (): Promise<boolean> => {
  return new Promise(resolve => {
    if (checkFineLocationPermission()) {
      resolve(true);
      return;
    }

    resolve(false);

    // 如果没有精确位置权限，引导用户开启
    uni.showModal({
      title: '建议开启精确位置',
      content: '为了获得更准确的定位信息，建议在应用权限设置中开启"精确位置"选项。',
      confirmText: '去设置',
      cancelText: '稍后再说',
      success: (res: any) => {
        if (res.confirm) {
          openAppSettings();
        }
      },
    });
  });
};

// 高德在线定位方法
export const getAmapOnlineLocation = (): Promise<LocationInfo> => {
  return new Promise((resolve, reject) => {
    // 检查运行环境
    // #ifdef APP-PLUS
    // APP环境使用plus.geolocation（高德定位）
    plus.geolocation.getCurrentPosition(
      (position: any) => {
        const { lat, lng } = transformFromGCJ02ToWGS84(position.coords.latitude, position.coords.longitude);
        resolve({
          latitude: lat || 0,
          longitude: lng || 0,
          address: position.addresses || '',
          provider: 'amap-online',
        });
      },
      (error: any) => {
        console.error('高德在线定位失败', error);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
        provider: 'amap',
      },
    );
    // #endif

    // #ifdef H5
    // H5环境使用浏览器原生定位API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude || 0,
            longitude: position.coords.longitude || 0,
            address: '', // H5环境下无法直接获取地址
            provider: 'h5-amap-online',
          });
        },
        error => {
          console.error('H5高德在线定位失败', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        },
      );
    } else {
      reject(new Error('浏览器不支持定位功能'));
    }
    // #endif
  });
};

// 系统在线定位方法
export const getSystemOnlineLocation = (): Promise<LocationInfo> => {
  return new Promise((resolve, reject) => {
    // 检查运行环境
    // #ifdef APP-PLUS
    // APP环境使用plus.geolocation（系统定位）
    plus.geolocation.getCurrentPosition(
      (position: any) => {
        resolve({
          latitude: position.coords?.latitude || 0,
          longitude: position.coords?.longitude || 0,
          address: position.addresses || '',
          provider: 'system-online',
        });
      },
      (error: any) => {
        console.error('系统在线定位失败', error);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
        provider: 'system',
        coordsType: 'wgs84',
      },
    );
    // #endif

    // #ifdef H5
    // H5环境使用浏览器原生定位API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude || 0,
            longitude: position.coords.longitude || 0,
            address: '', // H5环境下无法直接获取地址
            provider: 'h5-system-online',
          });
        },
        error => {
          console.error('H5系统在线定位失败', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        },
      );
    } else {
      reject(new Error('浏览器不支持定位功能'));
    }
    // #endif
  });
};

// 离线定位方法
export const getOfflineLocation = (): Promise<LocationInfo> => {
  return new Promise((resolve, reject) => {
    try {
      // 使用原生定位
      const main = plus.android.runtimeMainActivity();
      const Context = plus.android.importClass('android.content.Context');
      const LocationManager = plus.android.importClass('android.location.LocationManager');

      // 获取位置管理器
      const locationManager = main.getSystemService(Context.LOCATION_SERVICE);

      // 检查GPS是否启用
      const isGPSEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
      // 检查网络定位是否启用
      const isNetworkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);

      if (!isGPSEnabled && !isNetworkEnabled) {
        reject(new Error('请开启位置服务'));
        return;
      }

      let lastKnownLocation = null;

      // 优先尝试GPS定位
      if (isGPSEnabled) {
        lastKnownLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
      }

      // 如果GPS没有最后位置，尝试网络定位
      if (!lastKnownLocation && isNetworkEnabled) {
        lastKnownLocation = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
      }

      if (lastKnownLocation) {
        resolve({
          latitude: plus.android.invoke(lastKnownLocation, 'getLatitude'),
          longitude: plus.android.invoke(lastKnownLocation, 'getLongitude'),
          address: '', // 离线状态下无法解析地址
          provider: plus.android.invoke(lastKnownLocation, 'getProvider'),
        });
      } else {
        reject(new Error('无法获取位置信息'));
      }
    } catch (e) {
      console.error('获取位置失败：', e);
      reject(e);
    }
  });
};

// 综合获取位置方法
export const getLocationComplete = (): Promise<LocationInfo> => {
  return new Promise(async (resolve, reject) => {
    // 获取定位设置
    const locationStore = useLocationStore();
    const currentMode = locationStore.currentLocationMode;

    // 检查权限
    if (!checkLocationPermission()) {
      // 尝试申请权限
      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        uni.showModal({
          title: '需要定位权限',
          content: '应用需要定位权限才能获取位置信息。为了获得更精确的位置，建议开启"精确位置"权限。',
          confirmText: '去设置',
          cancelText: '取消',
          success: (res: any) => {
            if (res.confirm) {
              openAppSettings();
            }
          },
        });
        reject(new Error('缺少定位权限'));
        return;
      }
    }

    // 检查是否有精确位置权限，如果没有则提示用户
    if (!checkFineLocationPermission()) {
      console.warn('当前只有大概位置权限，建议开启精确位置权限以获得更准确的定位');
    }

    // 根据选择的定位方式进行定位
    try {
      switch (currentMode) {
        case LocationMode.AMAP_ONLINE:
          // 高德在线定位 - 需要网络
          const hasNetworkForAmap = await checkNetworkConnection();
          if (!hasNetworkForAmap) {
            throw new Error('高德在线定位需要网络连接，请检查网络设置');
          }
          const amapResult = await getAmapOnlineLocation();
          resolve(amapResult);
          break;

        case LocationMode.SYSTEM:
          // 系统定位 - 需要网络
          const hasNetworkForSystem = await checkNetworkConnection();
          if (!hasNetworkForSystem) {
            throw new Error('系统定位需要网络连接，请检查网络设置');
          }
          const systemResult = await getSystemOnlineLocation();
          resolve(systemResult);
          break;

        case LocationMode.OFFLINE:
          // 离线定位 - 不需要网络
          const offlineResult = await getOfflineLocation();
          resolve(offlineResult);
          break;

        default:
          // 默认使用高德在线定位
          const hasNetworkDefault = await checkNetworkConnection();
          if (!hasNetworkDefault) {
            throw new Error('高德在线定位需要网络连接，请检查网络设置');
          }
          const defaultResult = await getAmapOnlineLocation();
          resolve(defaultResult);
          break;
      }
    } catch (error) {
      console.error(`定位失败 (${locationStore.getLocationModeName(currentMode)}):`, error);
      reject(error);
    }
  });
};
