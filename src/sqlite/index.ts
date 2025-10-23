// SQLite 统一封装，支持 H5 和 Android 环境
import type { Database as SqlJsDatabase } from "sql.js";

// 统一的数据库接口
export interface IDatabase {
  init(): Promise<void>;
  exec(sql: string, params?: any[]): Promise<any[]>;
  run(
    sql: string,
    params?: any[]
  ): Promise<{ lastInsertRowid?: number; changes?: number }>;
  get(sql: string, params?: any[]): Promise<any>;
  all(sql: string, params?: any[]): Promise<any[]>;
  close(): Promise<void>;
}

// 查询结果类型
export interface QueryResult {
  columns: string[];
  values: any[][];
}

// 环境类型
export type Environment = "h5" | "android";

// 检测当前运行环境
export function detectEnvironment(): Environment {
  // #ifdef H5
  return "h5";
  // #endif

  // #ifdef APP-PLUS
  return "android";
  // #endif

  // 默认返回 h5（开发环境）
  return "h5";
}

// H5 环境的 SQLite 实现
class H5Database implements IDatabase {
  private db: SqlJsDatabase | null = null;
  private dbName: string;

  constructor(dbName: string) {
    this.dbName = dbName;
  }

  async init(): Promise<void> {
    try {
      // 动态导入 sql.js
      const initSqlJs = (await import("sql.js")).default;
      const SQL = await initSqlJs({
        // 可以配置 wasm 文件路径
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
      });

      // 尝试从 localStorage 加载已有数据库
      const savedDb = localStorage.getItem(`sqlite_${this.dbName}`);
      if (savedDb) {
        const uint8Array = new Uint8Array(JSON.parse(savedDb));
        this.db = new SQL.Database(uint8Array);
      } else {
        this.db = new SQL.Database();
      }
    } catch (error) {
      console.error("H5 SQLite 初始化失败:", error);
      throw error;
    }
  }

  async exec(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) throw new Error("数据库未初始化");

    try {
      const results = this.db.exec(sql, params);
      this.saveToStorage();
      return results;
    } catch (error) {
      console.error("H5 SQLite exec 错误:", error);
      throw error;
    }
  }

  async run(
    sql: string,
    params: any[] = []
  ): Promise<{ lastInsertRowid?: number; changes?: number }> {
    if (!this.db) throw new Error("数据库未初始化");

    try {
      this.db.run(sql, params);
      this.saveToStorage();
      return {
        lastInsertRowid: this.db.exec("SELECT last_insert_rowid()")[0]
          ?.values[0]?.[0] as number,
        changes: this.db.getRowsModified(),
      };
    } catch (error) {
      console.error("H5 SQLite run 错误:", error);
      throw error;
    }
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error("数据库未初始化");

    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.getAsObject(params);
      stmt.free();
      return result;
    } catch (error) {
      console.error("H5 SQLite get 错误:", error);
      throw error;
    }
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) throw new Error("数据库未初始化");

    try {
      const stmt = this.db.prepare(sql);
      const results: any[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    } catch (error) {
      console.error("H5 SQLite all 错误:", error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.saveToStorage();
      this.db.close();
      this.db = null;
    }
  }

  private saveToStorage(): void {
    if (this.db) {
      const data = this.db.export();
      localStorage.setItem(
        `sqlite_${this.dbName}`,
        JSON.stringify(Array.from(data))
      );
    }
  }
}

// Android 环境的 SQLite 实现
class AndroidDatabase implements IDatabase {
  private dbName: string;
  private dbPath: string;

  constructor(dbName: string) {
    this.dbName = dbName;
    this.dbPath = `_doc/${dbName}.db`;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      (plus.sqlite as any).openDatabase({
        name: this.dbName,
        path: this.dbPath,
        success: () => {
          console.log("Android SQLite 数据库打开成功");
          resolve();
        },
        fail: (error: any) => {
          console.error("Android SQLite 数据库打开失败:", error);
          reject(error);
        },
      });
    });
  }

  async exec(sql: string, params: any[] = []): Promise<any[]> {
    // 注意：Android环境下的plus.sqlite.executeSql不直接支持参数绑定
    // 如果需要参数绑定，需要手动处理SQL字符串
    const finalSql = this.bindParams(sql, params);

    return new Promise((resolve, reject) => {
      (plus.sqlite as any).executeSql({
        name: this.dbName,
        sql: finalSql,
        success: (result: any) => {
          resolve(result);
        },
        fail: (error: any) => {
          console.error("Android SQLite exec 错误:", error);
          reject(error);
        },
      });
    });
  }

  async run(
    sql: string,
    params: any[] = []
  ): Promise<{ lastInsertRowid?: number; changes?: number }> {
    const finalSql = this.bindParams(sql, params);

    return new Promise((resolve, reject) => {
      (plus.sqlite as any).executeSql({
        name: this.dbName,
        sql: finalSql,
        success: (result: any) => {
          resolve({
            lastInsertRowid: result.insertId,
            changes: result.rowsAffected,
          });
        },
        fail: (error: any) => {
          console.error("Android SQLite run 错误:", error);
          reject(error);
        },
      });
    });
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    const finalSql = this.bindParams(sql, params);

    return new Promise((resolve, reject) => {
      (plus.sqlite as any).selectSql({
        name: this.dbName,
        sql: finalSql,
        success: (result: any) => {
          resolve(result.length > 0 ? result[0] : null);
        },
        fail: (error: any) => {
          console.error("Android SQLite get 错误:", error);
          reject(error);
        },
      });
    });
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    const finalSql = this.bindParams(sql, params);

    return new Promise((resolve, reject) => {
      (plus.sqlite as any).selectSql({
        name: this.dbName,
        sql: finalSql,
        success: (result: any) => {
          resolve(result || []);
        },
        fail: (error: any) => {
          console.error("Android SQLite all 错误:", error);
          reject(error);
        },
      });
    });
  }

  // 简单的参数绑定实现（用于Android环境）
  private bindParams(sql: string, params: any[] = []): string {
    if (!params || params.length === 0) {
      return sql;
    }

    let result = sql;
    params.forEach(param => {
      const value =
        typeof param === "string" ? `'${param.replace(/'/g, "''")}'` : param;
      result = result.replace("?", String(value));
    });

    return result;
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      (plus.sqlite as any).closeDatabase({
        name: this.dbName,
        success: () => {
          console.log("Android SQLite 数据库关闭成功");
          resolve();
        },
        fail: (error: any) => {
          console.error("Android SQLite 数据库关闭失败:", error);
          reject(error);
        },
      });
    });
  }
}

// 数据库工厂类
export class DatabaseFactory {
  private static instances: Map<string, IDatabase> = new Map();
  private static environment: Environment;

  // 初始化工厂
  static init() {
    this.environment = detectEnvironment();
    console.log(`SQLite 环境检测: ${this.environment}`);
  }

  // 获取数据库实例（单例模式）
  static async getDatabase(dbName: string = "default"): Promise<IDatabase> {
    if (!this.environment) {
      this.init();
    }

    const key = `${this.environment}_${dbName}`;

    if (this.instances.has(key)) {
      return this.instances.get(key)!;
    }

    let database: IDatabase;

    if (this.environment === "h5") {
      database = new H5Database(dbName);
    } else {
      database = new AndroidDatabase(dbName);
    }

    await database.init();
    this.instances.set(key, database);

    return database;
  }

  // 关闭所有数据库连接
  static async closeAll(): Promise<void> {
    const promises = Array.from(this.instances.values()).map(db => db.close());
    await Promise.all(promises);
    this.instances.clear();
  }

  // 关闭指定数据库
  static async closeDatabase(dbName: string = "default"): Promise<void> {
    const key = `${this.environment}_${dbName}`;
    const database = this.instances.get(key);

    if (database) {
      await database.close();
      this.instances.delete(key);
    }
  }

  // 获取当前环境
  static getEnvironment(): Environment {
    if (!this.environment) {
      this.init();
    }
    return this.environment;
  }
}

// 缓存管理类
export class CacheManager {
  private db: IDatabase;
  private tableName: string;

  constructor(db: IDatabase, tableName: string = "cache") {
    this.db = db;
    this.tableName = tableName;
  }

  // 初始化缓存表
  async init(): Promise<void> {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `;

    await this.db.exec(createTableSql);

    // 创建过期时间索引
    const createIndexSql = `
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_expires
      ON ${this.tableName}(expires_at)
    `;

    await this.db.exec(createIndexSql);
  }

  // 设置缓存
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const jsonValue = JSON.stringify(value);
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = ttl ? now + ttl : null;

    const sql = `
      INSERT OR REPLACE INTO ${this.tableName}
      (key, value, expires_at, updated_at)
      VALUES (?, ?, ?, ?)
    `;

    await this.db.run(sql, [key, jsonValue, expiresAt, now]);
  }

  // 获取缓存
  async get<T = any>(key: string): Promise<T | null> {
    const now = Math.floor(Date.now() / 1000);

    const sql = `
      SELECT value FROM ${this.tableName}
      WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)
    `;

    const result = await this.db.get(sql, [key, now]);

    if (result && result.value) {
      try {
        return JSON.parse(result.value);
      } catch (error) {
        console.error("缓存数据解析失败:", error);
        await this.delete(key);
        return null;
      }
    }

    return null;
  }

  // 删除缓存
  async delete(key: string): Promise<void> {
    const sql = `DELETE FROM ${this.tableName} WHERE key = ?`;
    await this.db.run(sql, [key]);
  }

  // 清理过期缓存
  async cleanup(): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const sql = `DELETE FROM ${this.tableName} WHERE expires_at IS NOT NULL AND expires_at <= ?`;
    await this.db.run(sql, [now]);
  }

  // 清空所有缓存
  async clear(): Promise<void> {
    const sql = `DELETE FROM ${this.tableName}`;
    await this.db.exec(sql);
  }

  // 获取缓存统计信息
  async getStats(): Promise<{ total: number; expired: number }> {
    const now = Math.floor(Date.now() / 1000);

    const totalResult = await this.db.get(
      `SELECT COUNT(*) as count FROM ${this.tableName}`
    );
    const expiredResult = await this.db.get(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE expires_at IS NOT NULL AND expires_at <= ?`,
      [now]
    );

    return {
      total: totalResult?.count || 0,
      expired: expiredResult?.count || 0,
    };
  }
}

// 便捷的全局实例
let defaultDatabase: IDatabase | null = null;
let defaultCacheManager: CacheManager | null = null;

// 获取默认数据库实例
export async function getDefaultDatabase(): Promise<IDatabase> {
  if (!defaultDatabase) {
    defaultDatabase = await DatabaseFactory.getDatabase();
  }
  return defaultDatabase;
}

// 获取默认缓存管理器
export async function getDefaultCacheManager(): Promise<CacheManager> {
  if (!defaultCacheManager) {
    const db = await getDefaultDatabase();
    defaultCacheManager = new CacheManager(db);
    await defaultCacheManager.init();
  }
  return defaultCacheManager;
}

// 导出主要类和函数
export { H5Database, AndroidDatabase };
