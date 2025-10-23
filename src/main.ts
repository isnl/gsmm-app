import { createSSRApp } from 'vue';
import App from './App.vue';
import '@/static/iconfont/iconfont.css';
import 'uno.css';
import * as Pinia from 'pinia';
// import 'leaflet/dist/leaflet.css';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

// 初始化SQLite数据库
// import { DatabaseFactory } from '@/sqlite';

// 在应用启动时初始化SQLite
// DatabaseFactory.init();

export function createApp() {
  const app = createSSRApp(App);
  const pinia = Pinia.createPinia();
  pinia.use(piniaPluginPersistedstate);
  app.use(pinia);
  return {
    app,
    Pinia,
  };
}
