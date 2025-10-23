// API基础URL配置
// const BASE_URL = 'http://192.168.0.104:8080/api';
// const BASE_URL = "http://47.92.103.246:8084/api";
const BASE_URL = 'http://47.92.103.246:18083/api';
// const BASE_URL = 'http://113.140.95.222:11010/api';
import { useSurveyTokenStore } from '@/stores/token';

// 接口返回数据类型
export interface ApiResponse<T = any> {
  statusCode: number;
  data: T;
  [key: string]: any;
}

// Token刷新响应类型
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// 请求方法类型
export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// 请求参数类型
export type RequestParams = Record<string, any>;

// 请求队列类型
type QueueCallback = () => void;

// uni请求结果类型
interface UniRequestResult<T = any> {
  data: T;
  statusCode: number;
  header: Record<string, string>;
  cookies: string[];
}

// 存储等待中的请求队列
let requestQueue: QueueCallback[] = [];

// 是否正在刷新token
let isRefreshing: boolean = false;

/**
 * 刷新token的方法
 * @returns {Promise<boolean>} 刷新结果
 */
async function refreshToken(): Promise<boolean> {
  try {
    const rToken = uni.getStorageSync('refreshToken');

    const [error, res] = (await uni.request({
      url: `${BASE_URL}/refresh_token`,
      method: 'POST',
      header: {
        'content-type': 'application/json',
      },
      data: {
        refreshToken: rToken,
      },
    })) as unknown as [any, UniRequestResult<TokenResponse>];

    if (!error && res.statusCode === 200 && res.data) {
      const surveyTokenStore = useSurveyTokenStore();
      const { setAccessToken, setRefreshToken } = surveyTokenStore;
      //  保存新的 token
      setAccessToken(res.data.accessToken);
      setRefreshToken(res.data.refreshToken);
      return true;
    }
    return false;
  } catch (error) {
    console.error('刷新token失败:', error);
    return false;
  }
}

/**
 * 网络请求服务
 * @param {Object} options - 请求配置对象
 * @param {string} options.url - 请求地址
 * @param {RequestParams} [options.params={}] - 请求参数
 * @param {RequestMethod} [options.method='GET'] - 请求方式
 * @returns {Promise<ApiResponse>} 请求响应Promise
 */
export function service<T = any>({
  url,
  params = {},
  method = 'GET',
  header = {},
}: {
  url: string;
  params?: RequestParams | FormData;
  method?: RequestMethod;
  header?: Record<string, string>;
}): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    let token = '';

    try {
      const surveyTokenStore = useSurveyTokenStore();
      const { accessToken } = surveyTokenStore;
      token = accessToken || '';
    } catch (e) {
      console.error('获取token失败:', e);
    }

    const fullUrl = `${BASE_URL}${url}`;
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      ...header,
    };

    if (!url.includes('login') && !url.includes('change_password_for_expired') && token) {
      headers.authorization = `Bearer ${token}`;
    }

    const request = (): void => {
      uni.request({
        url: fullUrl,
        data: params,
        method: method as any,
        header: headers,
        success: (res: any) => {
          if (res.statusCode === 200) {
            resolve(res as ApiResponse<T>);
          } else {
            reject(new Error('服务器错误，请稍后再试'));
          }
        },
        fail: err => {
          uni.showToast({
            title: '加载失败，请检查网络！',
            icon: 'none',
          });
          reject(err);
        },
        complete: async (res: any) => {
          // 处理认证失败
          if (res.statusCode === 401) {
            if (url.includes('login')) {
              if (res.data === 'Too many failed attempts. Account locked for 10 minutes') {
                uni.showToast({
                  title: '密码错误次数过多，账号已锁定，请10分钟后再试！',
                  icon: 'none',
                });
                return;
              }

              if (res.data === 'Password expired') {
                return;
              }

              uni.showToast({
                title: '账号或密码错误',
                icon: 'none',
              });
              return;
            }

            // 创建一个Promise来处理重试逻辑
            const retryRequest = new Promise<void>(resolve => {
              requestQueue.push(() => {
                const surveyTokenStore = useSurveyTokenStore();
                const { accessToken } = surveyTokenStore;
                headers.authorization = `Bearer ${accessToken}`;
                request(); // 重新发起请求
                resolve();
              });
            });

            // 处理token过期
            if (!isRefreshing) {
              isRefreshing = true;
              const refreshResult = await refreshToken();

              if (refreshResult) {
                // 刷新token成功，重试所有请求
                requestQueue.forEach(cb => cb());
                requestQueue = [];
              } else {
                // 刷新token失败，清空队列并跳转登录页
                requestQueue = [];
                try {
                  uni.showTabBar();
                } catch (error) {}
                uni.reLaunch({
                  url: '/pages/login/index',
                });
              }
              isRefreshing = false;
            }

            return retryRequest;
          }

          // 处理服务器错误
          if (res.statusCode === 500) {
            reject(new Error('服务器错误，请稍后再试'));
          }
        },
      });
    };

    request();
  });
}

/**
 * 文件上传服务
 * @param {Object} options - 上传配置对象
 * @param {string} options.url - 上传地址
 * @param {Array} options.files - 需要上传的文件数组对象，每个对象中包含name和filePath
 * @param {string} options.name - 文件对应的 key (仅在不使用files时生效)
 * @param {Record<string, any>} [options.formData={}] - 附加的表单数据
 * @param {Record<string, string>} [options.header={}] - 请求头
 * @returns {Promise<ApiResponse>} 上传响应Promise
 */
export function uploadService<T = any>({
  url,
  files,
  formData = {},
  header = {},
}: {
  url: string;
  files: UniApp.UploadFileOptionFiles[];
  formData?: Record<string, any>;
  header?: Record<string, string>;
}): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    let token = '';

    try {
      const surveyTokenStore = useSurveyTokenStore();
      const { accessToken } = surveyTokenStore;
      token = accessToken || '';
    } catch (e) {
      console.error('获取token失败:', e);
    }

    const fullUrl = `${BASE_URL}${url}`;
    const headers: Record<string, string> = {
      ...header,
    };

    if (!url.includes('login') && token) {
      headers.authorization = `Bearer ${token}`;
    }

    const upload = (): void => {
      uni.uploadFile({
        url: fullUrl,
        files, // 直接传入files数组
        formData,
        header: headers,
        success: res => {
          // uploadFile 返回的数据是字符串，需要解析为 JSON
          try {
            const data = JSON.parse(res.data);
            resolve({
              statusCode: res.statusCode,
              data,
            } as ApiResponse<T>);
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              data: res.data as any,
            } as ApiResponse<T>);
          }
        },
        fail: err => {
          uni.showToast({
            title: '上传失败，请检查网络！',
            icon: 'none',
          });
          reject(err);
        },
        complete: async (res: any) => {
          // 处理认证失败
          if (res.statusCode === 401) {
            // 创建一个Promise来处理重试逻辑
            const retryRequest = new Promise<void>(resolve => {
              requestQueue.push(() => {
                const surveyTokenStore = useSurveyTokenStore();
                const { accessToken } = surveyTokenStore;
                headers.authorization = `Bearer ${accessToken}`;
                upload(); // 重新发起上传
                resolve();
              });
            });

            // 处理token过期
            if (!isRefreshing) {
              isRefreshing = true;
              const refreshResult = await refreshToken();

              if (refreshResult) {
                // 刷新token成功，重试所有请求
                requestQueue.forEach(cb => cb());
                requestQueue = [];
              } else {
                // 刷新token失败，清空队列并跳转登录页
                requestQueue = [];
                try {
                  uni.showTabBar();
                } catch (error) {}
                uni.reLaunch({
                  url: '/pages/login/index',
                });
              }
              isRefreshing = false;
            }

            return retryRequest;
          }

          // 处理服务器错误
          if (res.statusCode === 500) {
            uni.showToast({
              title: '服务器错误，请稍后再试',
              icon: 'none',
            });
          }
        },
      });
    };

    upload();
  });
}
