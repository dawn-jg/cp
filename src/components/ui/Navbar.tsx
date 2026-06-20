'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface UserInfo {
  userId: string;
  username: string;
  role: string;
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // 从 cookie 解析用户信息
    const token = document.cookie
      .split('; ')
      .find((r) => r.startsWith('token='))
      ?.split('=')[1];
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ userId: payload.userId, username: payload.username, role: payload.role });
      } catch {
        /* ignore */
      }
    }
  }, []);

  const handleLogout = async () => {
    document.cookie = 'token=; path=/; max-age=0';
    setUser(null);
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-blue-600">
              📊 评测系统
            </Link>
            {user && (
              <div className="hidden md:flex items-center gap-4">
                {user.role === 'admin' ? (
                  <>
                    <Link href="/admin/dashboard" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      管理首页
                    </Link>
                    <Link href="/admin/users" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      用户管理
                    </Link>
                    <Link href="/admin/questions" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      题库管理
                    </Link>
                    <Link href="/admin/groups" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      组别管理
                    </Link>
                    <Link href="/admin/ratings" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      人物评分
                    </Link>
                    <Link href="/admin/results" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      评测结果
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      首页
                    </Link>
                    <Link href="/evaluate" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      开始评测
                    </Link>
                    <Link href="/ratings" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      人物评分
                    </Link>
                    <Link href="/results" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      我的成绩
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                    {user.username[0]}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{user.username}</span>
                  <span className="badge badge-primary text-xs">{user.role === 'admin' ? '管理员' : '用户'}</span>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-12 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-fade-in">
                      <div className="px-4 py-2 text-xs text-gray-500 border-b">
                        {user.username} · {user.role === 'admin' ? '管理员' : '普通用户'}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        退出登录
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="btn btn-outline btn-sm">
                  登录
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
