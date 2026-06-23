import { getConfig } from './config-loader.js';

export async function loadCharacterEditPage(characterId) {
  const config = getConfig();
  const CHARACTER_APP_URL = config.frontends.character;

  const contentArea = document.getElementById('content-area');
  const response = await fetch('/src/character-edit.html');
  const html = await response.text();
  contentArea.innerHTML = html;

  const token = localStorage.getItem('token');
  const iframe = document.getElementById('character-edit-frame');
  iframe.src = `${CHARACTER_APP_URL}/creator-edit.html?id=${encodeURIComponent(characterId)}&token=${encodeURIComponent(token)}`;

  // 歷史問題修正：與 character-create.js 同理，popstate 觸發時無條件推送狀態會造成死循環。
  // 另外編輯不同的角色時，characterId 不同，需要檢查兩個條件才能判斷是否要推送新狀態。
  // 解決方案：同時檢查 page 和 characterId，確保只有真的切換角色時才推送狀態。
  if (history.state?.page !== 'edit' || history.state?.characterId !== characterId) {
    history.pushState({ page: 'edit', characterId }, '', `/my-characters/edit?id=${encodeURIComponent(characterId)}`);
  }
}
