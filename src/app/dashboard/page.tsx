'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import type { Evaluation } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string; group_id: string | null } | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = document.cookie.split('; ').find((r) => r.startsWith('token='))?.split('=')[1];
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role === 'admin') {
        router.push('/admin/dashboard');
        return;
      }
      setUser(payload);
      fetchEvaluations();
      // 获取组别名称
      fetch('/api/groups')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && payload.group_id) {
            const g = d.data.find((g: { id: string; name: string }) => g.id === payload.group_id);
            if (g) setGroupName(g.name);
          }
        })
        .catch(() => {});
    } catch {
      router.push('/login');
    }
  }, [router]);

  const fetchEvaluations = async () => {
    try {
      const res = await fetch('/api/admin/results');
      const data = await res.json();
      if (data.success) {
        setEvaluations(data.data || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </>
    );
  }

  const myEvals = evaluations.filter((e) => e.user_id === user?.username);
  const latest = myEvals[myEvals.length - 1];

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            欢迎回来，{user?.username} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            以下是您的评测概览
            {groupName && (
              <span className="ml-3 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded text-xs">
                🏷️ {groupName}
              </span>
            )}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-2">完成评测</p>
            <p className="text-4xl font-bold text-blue-600">{myEvals.length}</p>
            <p className="text-xs text-gray-400 mt-1">次</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-2">最近得分</p>
            <p className="text-4xl font-bold text-green-600">
              {latest ? `${latest.total_score}/${latest.max_score}` : '--'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {latest ? `${Math.round((latest.total_score / latest.max_score) * 100)}%` : '暂无'}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-2">分类平均正确率</p>
            <p className="text-4xl font-bold text-purple-600">
              {myEvals.length > 0
                ? `${Math.round(
                    myEvals.reduce(
                      (s, e) =>
                        s +
                        e.category_scores.reduce((cs, c) => cs + c.percentage, 0) /
                          e.category_scores.length,
                      0,
                    ) / myEvals.length,
                  )}%`
                : '--'}
            </p>
            <p className="text-xs text-gray-400 mt-1">综合</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link href="/evaluate" className="btn btn-primary btn-lg flex-1 text-center">
            🚀 开始新的评测
          </Link>
          <Link href="/results" className="btn btn-outline btn-lg flex-1 text-center">
            📊 查看历史成绩
          </Link>
        </div>

        {latest && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">📋 最近一次评测详情</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>题目</th>
                    <th>分类</th>
                    <th>得分</th>
                    <th>结果</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.answers.slice(0, 5).map((a, i) => (
                    <tr key={i}>
                      <td className="max-w-xs truncate">{a.question_title}</td>
                      <td>
                        <span className="badge badge-primary">{a.max_score}分</span>
                      </td>
                      <td>
                        {a.score}/{a.max_score}
                      </td>
                      <td>
                        <span className={`badge ${a.is_correct ? 'badge-success' : 'badge-danger'}`}>
                          {a.is_correct ? '正确' : '错误'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {latest.answers.length > 5 && (
              <Link
                href="/results"
                className="block text-center text-sm text-blue-600 hover:underline mt-4"
              >
                查看全部 {latest.answers.length} 题 →
              </Link>
            )}
          </div>
        )}
      </main>
    </>
  );
}
