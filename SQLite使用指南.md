# SQLite 统一封装使用指南

## 概述

这套SQLite封装为你的uni-app项目提供了一个统一的数据库操作接口，能够自动检测运行环境（H5或Android），并使用相应的SQLite实现：

- **H5环境**: 使用 `sql.js` 库，数据存储在 localStorage 中
- **Android环境**: 使用 uni-app 的 `plus.sqlite` API，数据存储在设备本地数据库中

## 主要特性

✅ **自动环境检测** - 无需手动配置，自动适配H5和Android环境  
✅ **统一API接口** - 相同的代码在不同环境下都能正常工作  
✅ **智能缓存管理** - 内置缓存系统，支持TTL过期机制  
✅ **单例模式** - 避免重复创建数据库连接  
✅ **离线数据支持** - 完整的离线数据存储和同步方案  
✅ **类型安全** - 完整的TypeScript类型定义  

## 快速开始

### 1. 基本使用

```typescript
import { getDefaultDatabase } from '@/sqlite'

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
```

### 2. 缓存使用

```typescript
import { getDefaultCacheManager } from '@/sqlite'

const cache = await getDefaultCacheManager()

// 设置缓存（永久）
await cache.set('user_profile', { id: 1, name: '张三' })

// 设置缓存（30秒过期）
await cache.set('api_token', 'abc123', 30)

// 获取缓存
const profile = await cache.get('user_profile')
```

### 3. API数据缓存示例

```typescript
class UserService {
  private cache = await getDefaultCacheManager()
  
  async getUserList(refresh = false) {
    const cacheKey = 'user_list'
    
    // 尝试从缓存获取
    if (!refresh) {
      const cached = await this.cache.get(cacheKey)
      if (cached) return cached
    }
    
    // 从API获取数据
    const users = await this.fetchFromAPI()
    
    // 缓存5分钟
    await this.cache.set(cacheKey, users, 300)
    
    return users
  }
}
```

## 项目集成

### 1. 已完成的集成

项目已经自动完成了以下集成：

- ✅ 安装了必要的依赖 (`sql.js`, `@types/sql.js`)
- ✅ 在 `src/main.ts` 中初始化了数据库工厂
- ✅ 创建了完整的SQLite封装 (`src/sqlite/index.ts`)
- ✅ 提供了使用示例 (`src/sqlite/example.ts`)
- ✅ 创建了测试文件 (`src/sqlite/test.ts`)
- ✅ 添加了演示页面 (`src/pages/sqlite-demo.vue`)

### 2. 访问演示页面

你可以通过以下方式访问SQLite演示页面：

```typescript
// 在任何页面中跳转到演示页面
uni.navigateTo({
  url: '/pages/sqlite-demo'
})
```

或者在H5环境下直接访问：`http://localhost:端口/pages/sqlite-demo`

## 环境配置

### H5环境配置

H5环境无需额外配置，但需要注意：

1. **数据存储限制**: 数据存储在localStorage中，有大小限制（通常5-10MB）
2. **数据持久性**: 用户清理浏览器缓存时数据会丢失
3. **WASM文件**: sql.js需要加载WASM文件，确保网络连接正常

### Android环境配置

Android环境需要确保manifest.json中包含必要的权限：

```json
{
  "app-plus": {
    "distribute": {
      "android": {
        "permissions": [
          "<uses-permission android:name=\"android.permission.WRITE_EXTERNAL_STORAGE\"/>",
          "<uses-permission android:name=\"android.permission.READ_EXTERNAL_STORAGE\"/>"
        ]
      }
    }
  }
}
```

## 最佳实践

### 1. 数据库初始化

```typescript
// 在App.vue的onLaunch中初始化
export default {
  async onLaunch() {
    try {
      const db = await getDefaultDatabase()
      await this.createTables(db)
      console.log('数据库初始化成功')
    } catch (error) {
      console.error('数据库初始化失败:', error)
    }
  },
  
  async createTables(db) {
    // 创建应用所需的表结构
    await db.exec(`
      CREATE TABLE IF NOT EXISTS app_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE,
        value TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)
  }
}
```

### 2. 错误处理

```typescript
async function safeDbOperation() {
  try {
    const db = await getDefaultDatabase()
    const result = await db.run('INSERT INTO users (name) VALUES (?)', ['测试'])
    return result
  } catch (error) {
    console.error('数据库操作失败:', error)
    
    // 可以显示用户友好的错误信息
    uni.showToast({
      title: '数据保存失败',
      icon: 'none'
    })
    
    throw error
  }
}
```

### 3. 离线数据同步

```typescript
class OfflineSync {
  async syncWhenOnline() {
    // 检查网络状态
    const networkType = await uni.getNetworkType()
    if (networkType.networkType === 'none') {
      console.log('无网络连接，跳过同步')
      return
    }
    
    // 获取待同步数据
    const db = await getDefaultDatabase()
    const pendingData = await db.all(
      'SELECT * FROM sync_queue WHERE synced = 0'
    )
    
    // 同步到服务器
    for (const item of pendingData) {
      try {
        await this.uploadToServer(item)
        await db.run('UPDATE sync_queue SET synced = 1 WHERE id = ?', [item.id])
      } catch (error) {
        console.error('同步失败:', error)
      }
    }
  }
}
```

## 调试和测试

### 1. 运行测试

```typescript
// 在浏览器控制台中运行
import { runAllTests } from '@/sqlite/test'
await runAllTests()
```

### 2. 查看数据库内容

在H5环境下，你可以在浏览器开发者工具中查看localStorage来检查数据库内容：

```javascript
// 查看所有SQLite相关的localStorage项
Object.keys(localStorage)
  .filter(key => key.startsWith('sqlite_'))
  .forEach(key => {
    console.log(key, localStorage.getItem(key))
  })
```

### 3. 性能监控

```typescript
// 监控数据库操作性能
async function monitoredDbOperation() {
  const start = Date.now()
  const db = await getDefaultDatabase()
  const result = await db.all('SELECT * FROM large_table')
  const duration = Date.now() - start
  
  console.log(`查询耗时: ${duration}ms, 结果数量: ${result.length}`)
  
  return result
}
```

## 常见问题

### Q: H5环境下数据丢失怎么办？
A: H5环境数据存储在localStorage中，建议定期备份重要数据到服务器。

### Q: Android环境下数据库文件在哪里？
A: 数据库文件存储在应用的私有目录中，路径为 `_doc/数据库名.db`。

### Q: 如何处理大量数据？
A: 建议使用分页查询、索引优化，以及定期清理过期数据。

### Q: 能否在多个页面同时使用数据库？
A: 可以，DatabaseFactory使用单例模式，确保多个页面共享同一个数据库实例。

## 技术支持

如果遇到问题，可以：

1. 查看 `src/sqlite/README.md` 获取详细API文档
2. 运行 `src/sqlite/test.ts` 中的测试用例
3. 访问 `/pages/sqlite-demo` 页面进行交互式测试
4. 检查浏览器控制台的错误信息

---

这套SQLite封装为你的uni-app项目提供了强大而灵活的离线数据存储能力，让你能够专注于业务逻辑的实现，而不用担心底层的环境差异。
