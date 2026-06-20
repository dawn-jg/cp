'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import type { Evaluation } from '@/types';

export default function ResultsPage() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selected, setSelected] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const token = document.cookie.split('; ').find((r) => r.startsWith('token='))?.split('=')[1];
    if (!token) { router.push('/login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserId(payload.username);
      fetch('/api/admin/results')
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            const myEvals = (d.data as Evaluation[]).filter((e) => e.user_id === payload.username);
            setEvaluations(myEvals);
            if (myEvals.length > 0) setSelected(myEvals[myEvals.length - 1]);
          }
        });
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  }, [router]);

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

  if (evaluations.length === 0) {
    return (
      <>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-6">📭</div>
          <h1 className="text-2xl font-bold mb-3">暂无评测记录</h1>
          <p className="text-gray-500 mb-8">您还没有完成任何评测，现在就开始吧</p>
          <Link href="/evaluate" className="btn btn-primary btn-lg">
            🚀 开始评测
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">📊 评测历史</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 历史列表 */}
          <div className="space-y-3">
            {evaluations.map((e, i) => (
              <button
                key={e.id}
                onClick={() => setSelected(e)}
                className={`w-full text-left card cursor-pointer transition-all ${
                  selected?.id === e.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">第 {evaluations.length - i} 次评测</span>
                  <span className="text-lg font-bold text-blue-600">
                    {e.total_score}/{e.max_score}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {new Date(e.completed_at).toLocaleString('zh-CN')}
                  </span>
                  <span className="badge badge-success text-xs">
                    {Math.round((e.total_score / e.max_score) * 100)}%
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${(e.total_score / e.max_score) * 100}%` }}
                  />
                </div>
              </button>
            ))}
          </div>

          {/* 详情 */}
          {selected && (
            <div className="lg:col-span-2 space-y-6 animate-fade-in">
              {/* 分类得分 */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">📈 分类得分</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {selected.category_scores.map((cs) => (
                    <div key={cs.category} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-2">{cs.category}</p>
                      <div className="flex items-end gap-1">
                        <span className="text-2xl font-bold text-blue-600">{cs.score}</span>
                        <span className="text-sm text-gray-400 mb-0.5">/ {cs.max_score}</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            cs.percentage >= 60
                              ? 'bg-green-500'
                              : cs.percentage >= 30
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${cs.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-right mt-1 text-gray-500">{cs.percentage}%</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 逐题详情 */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">📋 逐题详情</h2>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>题目</th>
                        <th>您的答案</th>
                        <th>正确答案</th>
                        <th>结果</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.answers.map((a, i) => (
                        <tr key={i}>
                          <td className="text-gray-400">{i + 1}</td>
                          <td className="max-w-xs">
                            <p className="truncate" title={a.question_title}>
                              {a.question_title}
                            </p>
                          </td>
                          <td className="text-sm">
                            {Array.isArray(a.user_answer)
                              ? a.user_answer.join(', ')
                              : a.user_answer || '(未作答)'}
                          </td>
                          <td className="text-sm">
                            {Array.isArray(a.correct_answer)
                              ? a.correct_answer.join(', ')
                              : a.correct_answer || '(主观题)'}
                          </td>
                          <td>
                            <span className={`badge ${a.is_correct ? 'badge-success' : 'badge-danger'}`}>
                              {a.is_correct ? '✓' : '✗'} {a.score}/{a.max_score}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
