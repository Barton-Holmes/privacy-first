import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AnonExam - 匿名加密在线考试平台",
  description: "基于FHEVM的去中心化隐私保护考试平台",
  keywords: ["FHEVM", "区块链", "隐私计算", "在线考试", "去中心化"],
  authors: [{ name: "AnonExam Team" }],
  creator: "AnonExam Team",
  publisher: "AnonExam Team",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}

