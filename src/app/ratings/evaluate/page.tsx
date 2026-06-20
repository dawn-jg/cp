'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import type { RatingQuestion, RatingTarget } from '@/types';

function EvaluateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId = searchParams.get('target_id');

  const [target, setTarget] = useState<RatingTarget | null>(null);
  const [questions, setQuestions] = useState<RatingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!targetId) { router.push('/ratings'); return; }

    const token = document.cookie.split('; ').find((r) => r.startsWith('token='))?.split('=')[1];
    if (!token) { router.push('/login'); return; }

    Promise.all([
      fetch('/api/admin/ratings').then((r) => r.json()),
      fetch(`/api/ratings/questions?target_id=${targetId}`).then((r) => r.json()),
    ]).then(([tData, qData]) => {
      if (tData.success) {
        const found = tData.data.find((t: RatingTarget) => t.id === targetId);
        setTarget(found || null);
      }
      if (qData.success) setQuestions(qData.data);
    }).finally(() => setLoading(false));
  }, [targetId, router]);

  const handleSelect = (qId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        target_id: targetId,
        answers: questions.map((q) => ({
          question_id: q.id,
          selected_option: answers[q.id] || '',
        })),
      };
      const res = await fetch('/api/ratings/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (d.success) {
        setSubmitted(true);
      } else {
        setError(d.error || '提交失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!target) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="card">
          <div className="text-5xl mb-4">❓</div>
          <p className="text-gray-500 mb-4">评分对象不存在或已删除</p>
          <button onClick={() => router.push('/ratings')} className="btn btn-outline">返回列表</button>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="card animate-fade-in">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-2xl font-bold mb-2">评分提交成功</h1>
          <p className="text-gray-500 mb-2">您对 {target.name} 的评价已提交</p>
          <p className="text-xs text-gray-400 mb-8">评分结果仅管理员可见</p>
          <button onClick={() => router.push('/ratings')} className="btn btn-primary">
            返回评分列表
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">
            {target.name[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold">评价 {target.name}</h1>
            <p className="text-sm text-gray-500">{target.description}</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          🔒 您的评分将匿名提交，仅管理员可查看统计结果
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="card animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-medium">
                {idx + 1}
              </span>
              <h3 className="font-medium">{q.title}</h3>
            </div>
            <div className="space-y-2">
              {q.options.map((opt) => (
                <label
                  key={opt}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    answers[q.id] === opt
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === opt}
                    onChange={() => handleSelect(q.id, opt)}
                    className="w-4 h-4 text-amber-500"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {questions.length > 0 && (
        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="btn btn-success btn-lg disabled:opacity-50 px-12"
          >
            {submitting ? '提交中...' : '✅ 提交评分'}
          </button>
          {!allAnswered && (
            <p className="text-xs text-gray-400 mt-2">请回答所有题目后再提交</p>
          )}
        </div>
      )}
    </main>
  );
}

export default function RatingsEvaluatePage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      }>
        <EvaluateContent />
      </Suspense>
    </>
  );
}
