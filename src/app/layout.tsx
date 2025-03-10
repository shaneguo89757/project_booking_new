import React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

const inter = Inter({ subsets: ["latin"] });

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',  // 讀寫權限
  // 或者用 'https://www.googleapis.com/auth/spreadsheets.readonly' // 只讀權限
];

export const metadata = {
  title: "課程預約系統",
  description: "A simple course booking system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <GoogleOAuthProvider 
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
        >
          <main className="min-h-screen bg-gray-100">
            {children}
          </main>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
} 