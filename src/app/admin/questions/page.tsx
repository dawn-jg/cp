'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import type { Question, QuestionSet } from '@/types';

export default function AdminQuestionsPage() {
  const router = useRouter();
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // 当前选中的题目套
  const [currentSetId, setCurrentSetId] = useState<string | null>(null);

  // 题目套表单
  const [showSetForm, setShowSetForm] = useState(false);
  const [editingSet, setEditingSet] = useState<QuestionSet | null>(null);
  const [setFormName, setSetFormName] = useState('');

  // 题目表单
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState({
    title: '',
    type: 'single' as Question['type'],
    options: ['', '', '', ''],
    correct_answer: '' as string | string[],
    score: 10,
    category: '',
    group_ids: [] as string[],
  });

  useEffect(() => {
    const token = document.cookie.split('; ').find((r) => r.startsWith('token='))?.split('=')[1];
    if (!token) { router.push('/admin-login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'admin') { router.push('/login'); return; }
    } catch { router.push('/admin-login'); return; }
    fetchQuestionSets();
    fetch('/api/admin/groups')
      .then((r) => r.json())
      .then((d) => { if (d.success) setGroups(d.data); })
      .catch(() => {});
  }, [router]);

  const fetchQuestionSets = async () => {
    try {
      const res = await fetch('/api/admin/question-sets');
      const d = await res.json();
      if (d.success) setQuestionSets(d.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (setId: string | null) => {
    try {
      const url = setId ? `/api/admin/questions?set_id=${setId}` : '/api/admin/questions';
      const res = await fetch(url);
      const d = await res.json();
      if (d.success) setQuestions(d.data);
    } catch { /* ignore */ }
  };

  // ===== 题目套操作 =====
  const openAddSet = () => {
    setEditingSet(null);
    setSetFormName('');
    setShowSetForm(true);
  };

  const openEditSet = (s: QuestionSet) => {
    setEditingSet(s);
    setSetFormName(s.name);
    setShowSetForm(true);
  };

  const handleSetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingSet ? 'PUT' : 'POST';
      const body = editingSet ? { id: editingSet.id, name: setFormName } : { name: setFormName };
      const res = await fetch('/api/admin/question-sets', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.success) {
        setMsg(editingSet ? '题目套已更新' : '题目套已创建');
        setShowSetForm(false);
        fetchQuestionSets();
      } else {
        setMsg(d.error || '操作失败');
      }
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('网络错误');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleDeleteSet = async (id: string) => {
    if (!confirm('删除该题目套不会删除其中的题目，但题目将不再归属于该套。确定删除？')) return;
    try {
      const res = await fetch('/api/admin/question-sets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (d.success) {
        if (currentSetId === id) setCurrentSetId(null);
        fetchQuestionSets();
        setMsg('题目套已删除');
      }
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('网络错误');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const enterSet = (setId: string) => {
    setCurrentSetId(setId);
    fetchQuestions(setId);
    resetForm();
  };

  const leaveSet = () => {
    setCurrentSetId(null);
    setQuestions([]);
    resetForm();
  };

  // ===== 题目操作 =====
  const resetForm = () => {
    setForm({ title: '', type: 'single', options: ['', '', '', ''], correct_answer: '', score: 10, category: '', group_ids: [] });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (q: Question) => {
    setEditing(q);
    setForm({
      title: q.title,
      type: q.type,
      options: q.options.length >= 4 ? q.options : [...q.options, ...Array(4 - q.options.length).fill('')],
      correct_answer: q.correct_answer,
      score: q.score,
      category: q.category,
      group_ids: q.group_ids || [],
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOptions = form.options.filter((o) => o.trim() !== '');
    const payload: Record<string, unknown> = {
      ...form,
      options: cleanOptions,
      correct_answer: form.type === 'multiple' && typeof form.correct_answer === 'string'
        ? form.correct_answer.split(',').map((s) => s.trim())
        : form.correct_answer,
    };
    if (currentSetId) payload.set_id = currentSetId;

    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...payload, id: editing.id } : payload;
      const res = await fetch('/api/admin/questions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.success) {
        setMsg(editing ? '题目已更新' : '题目已添加');
        resetForm();
        fetchQuestions(currentSetId);
      } else {
        setMsg(d.error || '操作失败');
      }
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('网络错误');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该题目？')) return;
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (d.success) {
        setQuestions(questions.filter((q) => q.id !== id));
        setMsg('题目已删除');
      }
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('网络错误');
      setTimeout(() => setMsg(''), 3000);
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

  // ===== 套内题目管理视图 =====
  if (currentSetId) {
    const currentSet = questionSets.find((s) => s.id === currentSetId);
    const categories = [...new Set(questions.map((q) => q.category))];

    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <button onClick={leaveSet} className="text-sm text-blue-600 hover:text-blue-800 mb-1 flex items-center gap-1">
                ← 返回题目套列表
              </button>
              <h1 className="text-2xl font-bold">📚 {currentSet?.name || '题目套'}</h1>
              <p className="text-gray-500 mt-1">共 {questions.length} 道题目，{categories.length} 个分类</p>
            </div>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary">
              ＋ 添加题目
            </button>
          </div>

          {msg && (
            <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm animate-fade-in">
              {msg}
            </div>
          )}

          {/* 添加/编辑题目表单 */}
          {showForm && (
            <div className="card mb-8 animate-fade-in">
              <h2 className="text-lg font-semibold mb-6">{editing ? '编辑题目' : '添加新题目'}</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">题目内容</label>
                    <input className="input" placeholder="请输入题目" value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">题目类型</label>
                    <select className="input" value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as Question['type'] })}>
                      <option value="single">单选题</option>
                      <option value="multiple">多选题</option>
                      <option value="text">简答题</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">分类</label>
                    <input className="input" placeholder="如：前端框架" value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })} required list="categories" />
                    <datalist id="categories">
                      {categories.map((c) => (<option key={c} value={c} />))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">分值</label>
                    <input type="number" className="input" min={1} max={100} value={form.score}
                      onChange={(e) => setForm({ ...form, score: Number(e.target.value) })} required />
                  </div>
                </div>

                {groups.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">归属组别（不选则所有组可见）</label>
                    <div className="flex flex-wrap gap-2">
                      {groups.map((g) => {
                        const checked = form.group_ids.includes(g.id);
                        return (
                          <label key={g.id} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-all ${checked ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                            <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded" checked={checked}
                              onChange={() => setForm({ ...form, group_ids: checked ? form.group_ids.filter((id) => id !== g.id) : [...form.group_ids, g.id] })} />
                            {g.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(form.type === 'single' || form.type === 'multiple') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">选项（留空则忽略）</label>
                      <div className="grid grid-cols-2 gap-3">
                        {form.options.map((opt, i) => (
                          <input key={i} className="input" placeholder={`选项 ${i + 1}`} value={opt}
                            onChange={(e) => { const opts = [...form.options]; opts[i] = e.target.value; setForm({ ...form, options: opts }); }} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {form.type === 'multiple' ? '正确答案（多选用逗号分隔）' : '正确答案'}
                      </label>
                      <input className="input"
                        placeholder={form.type === 'multiple' ? '如：选项1, 选项2' : '输入正确选项内容'}
                        value={typeof form.correct_answer === 'string' ? form.correct_answer : (form.correct_answer as string[]).join(', ')}
                        onChange={(e) => setForm({ ...form, correct_answer: e.target.value })} required />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn btn-primary">{editing ? '保存修改' : '添加题目'}</button>
                  <button type="button" onClick={resetForm} className="btn btn-outline">取消</button>
                </div>
              </form>
            </div>
          )}

          {/* 题目列表 */}
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="card flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`badge text-xs ${q.type === 'single' ? 'badge-primary' : q.type === 'multiple' ? 'badge-warning' : 'badge-success'}`}>
                      {q.type === 'single' ? '单选' : q.type === 'multiple' ? '多选' : '简答'}
                    </span>
                    <span className="badge badge-primary text-xs">{q.category}</span>
                    <span className="badge text-xs">{q.score}分</span>
                    {q.group_ids && q.group_ids.length > 0 && q.group_ids.map((gid) => {
                      const g = groups.find((gr) => gr.id === gid);
                      return g ? (<span key={gid} className="badge badge-success text-xs">{g.name}</span>) : null;
                    })}
                    {(!q.group_ids || q.group_ids.length === 0) && (
                      <span className="badge text-xs bg-gray-100 text-gray-500">全部组</span>
                    )}
                  </div>
                  <p className="font-medium mb-2">{q.title}</p>
                  {q.options.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt) => {
                        const isCorrect = q.type === 'multiple'
                          ? (Array.isArray(q.correct_answer) && q.correct_answer.includes(opt))
                          : q.correct_answer === opt;
                        return (
                          <span key={opt} className={`text-xs px-2 py-1 rounded-md ${isCorrect ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                            {isCorrect && '✓ '}{opt}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {q.type === 'text' && (<p className="text-xs text-gray-400">简答题（自动给分）</p>)}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(q)} className="btn btn-outline btn-sm">编辑</button>
                  <button onClick={() => handleDelete(q.id)} className="btn btn-danger btn-sm">删除</button>
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <div className="card text-center text-gray-500 py-12">该题目套中暂无题目</div>
            )}
          </div>
        </main>
      </>
    );
  }

  // ===== 题目套列表视图 =====
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">📚 题库管理</h1>
            <p className="text-gray-500 mt-1">共 {questionSets.length} 个题目套</p>
          </div>
          <button onClick={openAddSet} className="btn btn-primary">
            ＋ 创建题目套
          </button>
        </div>

        {msg && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm animate-fade-in">
            {msg}
          </div>
        )}

        {/* 题目套表单 */}
        {showSetForm && (
          <div className="card mb-8 animate-fade-in">
            <h2 className="text-lg font-semibold mb-6">{editingSet ? '编辑题目套' : '创建题目套'}</h2>
            <form onSubmit={handleSetSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">题目套名称</label>
                <input className="input" placeholder="如：前端基础测试" value={setFormName}
                  onChange={(e) => setSetFormName(e.target.value)} required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn btn-primary">{editingSet ? '保存修改' : '创建'}</button>
                <button type="button" onClick={() => setShowSetForm(false)} className="btn btn-outline">取消</button>
              </div>
            </form>
          </div>
        )}

        {/* 题目套列表 */}
        {questionSets.length === 0 ? (
          <div className="card text-center text-gray-500 py-12">
            暂无题目套，点击上方按钮创建
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {questionSets.map((s) => (
              <div key={s.id} className="card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => enterSet(s.id)}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">{s.name}</h3>
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEditSet(s)} className="btn btn-outline btn-sm text-xs px-2 py-1">编辑</button>
                    <button onClick={() => handleDeleteSet(s.id)} className="btn btn-danger btn-sm text-xs px-2 py-1">删除</button>
                  </div>
                </div>
                <p className="text-xs text-gray-400">创建于 {new Date(s.created_at).toLocaleDateString('zh-CN')}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
