import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAllRatingTargets, createRatingTarget, updateRatingTarget, deleteRatingTarget } from '@/lib/db';

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
  const targets = await getAllRatingTargets();
  return NextResponse.json({ success: true, data: targets });
}

export async function POST(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  const body = await req.json();
  if (!body.name) return NextResponse.json({ success: false, error: '姓名不能为空' }, { status: 400 });
  const target = await createRatingTarget(body);
  return NextResponse.json({ success: true, data: target });
}

export async function PUT(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  const { id, ...data } = await req.json();
  const ok = await updateRatingTarget(id, data);
  return NextResponse.json({ success: ok, error: ok ? undefined : '评分对象不存在' });
}

export async function DELETE(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  const { id } = await req.json();
  const ok = await deleteRatingTarget(id);
  return NextResponse.json({ success: ok, error: ok ? undefined : '评分对象不存在' });
}
