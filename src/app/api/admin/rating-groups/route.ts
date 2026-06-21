import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAllRatingGroups, createRatingGroup, updateRatingGroup, deleteRatingGroup } from '@/lib/db';

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
  const groups = await getAllRatingGroups();
  return NextResponse.json({ success: true, data: groups });
}

export async function POST(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  const { name } = await req.json();
  if (!name) return NextResponse.json({ success: false, error: '名称不能为空' }, { status: 400 });
  const group = await createRatingGroup(name);
  return NextResponse.json({ success: true, data: group });
}

export async function PUT(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  const { id, name } = await req.json();
  if (!id || !name) return NextResponse.json({ success: false, error: '参数不完整' }, { status: 400 });
  const ok = await updateRatingGroup(id, name);
  return NextResponse.json({ success: ok, error: ok ? undefined : '评分组不存在' });
}

export async function DELETE(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  const { id } = await req.json();
  const ok = await deleteRatingGroup(id);
  return NextResponse.json({ success: ok, error: ok ? undefined : '评分组不存在' });
}
