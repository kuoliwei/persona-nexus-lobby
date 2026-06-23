import { getConfig } from './config-loader.js';

export async function initSidebar() {
  const config = getConfig();
  const CHARACTER_APP_URL = config.frontends.character;

  const sidebarContainer = document.getElementById('sidebar-container');
  const response = await fetch('/src/sidebar.html');
  const html = await response.text();
  sidebarContainer.innerHTML = html;

  const logoBtn = document.getElementById('logo-btn');
  const createBtn = document.getElementById('create-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const contentArea = document.getElementById('content-area');

  // Logo 按鈕：回到首頁（清空右側內容）
  logoBtn.addEventListener('click', async () => {
    await loadHome();
    history.pushState({ page: 'home' }, '', '/');
  });

  // 創建角色按鈕：載入「我的角色」
  createBtn.addEventListener('click', async () => {
    await loadMyCharacter();
    history.pushState({ page: 'myCharacters' }, '', '/my-characters');
  });

  // 登出按鈕：清除 token，回到登入頁
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    const config = getConfig();
    const LOGIN_APP_URL = config.frontends.web;
    window.location.href = LOGIN_APP_URL;
  });
}

async function loadHome() {
  const { loadHomePage } = await import('./home.js');
  await loadHomePage();
}

async function loadMyCharacter() {
  const { loadMyCharacterPage } = await import('./my-character.js');
  await loadMyCharacterPage();
}
