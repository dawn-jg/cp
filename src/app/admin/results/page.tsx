'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import StatCard from '@/components/ui/StatCard';
import { exportCSV } from '@/lib/export';
import type { Evaluation, Question } from '@/types';

// 饼图组件（纯 SVG）
function PieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-gray-400 text-sm text-center py-8">暂无数据</p>;

  const size = 160;
  const center = size / 2;
  const radius = 60;
  let cumulative = 0;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((d) => {
          const pct = d.value / total;
          const startAngle = (cumulative / total) * 360;
          cumulative += d.value;
          const endAngle = (cumulative / total) * 360;

          const startRad = ((startAngle - 90) * Math.PI) / 180;
          const endRad = ((endAngle - 90) * Math.PI) / 180;

          const x1 = center + radius * Math.cos(startRad);
          const y1 = center + radius * Math.sin(startRad);
          const x2 = center + radius * Math.cos(endRad);
          const y2 = center + radius * Math.sin(endRad);

          const largeArc = pct > 0.5 ? 1 : 0;

          return (
            <path
              key={d.label}
              d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={d.color}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-gray-600">{d.label}</span>
            <span className="font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminResultsPage() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview');

  useEffect(() => {
    const token = document.cookie.split('; ').find((r) => r.startsWith('token='))?.split('=')[1];
    if (!token) { router.push('/admin-login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'admin') { router.push('/login'); return; }
    } catch { router.push('/admin-login'); return; }

    Promise.all([
      fetch('/api/admin/results').then((r) => r.json()),
      fetch('/api/admin/questions').then((r) => r.json()),
    ]).then(([eData, qData]) => {
      if (eData.success) setEvaluations(eData.data);
      if (qData.success) setQuestions(qData.data);
    }).finally(() => setLoading(false));
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

  // 统计数据
  const userEvalCount = new Map<string, number>();
  evaluations.forEach((e) => {
    userEvalCount.set(e.user_id, (userEvalCount.get(e.user_id) || 0) + 1);
  });

  const avgScore =
    evaluations.length > 0
      ? Math.round(evaluations.reduce((s, e) => s + (e.total_score / e.max_score) * 100, 0) / evaluations.length)
      : 0;

  const scoreDistribution = [
    { label: '优秀(≥80%)', value: evaluations.filter((e) => (e.total_score / e.max_score) >= 0.8).length, color: '#10b981' },
    { label: '良好(60-79%)', value: evaluations.filter((e) => {
      const p = e.total_score / e.max_score;
      return p >= 0.6 && p < 0.8;
    }).length, color: '#3b82f6' },
    { label: '一般(40-59%)', value: evaluations.filter((e) => {
      const p = e.total_score / e.max_score;
      return p >= 0.4 && p < 0.6;
    }).length, color: '#f59e0b' },
    { label: '需提升(<40%)', value: evaluations.filter((e) => (e.total_score / e.max_score) < 0.4).length, color: '#ef4444' },
  ];

  // 题目正确率
  const questionAccuracy = questions.map((q) => {
    const attempts = evaluations
      .flatMap((e) => e.answers.filter((a) => a.question_id === q.id));
    const correct = attempts.filter((a) => a.is_correct).length;
    return {
      title: q.title.length > 20 ? q.title.slice(0, 20) + '...' : q.title,
      accuracy: attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : 0,
      attempts: attempts.length,
    };
  }).sort((a, b) => b.accuracy - a.accuracy);

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">📋 评测结果</h1>
            <p className="text-gray-500 mt-1">{evaluations.length} 条评测记录</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                exportCSV('评测结果.csv',
                  ['用户', '总分', '满分', '正确率(%)', '分类得分', '提交时间'],
                  evaluations.map((e) => [
                    e.user_id,
                    String(e.total_score),
                    String(e.max_score),
                    String(Math.round((e.total_score / e.max_score) * 100)),
                    e.category_scores.map((cs) => `${cs.category}:${cs.score}/${cs.max_score}`).join('; '),
                    new Date(e.completed_at).toLocaleString('zh-CN'),
                  ]),
                );
              }}
              className="btn btn-outline btn-sm"
            >
              📥 导出CSV
            </button>
            <button
              onClick={() => setViewMode('overview')}
              className={`btn btn-sm ${viewMode === 'overview' ? 'btn-primary' : 'btn-outline'}`}
            >
              数据总览
            </button>
            <button
              onClick={() => setViewMode('detail')}
              className={`btn btn-sm ${viewMode === 'detail' ? 'btn-primary' : 'btn-outline'}`}
            >
              逐条查看
            </button>
          </div>
        </div>

        {viewMode === 'overview' && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatCard title="评测总数" value={evaluations.length} icon="📝" color="blue" />
              <StatCard title="参与用户" value={userEvalCount.size} icon="👥" color="green" />
              <StatCard title="平均正确率" value={`${avgScore}%`} icon="🎯" color="yellow" />
              <StatCard title="题目数量" value={questions.length} icon="📚" color="purple" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-10">
              {/* 分数分布饼图 */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-6">📊 成绩分布</h2>
                <PieChart data={scoreDistribution} />
              </div>

              {/* 题目正确率排行 */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-6">📈 题目正确率排行</h2>
                {questionAccuracy.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">暂无数据</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {questionAccuracy.map((qa, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-6">{i + 1}</span>
                        <span className="text-sm flex-1 truncate" title={qa.title}>{qa.title}</span>
                        <div className="w-24 bg-gray-100 rounded-full h-4 relative overflow-hidden shrink-0">
                          <div
                            className={`h-full rounded-full ${
                              qa.accuracy >= 70
                                ? 'bg-green-500'
                                : qa.accuracy >= 40
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${qa.accuracy}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-10 text-right">{qa.accuracy}%</span>
                        <span className="text-xs text-gray-400 w-10 text-right">{qa.attempts}次</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 用户评测次数 */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">👤 用户评测次数</h2>
              {userEvalCount.size === 0 ? (
                <p className="text-gray-400 text-center py-8">暂无数据</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>用户</th>
                        <th>评测次数</th>
                        <th>平均正确率</th>
                        <th>最近评测</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(userEvalCount.entries()).map(([userId, count]) => {
                        const userEvals = evaluations.filter((e) => e.user_id === userId);
                        const avg =
                          userEvals.length > 0
                            ? Math.round(
                                userEvals.reduce((s, e) => s + (e.total_score / e.max_score) * 100, 0) /
                                  userEvals.length,
                              )
                            : 0;
                        const last = userEvals[userEvals.length - 1];
                        return (
                          <tr key={userId}>
                            <td className="font-medium">{userId}</td>
                            <td>
                              <span className="badge badge-primary">{count}</span>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  avg >= 70 ? 'badge-success' : avg >= 40 ? 'badge-warning' : 'badge-danger'
                                }`}
                              >
                                {avg}%
                              </span>
                            </td>
                            <td className="text-xs text-gray-500">
                              {last ? new Date(last.completed_at).toLocaleString('zh-CN') : '--'}
                            </td>
                            <td>
                              <button
                                onClick={() => {
                                  setSelected(last);
                                  setViewMode('detail');
                                }}
                                className="btn btn-outline btn-sm"
                              >
                                查看详情
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {viewMode === 'detail' && (
          <>
            {selected && (
              <div className="card mb-6 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    评测详情 — {selected.user_id}
                  </h2>
                  <button onClick={() => setSelected(null)} className="btn btn-outline btn-sm">
                    返回列表
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  {selected.category_scores.map((cs) => (
                    <div key={cs.category} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">{cs.category}</p>
                      <p className="text-xl font-bold">
                        {cs.score}/{cs.max_score}
                      </p>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${cs.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{cs.percentage}%</p>
                    </div>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>题目</th>
                        <th>答案</th>
                        <th>正确答案</th>
                        <th>结果</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.answers.map((a, i) => (
                        <tr key={i}>
                          <td className="text-gray-400">{i + 1}</td>
                          <td className="max-w-xs truncate">{a.question_title}</td>
                          <td className="text-sm">
                            {Array.isArray(a.user_answer) ? a.user_answer.join(', ') : a.user_answer || '--'}
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
            )}

            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>用户</th>
                      <th>总分</th>
                      <th>正确率</th>
                      <th>分类</th>
                      <th>时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluations.map((e) => (
                      <tr key={e.id}>
                        <td className="font-medium">{e.user_id}</td>
                        <td>
                          <span className="font-bold text-blue-600">{e.total_score}</span>
                          <span className="text-gray-400 text-sm">/{e.max_score}</span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              e.total_score / e.max_score >= 0.7
                                ? 'badge-success'
                                : e.total_score / e.max_score >= 0.4
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            {Math.round((e.total_score / e.max_score) * 100)}%
                          </span>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {e.category_scores.map((cs) => (
                              <span key={cs.category} className="badge badge-primary text-xs">
                                {cs.category}: {cs.percentage}%
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="text-xs text-gray-500">
                          {new Date(e.completed_at).toLocaleString('zh-CN')}
                        </td>
                        <td>
                          <button
                            onClick={() => setSelected(e)}
                            className="btn btn-outline btn-sm"
                          >
                            查看
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
