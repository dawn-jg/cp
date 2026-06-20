import { NextRequest, NextResponse } from 'next/server';
import { submitRating, hasUserRated } from '@/lib/db';
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

    const { target_id, answers } = await req.json();
    if (!target_id || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ success: false, error: '无效的请求数据' }, { status: 400 });
    }

    // 防止重复提交
    if (await hasUserRated(payload.userId, target_id)) {
      return NextResponse.json({ success: false, error: '您已经对该对象进行过评分' }, { status: 409 });
    }

    const record = await submitRating(payload.userId, target_id, answers);
    return NextResponse.json({ success: true, data: { completed: true } });
  } catch {
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
