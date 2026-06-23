import { listMyCharacters } from './api.js';
import { getConfig } from './config-loader.js';

export async function loadMyCharacterPage() {
  const config = getConfig();
  const CHARACTER_APP_URL = config.frontends.character;

  const contentArea = document.getElementById('content-area');
  const response = await fetch('/src/my-character.html');
  const html = await response.text();
  contentArea.innerHTML = html;

  const messageBox = document.getElementById('message-box');
  const createCharacterBtn = document.getElementById('create-character-btn');
  const emptyCreateBtn = document.querySelector('.empty-create-btn');
  const token = localStorage.getItem('token');

  async function handleCreateClick() {
    const { loadCharacterCreatePage } = await import('./character-create.js');
    await loadCharacterCreatePage();
  }

  // 歷史問題修正：每次 loadMyCharacterPage() 執行時，都會新增事件監聽器到按鈕上。
  // 如果直接用 addEventListener，監聽器會累積，導致按一次按鈕會觸發多次，進而推送多次歷史狀態，
  // 造成瀏覽器歷史棧混亂，按上一頁時卡住或循環。
  // 解決方案：用 cloneNode() 克隆按鈕，替換舊按鈕，新克隆的按鈕自動丟掉所有舊監聽器。
  const newCreateBtn = createCharacterBtn.cloneNode(true);
  createCharacterBtn.parentNode.replaceChild(newCreateBtn, createCharacterBtn);
  newCreateBtn.addEventListener('click', handleCreateClick);

  const newEmptyCreateBtn = emptyCreateBtn.cloneNode(true);
  emptyCreateBtn.parentNode.replaceChild(newEmptyCreateBtn, emptyCreateBtn);
  newEmptyCreateBtn.addEventListener('click', handleCreateClick);

  showMessage('info', '載入角色清單中...');

  const result = await listMyCharacters();

  if (result.status !== 'success') {
    showMessage('error', `載入失敗：${result.message}`);
    return;
  }

  clearMessage();
  renderCharacters(result.data, CHARACTER_APP_URL);
}

function showMessage(type, text) {
  const messageBox = document.getElementById('message-box');
  if (!messageBox) return;
  messageBox.className = type;
  messageBox.textContent = text;
}

function clearMessage() {
  const messageBox = document.getElementById('message-box');
  if (!messageBox) return;
  messageBox.className = '';
  messageBox.textContent = '';
}

function renderCharacters(characters, characterAppUrl) {
  const grid = document.getElementById('character-grid');
  const emptyState = document.getElementById('empty-state');
  const cardTemplate = document.getElementById('character-card-template');

  grid.innerHTML = '';

  if (characters.length === 0) {
    emptyState.classList.add('visible');
    return;
  }

  emptyState.classList.remove('visible');

  characters.forEach((character) => {
    const node = cardTemplate.content.cloneNode(true);
    const card = node.querySelector('.character-card');
    const badge = node.querySelector('.character-badge');
    card.href = '#';
    card.addEventListener('click', async (e) => {
      e.preventDefault();
      const { loadCharacterEditPage } = await import('./character-edit.js');
      await loadCharacterEditPage(character.id);
    });
    node.querySelector('.character-name').textContent = character.name;
    node.querySelector('.character-intro').textContent = character.introduction ?? '';

    // 設定公開/私人 badge
    if (character.visibility === 'public') {
      badge.textContent = '公開';
      badge.classList.add('public');
    } else {
      badge.textContent = '私人';
      badge.classList.add('private');
    }

    grid.appendChild(node);
  });
}
