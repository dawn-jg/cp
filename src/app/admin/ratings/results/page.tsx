'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import { exportCSV } from '@/lib/export';
import type { RatingTarget, RatingStats, Group } from '@/types';

export default function AdminRatingsResultsPage() {
  const router = useRouter();
  const [targets, setTargets] = useState<RatingTarget[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [overview, setOverview] = useState<{ target_id: string; target_name: string; total_raters: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = document.cookie.split('; ').find((r) => r.startsWith('token='))?.split('=')[1];
    if (!token) { router.push('/admin-login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'admin') { router.push('/login'); return; }
    } catch { router.push('/admin-login'); return; }

    Promise.all([
      fetch('/api/admin/ratings').then((r) => r.json()),
      fetch('/api/admin/groups').then((r) => r.json()),
      fetch('/api/admin/ratings/results').then((r) => r.json()),
    ]).then(([tData, gData, oData]) => {
      if (tData.success) setTargets(tData.data);
      if (gData.success) setGroups(gData.data);
      if (oData.success) setOverview(oData.data);
    }).finally(() => setLoading(false));
  }, [router]);

  const loadStats = async () => {
    if (!selectedTarget) return;
    const params = new URLSearchParams({ target_id: selectedTarget });
    if (selectedGroup) params.set('group_id', selectedGroup);
    const res = await fetch(`/api/admin/ratings/results?${params}`);
    const d = await res.json();
    if (d.success) setStats(d.data);
  };

  useEffect(() => {
    if (selectedTarget) loadStats();
  }, [selectedTarget, selectedGroup]);

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

  const barColors = ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-red-400', 'bg-purple-500'];

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">📊 评分结果</h1>
            <p className="text-gray-500 mt-1">查看人物评分统计和分布</p>
          </div>
          {stats && stats.total_raters > 0 && (
            <button
              onClick={() => {
                exportCSV(
                  `评分结果_${stats.target.name}.csv`,
                  ['题目', '选项', '票数', '占比(%)'],
                  stats.questions.flatMap((q) =>
                    q.option_distribution.map((opt) => [
                      q.question_title,
                      opt.option,
                      String(opt.count),
                      String(opt.percentage),
                    ]),
                  ),
                );
              }}
              className="btn btn-outline btn-sm"
            >
              📥 导出CSV
            </button>
          )}
        </div>

        {/* 概览卡片 */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {overview.map((o) => (
            <div
              key={o.target_id}
              onClick={() => setSelectedTarget(o.target_id)}
              className={`card cursor-pointer transition-all ${
                selectedTarget === o.target_id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">
                  {o.target_name[0]}
                </div>
                <div>
                  <h3 className="font-semibold">{o.target_name}</h3>
                  <p className="text-sm text-gray-500">{o.total_raters} 人已评分</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 过滤器 */}
        <div className="card mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">评分对象</label>
              <select className="input text-sm" value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}>
                <option value="">请选择</option>
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">筛选组别</label>
              <select className="input text-sm" value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}>
                <option value="">全部组</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 统计结果 */}
        {stats ? (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold mb-1">{stats.target.name} - 评分统计</h2>
              <p className="text-sm text-gray-500">共 {stats.total_raters} 人参与评分</p>
            </div>

            {stats.questions.map((q) => (
              <div key={q.question_id} className="card">
                <h3 className="font-medium mb-4">{q.question_title}</h3>
                <div className="space-y-3">
                  {q.option_distribution.map((opt, i) => (
                    <div key={opt.option}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm">{opt.option}</span>
                        <span className="text-sm text-gray-500">{opt.count} 票 ({opt.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColors[i % barColors.length]}`}
                          style={{ width: `${opt.percentage}%`, minWidth: opt.percentage > 0 ? '2px' : '0' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {stats.total_raters === 0 && (
              <div className="card text-center text-gray-500 py-8">
                暂无评分数据
              </div>
            )}
          </div>
        ) : selectedTarget ? (
          <div className="card text-center text-gray-500 py-8">加载中...</div>
        ) : (
          <div className="card text-center text-gray-500 py-8">
            请选择一个评分对象查看结果
          </div>
        )}
      </main>
    </>
  );
}
