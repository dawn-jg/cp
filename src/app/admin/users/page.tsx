'use client';
// force recompile: v4
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import type { User } from '@/types';
import type { ApiResponse } from '@/types';

const emptyForm = { username: '', password: '', group_id: '', role: 'user' as 'user' | 'admin' };

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  // 添加用户弹窗
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);

  // 批量导入弹窗
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<{ username: string; password: string; groupId?: string }[]>([]);

  useEffect(() => {
    const token = document.cookie.split('; ').find((r) => r.startsWith('token='))?.split('=')[1];
    if (!token) { router.push('/admin-login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'admin') { router.push('/login'); return; }
    } catch { router.push('/admin-login'); return; }
    fetchUsers();
    fetch('/api/admin/groups')
      .then((r) => r.json())
      .then((d) => { if (d.success) setGroups(d.data); })
      .catch(() => {});
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => { if (d.success) setRegistrationEnabled(d.data.registrationEnabled); })
      .catch(() => {});
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data: ApiResponse<User[]> = await res.json();
      if (data.success) setUsers(data.data!);
      else setError(data.error || '加载失败');
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const selectableUsers = useMemo(() => users.filter((u) => u.id !== '1'), [users]);
  const allSelected = selectableUsers.length > 0 && selectableUsers.every((u) => selectedIds.has(u.id));
  const someSelected = selectableUsers.some((u) => selectedIds.has(u.id));

  const toggleAll = useCallback(() => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(selectableUsers.map((u) => u.id)));
  }, [allSelected, selectableUsers]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectedCount = selectedIds.size;

  // 单个删除
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该用户吗？此操作不可撤销。')) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
        setActionMsg('用户已删除');
      } else setActionMsg(data.error || '删除失败');
      setTimeout(() => setActionMsg(''), 3000);
    } catch { setActionMsg('网络错误'); setTimeout(() => setActionMsg(''), 3000); }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedCount === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedCount} 个用户吗？此操作不可撤销。`)) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selectedIds] }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => !selectedIds.has(u.id)));
        setSelectedIds(new Set());
        setActionMsg(data.message || `已删除 ${data.data?.deleted || 0} 个用户`);
      } else setActionMsg(data.error || '删除失败');
      setTimeout(() => setActionMsg(''), 3000);
    } catch { setActionMsg('网络错误'); setTimeout(() => setActionMsg(''), 3000); }
    finally { setBusy(false); }
  };

  // 密码重置弹窗
  const [passwordModal, setPasswordModal] = useState<{ id: string; username: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModal || !newPassword.trim()) return;
    setPasswordBusy(true);
    setPasswordMsg('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: passwordModal.id, password: newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordMsg('密码已重置成功');
        setTimeout(() => { setPasswordModal(null); setNewPassword(''); setPasswordMsg(''); }, 1500);
      } else setPasswordMsg(data.error || '重置失败');
    } catch { setPasswordMsg('网络错误'); }
    finally { setPasswordBusy(false); }
  };

  // 批量更改组别
  const handleBatchGroupChange = async (groupId: string) => {
    if (selectedCount === 0) return;
    const newGroupId = groupId === '__none__' ? null : groupId || null;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selectedIds], group_id: newGroupId }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((u) => (selectedIds.has(u.id) ? { ...u, group_id: newGroupId } as User : u)));
        setActionMsg(data.message);
      } else setActionMsg(data.error || '更新失败');
      setTimeout(() => setActionMsg(''), 3000);
    } catch { setActionMsg('网络错误'); setTimeout(() => setActionMsg(''), 3000); }
    finally { setBusy(false); }
  };

  // 单个组别更改
  const handleGroupChange = async (userId: string, groupId: string) => {
    const newGroupId = groupId === '__none__' ? null : groupId || null;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, group_id: newGroupId }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, group_id: newGroupId } as User : u)));
        setActionMsg('组别已更新');
      } else setActionMsg(data.error || '更新失败');
      setTimeout(() => setActionMsg(''), 3000);
    } catch { setActionMsg('网络错误'); setTimeout(() => setActionMsg(''), 3000); }
  };

  const handleRoleToggle = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } as User : u)));
        setActionMsg(`角色已更新为 ${newRole === 'admin' ? '管理员' : '普通用户'}`);
      } else setActionMsg(data.error || '更新失败');
      setTimeout(() => setActionMsg(''), 3000);
    } catch { setActionMsg('网络错误'); setTimeout(() => setActionMsg(''), 3000); }
  };

  // 切换注册开关
  const toggleRegistration = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationEnabled: !registrationEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        setRegistrationEnabled(data.data.registrationEnabled);
        setActionMsg(data.message);
      }
      setTimeout(() => setActionMsg(''), 3000);
    } catch { /* ignore */ }
  };

  // 添加单个用户
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: addForm.username,
          email: `${addForm.username}@eval.local`,
          password: addForm.password,
          group_id: addForm.group_id || undefined,
          role: addForm.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => [...prev, data.data]);
        setActionMsg('用户创建成功');
        setShowAddModal(false);
        setAddForm(emptyForm);
      } else setActionMsg(data.error || '创建失败');
      setTimeout(() => setActionMsg(''), 3000);
    } catch { setActionMsg('网络错误'); setTimeout(() => setActionMsg(''), 3000); }
    finally { setBusy(false); }
  };

  // 解析批量导入文本
  const handleParseImport = () => {
    const lines = importText.trim().split('\n').filter(Boolean);
    const parsed: { username: string; password: string; groupId?: string }[] = [];
    for (const line of lines) {
      // 支持：username,password[,group_id]
      const parts = line.split(',').map((s) => s.trim());
      if (parts.length >= 2) {
        parsed.push({
          username: parts[0],
          password: parts[1],
          groupId: parts[2] || undefined,
        });
      }
    }
    setImportPreview(parsed);
  };

  // 执行批量导入
  const handleBatchImport = async () => {
    if (importPreview.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: importPreview }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        setActionMsg(data.message);
        setShowImportModal(false);
        setImportText('');
        setImportPreview([]);
      } else setActionMsg(data.error || '导入失败');
      setTimeout(() => setActionMsg(''), 3000);
    } catch { setActionMsg('网络错误'); setTimeout(() => setActionMsg(''), 3000); }
    finally { setBusy(false); }
  };

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const userCount = users.filter((u) => u.role === 'user').length;

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">👥 用户管理</h1>
            <p className="text-gray-500 mt-1">
              共 {users.length} 个用户（{adminCount} 管理员，{userCount} 普通用户）
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleRegistration}
              className={`btn btn-sm ${registrationEnabled ? 'btn-warning' : 'btn-success'}`}
              title={registrationEnabled ? '点击关闭注册' : '点击开启注册'}
            >
              {registrationEnabled ? '🔓 注册已开启' : '🔒 注册已关闭'}
            </button>
            <button onClick={() => setShowImportModal(true)} className="btn btn-outline btn-sm">
              📥 批量导入
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">
              ＋ 添加用户
            </button>
          </div>
        </div>

        {/* 批量操作栏 */}
        <div className={`mb-4 flex items-center gap-3 transition-all duration-200 ${
          selectedCount > 0 ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'
        }`}>
          <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg flex-1">
            <span className="text-sm text-blue-700 font-medium">已选 {selectedCount} 项</span>
            <div className="flex items-center gap-2 ml-auto">
              <select
                className="text-xs border border-blue-300 rounded-md px-2 py-1.5 bg-white text-blue-700"
                defaultValue=""
                onChange={(e) => { if (e.target.value) handleBatchGroupChange(e.target.value); e.target.value = ''; }}
                disabled={busy}
              >
                <option value="" disabled>批量更改组别</option>
                <option value="__none__">取消分组</option>
                {groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
              </select>
              <button onClick={handleBatchDelete} disabled={busy} className="btn btn-danger btn-sm">
                {busy ? '处理中...' : `批量删除 (${selectedCount})`}
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-400 hover:text-gray-600">
                取消选择
              </button>
            </div>
          </div>
        </div>

        {actionMsg && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm animate-fade-in">{actionMsg}</div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input type="checkbox" checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </th>
                  <th>用户ID</th><th>用户名</th><th>组别</th><th>角色</th><th>注册时间</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isAdmin = u.id === '1';
                  const checked = selectedIds.has(u.id);
                  return (
                    <tr key={u.id} className={checked ? 'bg-blue-50/50' : ''}>
                      <td>{!isAdmin && (
                        <input type="checkbox" checked={checked} onChange={() => toggleOne(u.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      )}</td>
                      <td className="text-xs text-gray-400 font-mono">{u.id}</td>
                      <td className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium">{u.username[0]}</div>
                          {u.username}
                        </div>
                      </td>
                      <td>
                        <select className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
                          value={u.group_id || '__none__'}
                          onChange={(e) => handleGroupChange(u.id, e.target.value)}>
                          <option value="__none__">未分组</option>
                          {groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                        </select>
                      </td>
                      <td><span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-primary'}`}>{u.role === 'admin' ? '管理员' : '用户'}</span></td>
                      <td className="text-sm text-gray-500">{new Date(u.created_at).toLocaleString('zh-CN')}</td>
                      <td>
                        <div className="flex gap-2">
                          {!isAdmin && (<>
                            <button onClick={() => setPasswordModal({ id: u.id, username: u.username })} className="btn btn-outline btn-sm">🔑 重置密码</button>
                            <button onClick={() => handleRoleToggle(u.id, u.role)} className="btn btn-outline btn-sm">{u.role === 'admin' ? '降级' : '升为管理'}</button>
                            <button onClick={() => handleDelete(u.id)} className="btn btn-danger btn-sm">删除</button>
                          </>)}
                          {isAdmin && <span className="text-xs text-gray-400">超级管理员</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== 添加用户弹窗 ===== */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAddModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">添加用户</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
                  <input className="input" placeholder="登录用" value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">密码 *</label>
                  <input type="text" className="input" placeholder="密码" value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">组别</label>
                    <select className="input" value={addForm.group_id}
                      onChange={(e) => setAddForm({ ...addForm, group_id: e.target.value })}>
                      <option value="">未分组</option>
                      {groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                    <select className="input" value={addForm.role}
                      onChange={(e) => setAddForm({ ...addForm, role: e.target.value as 'user' | 'admin' })}>
                      <option value="user">普通用户</option>
                      <option value="admin">管理员</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={busy}>
                  {busy ? '创建中...' : '创建用户'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ===== 密码重置弹窗 ===== */}
        {passwordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setPasswordModal(null); setNewPassword(''); setPasswordMsg(''); }}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">🔑 重置密码</h2>
                <button onClick={() => { setPasswordModal(null); setNewPassword(''); setPasswordMsg(''); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                为用户 <strong>{passwordModal.username}</strong> 设置新密码
              </p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">新密码 *</label>
                  <input type="text" className="input" placeholder="输入新密码" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} required autoFocus />
                </div>
                {passwordMsg && (
                  <div className={`text-sm px-3 py-2 rounded-lg ${passwordMsg.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{passwordMsg}</div>
                )}
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setPasswordModal(null); setNewPassword(''); setPasswordMsg(''); }} className="btn btn-outline btn-sm">取消</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={passwordBusy || !newPassword.trim()}>
                    {passwordBusy ? '重置中...' : '确认重置'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== 批量导入弹窗 ===== */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowImportModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">📥 批量导入用户</h2>
                <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                每行一个用户，格式：<code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">用户名,密码[,组别ID]</code>
              </p>
              <textarea
                className="input min-h-[160px] font-mono text-xs"
                placeholder={'user01,123456,g-frontend\nuser02,123456,g-frontend\nuser03,123456,g-backend'}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <div className="flex gap-2 mt-3">
                <button onClick={handleParseImport} className="btn btn-outline btn-sm" disabled={!importText.trim()}>
                  🔍 解析预览
                </button>
              </div>
              {importPreview.length > 0 && (
                <div className="mt-4 border rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr><th className="px-3 py-1.5 text-left">用户名</th><th className="px-3 py-1.5 text-left">密码</th><th className="px-3 py-1.5 text-left">组别</th></tr>
                    </thead>
                    <tbody>
                      {importPreview.map((u, i) => (
                        <tr key={i} className="border-t"><td className="px-3 py-1">{u.username}</td><td className="px-3 py-1">{u.password}</td><td className="px-3 py-1 text-gray-400">{u.groupId || '未分组'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex gap-2 mt-5 justify-end">
                <button onClick={() => setShowImportModal(false)} className="btn btn-outline btn-sm">取消</button>
                <button onClick={handleBatchImport} disabled={importPreview.length === 0 || busy} className="btn btn-primary btn-sm">
                  {busy ? '导入中...' : `导入 ${importPreview.length} 个用户`}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
