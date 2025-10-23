<template>
  <view class="container">
    <view class="header">
      <text class="title">SQLite 演示页面</text>
      <text class="env">当前环境: {{ environment }}</text>
    </view>

    <view class="section">
      <text class="section-title">基本操作</text>
      <view class="button-group">
        <button @click="initDatabase" :disabled="loading">初始化数据库</button>
        <button @click="insertUser" :disabled="loading">添加用户</button>
        <button @click="queryUsers" :disabled="loading">查询用户</button>
        <button @click="clearUsers" :disabled="loading">清空用户</button>
      </view>
    </view>

    <view class="section">
      <text class="section-title">缓存操作</text>
      <view class="button-group">
        <button @click="setCache" :disabled="loading">设置缓存</button>
        <button @click="getCache" :disabled="loading">获取缓存</button>
        <button @click="clearCache" :disabled="loading">清空缓存</button>
        <button @click="getCacheStats" :disabled="loading">缓存统计</button>
      </view>
    </view>

    <view class="section">
      <text class="section-title">测试功能</text>
      <view class="button-group">
        <button @click="runTests" :disabled="loading">运行测试</button>
        <button @click="performanceTest" :disabled="loading">性能测试</button>
      </view>
    </view>

    <view class="section">
      <text class="section-title">用户列表</text>
      <view class="user-list">
        <view v-for="user in users" :key="user.id" class="user-item">
          <text class="user-name">{{ user.name }}</text>
          <text class="user-email">{{ user.email }}</text>
          <text class="user-time">{{ formatTime(user.created_at) }}</text>
        </view>
        <view v-if="users.length === 0" class="empty">
          <text>暂无用户数据</text>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">日志输出</text>
      <scroll-view class="log-container" scroll-y>
        <view v-for="(log, index) in logs" :key="index" class="log-item" :class="log.type">
          <text class="log-time">{{ log.time }}</text>
          <text class="log-message">{{ log.message }}</text>
        </view>
      </scroll-view>
      <button @click="clearLogs" class="clear-logs-btn">清空日志</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  DatabaseFactory, 
  getDefaultDatabase, 
  getDefaultCacheManager,
  type IDatabase,
  type CacheManager
} from '@/sqlite'
import { runAllTests } from '@/sqlite/test'

// 响应式数据
const environment = ref('')
const loading = ref(false)
const users = ref<any[]>([])
const logs = ref<Array<{ time: string; message: string; type: string }>>([])

let db: IDatabase | null = null
let cache: CacheManager | null = null

// 添加日志
function addLog(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const time = new Date().toLocaleTimeString()
  logs.value.unshift({ time, message, type })
  
  // 限制日志数量
  if (logs.value.length > 100) {
    logs.value = logs.value.slice(0, 100)
  }
  
  console.log(`[${type.toUpperCase()}] ${message}`)
}

// 清空日志
function clearLogs() {
  logs.value = []
}

// 格式化时间
function formatTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString()
}

// 初始化数据库
async function initDatabase() {
  loading.value = true
  try {
    addLog('正在初始化数据库...')
    
    db = await getDefaultDatabase()
    cache = await getDefaultCacheManager()
    
    // 创建用户表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS demo_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)
    
    addLog('数据库初始化成功', 'success')
    await queryUsers()
    
  } catch (error) {
    addLog(`数据库初始化失败: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

// 添加用户
async function insertUser() {
  if (!db) {
    addLog('请先初始化数据库', 'error')
    return
  }
  
  loading.value = true
  try {
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']
    const domains = ['example.com', 'test.com', 'demo.com', 'sample.com']
    
    const randomName = names[Math.floor(Math.random() * names.length)]
    const randomDomain = domains[Math.floor(Math.random() * domains.length)]
    const email = `${randomName.toLowerCase()}${Date.now()}@${randomDomain}`
    
    const result = await db.run(
      'INSERT INTO demo_users (name, email) VALUES (?, ?)',
      [randomName, email]
    )
    
    addLog(`添加用户成功: ${randomName} (ID: ${result.lastInsertRowid})`, 'success')
    await queryUsers()
    
  } catch (error) {
    addLog(`添加用户失败: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

// 查询用户
async function queryUsers() {
  if (!db) {
    addLog('请先初始化数据库', 'error')
    return
  }
  
  loading.value = true
  try {
    const result = await db.all('SELECT * FROM demo_users ORDER BY created_at DESC LIMIT 20')
    users.value = result
    addLog(`查询到 ${result.length} 个用户`)
    
  } catch (error) {
    addLog(`查询用户失败: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

// 清空用户
async function clearUsers() {
  if (!db) {
    addLog('请先初始化数据库', 'error')
    return
  }
  
  loading.value = true
  try {
    await db.exec('DELETE FROM demo_users')
    users.value = []
    addLog('清空用户成功', 'success')
    
  } catch (error) {
    addLog(`清空用户失败: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

// 设置缓存
async function setCache() {
  if (!cache) {
    addLog('请先初始化数据库', 'error')
    return
  }
  
  loading.value = true
  try {
    const testData = {
      message: '这是测试缓存数据',
      timestamp: Date.now(),
      random: Math.random()
    }
    
    await cache.set('demo_cache', testData, 60) // 60秒过期
    addLog('设置缓存成功', 'success')
    
  } catch (error) {
    addLog(`设置缓存失败: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

// 获取缓存
async function getCache() {
  if (!cache) {
    addLog('请先初始化数据库', 'error')
    return
  }
  
  loading.value = true
  try {
    const data = await cache.get('demo_cache')
    if (data) {
      addLog(`获取缓存成功: ${JSON.stringify(data)}`, 'success')
    } else {
      addLog('缓存不存在或已过期')
    }
    
  } catch (error) {
    addLog(`获取缓存失败: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

// 清空缓存
async function clearCache() {
  if (!cache) {
    addLog('请先初始化数据库', 'error')
    return
  }
  
  loading.value = true
  try {
    await cache.clear()
    addLog('清空缓存成功', 'success')
    
  } catch (error) {
    addLog(`清空缓存失败: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

// 获取缓存统计
async function getCacheStats() {
  if (!cache) {
    addLog('请先初始化数据库', 'error')
    return
  }
  
  loading.value = true
  try {
    const stats = await cache.getStats()
    addLog(`缓存统计 - 总数: ${stats.total}, 过期: ${stats.expired}`)
    
  } catch (error) {
    addLog(`获取缓存统计失败: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

// 运行测试
async function runTests() {
  loading.value = true
  try {
    addLog('开始运行测试套件...')
    
    // 重定向console.log到日志
    const originalLog = console.log
    console.log = (...args) => {
      addLog(args.join(' '))
      originalLog(...args)
    }
    
    await runAllTests()
    
    // 恢复console.log
    console.log = originalLog
    
    addLog('测试套件运行完成', 'success')
    
  } catch (error) {
    addLog(`测试运行失败: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

// 性能测试
async function performanceTest() {
  if (!db) {
    addLog('请先初始化数据库', 'error')
    return
  }
  
  loading.value = true
  try {
    addLog('开始性能测试...')
    
    // 创建测试表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS perf_test (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)
    
    await db.exec('DELETE FROM perf_test')
    
    const testCount = 50
    const start = Date.now()
    
    // 批量插入
    for (let i = 0; i < testCount; i++) {
      await db.run('INSERT INTO perf_test (data) VALUES (?)', [`测试数据${i}`])
    }
    
    const insertTime = Date.now() - start
    addLog(`插入${testCount}条数据耗时: ${insertTime}ms`)
    
    // 查询测试
    const queryStart = Date.now()
    const result = await db.all('SELECT * FROM perf_test')
    const queryTime = Date.now() - queryStart
    
    addLog(`查询${result.length}条数据耗时: ${queryTime}ms`)
    addLog('性能测试完成', 'success')
    
  } catch (error) {
    addLog(`性能测试失败: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

// 页面加载时初始化
onMounted(async () => {
  environment.value = DatabaseFactory.getEnvironment()
  addLog(`页面加载完成，当前环境: ${environment.value}`)
  
  // 自动初始化数据库
  await initDatabase()
})
</script>

<style scoped>
.container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10px;
}

.env {
  font-size: 14px;
  color: #666;
  background-color: #e8f4fd;
  padding: 5px 10px;
  border-radius: 15px;
  display: inline-block;
}

.section {
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 15px;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

button {
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 15px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #0056b3;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.user-list {
  max-height: 300px;
  overflow-y: auto;
}

.user-item {
  border-bottom: 1px solid #eee;
  padding: 10px 0;
}

.user-name {
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 5px;
}

.user-email {
  color: #666;
  font-size: 14px;
  display: block;
  margin-bottom: 5px;
}

.user-time {
  color: #999;
  font-size: 12px;
  display: block;
}

.empty {
  text-align: center;
  color: #999;
  padding: 20px;
}

.log-container {
  height: 200px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 10px;
}

.log-item {
  margin-bottom: 5px;
  font-size: 12px;
  line-height: 1.4;
}

.log-time {
  color: #6c757d;
  margin-right: 10px;
}

.log-message {
  color: #333;
}

.log-item.success .log-message {
  color: #28a745;
}

.log-item.error .log-message {
  color: #dc3545;
}

.clear-logs-btn {
  background-color: #6c757d;
  font-size: 12px;
  padding: 5px 10px;
}
</style>
