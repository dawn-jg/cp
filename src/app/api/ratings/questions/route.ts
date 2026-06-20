import { NextRequest, NextResponse } from 'next/server';
import { getRatingQuestions } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get('target_id');
    if (!targetId) {
      return NextResponse.json({ success: false, error: '缺少 target_id' }, { status: 400 });
    }

    const questions = await getRatingQuestions(targetId);
    return NextResponse.json({ success: true, data: questions });
  } catch {
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
