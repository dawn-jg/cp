'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import type { Group } from '@/types';

export default function AdminGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => {
    const token = document.cookie.split('; ').find((r) => r.startsWith('token='))?.split('=')[1];
    if (!token) { router.push('/admin-login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'admin') { router.push('/login'); return; }
    } catch { router.push('/admin-login'); return; }
    fetchGroups();
  }, [router]);

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/admin/groups');
      const d = await res.json();
      if (d.success) setGroups(d.data);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', description: '' });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (g: Group) => {
    setEditing(g);
    setForm({ name: g.name, description: g.description });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch('/api/admin/groups', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.success) {
        setMsg(editing ? '组别已更新' : '组别已创建');
        resetForm();
        fetchGroups();
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
    if (!confirm('删除该组会将组内成员移出，确定删除？')) return;
    try {
      const res = await fetch('/api/admin/groups', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (d.success) {
        setGroups(groups.filter((g) => g.id !== id));
        setMsg('组别已删除');
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

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">🏷️ 组别管理</h1>
            <p className="text-gray-500 mt-1">
              共 {groups.length} 个组别，用于分组出题和用户分类
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="btn btn-primary"
          >
            ＋ 新建组别
          </button>
        </div>

        {msg && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm animate-fade-in">
            {msg}
          </div>
        )}

        {showForm && (
          <div className="card mb-8 animate-fade-in">
            <h2 className="text-lg font-semibold mb-6">{editing ? '编辑组别' : '新建组别'}</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">组别名称</label>
                <input
                  className="input"
                  placeholder="如：前端组、后端组、全栈组"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
                <textarea
                  className="input min-h-[80px] resize-y"
                  placeholder="组别用途说明..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn btn-primary">
                  {editing ? '保存修改' : '创建组别'}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-outline">
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {groups.length === 0 ? (
          <div className="card text-center text-gray-500 py-12">
            暂无组别，点击上方按钮创建第一个组别
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((g) => (
              <div key={g.id} className="card flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">{g.name}</h3>
                  <span className="text-xs text-gray-400">{g.id}</span>
                </div>
                <p className="text-sm text-gray-500 flex-1 mb-4">
                  {g.description || '暂无描述'}
                </p>
                <div className="flex gap-2 text-xs text-gray-400 mb-3">
                  创建于 {new Date(g.created_at).toLocaleDateString('zh-CN')}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(g)} className="btn btn-outline btn-sm flex-1">
                    编辑
                  </button>
                  <button onClick={() => handleDelete(g.id)} className="btn btn-danger btn-sm flex-1">
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
