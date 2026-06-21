import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAllGroups, createGroup, updateGroup, deleteGroup } from '@/lib/db';

async function checkAdmin(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  const groups = await getAllGroups();
  return NextResponse.json({ success: true, data: groups });
}

export async function POST(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  const { name, description } = await req.json();
  if (!name) return NextResponse.json({ success: false, error: '组名不能为空' }, { status: 400 });

  // 检查组名是否已存在
  const existing = await getAllGroups();
  if (existing.some((g) => g.name === name)) {
    return NextResponse.json({ success: false, error: '组名已存在' }, { status: 400 });
  }

  const group = await createGroup(name, description || '');
  return NextResponse.json({ success: true, data: group });
}

export async function PUT(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  const { id, name, description } = await req.json();
  if (!id) return NextResponse.json({ success: false, error: '缺少组ID' }, { status: 400 });

  // 检查组名是否与其他组重复
  if (name) {
    const existing = await getAllGroups();
    if (existing.some((g) => g.name === name && g.id !== id)) {
      return NextResponse.json({ success: false, error: '组名已存在' }, { status: 400 });
    }
  }

  const ok = await updateGroup(id, { name, description });
  return NextResponse.json({ success: ok, error: ok ? undefined : '组不存在' });
}

export async function DELETE(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  const { id } = await req.json();
  const ok = await deleteGroup(id);
  return NextResponse.json({ success: ok, error: ok ? undefined : '组不存在' });
}
