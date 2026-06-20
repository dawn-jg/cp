import { NextRequest, NextResponse } from 'next/server';
import { submitEvaluation } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });
    }

    const { answers, group_id } = await req.json();
    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ success: false, error: '无效的答案数据' }, { status: 400 });
    }

    const evaluation = await submitEvaluation(payload.userId, answers, group_id ?? payload.group_id);
    return NextResponse.json({ success: true, data: evaluation });
  } catch {
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
