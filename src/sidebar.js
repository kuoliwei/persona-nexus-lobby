import { getConfig } from './config-loader.js';

export async function initSidebar() {
  const config = getConfig();
  const CHARACTER_APP_URL = config.frontends.character;
  const GATEWAY_URL = config.services.gateway;  // 🆕 正確路徑：services.gateway

  const sidebarContainer = document.getElementById('sidebar-container');
  const response = await fetch('/src/sidebar.html');
  const html = await response.text();
  sidebarContainer.innerHTML = html;

  const logoBtn = document.getElementById('logo-btn');
  const createBtn = document.getElementById('create-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const contentArea = document.getElementById('content-area');
  const sidebarMiddle = document.getElementById('sidebar-middle');

  // 🆕 載入聊天過的角色按鈕
  await loadChatHistoryButtons(sidebarMiddle, GATEWAY_URL);

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

// 🆕 顯示對話菜單
function showConversationMenu(event, item) {
  const token = localStorage.getItem('token');
  const config = getConfig();
  const GATEWAY_URL = config.services.gateway;

  // 建立菜單
  const menu = document.createElement('div');
  menu.className = 'conversation-menu';

  // 刪除選項
  const deleteOption = document.createElement('div');
  deleteOption.className = 'conversation-menu-item';
  deleteOption.textContent = '🗑️ 刪除';
  deleteOption.addEventListener('click', async () => {
    if (confirm(`確定要刪除與 ${item.characterName} 的所有對話嗎？`)) {
      try {
        console.log('🗑️ [sidebar.js] 刪除對話...');

        const res = await fetch(`${GATEWAY_URL}/conversations/character/${item.characterId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`刪除失敗: ${res.status}`);
        }

        console.log('✅ [sidebar.js] 對話已刪除，重新載入聊天歷史');
        document.body.removeChild(menu);

        // 重新載入聊天歷史
        const sidebarMiddle = document.getElementById('sidebar-middle');
        sidebarMiddle.innerHTML = '';
        await loadChatHistoryButtons(sidebarMiddle, GATEWAY_URL);
      } catch (error) {
        console.error('❌ [sidebar.js] 刪除失敗:', error);
        alert(`刪除失敗: ${error.message}`);
        document.body.removeChild(menu);
      }
    } else {
      document.body.removeChild(menu);
    }
  });

  menu.appendChild(deleteOption);

  // 定位菜單到點擊位置
  const rect = event.target.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.top = `${rect.bottom + 4}px`;
  menu.style.left = `${rect.left - 80}px`;

  document.body.appendChild(menu);

  // 點擊外部關閉菜單
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);

  function closeMenu(e) {
    if (!menu.contains(e.target) && e.target !== event.target) {
      document.removeChild(menu);
      document.removeEventListener('click', closeMenu);
    }
  }
}

// 🆕 載入聊天歷史的角色按鈕
async function loadChatHistoryButtons(container, gatewayUrl) {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    console.log('📡 [sidebar.js] 載入聊天歷史...');

    // 🆕 調用 gateway 獲取對話摘要（輕量版）
    const res = await fetch(`${gatewayUrl}/conversations/summary`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) {
      console.warn('⚠️ [sidebar.js] 無法載入聊天歷史');
      return;
    }

    const summary = await res.json();
    console.log('✅ [sidebar.js] 聊天歷史摘要載入成功，共', summary.length, '個對話');

    // 摘要已按 updatedAt 排序（後端已排序）

    // 為每個對話建立角色按鈕
    summary.forEach((item) => {
      // 🆕 建立容器（flex 布局）
      const btnContainer = document.createElement('div');
      btnContainer.className = 'sidebar-conversation-item';

      // 聊天按鈕（左邊，占滿空間）
      const chatBtn = document.createElement('button');
      chatBtn.className = 'sidebar-conversation-btn';
      chatBtn.textContent = item.characterName || `角色 ${item.characterId}`;
      chatBtn.dataset.conversationId = item.conversationId;
      chatBtn.dataset.characterId = item.characterId;

      // 點擊按鈕後載入聊天室
      chatBtn.addEventListener('click', async () => {
        console.log('💬 [sidebar.js] 點擊聊天按鈕，characterId:', item.characterId);
        const { loadChatPage } = await import('./chat-page.js');
        await loadChatPage(item.characterId);
        history.pushState({ page: 'chat', characterId: item.characterId }, '', `/chat/${item.characterId}`);
      });

      // 🆕 菜單按鈕（右邊，三點）
      const menuBtn = document.createElement('button');
      menuBtn.className = 'sidebar-conversation-menu';
      menuBtn.textContent = '⋮';
      menuBtn.title = '更多選項';
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();  // 防止觸發聊天按鈕
        console.log('📋 [sidebar.js] 點擊菜單按鈕，characterId:', item.characterId);
        showConversationMenu(e, item);
      });

      btnContainer.appendChild(chatBtn);
      btnContainer.appendChild(menuBtn);
      container.appendChild(btnContainer);
    });

    if (summary.length === 0) {
      console.log('📭 [sidebar.js] 沒有聊天歷史');
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'sidebar-empty-msg';
      emptyMsg.textContent = '暫無聊天記錄';
      container.appendChild(emptyMsg);
    }
  } catch (error) {
    console.error('❌ [sidebar.js] 載入聊天歷史失敗:', error);
  }
}
