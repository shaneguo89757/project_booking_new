/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // 啟用靜態網站導出
  images: {
    unoptimized: true,  // 靜態導出時需要禁用圖片優化
  },
  basePath: '/project_booking_new',  // GitHub Pages 的基礎路徑
  eslint: {
    ignoreDuringBuilds: true,  // 構建時忽略 ESLint 錯誤
  },
}

module.exports = nextConfig 