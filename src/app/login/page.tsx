'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
      } else {
        router.push(data.data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl">📊</Link>
          <h1 className="text-2xl font-bold mt-4">登录评测系统</h1>
          <p className="text-gray-500 mt-2">欢迎回来，继续您的技能评测之旅</p>

        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">账号</label>
              <input
                type="text"
                className="input"
                placeholder="邮箱或用户名"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
              <input
                type="password"
                className="input"
                placeholder="请输入密码"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-gray-500">
              还没有账号？{' '}
              <Link href="/register" className="text-blue-600 hover:underline">
                立即注册
              </Link>
            </p>
            <Link href="/admin-login" className="text-xs text-gray-400 hover:text-blue-600 mt-2 inline-block">
              管理员登录 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
