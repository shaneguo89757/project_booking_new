/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';
const repoName = 'project_booking_new';

const nextConfig = {
  output: 'export',  // 啟用靜態網站導出
  images: {
    unoptimized: true,  // 靜態導出時需要禁用圖片優化
  },
  basePath: isProduction ? `/${repoName}` : '',  // 只在生產環境使用 basePath
  assetPrefix: isProduction ? `https://shaneguo89757.github.io/${repoName}` : '',  // 使用完整的 URL
  eslint: {
    ignoreDuringBuilds: true,  // 構建時忽略 ESLint 錯誤
  },
  distDir: 'docs',  // 將構建輸出到 docs 目錄
  trailingSlash: true,  // 確保 URL 結尾有斜線
}

module.exports = nextConfig 