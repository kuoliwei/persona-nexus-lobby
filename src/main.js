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
  // 初始化：載入側邊欄
  await initSidebar();

  // 根據 URL 路徑決定加載哪個頁面
  // 問題背景：persona-nexus-character 創建/編輯角色成功後，使用 window.parent.location.href 跳轉到 /my-characters
  // 但頁面重新加載時，main.js 會再次執行，導致總是加載首頁而忽略 URL 路徑
  // 解決方案：在初始化時檢查 window.location.pathname，根據路徑決定加載首頁或「我的角色」頁面
  const pathname = window.location.pathname;
  if (pathname === '/my-characters') {
    const { loadMyCharacterPage } = await import('./my-character.js');
    await loadMyCharacterPage();
    history.replaceState({ page: 'myCharacters' }, '', '/my-characters');
  } else {
    await loadHomePage();
    history.replaceState({ page: 'home' }, '', '/');
  }

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
    } else if (event.state?.page === 'chat') {
      const { loadChatPage } = await import('./chat-page.js');
      await loadChatPage(event.state.characterId);
    }
  });
}
