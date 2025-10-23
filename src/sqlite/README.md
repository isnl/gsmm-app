# SQLite 统一封装

这是一个为 uni-app 项目设计的 SQLite 统一封装，支持 H5 和 Android 环境自动切换。

## 特性

- 🔄 **自动环境检测**: 自动识别 H5 和 Android 环境
- 🗄️ **统一接口**: 提供一致的数据库操作接口
- 💾 **智能缓存**: 内置缓存管理系统
- 🔧 **单例模式**: 数据库连接复用，避免重复创建
- 📱 **离线支持**: 完整的离线数据存储方案
- 🚀 **开箱即用**: 简单的 API 设计，快速上手

## 环境支持

### H5 环境
- 使用 `sql.js` 库
- 数据存储在 localStorage 中
- 支持完整的 SQLite 语法

### Android 环境
- 使用 uni-app 的 `plus.sqlite` API
- 数据存储在设备本地数据库中
- 原生性能，支持大数据量

## 安装

```bash
npm install sql.js @types/sql.js
```

## 快速开始

### 1. 基本使用

```typescript
import { DatabaseFactory, getDefaultDatabase } from '@/sqlite'

// 初始化应用时
async function initApp() {
  // 获取数据库实例
  const db = await getDefaultDatabase()
  
  // 创建表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE
    )
  `)
  
  // 插入数据
  const result = await db.run(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    ['张三', 'zhangsan@example.com']
  )
  
  // 查询数据
  const users = await db.all('SELECT * FROM users')
  console.log(users)
}
```

### 2. 缓存管理

```typescript
import { getDefaultCacheManager } from '@/sqlite'

async function useCache() {
  const cache = await getDefaultCacheManager()
  
  // 设置缓存（永久）
  await cache.set('user_profile', { id: 1, name: '张三' })
  
  // 设置缓存（30秒过期）
  await cache.set('api_token', 'abc123', 30)
  
  // 获取缓存
  const profile = await cache.get('user_profile')
  
  // 清理过期缓存
  await cache.cleanup()
}
```

### 3. API 数据缓存

```typescript
import { ApiCacheService } from '@/sqlite/example'

const apiCache = new ApiCacheService()

// 获取用户列表（自动缓存）
const users = await apiCache.getUserList()

// 强制刷新
const freshUsers = await apiCache.getUserList(true)

// 获取用户详情
const userDetail = await apiCache.getUserDetail(1)
```

## API 文档

### DatabaseFactory

数据库工厂类，管理数据库实例。

```typescript
// 获取数据库实例
const db = await DatabaseFactory.getDatabase('myapp')

// 关闭指定数据库
await DatabaseFactory.closeDatabase('myapp')

// 关闭所有数据库
await DatabaseFactory.closeAll()

// 获取当前环境
const env = DatabaseFactory.getEnvironment() // 'h5' | 'android'
```

### IDatabase 接口

统一的数据库操作接口。

```typescript
interface IDatabase {
  init(): Promise<void>
  exec(sql: string, params?: any[]): Promise<any[]>
  run(sql: string, params?: any[]): Promise<{ lastInsertRowid?: number; changes?: number }>
  get(sql: string, params?: any[]): Promise<any>
  all(sql: string, params?: any[]): Promise<any[]>
  close(): Promise<void>
}
```

### CacheManager

缓存管理类。

```typescript
const cache = new CacheManager(db, 'cache_table')
await cache.init()

// 设置缓存
await cache.set(key, value, ttl?) // ttl: 过期时间（秒）

// 获取缓存
const value = await cache.get<T>(key)

// 删除缓存
await cache.delete(key)

// 清理过期缓存
await cache.cleanup()

// 清空所有缓存
await cache.clear()

// 获取统计信息
const stats = await cache.getStats()
```

## 最佳实践

### 1. 应用初始化

```typescript
// main.ts
import { initializeApp } from '@/sqlite/example'

async function bootstrap() {
  try {
    await initializeApp()
    console.log('数据库初始化成功')
  } catch (error) {
    console.error('数据库初始化失败:', error)
  }
}

bootstrap()
```

### 2. 数据服务层

```typescript
// services/userService.ts
import { getDefaultDatabase } from '@/sqlite'

export class UserService {
  private db = getDefaultDatabase()
  
  async createUser(user: { name: string; email: string }) {
    const result = await this.db.run(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [user.name, user.email]
    )
    return result.lastInsertRowid
  }
  
  async getUserById(id: number) {
    return await this.db.get('SELECT * FROM users WHERE id = ?', [id])
  }
  
  async getAllUsers() {
    return await this.db.all('SELECT * FROM users ORDER BY created_at DESC')
  }
}
```

### 3. 离线数据同步

```typescript
// services/syncService.ts
import { OfflineDataSync } from '@/sqlite/example'

export class SyncService {
  private sync = new OfflineDataSync()
  
  async syncData() {
    const pendingData = await this.sync.getPendingSyncData()
    
    for (const item of pendingData) {
      try {
        // 同步到服务器
        await this.uploadToServer(item)
        
        // 标记为已同步
        await this.sync.markAsSynced(item.id)
      } catch (error) {
        console.error('同步失败:', error)
      }
    }
    
    // 清理已同步数据
    await this.sync.cleanupSyncedData()
  }
}
```

## 注意事项

1. **H5 环境限制**: 
   - 数据存储在 localStorage 中，有大小限制
   - 浏览器清理缓存时数据会丢失
   - 建议定期备份重要数据

2. **Android 环境**:
   - 需要在 manifest.json 中配置相关权限
   - 数据库文件存储在应用私有目录

3. **性能优化**:
   - 使用事务处理批量操作
   - 合理设置缓存过期时间
   - 定期清理过期数据

4. **错误处理**:
   - 所有数据库操作都应该包装在 try-catch 中
   - 网络异常时优雅降级到缓存数据

## 示例项目

查看 `src/sqlite/example.ts` 文件获取完整的使用示例。

## 许可证

MIT License
