export class MapTileCache {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'MapTileCache';
  private readonly storeName = 'tiles';
  private readonly progressStoreName = 'downloadProgress';
  private downloadController: AbortController | null = null;
  private isDownloading = false;
  private downloadProgress = {
    isActive: false,
    progress: 0,
    downloadedCount: 0,
    totalCount: 0,
    cityName: '',
    bounds: null as any,
    minZoom: 0,
    maxZoom: 0,
  };

  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 2);

      request.onupgradeneeded = event => {
        this.db = (event.target as IDBOpenDBRequest).result;

        if (!this.db.objectStoreNames.contains(this.storeName)) {
          this.db.createObjectStore(this.storeName, { keyPath: 'id' });
        }

        if (!this.db.objectStoreNames.contains(this.progressStoreName)) {
          this.db.createObjectStore(this.progressStoreName, { keyPath: 'id' });
        }
      };

      request.onsuccess = event => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.loadDownloadProgress();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }
  async testDownloadTile() {
    try {
      // 测试zoom=19的瓦片
      const testUrl = `/proxy_geoserver/gsmm/gwc/service/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=gsmm:wrj&STYLE=&TILEMATRIXSET=My_EPSG:4490&TILEMATRIX=My_EPSG:4490:19&zoomOffset=1&TILEROW=88550&TILECOL=399201&FORMAT=image/png`;

      const response = await fetch(testUrl);
      console.log(`测试瓦片响应: ${response.status} ${response.statusText}`);

      if (response.ok) {
        console.log('✅ 测试瓦片下载成功');
      } else {
        const text = await response.text();
        console.log('❌ 测试瓦片失败:', text);
      }
    } catch (error) {
      console.error('测试瓦片错误:', error);
    }
  }
  // 保存下载进度
  private async saveDownloadProgress() {
    if (!this.db) return;

    const transaction = this.db.transaction([this.progressStoreName], 'readwrite');
    const store = transaction.objectStore(this.progressStoreName);

    const progressRecord = {
      id: 'current_download',
      ...this.downloadProgress,
      updatedAt: Date.now(),
    };

    store.put(progressRecord);
  }

  // 加载下载进度
  private async loadDownloadProgress() {
    if (!this.db) return;

    const transaction = this.db.transaction([this.progressStoreName], 'readonly');
    const store = transaction.objectStore(this.progressStoreName);

    return new Promise<void>(resolve => {
      const request = store.get('current_download');
      request.onsuccess = () => {
        if (request.result) {
          this.downloadProgress = { ...request.result };
          delete this.downloadProgress.id;
        }
        resolve();
      };
      request.onerror = () => resolve();
    });
  }

  // 清除下载进度（公开方法）
  async clearDownloadProgress() {
    if (!this.db) return;

    // 先暂停下载
    this.pauseDownload();

    try {
      const transaction = this.db.transaction([this.progressStoreName], 'readwrite');
      const store = transaction.objectStore(this.progressStoreName);
      await new Promise((resolve, reject) => {
        const request = store.delete('current_download');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      this.downloadProgress = {
        isActive: false,
        progress: 0,
        downloadedCount: 0,
        totalCount: 0,
        cityName: '',
        bounds: null,
        minZoom: 0,
        maxZoom: 0,
      };

      console.log('下载进度已清除');
    } catch (error) {
      console.error('清除下载进度失败:', error);
    }
  }

  // 获取当前下载状态
  getDownloadStatus() {
    return {
      isDownloading: this.isDownloading,
      ...this.downloadProgress,
    };
  }

  // 暂停下载
  pauseDownload() {
    console.log('开始暂停下载...');
    if (this.downloadController) {
      this.downloadController.abort();
      this.downloadController = null;
      console.log('下载控制器已终止');
    }
    this.isDownloading = false;
    console.log('下载状态已设为false');
  }

  private getTileId(z: number, x: number, y: number, layerType = 'img'): string {
    return `${layerType}_${z}_${x}_${y}`;
  }

  // 保存瓦片到IndexedDB
  async saveTile(z: number, x: number, y: number, tileData: string, layerType = 'img') {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.getTileId(z, x, y, layerType);

    // 将base64转换为ArrayBuffer
    let arrayBuffer;
    if (tileData.startsWith('data:image')) {
      const base64Data = tileData.split(',')[1];
      const binaryString = atob(base64Data);
      arrayBuffer = new ArrayBuffer(binaryString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }
    } else {
      const binaryString = atob(tileData);
      arrayBuffer = new ArrayBuffer(binaryString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    const tileRecord = {
      id,
      z,
      x,
      y,
      layerType,
      data: arrayBuffer,
      createdAt: Date.now(),
    };

    return new Promise<void>((resolve, reject) => {
      const request = store.put(tileRecord);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 从IndexedDB获取瓦片
  async getTile(z: number, x: number, y: number, layerType = 'img'): Promise<string | null> {
    if (!this.db) return null;

    const id = this.getTileId(z, x, y, layerType);
    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        if (result?.data) {
          // 将ArrayBuffer转换为base64
          const uint8Array = new Uint8Array(result.data);
          const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
          const base64 = btoa(binaryString);
          resolve(`data:image/png;base64,${base64}`);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // 检查瓦片是否存在
  async hasTile(z: number, x: number, y: number, layerType = 'img'): Promise<boolean> {
    if (!this.db) return false;

    const id = this.getTileId(z, x, y, layerType);
    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.count(id);
      request.onsuccess = () => resolve(request.result > 0);
      request.onerror = () => reject(request.error);
    });
  }

  // 下载并保存单个瓦片
  private async downloadAndSaveTile(url: string, z: number, x: number, y: number, layerType: string) {
    try {
      console.log(`尝试下载瓦片: ${url}`);

      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit',
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const base64 = this.arrayBufferToBase64(arrayBuffer);
        await this.saveTile(z, x, y, base64, layerType);
        console.log(`瓦片下载成功: ${z}/${x}/${y}`);
      } else {
        console.error(`瓦片下载失败 ${z}/${x}/${y}: HTTP ${response.status} ${response.statusText}`);
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`下载瓦片失败 ${layerType} ${z}/${x}/${y}:`, error);
      throw error;
    }
  }

  // ArrayBuffer转Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // 经纬度转瓦片坐标
  deg2tile(lat: number, lon: number, zoom: number) {
    const latRad = (lat * Math.PI) / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor(((lon + 180) / 360) * n);
    const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);

    console.log(`坐标转换: lat=${lat}, lon=${lon}, zoom=${zoom} -> x=${x}, y=${y}`);
    return { x, y };
  }
  // 测试瓦片坐标转换
  testTileConversion() {
    // 已知正确的瓦片坐标
    const knownTile = { x: 399203, y: 88551, z: 19 };
    const bounds = {
      north: 29.196832,
      south: 29.196084,
      west: 94.110509,
      east: 94.111547,
    };

    console.log('=== 瓦片坐标转换测试 ===');
    console.log('已知正确瓦片:', knownTile);
    console.log('边界:', bounds);

    // 测试不同的Y轴计算方式
    const n = Math.pow(2, 19);
    const x = Math.floor(((bounds.west + 180) / 360) * n);

    // 方式1: 标准Web Mercator
    const y1 = Math.floor(((1 - Math.asinh(Math.tan((bounds.north * Math.PI) / 180)) / Math.PI) / 2) * n);

    // 方式2: 简单纬度划分（从北到南）
    const y2 = Math.floor(((90 - bounds.north) / 180) * n);

    // 方式3: 简单纬度划分（从南到北）
    const y3 = Math.floor(((bounds.north + 90) / 180) * n);

    // 方式4: CGCS2000可能的计算方式
    const y4 = Math.floor(n - ((bounds.north + 90) / 180) * n);
    // 新的尝试
    const y5 = Math.floor((((bounds.north + 90) / 180) * n) / 2); // 除以2
    const y6 = Math.floor((((90 - bounds.north) / 180) * n) / 2); // 除以2
    const y7 = Math.floor(n / 2 - (((bounds.north + 90) / 180) * n) / 2); // 中心对称
    const y8 = Math.floor(n / 4 + ((bounds.north / 180) * n) / 2); // 四分之一偏移

    // 反推公式：已知y=88551，求应该用什么公式
    const targetY = 88551;
    const ratio = targetY / n; // 0.169...
    const latFromRatio = ratio * 180 - 90; // 反推纬度

    console.log(`X计算结果: ${x} (期望: ${knownTile.x})`);
    console.log(`Y方式1 (Web Mercator): ${y1}`);
    console.log(`Y方式2 (90-lat)/180: ${y2}`);
    console.log(`Y方式3 (lat+90)/180: ${y3}`);
    console.log(`Y方式4 n-(lat+90)/180: ${y4}`);
    console.log(`Y方式5 (lat+90)/180/2: ${y5}`);
    console.log(`Y方式6 (90-lat)/180/2: ${y6}`);
    console.log(`Y方式7 中心对称: ${y7}`);
    console.log(`Y方式8 四分之一偏移: ${y8}`);
    console.log(`期望Y: ${knownTile.y}`);
    console.log(`目标比例: ${ratio}`);
    console.log(`反推纬度: ${latFromRatio}`);
  }
  // EPSG:4490坐标系的经纬度转瓦片坐标
  deg2tile4490(lat: number, lon: number, zoom: number) {
    // EPSG:4490使用简单的经纬度划分
    const n = Math.pow(2, zoom);

    // 经度范围: -180 到 180
    const x = Math.floor(((lon + 180) / 360) * n + 0.5);

    // 纬度计算：基于你的参考数据校准
    // lat≈29.196, zoom=19 应该得到 y≈88550
    // 尝试不同的计算方式
    const y = Math.floor((((90 - lat) / 180) * n) / 2);

    console.log(`EPSG:4490坐标转换: lat=${lat}, lon=${lon}, zoom=${zoom} -> x=${x}, y=${y}`);
    return { x, y };
  }
  // 批量下载瓦片（支持暂停/恢复）
  async downloadCityTiles(cityName: string, bounds: any, minZoom: number, maxZoom: number, onProgress?: (progress: number) => void) {
    // 添加测试
    // this.testTileConversion();
    if (this.isDownloading) {
      throw new Error('已有下载任务在进行中');
    }
    console.log('开始下载瓦片，边界:', bounds);
    console.log('缩放级别:', minZoom, 'to', maxZoom);

    this.isDownloading = true;
    this.downloadController = new AbortController();

    // 如果是新的下载任务，重置进度
    if (
      !this.downloadProgress.isActive ||
      this.downloadProgress.cityName !== cityName ||
      JSON.stringify(this.downloadProgress.bounds) !== JSON.stringify(bounds)
    ) {
      // 计算总瓦片数
      let totalTiles = 0;
      for (let z = minZoom; z <= maxZoom; z++) {
        const nwTile = this.deg2tile4490(bounds.north, bounds.west, z);
        const seTile = this.deg2tile4490(bounds.south, bounds.east, z);
        // totalTiles += (seTile.x - nwTile.x + 1) * (seTile.y - nwTile.y + 1); // 只有一个图层
        console.log(`级别${z}: NW(${nwTile.x},${nwTile.y}) SE(${seTile.x},${seTile.y})`);

        const tilesInLevel = (seTile.x - nwTile.x + 1) * (seTile.y - nwTile.y + 1);
        console.log(`级别${z}瓦片数: ${tilesInLevel}`);
        totalTiles += tilesInLevel;
      }
      console.log('总瓦片数:', totalTiles);
      this.downloadProgress = {
        isActive: true,
        progress: 0,
        downloadedCount: 0,
        totalCount: totalTiles,
        cityName,
        bounds,
        minZoom,
        maxZoom,
      };

      // 保存初始进度
      await this.saveDownloadProgress();
    }

    const tiandituKey = '64a7440068a2bbc276c11927b54458f4';
    const maxConcurrent = 2;

    try {
      // 生成所有瓦片坐标
      const allTiles: Array<{ z: number; x: number; y: number }> = [];
      for (let z = minZoom; z <= maxZoom; z++) {
        const nwTile = this.deg2tile4490(bounds.north, bounds.west, z);
        const seTile = this.deg2tile4490(bounds.south, bounds.east, z);

        // 确保坐标范围正确
        const minX = Math.min(nwTile.x, seTile.x);
        const maxX = Math.max(nwTile.x, seTile.x);
        const minY = Math.min(nwTile.y, seTile.y);
        const maxY = Math.max(nwTile.y, seTile.y);

        for (let x = minX; x <= maxX; x++) {
          for (let y = minY; y <= maxY; y++) {
            allTiles.push({ z, x, y });
          }
        }
      }

      // 从当前进度开始下载
      const startIndex = this.downloadProgress.downloadedCount; // 移除除以2
      const remainingTiles = allTiles.slice(startIndex);

      for (let i = 0; i < remainingTiles.length; i += maxConcurrent) {
        // 检查是否被取消
        if (this.downloadController?.signal.aborted || !this.isDownloading) {
          console.log('下载被中断');
          throw new Error('下载已暂停');
        }

        const batch = remainingTiles.slice(i, i + maxConcurrent);

        await Promise.allSettled(
          batch.map(async ({ z, x, y }) => {
            try {
              // 再次检查是否被取消
              if (this.downloadController?.signal.aborted || !this.isDownloading) {
                return;
              }

              // 下载影像瓦片
              if (!(await this.hasTile(z, x, y, 'img'))) {
                const imgUrl = `/proxy_geoserver/gsmm/gwc/service/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=gsmm:wrj&STYLE=&TILEMATRIXSET=My_EPSG:4490&TILEMATRIX=My_EPSG:4490:${z}&TILEROW=${y}&TILECOL=${x}&FORMAT=image/png`;
                await this.downloadAndSaveTile(imgUrl, z, x, y, 'img');
              }
              this.downloadProgress.downloadedCount++;

              // 再次检查是否被取消
              // if (this.downloadController?.signal.aborted || !this.isDownloading) {
              //   return;
              // }

              // 下载注记瓦片
              // if (!(await this.hasTile(z, x, y, 'cia'))) {
              //   const ciaUrl = `https://t0.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&tk=${tiandituKey}`;
              //   await this.downloadAndSaveTile(ciaUrl, z, x, y, 'cia');
              // }
              // this.downloadProgress.downloadedCount++;

              this.downloadProgress.progress = this.downloadProgress.downloadedCount / this.downloadProgress.totalCount;

              // 调用进度回调
              onProgress?.(this.downloadProgress.progress);

              // 定期保存进度
              if (this.downloadProgress.downloadedCount % 10 === 0) {
                await this.saveDownloadProgress();
              }
            } catch (error) {
              console.error(`下载瓦片失败 ${z}/${x}/${y}:`, error);
              this.downloadProgress.downloadedCount += 1;
            }
          }),
        );

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // 下载完成，清除进度
      await this.clearDownloadProgress();
    } catch (error) {
      if (error.message === '下载已暂停') {
        console.log('下载已暂停，进度已保存');
        await this.saveDownloadProgress();
      } else {
        throw error;
      }
    } finally {
      this.isDownloading = false;
      this.downloadController = null;
    }
  }

  // 获取缓存统计
  async getCacheStats() {
    if (!this.db) return { totalTiles: 0 };

    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve({ totalTiles: request.result });
      request.onerror = () => reject(request.error);
    });
  }

  // 获取缓存大小估算
  async getCacheSize(): Promise<string> {
    const stats = await this.getCacheStats();
    // 估算每个瓦片平均15KB
    const estimatedSize = stats.totalTiles * 15 * 1024;
    return this.formatBytes(estimatedSize);
  }

  // 格式化字节数
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 清除指定区域的缓存
  async clearAreaCache(bounds: any, minZoom: number, maxZoom: number) {
    if (!this.db) return;

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    for (let z = minZoom; z <= maxZoom; z++) {
      const nwTile = this.deg2tile4490(bounds.north, bounds.west, z);
      const seTile = this.deg2tile4490(bounds.south, bounds.east, z);

      for (let x = nwTile.x; x <= seTile.x; x++) {
        for (let y = nwTile.y; y <= seTile.y; y++) {
          const imgId = this.getTileId(z, x, y, 'img');
          // const ciaId = this.getTileId(z, x, y, 'cia');

          store.delete(imgId);
          // store.delete(ciaId);
        }
      }
    }
  }

  // 清理旧缓存
  async cleanupOldCache(keepDays = 30) {
    if (!this.db) return;

    const cutoffTime = Date.now() - keepDays * 24 * 60 * 60 * 1000;
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const index = store.index('createdAt');

    const range = IDBKeyRange.upperBound(cutoffTime);
    const request = index.openCursor(range);

    request.onsuccess = event => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }

  // 获取指定区域的缓存统计
  async getAreaCacheStats(bounds: any, minZoom: number, maxZoom: number) {
    if (!this.db) return { totalTiles: 0, cachedTiles: 0, cacheRate: '0.00' };

    let totalTiles = 0;
    let cachedTiles = 0;

    for (let z = minZoom; z <= maxZoom; z++) {
      const nwTile = this.deg2tile4490(bounds.north, bounds.west, z);
      const seTile = this.deg2tile4490(bounds.south, bounds.east, z);

      for (let x = nwTile.x; x <= seTile.x; x++) {
        for (let y = nwTile.y; y <= seTile.y; y++) {
          totalTiles += 1; // img + cia

          if (await this.hasTile(z, x, y, 'img')) {
            cachedTiles++;
          }
          // if (await this.hasTile(z, x, y, 'cia')) {
          //   cachedTiles++;
          // }
        }
      }
    }

    const cacheRate = totalTiles > 0 ? ((cachedTiles / totalTiles) * 100).toFixed(2) : '0.00';

    return {
      totalTiles,
      cachedTiles,
      cacheRate,
    };
  }

  // 清空所有缓存
  async clearAllCache() {
    if (!this.db) return;

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        console.log('所有缓存已清空');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const mapTileCache = new MapTileCache();
