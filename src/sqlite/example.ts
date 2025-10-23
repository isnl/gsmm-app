// SQLite 使用示例
import { 
  DatabaseFactory, 
  CacheManager, 
  getDefaultDatabase, 
  getDefaultCacheManager,
  type IDatabase 
} from './index'

// 示例：基本数据库操作
export async function basicDatabaseExample() {
  try {
    // 获取数据库实例
    const db = await DatabaseFactory.getDatabase('myapp')
    
    // 创建表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)
    
    // 插入数据
    const insertResult = await db.run(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      ['张三', 'zhangsan@example.com']
    )
    console.log('插入成功，ID:', insertResult.lastInsertRowid)
    
    // 查询单条数据
    const user = await db.get('SELECT * FROM users WHERE id = ?', [insertResult.lastInsertRowid])
    console.log('查询到用户:', user)
    
    // 查询多条数据
    const users = await db.all('SELECT * FROM users ORDER BY created_at DESC')
    console.log('所有用户:', users)
    
    // 更新数据
    await db.run('UPDATE users SET name = ? WHERE id = ?', ['李四', insertResult.lastInsertRowid])
    
    // 删除数据
    // await db.run('DELETE FROM users WHERE id = ?', [insertResult.lastInsertRowid])
    
  } catch (error) {
    console.error('数据库操作失败:', error)
  }
}

// 示例：缓存管理
export async function cacheExample() {
  try {
    // 获取缓存管理器
    const cache = await getDefaultCacheManager()
    
    // 设置缓存（永久）
    await cache.set('user_profile', {
      id: 1,
      name: '张三',
      avatar: 'https://example.com/avatar.jpg'
    })
    
    // 设置缓存（30秒过期）
    await cache.set('api_token', 'abc123token', 30)
    
    // 获取缓存
    const profile = await cache.get('user_profile')
    console.log('用户资料:', profile)
    
    const token = await cache.get('api_token')
    console.log('API Token:', token)
    
    // 获取缓存统计
    const stats = await cache.getStats()
    console.log('缓存统计:', stats)
    
    // 清理过期缓存
    await cache.cleanup()
    
  } catch (error) {
    console.error('缓存操作失败:', error)
  }
}

// 示例：API数据缓存
export class ApiCacheService {
  private cache: CacheManager
  private db: IDatabase
  
  constructor() {
    this.init()
  }
  
  private async init() {
    this.db = await getDefaultDatabase()
    this.cache = new CacheManager(this.db, 'api_cache')
    await this.cache.init()
  }
  
  // 获取用户列表（带缓存）
  async getUserList(refresh = false): Promise<any[]> {
    const cacheKey = 'user_list'
    
    if (!refresh) {
      const cached = await this.cache.get<any[]>(cacheKey)
      if (cached) {
        console.log('从缓存获取用户列表')
        return cached
      }
    }
    
    // 模拟API调用
    console.log('从API获取用户列表')
    const users = await this.fetchUsersFromApi()
    
    // 缓存5分钟
    await this.cache.set(cacheKey, users, 300)
    
    return users
  }
  
  // 获取用户详情（带缓存）
  async getUserDetail(userId: number, refresh = false): Promise<any> {
    const cacheKey = `user_detail_${userId}`
    
    if (!refresh) {
      const cached = await this.cache.get(cacheKey)
      if (cached) {
        console.log(`从缓存获取用户${userId}详情`)
        return cached
      }
    }
    
    // 模拟API调用
    console.log(`从API获取用户${userId}详情`)
    const user = await this.fetchUserDetailFromApi(userId)
    
    // 缓存10分钟
    await this.cache.set(cacheKey, user, 600)
    
    return user
  }
  
  // 清除用户相关缓存
  async clearUserCache(userId?: number): Promise<void> {
    if (userId) {
      await this.cache.delete(`user_detail_${userId}`)
    } else {
      await this.cache.delete('user_list')
      // 可以添加更多清理逻辑
    }
  }
  
  // 模拟API调用
  private async fetchUsersFromApi(): Promise<any[]> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return [
      { id: 1, name: '张三', email: 'zhangsan@example.com' },
      { id: 2, name: '李四', email: 'lisi@example.com' },
      { id: 3, name: '王五', email: 'wangwu@example.com' }
    ]
  }
  
  private async fetchUserDetailFromApi(userId: number): Promise<any> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return {
      id: userId,
      name: `用户${userId}`,
      email: `user${userId}@example.com`,
      profile: {
        age: 25 + userId,
        city: '北京',
        avatar: `https://example.com/avatar${userId}.jpg`
      }
    }
  }
}

// 示例：离线数据同步
export class OfflineDataSync {
  private db: IDatabase
  private cache: CacheManager
  
  constructor() {
    this.init()
  }
  
  private async init() {
    this.db = await getDefaultDatabase()
    this.cache = new CacheManager(this.db, 'sync_cache')
    await this.cache.init()
    
    // 创建同步队列表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        table_name TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        synced INTEGER DEFAULT 0
      )
    `)
  }
  
  // 添加到同步队列
  async addToSyncQueue(action: 'insert' | 'update' | 'delete', tableName: string, data: any): Promise<void> {
    await this.db.run(
      'INSERT INTO sync_queue (action, table_name, data) VALUES (?, ?, ?)',
      [action, tableName, JSON.stringify(data)]
    )
  }
  
  // 获取待同步数据
  async getPendingSyncData(): Promise<any[]> {
    return await this.db.all('SELECT * FROM sync_queue WHERE synced = 0 ORDER BY created_at ASC')
  }
  
  // 标记为已同步
  async markAsSynced(id: number): Promise<void> {
    await this.db.run('UPDATE sync_queue SET synced = 1 WHERE id = ?', [id])
  }
  
  // 清理已同步数据
  async cleanupSyncedData(): Promise<void> {
    await this.db.run('DELETE FROM sync_queue WHERE synced = 1 AND created_at < ?', [
      Math.floor(Date.now() / 1000) - 7 * 24 * 3600 // 7天前的数据
    ])
  }
}

// 示例：应用初始化
export async function initializeApp() {
  try {
    console.log('初始化SQLite数据库...')
    
    // 初始化数据库工厂
    DatabaseFactory.init()
    
    // 获取默认数据库
    const db = await getDefaultDatabase()
    
    // 创建应用所需的表
    await createAppTables(db)
    
    // 初始化缓存
    const cache = await getDefaultCacheManager()
    
    // 清理过期缓存
    await cache.cleanup()
    
    console.log('SQLite数据库初始化完成')
    console.log('当前环境:', DatabaseFactory.getEnvironment())
    
  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw error
  }
}

// 创建应用表结构
async function createAppTables(db: IDatabase) {
  // 用户表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      avatar TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `)
  
  // 设置表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `)
  
  // 日志表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `)
}
