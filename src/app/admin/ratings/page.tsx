'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import type { RatingTarget, RatingQuestion, RatingGroup } from '@/types';

export default function AdminRatingsPage() {
  const router = useRouter();
  const [ratingGroups, setRatingGroups] = useState<RatingGroup[]>([]);
  const [targets, setTargets] = useState<RatingTarget[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // 当前选中的评分组
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  // 评分组表单
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<RatingGroup | null>(null);
  const [groupFormName, setGroupFormName] = useState('');

  // 评分对象表单
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [editingTarget, setEditingTarget] = useState<RatingTarget | null>(null);
  const [targetForm, setTargetForm] = useState({ name: '', description: '', group_ids: [] as string[] });

  // 题目管理
  const [expandedTarget, setExpandedTarget] = useState<string | null>(null);
  const [targetQuestions, setTargetQuestions] = useState<RatingQuestion[]>([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<RatingQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState({ title: '', options: ['', '', '', ''], score: 10 });

  useEffect(() => {
    const token = document.cookie.split('; ').find((r) => r.startsWith('token='))?.split('=')[1];
    if (!token) { router.push('/admin-login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'admin') { router.push('/login'); return; }
    } catch { router.push('/admin-login'); return; }
    fetchRatingGroups();
    fetch('/api/admin/groups')
      .then((r) => r.json())
      .then((d) => { if (d.success) setGroups(d.data); })
      .catch(() => {});
  }, [router]);

  const fetchRatingGroups = async () => {
    try {
      const res = await fetch('/api/admin/rating-groups');
      const d = await res.json();
      if (d.success) setRatingGroups(d.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchTargets = async (groupId: string | null) => {
    try {
      const url = groupId ? `/api/admin/ratings?group_id=${groupId}` : '/api/admin/ratings';
      const res = await fetch(url);
      const d = await res.json();
      if (d.success) setTargets(d.data);
    } catch { /* ignore */ }
  };

  const fetchQuestions = async (targetId: string) => {
    try {
      const res = await fetch(`/api/admin/ratings/questions?target_id=${targetId}`);
      const d = await res.json();
      if (d.success) setTargetQuestions(d.data);
    } catch { /* ignore */ }
  };

  // ===== 评分组操作 =====
  const openAddGroup = () => {
    setEditingGroup(null);
    setGroupFormName('');
    setShowGroupForm(true);
  };

  const openEditGroup = (g: RatingGroup) => {
    setEditingGroup(g);
    setGroupFormName(g.name);
    setShowGroupForm(true);
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingGroup ? 'PUT' : 'POST';
      const body = editingGroup ? { id: editingGroup.id, name: groupFormName } : { name: groupFormName };
      const res = await fetch('/api/admin/rating-groups', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.success) {
        setMsg(editingGroup ? '评分组已更新' : '评分组已创建');
        setShowGroupForm(false);
        fetchRatingGroups();
      } else {
        setMsg(d.error || '操作失败');
      }
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('网络错误');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('删除评分组不会删除其中的评分对象，但对象将不再归属于该组。确定删除？')) return;
    try {
      const res = await fetch('/api/admin/rating-groups', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (d.success) {
        if (currentGroupId === id) setCurrentGroupId(null);
        fetchRatingGroups();
        setMsg('评分组已删除');
      }
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('网络错误');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const enterGroup = (groupId: string) => {
    setCurrentGroupId(groupId);
    fetchTargets(groupId);
    resetTargetForm();
    setExpandedTarget(null);
  };

  const leaveGroup = () => {
    setCurrentGroupId(null);
    setTargets([]);
    resetTargetForm();
    setExpandedTarget(null);
  };

  // ===== 评分对象操作 =====
  const resetTargetForm = () => {
    setTargetForm({ name: '', description: '', group_ids: [] });
    setEditingTarget(null);
    setShowTargetForm(false);
  };

  const startEditTarget = (t: RatingTarget) => {
    setEditingTarget(t);
    setTargetForm({ name: t.name, description: t.description, group_ids: t.group_ids || [] });
    setShowTargetForm(true);
  };

  const handleTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingTarget ? 'PUT' : 'POST';
      const body: Record<string, unknown> = editingTarget
        ? { ...targetForm, id: editingTarget.id }
        : targetForm;
      if (currentGroupId) body.group_id = currentGroupId;
      const res = await fetch('/api/admin/ratings', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.success) {
        setMsg(editingTarget ? '已更新' : '已创建');
        resetTargetForm();
        fetchTargets(currentGroupId);
      } else { setMsg(d.error || '失败'); }
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('网络错误'); setTimeout(() => setMsg(''), 3000); }
  };

  const handleDeleteTarget = async (id: string) => {
    if (!confirm('删除该评分对象将同时删除所有关联题目和评分记录，确定？')) return;
    try {
      const res = await fetch('/api/admin/ratings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (d.success) {
        setTargets(targets.filter((t) => t.id !== id));
        if (expandedTarget === id) setExpandedTarget(null);
      }
    } catch { /* ignore */ }
  };

  // ===== 题目操作 =====
  const resetQuestionForm = () => {
    setQuestionForm({ title: '', options: ['', '', '', ''], score: 10 });
    setEditingQuestion(null);
    setShowQuestionForm(false);
  };

  const startEditQuestion = (q: RatingQuestion) => {
    setEditingQuestion(q);
    setQuestionForm({
      title: q.title,
      options: q.options.length >= 4 ? q.options : [...q.options, ...Array(4 - q.options.length).fill('')],
      score: q.score,
    });
    setShowQuestionForm(true);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedTarget) return;
    const cleanOptions = questionForm.options.filter((o) => o.trim() !== '');
    try {
      const method = editingQuestion ? 'PUT' : 'POST';
      const body = editingQuestion
        ? { ...questionForm, options: cleanOptions, id: editingQuestion.id }
        : { ...questionForm, options: cleanOptions, target_id: expandedTarget };
      const res = await fetch('/api/admin/ratings/questions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.success) {
        setMsg(editingQuestion ? '题目已更新' : '题目已添加');
        resetQuestionForm();
        fetchQuestions(expandedTarget);
      } else { setMsg(d.error || '失败'); }
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('网络错误'); setTimeout(() => setMsg(''), 3000); }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('确定删除该题目？')) return;
    try {
      const res = await fetch('/api/admin/ratings/questions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (d.success) {
        setTargetQuestions(targetQuestions.filter((q) => q.id !== id));
      }
    } catch { /* ignore */ }
  };

  const toggleExpand = (targetId: string) => {
    if (expandedTarget === targetId) {
      setExpandedTarget(null);
    } else {
      setExpandedTarget(targetId);
      fetchQuestions(targetId);
      resetQuestionForm();
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

  // ===== 组内评分管理视图 =====
  if (currentGroupId) {
    const currentGroup = ratingGroups.find((g) => g.id === currentGroupId);

    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <button onClick={leaveGroup} className="text-sm text-amber-600 hover:text-amber-800 mb-1 flex items-center gap-1">
                ← 返回评分组列表
              </button>
              <h1 className="text-2xl font-bold">⭐ {currentGroup?.name || '评分组'}</h1>
              <p className="text-gray-500 mt-1">{targets.length} 个评分对象</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => router.push('/admin/ratings/results')} className="btn btn-outline">
                📊 查看结果
              </button>
              <button onClick={() => { resetTargetForm(); setShowTargetForm(true); }} className="btn btn-primary">
                ＋ 添加评分对象
              </button>
            </div>
          </div>

          {msg && (
            <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm animate-fade-in">
              {msg}
            </div>
          )}

          {/* 评分对象表单 */}
          {showTargetForm && (
            <div className="card mb-8 animate-fade-in">
              <h2 className="text-lg font-semibold mb-6">{editingTarget ? '编辑评分对象' : '添加评分对象'}</h2>
              <form onSubmit={handleTargetSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名</label>
                    <input className="input" placeholder="被评分人姓名" value={targetForm.name}
                      onChange={(e) => setTargetForm({ ...targetForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
                    <input className="input" placeholder="如：前端团队 Leader" value={targetForm.description}
                      onChange={(e) => setTargetForm({ ...targetForm, description: e.target.value })} />
                  </div>
                </div>
                {groups.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">评分组别（不选则所有组可见）</label>
                    <div className="flex flex-wrap gap-2">
                      {groups.map((g) => {
                        const checked = targetForm.group_ids.includes(g.id);
                        return (
                          <label key={g.id} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-all ${checked ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                            <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded" checked={checked}
                              onChange={() => setTargetForm({ ...targetForm, group_ids: checked ? targetForm.group_ids.filter((id) => id !== g.id) : [...targetForm.group_ids, g.id] })} />
                            {g.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn btn-primary">{editingTarget ? '保存修改' : '创建'}</button>
                  <button type="button" onClick={resetTargetForm} className="btn btn-outline">取消</button>
                </div>
              </form>
            </div>
          )}

          {/* 评分对象列表 */}
          {targets.length === 0 ? (
            <div className="card text-center text-gray-500 py-12">该评分组中暂无评分对象</div>
          ) : (
            <div className="space-y-4">
              {targets.map((t) => (
                <div key={t.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleExpand(t.id)}>
                      <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">
                        {t.name[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold">{t.name}</h3>
                        <p className="text-xs text-gray-500">{t.description || '暂无描述'}</p>
                      </div>
                      <span className="text-xs text-gray-400 ml-auto">
                        {expandedTarget === t.id ? '▲ 收起' : '▼ 展开'}
                      </span>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => startEditTarget(t)} className="btn btn-outline btn-sm">编辑</button>
                      <button onClick={() => handleDeleteTarget(t.id)} className="btn btn-danger btn-sm">删除</button>
                    </div>
                  </div>

                  {expandedTarget === t.id && (
                    <div className="mt-6 pt-6 border-t animate-fade-in">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-sm text-gray-700">评分题目（{targetQuestions.length} 题）</h4>
                        <button onClick={() => { resetQuestionForm(); setShowQuestionForm(true); }} className="btn btn-primary btn-sm">
                          ＋ 添加题目
                        </button>
                      </div>

                      {showQuestionForm && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4 animate-fade-in">
                          <h5 className="text-sm font-medium mb-4">{editingQuestion ? '编辑题目' : '添加题目'}</h5>
                          <form onSubmit={handleQuestionSubmit} className="space-y-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">题目内容</label>
                              <input className="input text-sm" placeholder="请输入评分题目" value={questionForm.title}
                                onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {questionForm.options.map((opt, i) => (
                                <input key={i} className="input text-sm" placeholder={`选项 ${i + 1}`} value={opt}
                                  onChange={(e) => { const opts = [...questionForm.options]; opts[i] = e.target.value; setQuestionForm({ ...questionForm, options: opts }); }} />
                              ))}
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-600">分值</label>
                                <input type="number" className="input text-sm w-20" min={1} max={100} value={questionForm.score}
                                  onChange={(e) => setQuestionForm({ ...questionForm, score: Number(e.target.value) })} />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button type="submit" className="btn btn-primary btn-sm">{editingQuestion ? '保存' : '添加'}</button>
                              <button type="button" onClick={resetQuestionForm} className="btn btn-outline btn-sm">取消</button>
                            </div>
                          </form>
                        </div>
                      )}

                      {targetQuestions.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">暂无题目，点击上方按钮添加</p>
                      ) : (
                        <div className="space-y-2">
                          {targetQuestions.map((q) => (
                            <div key={q.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{q.title}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {q.options.map((opt) => (
                                    <span key={opt} className="text-xs bg-white px-2 py-0.5 rounded border border-gray-200">{opt}</span>
                                  ))}
                                </div>
                              </div>
                              <span className="text-xs text-gray-400 mx-3">{q.score}分</span>
                              <div className="flex gap-1">
                                <button onClick={() => startEditQuestion(q)} className="btn btn-outline btn-sm text-xs px-2 py-1">编辑</button>
                                <button onClick={() => handleDeleteQuestion(q.id)} className="btn btn-danger btn-sm text-xs px-2 py-1">删除</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </>
    );
  }

  // ===== 评分组列表视图 =====
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">⭐ 人物评分管理</h1>
            <p className="text-gray-500 mt-1">共 {ratingGroups.length} 个评分组</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/admin/ratings/results')} className="btn btn-outline">
              📊 查看结果
            </button>
            <button onClick={openAddGroup} className="btn btn-primary">
              ＋ 创建评分组
            </button>
          </div>
        </div>

        {msg && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm animate-fade-in">
            {msg}
          </div>
        )}

        {/* 评分组表单 */}
        {showGroupForm && (
          <div className="card mb-8 animate-fade-in">
            <h2 className="text-lg font-semibold mb-6">{editingGroup ? '编辑评分组' : '创建评分组'}</h2>
            <form onSubmit={handleGroupSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">评分组名称</label>
                <input className="input" placeholder="如：前端团队互评" value={groupFormName}
                  onChange={(e) => setGroupFormName(e.target.value)} required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn btn-primary">{editingGroup ? '保存修改' : '创建'}</button>
                <button type="button" onClick={() => setShowGroupForm(false)} className="btn btn-outline">取消</button>
              </div>
            </form>
          </div>
        )}

        {/* 评分组列表 */}
        {ratingGroups.length === 0 ? (
          <div className="card text-center text-gray-500 py-12">
            暂无评分组，点击上方按钮创建
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ratingGroups.map((g) => (
              <div key={g.id} className="card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => enterGroup(g.id)}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">{g.name}</h3>
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEditGroup(g)} className="btn btn-outline btn-sm text-xs px-2 py-1">编辑</button>
                    <button onClick={() => handleDeleteGroup(g.id)} className="btn btn-danger btn-sm text-xs px-2 py-1">删除</button>
                  </div>
                </div>
                <p className="text-xs text-gray-400">创建于 {new Date(g.created_at).toLocaleDateString('zh-CN')}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
