# 課程預約系統

這是一個使用 Next.js 開發的課程預約系統，整合了 Google Calendar 和 Google Sheets 功能。

## 功能特點

- 使用 Google 帳號登入
- 月曆方式查看課程安排
- 學員預約課程功能
- 自動同步到 Google Calendar
- 使用 Google Sheets 儲存預約資料

## 技術棧

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Google Calendar API
- Google Sheets API

## 開始使用

1. 克隆專案：
   ```bash
   git clone [repository-url]
   cd project_booking_new
   ```

2. 安裝依賴：
   ```bash
   npm install
   ```

3. 設置 Google API：
   - 前往 [Google Cloud Console](https://console.cloud.google.com)
   - 創建新專案
   - 啟用 Google Calendar API 和 Google Sheets API
   - 創建 OAuth 2.0 憑證
   - 下載憑證

4. 配置環境變數：
   - 複製 `.env.local.example` 到 `.env.local`
   - 填入你的 Google API 憑證：
     ```
     NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
     NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your_client_secret_here
     NEXT_PUBLIC_GOOGLE_CALENDAR_ID=your_calendar_id_here
     NEXT_PUBLIC_GOOGLE_SHEET_ID=your_sheet_id_here
     ```

5. 運行開發服務器：
   ```bash
   npm run dev
   ```

6. 訪問 [http://localhost:3000](http://localhost:3000)

## 部署

本專案可以部署到 GitHub Pages：

1. 在 GitHub 上創建倉庫

2. 修改 `next.config.ts`：
   ```typescript
   const nextConfig = {
     output: 'export',
     basePath: '/your-repo-name',
   };
   ```

3. 部署到 GitHub Pages：
   ```bash
   npm run build
   ```

## 專案結構

```
project_booking_new/
├── src/
│   ├── app/              # 頁面組件
│   ├── components/       # React 組件
│   └── services/         # 服務層（Google API 整合）
├── public/              # 靜態資源
└── package.json         # 專案配置
```

## 授權

MIT License
