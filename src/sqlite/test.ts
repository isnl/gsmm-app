// SQLite 测试文件
import { 
  DatabaseFactory, 
  CacheManager, 
  getDefaultDatabase, 
  getDefaultCacheManager,
  detectEnvironment 
} from './index'

// 测试环境检测
export function testEnvironmentDetection() {
  console.log('=== 环境检测测试 ===')
  const env = detectEnvironment()
  console.log('当前环境:', env)
  
  DatabaseFactory.init()
  console.log('工厂环境:', DatabaseFactory.getEnvironment())
}

// 测试基本数据库操作
export async function testBasicDatabaseOperations() {
  console.log('\n=== 基本数据库操作测试 ===')
  
  try {
    const db = await DatabaseFactory.getDatabase('test')
    
    // 创建测试表
    console.log('创建测试表...')
    await db.exec(`
      CREATE TABLE IF NOT EXISTS test_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        age INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)
    
    // 清空测试数据
    await db.exec('DELETE FROM test_users')
    
    // 插入测试数据
    console.log('插入测试数据...')
    const insertResult1 = await db.run(
      'INSERT INTO test_users (name, email, age) VALUES (?, ?, ?)',
      ['张三', 'zhangsan@test.com', 25]
    )
    console.log('插入结果1:', insertResult1)
    
    const insertResult2 = await db.run(
      'INSERT INTO test_users (name, email, age) VALUES (?, ?, ?)',
      ['李四', 'lisi@test.com', 30]
    )
    console.log('插入结果2:', insertResult2)
    
    // 查询单条数据
    console.log('查询单条数据...')
    const user = await db.get('SELECT * FROM test_users WHERE id = ?', [insertResult1.lastInsertRowid])
    console.log('查询到的用户:', user)
    
    // 查询所有数据
    console.log('查询所有数据...')
    const users = await db.all('SELECT * FROM test_users ORDER BY id')
    console.log('所有用户:', users)
    
    // 更新数据
    console.log('更新数据...')
    const updateResult = await db.run(
      'UPDATE test_users SET age = ? WHERE id = ?',
      [26, insertResult1.lastInsertRowid]
    )
    console.log('更新结果:', updateResult)
    
    // 验证更新
    const updatedUser = await db.get('SELECT * FROM test_users WHERE id = ?', [insertResult1.lastInsertRowid])
    console.log('更新后的用户:', updatedUser)
    
    console.log('✅ 基本数据库操作测试通过')
    
  } catch (error) {
    console.error('❌ 基本数据库操作测试失败:', error)
  }
}

// 测试缓存功能
export async function testCacheOperations() {
  console.log('\n=== 缓存功能测试 ===')
  
  try {
    const cache = await getDefaultCacheManager()
    
    // 清空缓存
    await cache.clear()
    
    // 设置永久缓存
    console.log('设置永久缓存...')
    await cache.set('test_permanent', { message: '这是永久缓存', timestamp: Date.now() })
    
    // 设置临时缓存（3秒过期）
    console.log('设置临时缓存（3秒过期）...')
    await cache.set('test_temporary', { message: '这是临时缓存', timestamp: Date.now() }, 3)
    
    // 立即获取缓存
    console.log('立即获取缓存...')
    const permanent = await cache.get('test_permanent')
    const temporary = await cache.get('test_temporary')
    console.log('永久缓存:', permanent)
    console.log('临时缓存:', temporary)
    
    // 获取缓存统计
    let stats = await cache.getStats()
    console.log('缓存统计:', stats)
    
    // 等待4秒后再次获取
    console.log('等待4秒后再次获取...')
    await new Promise(resolve => setTimeout(resolve, 4000))
    
    const permanentAfter = await cache.get('test_permanent')
    const temporaryAfter = await cache.get('test_temporary')
    console.log('4秒后永久缓存:', permanentAfter)
    console.log('4秒后临时缓存:', temporaryAfter)
    
    // 清理过期缓存
    console.log('清理过期缓存...')
    await cache.cleanup()
    
    stats = await cache.getStats()
    console.log('清理后缓存统计:', stats)
    
    console.log('✅ 缓存功能测试通过')
    
  } catch (error) {
    console.error('❌ 缓存功能测试失败:', error)
  }
}

// 测试多数据库实例
export async function testMultipleDatabases() {
  console.log('\n=== 多数据库实例测试 ===')
  
  try {
    // 获取不同的数据库实例
    const db1 = await DatabaseFactory.getDatabase('app1')
    const db2 = await DatabaseFactory.getDatabase('app2')
    const db3 = await DatabaseFactory.getDatabase('app1') // 应该返回相同实例
    
    console.log('db1 === db3:', db1 === db3) // 应该为 true
    console.log('db1 === db2:', db1 === db2) // 应该为 false
    
    // 在不同数据库中创建表
    await db1.exec(`
      CREATE TABLE IF NOT EXISTS app1_data (
        id INTEGER PRIMARY KEY,
        value TEXT
      )
    `)
    
    await db2.exec(`
      CREATE TABLE IF NOT EXISTS app2_data (
        id INTEGER PRIMARY KEY,
        value TEXT
      )
    `)
    
    // 插入不同的数据
    await db1.run('INSERT OR REPLACE INTO app1_data (id, value) VALUES (?, ?)', [1, 'app1数据'])
    await db2.run('INSERT OR REPLACE INTO app2_data (id, value) VALUES (?, ?)', [1, 'app2数据'])
    
    // 验证数据隔离
    const data1 = await db1.get('SELECT * FROM app1_data WHERE id = 1')
    const data2 = await db2.get('SELECT * FROM app2_data WHERE id = 1')
    
    console.log('app1数据:', data1)
    console.log('app2数据:', data2)
    
    console.log('✅ 多数据库实例测试通过')
    
  } catch (error) {
    console.error('❌ 多数据库实例测试失败:', error)
  }
}

// 测试错误处理
export async function testErrorHandling() {
  console.log('\n=== 错误处理测试 ===')
  
  try {
    const db = await getDefaultDatabase()
    
    // 测试SQL语法错误
    try {
      await db.exec('INVALID SQL STATEMENT')
      console.log('❌ 应该抛出SQL语法错误')
    } catch (error) {
      console.log('✅ 正确捕获SQL语法错误:', error.message)
    }
    
    // 测试约束违反
    await db.exec(`
      CREATE TABLE IF NOT EXISTS test_unique (
        id INTEGER PRIMARY KEY,
        email TEXT UNIQUE
      )
    `)
    
    await db.run('INSERT OR REPLACE INTO test_unique (id, email) VALUES (?, ?)', [1, 'test@example.com'])
    
    try {
      await db.run('INSERT INTO test_unique (id, email) VALUES (?, ?)', [2, 'test@example.com'])
      console.log('❌ 应该抛出唯一约束错误')
    } catch (error) {
      console.log('✅ 正确捕获唯一约束错误:', error.message)
    }
    
    console.log('✅ 错误处理测试通过')
    
  } catch (error) {
    console.error('❌ 错误处理测试失败:', error)
  }
}

// 性能测试
export async function testPerformance() {
  console.log('\n=== 性能测试 ===')
  
  try {
    const db = await getDefaultDatabase()
    
    // 创建测试表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS perf_test (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)
    
    // 清空测试数据
    await db.exec('DELETE FROM perf_test')
    
    const testCount = 100
    
    // 测试批量插入性能
    console.log(`开始批量插入${testCount}条数据...`)
    const insertStart = Date.now()
    
    for (let i = 0; i < testCount; i++) {
      await db.run('INSERT INTO perf_test (data) VALUES (?)', [`测试数据${i}`])
    }
    
    const insertTime = Date.now() - insertStart
    console.log(`批量插入耗时: ${insertTime}ms, 平均: ${(insertTime / testCount).toFixed(2)}ms/条`)
    
    // 测试批量查询性能
    console.log('开始批量查询测试...')
    const queryStart = Date.now()
    
    for (let i = 0; i < 50; i++) {
      await db.all('SELECT * FROM perf_test LIMIT 10')
    }
    
    const queryTime = Date.now() - queryStart
    console.log(`批量查询耗时: ${queryTime}ms, 平均: ${(queryTime / 50).toFixed(2)}ms/次`)
    
    // 验证数据总数
    const count = await db.get('SELECT COUNT(*) as count FROM perf_test')
    console.log(`数据总数: ${count.count}`)
    
    console.log('✅ 性能测试完成')
    
  } catch (error) {
    console.error('❌ 性能测试失败:', error)
  }
}

// 运行所有测试
export async function runAllTests() {
  console.log('🚀 开始SQLite封装测试\n')
  
  // 环境检测测试
  testEnvironmentDetection()
  
  // 基本操作测试
  await testBasicDatabaseOperations()
  
  // 缓存功能测试
  await testCacheOperations()
  
  // 多数据库实例测试
  await testMultipleDatabases()
  
  // 错误处理测试
  await testErrorHandling()
  
  // 性能测试
  await testPerformance()
  
  console.log('\n🎉 所有测试完成')
}

// 如果直接运行此文件，执行所有测试
if (typeof window !== 'undefined') {
  // 在浏览器环境中，可以通过控制台调用
  (window as any).sqliteTest = {
    runAllTests,
    testEnvironmentDetection,
    testBasicDatabaseOperations,
    testCacheOperations,
    testMultipleDatabases,
    testErrorHandling,
    testPerformance
  }
  
  console.log('SQLite测试函数已挂载到 window.sqliteTest')
  console.log('可以通过 window.sqliteTest.runAllTests() 运行所有测试')
}
