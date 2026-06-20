import { NextRequest, NextResponse } from 'next/server';
import { getUserEvaluations, getQuestionsForGroup, getAllQuestions } from '@/lib/db';
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

    // 如果请求参数中有 group_id，返回该组的题目列表（评测用）
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('group_id');
    if (groupId !== null) {
      const questions = await getQuestionsForGroup(groupId || null);
      return NextResponse.json({ success: true, data: questions });
    }

    // 默认返回用户的评测记录
    const evaluations = await getUserEvaluations(payload.userId);
    return NextResponse.json({ success: true, data: evaluations });
  } catch {
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
