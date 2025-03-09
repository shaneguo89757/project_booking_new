/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/project_booking_new',
  assetPrefix: '/project_booking_new/', // 添加這行
  trailingSlash: true, // 添加這行
}

module.exports = nextConfig