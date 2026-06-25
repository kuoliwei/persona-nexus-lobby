import { getConfig } from './config-loader.js';

export async function loadChatPage(characterId) {
  const config = getConfig();
  const CHAT_APP_URL = config.frontends.chat;

  const contentArea = document.getElementById('content-area');
  const response = await fetch('/src/chat.html');
  const html = await response.text();
  contentArea.innerHTML = html;

  const token = localStorage.getItem('token');
  const iframe = document.getElementById('chat-frame');
  iframe.src = `${CHAT_APP_URL}/index.html?characterId=${encodeURIComponent(characterId)}&token=${encodeURIComponent(token)}`;

  // 歷史狀態管理
  if (history.state?.page !== 'chat' || history.state?.characterId !== characterId) {
    history.pushState({ page: 'chat', characterId }, '', `/chat?characterId=${encodeURIComponent(characterId)}`);
  }
}
