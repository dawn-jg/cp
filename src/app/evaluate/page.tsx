'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import type { Question } from '@/types';

export default function EvaluatePage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [userGroupId, setUserGroupId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    total_score: number;
    max_score: number;
    category_scores: { category: string; percentage: number }[];
  } | null>(null);

  useEffect(() => {
    const token = document.cookie.split('; ').find((r) => r.startsWith('token='))?.split('=')[1];
    if (!token) { router.push('/login'); return; }
    let groupId: string | null = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role === 'admin') { router.push('/admin/dashboard'); return; }
      groupId = payload.group_id || null;
      setUserGroupId(groupId);
    } catch { router.push('/login'); return; }
    
    // 根据用户组别获取题目
    const url = groupId ? `/api/evaluate?group_id=${encodeURIComponent(groupId)}` : '/api/evaluate';
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setQuestions(d.data);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSingleSelect = (qId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const handleMultiSelect = (qId: string, option: string) => {
    setAnswers((prev) => {
      const current = (prev[qId] as string[]) || [];
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [qId]: updated };
    });
  };

  const handleTextChange = (qId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: text }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({
        question_id: q.id,
        user_answer: answers[q.id] || (q.type === 'multiple' ? [] : ''),
      }));
      const res = await fetch('/api/evaluate/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload, group_id: userGroupId }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({
          total_score: data.data.total_score,
          max_score: data.data.max_score,
          category_scores: data.data.category_scores,
        });
        setSubmitted(true);
      }
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = questions.length > 0 && questions.every((q) => {
    const a = answers[q.id];
    if (!a) return false;
    if (q.type === 'multiple') return (a as string[]).length > 0;
    return true;
  });

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

  if (questions.length === 0) {
    return (
      <>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-12 text-center">
          <div className="card">
            <div className="text-5xl mb-4">📭</div>
            <h1 className="text-xl font-bold mb-2">暂无可用题目</h1>
            <p className="text-gray-500 mb-6">
              {userGroupId ? '当前组别暂无适配题目，请联系管理员' : '系统暂无可用题目'}
            </p>
            <button onClick={() => router.push('/dashboard')} className="btn btn-outline">
              返回首页
            </button>
          </div>
        </main>
      </>
    );
  }

  if (submitted && result) {
    return (
      <>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="card text-center animate-fade-in">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-bold mb-2">评测完成！</h1>
            <div className="text-5xl font-bold text-blue-600 my-6">
              {result.total_score}
              <span className="text-2xl text-gray-400">/{result.max_score}</span>
            </div>
            <p className="text-gray-500 mb-8">
              正确率 {Math.round((result.total_score / result.max_score) * 100)}%
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {result.category_scores.map((cs) => (
                <div key={cs.category} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-2">{cs.category}</p>
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke={cs.percentage >= 60 ? '#10b981' : cs.percentage >= 30 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="6"
                        strokeDasharray={`${(cs.percentage / 100) * 175.9} 175.9`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                      {cs.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              <button onClick={() => router.push('/dashboard')} className="btn btn-outline">
                返回首页
              </button>
              <button onClick={() => router.push('/results')} className="btn btn-primary">
                查看详情
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  const q = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">技能评测</h1>
            <span className="text-sm text-gray-500">
              {currentStep + 1} / {questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {q && (
          <div className="card animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
              <span className={`badge ${q.type === 'single' ? 'badge-primary' : q.type === 'multiple' ? 'badge-warning' : 'badge-success'}`}>
                {q.type === 'single' ? '单选' : q.type === 'multiple' ? '多选' : '简答'}
              </span>
              <span className="badge badge-primary">{q.category}</span>
              <span className="badge">{q.score}分</span>
            </div>

            <h2 className="text-lg font-semibold mb-6">{q.title}</h2>

            {q.type === 'single' && (
              <div className="space-y-3">
                {q.options.map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      answers[q.id] === opt
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === opt}
                      onChange={() => handleSingleSelect(q.id, opt)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'multiple' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-3">可多选，选择所有正确答案</p>
                {q.options.map((opt) => {
                  const selected = ((answers[q.id] as string[]) || []).includes(opt);
                  return (
                    <label
                      key={opt}
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                        selected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => handleMultiSelect(q.id, opt)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {q.type === 'text' && (
              <div>
                <textarea
                  className="input min-h-[150px] resize-y"
                  placeholder="请输入您的回答..."
                  value={(answers[q.id] as string) || ''}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-between mt-8 pt-4 border-t">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="btn btn-outline btn-sm disabled:opacity-50"
              >
                ← 上一题
              </button>

              {currentStep < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!answers[q.id]}
                  className="btn btn-primary btn-sm disabled:opacity-50"
                >
                  下一题 →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  className="btn btn-success btn-sm disabled:opacity-50"
                >
                  {submitting ? '提交中...' : '✅ 提交评测'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 题目导航 */}
        <div className="flex flex-wrap gap-2 mt-6">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentStep(i)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                i === currentStep
                  ? 'bg-blue-600 text-white'
                  : answers[q.id]
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </main>
    </>
  );
}
