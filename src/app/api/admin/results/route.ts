import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAllEvaluations, getEvaluationSummary } from '@/lib/db';

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

  const url = new URL(req.url);
  const type = url.searchParams.get('type');

  if (type === 'summary') {
    const summary = await getEvaluationSummary();
    return NextResponse.json({ success: true, data: summary });
  }

  const evaluations = await getAllEvaluations();
  return NextResponse.json({ success: true, data: evaluations });
}
