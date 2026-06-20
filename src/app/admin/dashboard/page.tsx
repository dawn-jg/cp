'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import StatCard from '@/components/ui/StatCard';
import type { EvaluationSummary } from '@/types';

// 简易图表组件（不依赖外部库，纯 SVG）
function BarChart({
  data,
  color = '#3b82f6',
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  if (data.length === 0) return <p className="text-gray-400 text-sm text-center py-8">暂无数据</p>;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-600 w-20 text-right shrink-0">{d.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{
                width: `${(d.value / maxVal) * 100}%`,
                backgroundColor: color,
              }}
            >
              <span className="text-xs text-white font-medium">{d.value}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  if (data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-gray-400 text-sm text-center py-8">暂无数据</p>;

  const size = 180;
  const center = size / 2;
  const radius = 70;
  const strokeW = 20;
  const circumference = 2 * Math.PI * (radius + strokeW / 2);

  let offset = 0;
  const segments = data.map((d) => {
    const pct = d.value / total;
    const len = pct * circumference;
    const seg = { ...d, pct, dash: len, dashOffset: offset };
    offset += len;
    return seg;
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg) => (
          <circle
            key={seg.label}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeW}
            strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
            strokeDashoffset={-seg.dashOffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${center} ${center})`}
          />
        ))}
        <text x={center} y={center - 6} textAnchor="middle" className="text-2xl font-bold" fill="#1e293b">
          {total}
        </text>
        <text x={center} y={center + 14} textAnchor="middle" className="text-xs" fill="#94a3b8">
          总评测数
        </text>
      </svg>
      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-gray-600">{d.label}</span>
            <span className="font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<EvaluationSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = document.cookie.split('; ').find((r) => r.startsWith('token='))?.split('=')[1];
    if (!token) { router.push('/admin-login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'admin') { router.push('/login'); return; }
    } catch { router.push('/admin-login'); return; }

    fetch('/api/admin/results?type=summary')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSummary(d.data);
      })
      .finally(() => setLoading(false));
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

  // 分数分布
  const scoreRanges = [
    { label: '90-100分', min: 90, max: 100, color: '#10b981' },
    { label: '70-89分', min: 70, max: 89, color: '#3b82f6' },
    { label: '50-69分', min: 50, max: 69, color: '#f59e0b' },
    { label: '0-49分', min: 0, max: 49, color: '#ef4444' },
  ];

  const distribution = summary
    ? scoreRanges.map((r) => {
        const evals = summary.recent_evaluations || [];
        const pct =
          summary.total_evaluations > 0
            ? evals.filter((e) => {
                const p = (e.total_score / e.max_score) * 100;
                return p >= r.min && p <= r.max;
              }).length
            : 0;
        return { label: r.label, value: pct, color: r.color };
      })
    : [];

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">📊 管理仪表盘</h1>

        {summary && (
          <>
            {/* 统计卡片 */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatCard title="注册用户" value={summary.total_users} icon="👥" color="blue" subtitle="总注册人数" />
              <StatCard title="完成评测" value={summary.total_evaluations} icon="📝" color="green" subtitle="总提交次数" />
              <StatCard title="平均得分" value={`${summary.average_score}分`} icon="⭐" color="yellow" />
              <StatCard title="完成率" value={`${summary.completion_rate}%`} icon="✅" color="purple" subtitle={`${summary.total_users}位用户中完成评测比例`} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-10">
              {/* 分类平均分 */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-6">📈 各分类平均正确率</h2>
                <BarChart
                  data={summary.category_averages.map((c) => ({ label: c.category, value: c.average }))}
                />
              </div>

              {/* 分数分布 */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-6">🎯 分数段分布</h2>
                <DonutChart data={distribution} />
              </div>
            </div>

            {/* 最近评测列表 */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">🕐 最近评测</h2>
              {summary.recent_evaluations.length === 0 ? (
                <p className="text-gray-400 text-center py-8">暂无评测记录</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>用户</th>
                        <th>总分</th>
                        <th>正确率</th>
                        <th>分类得分</th>
                        <th>时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recent_evaluations.map((e) => (
                        <tr key={e.id}>
                          <td className="font-medium">{e.user_id}</td>
                          <td>
                            <span className="font-bold text-blue-600">{e.total_score}</span>
                            <span className="text-gray-400">/{e.max_score}</span>
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
                              {e.category_scores.slice(0, 3).map((cs) => (
                                <span key={cs.category} className="badge badge-primary text-xs">
                                  {cs.category}: {cs.percentage}%
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="text-xs text-gray-500">
                            {new Date(e.completed_at).toLocaleString('zh-CN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
