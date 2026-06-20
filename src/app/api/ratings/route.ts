import { NextRequest, NextResponse } from 'next/server';
import { getRatingTargetsForGroup, hasUserRated } from '@/lib/db';
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

    const targets = await getRatingTargetsForGroup(payload.group_id);
    
    // 标注用户是否已评分
    const withStatus = await Promise.all(
      targets.map(async (t) => ({
        ...t,
        has_rated: await hasUserRated(payload.userId, t.id),
      })),
    );

    return NextResponse.json({ success: true, data: withStatus });
  } catch {
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
