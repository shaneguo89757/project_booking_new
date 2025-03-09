/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // 啟用靜態網站導出
  images: {
    unoptimized: true,  // 靜態導出時需要禁用圖片優化
  }
}

module.exports = nextConfig 