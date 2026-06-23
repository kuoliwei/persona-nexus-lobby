# persona-nexus-lobby

## 平台是什麼

Persona Nexus 是一個 AI 戀愛模擬角色扮演服務，採微服務架構，由多個獨立的前後端專案組成，已整合到 `C:\Users\MSI3090\persona-nexus-platform` 工作資料夾下（複製合併，非 git monorepo）。

## 專案地圖

| 路徑 | 角色 | Port |
|------|------|------|
| `auth-service` | Auth 微服務（註冊/登入，發 JWT），**不經過 gateway** | 3000（內部）|
| `user-service` | 使用者資料服務，**需經 gateway** | 4000（內部）|
| `character-service` | 角色 CRUD（Express + Prisma + SQLite），**需經 gateway**，只認 `x-user-id` header（由 gateway 注入，本身不驗 JWT）| 5000（內部）|
| `api-gateway` | 統一入口，驗證 `Authorization: Bearer <JWT>`，驗證成功後注入 `x-user-id` header 再 proxy 給後面的服務 | 8000 |
| `persona-nexus-auth` | 前台：註冊/登入頁面（Vite + Vanilla JS）| 5173（已固定）|
| `persona-nexus-character` | 前台：角色創建/編輯頁面（Vite + Vanilla JS），檔案已改名為 `creator-create.html` / `creator-edit.html` | 5174（已固定）|
| `persona-nexus-lobby`（本專案）| 前台：**整個服務的首頁**，採側邊欄 + 主內容區設計 | 5175（已固定）|

## 本專案的職責

- **側邊欄（固定）**：Logo 按鈕、創建角色按鈕
  - Logo：回到首頁
  - 創建角色：跳轉到 `persona-nexus-character` 的創建頁（`http://localhost:5174/creator-create.html`）
- **主內容區**：暫時空白，之後根據需求放置內容（例如所有公開角色的發現頁、使用者個人角色大廳等）
- **登入守門**：未登入（`localStorage` 沒有合法 JWT token）→ 強制跳轉到 `persona-nexus-web` 登入頁（`http://localhost:5173/`）

## 專案結構

- `index.html`：新首頁架構，左側邊欄（250px 固定寬度）+ 右側主內容區（暫時空白）
- `vite.config.js`：固定 port 5175，`strictPort: true`
- `package.json`
- `src/api.js`：打 gateway 拿 token 相關資訊；內含 `getCurrentUserId()`，解碼 `localStorage` 裡的 JWT 拿使用者 id
- `src/style.css`：深色主題（GitHub dark 配色 `#0d1117`、`#58a6ff`、`#238636`），側邊欄 + 主內容區佈局
- `src/main.js`：登入守門、側邊欄按鈕事件處理（Logo 回首頁、創建角色跳轉）

## 登入流程（已通）

1. 使用者在 `persona-nexus-web`（5173）登入
2. auth-service 簽發 JWT，`persona-nexus-web` 把 token 透過 URL 參數傳給大廳：`http://localhost:5175/?token=...`
3. 大廳收到 token，存進 `localStorage`，清掉網址
4. 檢查登入狀態（解碼 JWT），如已登入則保留在首頁，否則導回登入頁

## ⚠️ 已知設計落差

- `persona-nexus-character` 目前是直接打 character-service（5000），沒有經過 gateway，跟本專案「一律打 gateway」的慣例不一致。不影響功能，但代表平台內各前端對「要不要走 gateway」沒有統一規則。

## 首頁架構演進

原本是「列出使用者自己的角色」（創作者後台），現在改成「整個服務的首頁」（側邊欄 + 空白主內容區）。具體改動：

- `index.html`：改成側邊欄佈局（Logo + 創建角色按鈕）
- `src/main.js`：移除角色列表渲染邏輯，只保留登入守門 + 側邊欄按鈕事件
- `src/style.css`：加上 `.home-container`、`.sidebar`、`.main-content` 等新的佈局類別

## 相關檔案改名（persona-nexus-character）

為了更清楚區分用途，將創建/編輯頁改名：
- `character-create.html` → `creator-create.html`
- `character-edit.html` → `creator-edit.html`
- `src/create.js`、`src/edit.js` 保持不變（只是被新的 HTML 引用）

## CORS（已解決）

`api-gateway` 的 CORS 已改成允許多個來源（`.env` 的 `FRONTEND_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175`，逗號分隔），不再只允許單一來源。此前舊紀錄裡「只允許 5173」的問題已修復，不需再處理。

## 程式慣例

- 純 Vanilla JS + Vite，無框架，無 TypeScript
- 跨專案跳轉一律用寫死的常數（例如 `LOGIN_APP_URL`、`LOBBY_APP_URL`、`CHARACTER_APP_URL`），方便之後改 port 時好找
- JWT 解碼邏輯（`decodeToken` / `getCurrentUserId`）在 `persona-nexus-lobby` 和 `persona-nexus-character` 各自有一份一樣的程式碼——刻意選擇不抽共用套件，保持每個前端專案獨立
- 訊息提示走 `#message-box` + CSS class（`success`/`error`/`info`）的固定模式
- 角色 schema 欄位：`name`、`gender`、`tags`（陣列）、`introduction`、`background`、`opening`、`fewShots`（陣列）、`visibility`（`private`/`public`）

## 現況補充

- 沒有測試、沒有 lint 設定檔
- 沒有 git（`.git` 不存在）
