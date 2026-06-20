'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import type { RatingTarget } from '@/types';

interface TargetWithStatus extends RatingTarget {
  has_rated: boolean;
}

export default function RatingsPage() {
  const router = useRouter();
  const [targets, setTargets] = useState<TargetWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = document.cookie.split('; ').find((r) => r.startsWith('token='))?.split('=')[1];
    if (!token) { router.push('/login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role === 'admin') { router.push('/admin/dashboard'); return; }
    } catch { router.push('/login'); return; }

    fetch('/api/ratings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTargets(d.data);
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

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">⭐ 人物评分</h1>
          <p className="text-gray-500 mt-1">选择要评分的人员，完成匿名评价</p>
        </div>

        {targets.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-lg font-semibold mb-2">暂无待评分人员</h2>
            <p className="text-gray-500">管理员暂未添加评分对象，或当前组别无可用评分</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {targets.map((t) => (
              <div key={t.id} className="card flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${
                  t.has_rated ? 'bg-gray-300 text-gray-500' : 'bg-amber-500 text-white'
                }`}>
                  {t.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{t.description || '暂无描述'}</p>
                </div>
                <button
                  onClick={() => router.push(`/ratings/evaluate?target_id=${t.id}`)}
                  disabled={t.has_rated}
                  className={`btn btn-sm shrink-0 ${
                    t.has_rated
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                      : 'btn-primary'
                  }`}
                >
                  {t.has_rated ? '已评分' : '去评分'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
