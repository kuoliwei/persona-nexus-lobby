import { getConfig } from './config-loader.js';

export async function loadCharacterCreatePage() {
  const config = getConfig();
  const CHARACTER_APP_URL = config.frontends.character;

  const contentArea = document.getElementById('content-area');
  const response = await fetch('/src/character-edit.html');
  const html = await response.text();
  contentArea.innerHTML = html;

  const token = localStorage.getItem('token');
  const iframe = document.getElementById('character-edit-frame');
  iframe.src = `${CHARACTER_APP_URL}/creator-create.html?token=${encodeURIComponent(token)}`;

  // 歷史問題修正：當用戶按瀏覽器上一頁時，popstate 事件會觸發此函式重新載入頁面。
  // 但如果無條件推送狀態，會導致 popstate 觸發 → 推送狀態 → popstate 再次觸發，造成死循環。
  // 解決方案：檢查當前 history.state，只在真的要切換到新狀態時才推送，否則跳過。
  if (history.state?.page !== 'create') {
    history.pushState({ page: 'create' }, '', '/my-characters/create');
  }
}
