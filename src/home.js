import { getConfig } from './config-loader.js';
import { getCurrentUserId } from './api.js';

export async function loadHomePage() {
  const contentArea = document.getElementById('content-area');
  const response = await fetch('/src/home.html');
  const html = await response.text();
  contentArea.innerHTML = html;

  // 初始化首頁
  await initHomePage();

  // 更新歷史狀態
  history.replaceState({ page: 'home' }, '', '/');
}

async function initHomePage() {
  const config = getConfig();
  const userId = getCurrentUserId();

  const characterGrid = document.getElementById('character-grid');
  const emptyState = document.getElementById('empty-state');
  const template = document.getElementById('character-card-template');

  try {
    // 從 character-service 獲取所有 public 角色
    console.log('📡 [home.js] 正在獲取公開角色...');

    const response = await fetch(`${config.services.gateway}/characters?visibility=public`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch characters: ${response.status}`);
    }

    const result = await response.json();
    const characters = result.data || [];
    console.log('✅ [home.js] 獲取公開角色成功:', characters);

    if (characters.length === 0) {
      emptyState.style.display = 'block';
      characterGrid.innerHTML = '';
      return;
    }

    // 渲染角色卡片
    characterGrid.innerHTML = '';
    characters.forEach((character) => {
      const card = template.content.cloneNode(true);

      const cardElement = card.querySelector('.character-card');
      cardElement.href = '#';
      cardElement.addEventListener('click', async (e) => {
        e.preventDefault();
        const { loadChatPage } = await import('./chat-page.js');
        await loadChatPage(character.id);
      });

      const avatarElement = card.querySelector('.character-avatar');
      avatarElement.textContent = character.name.charAt(0).toUpperCase();
      avatarElement.style.background = generateAvatarColor(character.id);

      const nameElement = card.querySelector('.character-name');
      nameElement.textContent = character.name;

      const introElement = card.querySelector('.character-intro');
      introElement.textContent = character.introduction || '一個神秘的角色...';

      characterGrid.appendChild(card);
    });

    console.log('✅ [home.js] 首頁初始化完成');
  } catch (error) {
    console.error('❌ [home.js] 獲取角色失敗:', error);
    showMessage('無法獲取角色列表', 'error');
  }
}

function generateAvatarColor(id) {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  ];
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
}

function showMessage(text, type = 'info') {
  const messageBox = document.getElementById('message-box');
  messageBox.textContent = text;
  messageBox.className = type;
  messageBox.style.display = 'block';

  setTimeout(() => {
    messageBox.style.display = 'none';
  }, 3000);
}
