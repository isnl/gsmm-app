// 封装uni的storage
export const UniStorage = {
  setItem: (key: string, value: any) => {
    uni.setStorageSync(key, value);
  },
  getItem: (key: string) => {
    return uni.getStorageSync(key);
  },
};
