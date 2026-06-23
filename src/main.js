import './style.css';
import { getCurrentUserId } from './api.js';
import { initSidebar } from './sidebar.js';
import { loadHomePage } from './home.js';
import { loadConfig, getConfig } from './config-loader.js';

// 載入設定
await loadConfig();
const config = getConfig();
const LOGIN_APP_URL = config.frontends.web;

// 檢查登入狀態
const urlParams = new URLSearchParams(window.location.search);
const tokenFromUrl = urlParams.get('token');

if (tokenFromUrl) {
  localStorage.setItem('token', tokenFromUrl);
  window.history.replaceState({}, '', window.location.pathname);
}

const userId = getCurrentUserId();

if (!userId) {
  window.location.href = `${LOGIN_APP_URL}/`;
} else {
  // 初始化：載入側邊欄和首頁
  await initSidebar();
  await loadHomePage();

  // 設定初始歷史狀態
  history.replaceState({ page: 'home' }, '', '/');

  // Debug：追蹤所有 pushState/replaceState 操作
  window.historyLog = [{ page: 'home', type: 'replace (initial)', length: window.history.length }];
  const originalPush = window.history.pushState;
  const originalReplace = window.history.replaceState;

  window.history.pushState = function(...args) {
    originalPush.apply(window.history, args);
    window.historyLog.push({ state: args[0], type: 'push', length: window.history.length });
    console.log('📍 pushState:', args[0], '| Length:', window.history.length, '| Full log:', window.historyLog);
  };

  window.history.replaceState = function(...args) {
    originalReplace.apply(window.history, args);
    window.historyLog.push({ state: args[0], type: 'replace', length: window.history.length });
    console.log('📍 replaceState:', args[0], '| Length:', window.history.length, '| Full log:', window.historyLog);
  };

  // 監聽瀏覽器上一頁/下一頁
  window.addEventListener('popstate', async (event) => {
    console.log('⬅️ popstate triggered:', event.state, '| Current length:', window.history.length);
    if (event.state?.page === 'home') {
      const { loadHomePage } = await import('./home.js');
      await loadHomePage();
    } else if (event.state?.page === 'myCharacters') {
      const { loadMyCharacterPage } = await import('./my-character.js');
      await loadMyCharacterPage();
    } else if (event.state?.page === 'edit') {
      const { loadCharacterEditPage } = await import('./character-edit.js');
      await loadCharacterEditPage(event.state.characterId);
    } else if (event.state?.page === 'create') {
      const { loadCharacterCreatePage } = await import('./character-create.js');
      await loadCharacterCreatePage();
    }
  });
}
