import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getRatingQuestions, createRatingQuestion, updateRatingQuestion, deleteRatingQuestion } from '@/lib/db';

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
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get('target_id');
  if (!targetId) return NextResponse.json({ success: false, error: '缺少 target_id' }, { status: 400 });
  const questions = await getRatingQuestions(targetId);
  return NextResponse.json({ success: true, data: questions });
}

export async function POST(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  const body = await req.json();
  if (!body.target_id || !body.title) return NextResponse.json({ success: false, error: '缺少必要字段' }, { status: 400 });
  const q = await createRatingQuestion(body);
  return NextResponse.json({ success: true, data: q });
}

export async function PUT(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  const { id, ...data } = await req.json();
  const ok = await updateRatingQuestion(id, data);
  return NextResponse.json({ success: ok, error: ok ? undefined : '题目不存在' });
}

export async function DELETE(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  const { id } = await req.json();
  const ok = await deleteRatingQuestion(id);
  return NextResponse.json({ success: ok, error: ok ? undefined : '题目不存在' });
}
