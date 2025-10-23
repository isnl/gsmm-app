/**
 * 日志记录工具类
 * 支持写入本地文件和控制台输出
 * 参考Android原生文件操作，支持日志文件管理
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

// 日志管理工具类接口
interface ILogCat {
  main: any;
  Environment: any;
  BufferedWriter: any;
  File: any;
  FileOutputStream: any;
  OutputStreamWriter: any;
  LogPath: string;
  saveDays: number;
  isInitialized: boolean;
  init(): void;
  cleanOldLogs(): void;
  writeLog(level: string, message: string, data?: any): void;
  getFormatDate(date: Date): string;
  getFormatDateTime(date: Date): string;
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
}

// 日志管理工具类
export const LogCat: ILogCat = {
  main: null as any,
  Environment: null as any,
  BufferedWriter: null as any,
  File: null as any,
  FileOutputStream: null as any,
  OutputStreamWriter: null as any,
  LogPath: '', // 日志存储目录
  saveDays: 14, // 日志最大存储天数
  isInitialized: false,

  /**
   * 初始化日志系统
   */
  init: function () {
    try {
      // #ifdef APP-PLUS
      if (typeof plus !== 'undefined' && plus.android) {
        this.main = plus.android.runtimeMainActivity();
        this.Environment = plus.android.importClass('android.os.Environment');
        this.BufferedWriter = plus.android.importClass('java.io.BufferedWriter');
        this.File = plus.android.importClass('java.io.File');
        this.FileOutputStream = plus.android.importClass('java.io.FileOutputStream');
        this.OutputStreamWriter = plus.android.importClass('java.io.OutputStreamWriter');

        // 设置日志存储路径
        if (this.Environment.MEDIA_MOUNTED || !this.Environment.isExternalStorageRemovable()) {
          this.LogPath = this.main.getExternalFilesDir(null).getPath();
        } else {
          this.LogPath = this.main.getFilesDir().getPath();
        }

        // 清理旧日志文件
        this.cleanOldLogs();
        this.isInitialized = true;
        console.log('📝 LogCat初始化成功，日志路径:', this.LogPath);
      }
      // #endif
    } catch (error) {
      console.error('📝 LogCat初始化失败:', error);
    }
  },

  /**
   * 清理旧日志文件
   */
  cleanOldLogs: function () {
    try {
      if (!this.LogPath || !this.File) return;

      const fileManager = new this.File(this.LogPath);
      const files = fileManager.listFiles();
      if (!files) return;

      const now = new Date();
      const maxSavedDay = this.getFormatDate(new Date(now.getTime() - this.saveDays * 24 * 60 * 60 * 1000));

      // 遍历目录下的日志文件，删除过期日志
      for (let i = 0; i < files.length; i++) {
        const fileName = files[i].getName();
        const nameParts = fileName.split('.');
        if (nameParts.length > 0) {
          const name = nameParts[0];
          const parts = name.split('_');
          if (parts.length >= 2 && parts[0] === 'log') {
            const time = parts[1];
            if (time <= maxSavedDay) {
              files[i].delete();
              console.log('📝 删除过期日志文件:', fileName);
            }
          }
        }
      }
    } catch (error) {
      console.error('📝 清理旧日志失败:', error);
    }
  },

  /**
   * 写入日志到文件
   */
  writeLog: function (level: string, message: string, data?: any) {
    try {
      // #ifdef APP-PLUS
      if (!this.isInitialized || !this.LogPath) {
        console.warn('📝 LogCat未初始化，跳过文件写入');
        return;
      }

      const now = new Date();
      const date = this.getFormatDate(now);
      const datetime = this.getFormatDateTime(now);

      // 处理数据
      let dataStr = '';
      if (data) {
        try {
          dataStr = typeof data === 'string' ? data : JSON.stringify(data);
        } catch (e) {
          dataStr = '[无法序列化的数据]';
        }
      }

      // 文件名
      const fileName = this.LogPath + '/log_' + date + '.txt';
      // 写入的内容
      const content = `${datetime} [${level}] ${message}${dataStr ? ' | ' + dataStr : ''}\n`;

      // 确保目录存在
      const file = new this.File(this.LogPath);
      if (!file.exists()) {
        file.mkdirs();
      }

      let fos = null;
      let bw = null;
      try {
        fos = new this.FileOutputStream(fileName, true);
        bw = new this.BufferedWriter(new this.OutputStreamWriter(fos));
        bw.append(content);
      } catch (e) {
        console.error('📝 写入日志文件异常:', e);
      } finally {
        try {
          if (bw != null) {
            bw.close();
          }
          if (fos != null) {
            fos.close();
          }
        } catch (closeEx) {
          console.error('📝 关闭文件流异常:', closeEx);
        }
      }
      // #endif
    } catch (error) {
      console.error('📝 日志写入失败:', error);
    }
  },

  /**
   * 格式化日期 YYYY-MM-DD
   */
  getFormatDate: function (date: Date): string {
    const year = date.getFullYear();
    let month: string | number = date.getMonth() + 1;
    let day: string | number = date.getDate();
    month = month > 9 ? month : '0' + month;
    day = day > 9 ? day : '0' + day;
    return `${year}-${month}-${day}`;
  },

  /**
   * 格式化日期时间 YYYY-MM-DD HH:mm:ss
   */
  getFormatDateTime: function (date: Date): string {
    const year = date.getFullYear();
    let month: string | number = date.getMonth() + 1;
    let day: string | number = date.getDate();
    let hour: string | number = date.getHours();
    let min: string | number = date.getMinutes();
    let second: string | number = date.getSeconds();

    month = month > 9 ? month : '0' + month;
    day = day > 9 ? day : '0' + day;
    hour = hour > 9 ? hour : '0' + hour;
    min = min > 9 ? min : '0' + min;
    second = second > 9 ? second : '0' + second;

    return `${year}-${month}-${day} ${hour}:${min}:${second}`;
  },

  /**
   * DEBUG 级别日志
   */
  debug(message: string, data?: any) {
    // 控制台输出
    console.log(`[DEBUG] ${message}`, data || '');
    // 写入文件
    this.writeLog('DEBUG', message, data);
  },

  /**
   * INFO 级别日志
   */
  info(message: string, data?: any) {
    // 控制台输出
    console.info(`[INFO] ${message}`, data || '');
    // 写入文件
    this.writeLog('INFO', message, data);
  },

  /**
   * WARN 级别日志
   */
  warn(message: string, data?: any) {
    // 控制台输出
    console.warn(`[WARN] ${message}`, data || '');
    // 写入文件
    this.writeLog('WARN', message, data);
  },

  /**
   * ERROR 级别日志
   */
  error(message: string, data?: any) {
    // 控制台输出
    console.error(`[ERROR] ${message}`, data || '');
    // 写入文件
    this.writeLog('ERROR', message, data);
  },
};

// 为了向后兼容，也导出logger别名
export const logger = LogCat;
