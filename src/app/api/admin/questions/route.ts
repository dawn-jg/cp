import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAllQuestions, createQuestion, updateQuestion, deleteQuestion } from '@/lib/db';

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
  const questions = await getAllQuestions();
  return NextResponse.json({ success: true, data: questions });
}

export async function POST(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  const body = await req.json();
  const question = await createQuestion(body);
  return NextResponse.json({ success: true, data: question });
}

export async function PUT(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  const { id, ...data } = await req.json();
  const ok = await updateQuestion(id, data);
  return NextResponse.json({ success: ok, error: ok ? undefined : '题目不存在' });
}

export async function DELETE(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  const { id } = await req.json();
  const ok = await deleteQuestion(id);
  return NextResponse.json({ success: ok, error: ok ? undefined : '题目不存在' });
}
