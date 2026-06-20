import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAllUsers, deleteUser, deleteUsers, updateUserRole, updateUserGroup, updateUsersGroup, updateUserPassword, createUser, createUsersBatch } from '@/lib/db';

async function checkAdmin(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权�? }, { status: 403 });
  const users = await getAllUsers();
  return NextResponse.json({ success: true, data: users });
}

export async function DELETE(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权�? }, { status: 403 });
  const { id, ids } = await req.json();
  // 批量删除
  if (ids && Array.isArray(ids)) {
    const filtered = ids.filter((i: string) => i !== '1');
    if (filtered.length === 0) {
      return NextResponse.json({ success: false, error: '所选用户不包含可删除的用户' }, { status: 400 });
    }
    const count = await deleteUsers(filtered);
    return NextResponse.json({ success: true, data: { deleted: count }, message: `已删�?${count} 个用户` });
  }
  // 单个删除
  if (id === '1') {
    return NextResponse.json({ success: false, error: '不能删除超级管理�? }, { status: 400 });
  }
  const ok = await deleteUser(id);
  return NextResponse.json({ success: ok, error: ok ? undefined : '用户不存�? });
}

export async function PATCH(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权�? }, { status: 403 });
  const body = await req.json();
  const { id, ids, role, group_id, password } = body;

  // 批量更新组别
  if (ids && Array.isArray(ids) && group_id !== undefined) {
    const newGroup = group_id === '__none__' ? null : group_id;
    const count = await updateUsersGroup(ids, newGroup);
    return NextResponse.json({ success: true, data: { updated: count }, message: `已更�?${count} 个用户的组别` });
  }
  // 单个组别更新
  if (group_id !== undefined) {
    const ok = await updateUserGroup(id, group_id);
    return NextResponse.json({ success: ok, error: ok ? undefined : '用户不存�? });
  }
  // 密码重置
  if (password) {
    if (id === '1') {
      return NextResponse.json({ success: false, error: '不能修改超级管理员密�? }, { status: 400 });
    }
    const ok = await updateUserPassword(id, password);
    return NextResponse.json({ success: ok, error: ok ? undefined : '用户不存�? });
  }
  // 角色更新
  if (role) {
    if (id === '1') {
      return NextResponse.json({ success: false, error: '不能修改超级管理员角�? }, { status: 400 });
    }
    const ok = await updateUserRole(id, role);
    return NextResponse.json({ success: ok, error: ok ? undefined : '用户不存�? });
  }
  return NextResponse.json({ success: false, error: '缺少更新参数' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权�? }, { status: 403 });
  const body = await req.json();
  // 批量导入
  if (body.users && Array.isArray(body.users)) {
    const users = body.users.map((u: { username: string; password: string; email?: string; groupId?: string }) => ({
      username: u.username,
      email: u.email || `${u.username}@eval.local`,
      password: u.password,
      groupId: u.groupId,
    }));
    const result = await createUsersBatch(users);
    return NextResponse.json({
      success: true,
      data: result,
      message: `创建 ${result.created} 个用�?{result.skipped > 0 ? `，跳�?${result.skipped} 个` : ''}`,
    });
  }
  // 单个创建
  const { email, username, password, group_id, role } = body;
  if (!username || !password) {
    return NextResponse.json({ success: false, error: '用户名、密码不能为�? }, { status: 400 });
  }
  const userEmail = email || `${username}@eval.local`;
  const user = await createUser(userEmail, password, username, group_id || undefined, role || undefined);
  if (!user) {
    return NextResponse.json({ success: false, error: '邮箱或用户名已存�? }, { status: 409 });
  }
  return NextResponse.json({ success: true, data: user, message: '用户创建成功' });
}
