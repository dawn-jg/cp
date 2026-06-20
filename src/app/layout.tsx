import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '评测系统 — 专业代码与技能评测平台',
  description: '在线编程技能评测平台，支持问答评测、结果分析和管理后台',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
