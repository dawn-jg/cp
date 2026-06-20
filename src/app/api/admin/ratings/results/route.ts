import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getRatingStats, getAllRatingTargets } from '@/lib/db';

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
  const groupId = searchParams.get('group_id') || undefined;

  if (targetId) {
    const stats = await getRatingStats(targetId, groupId ?? null);
    if (!stats) return NextResponse.json({ success: false, error: '评分对象不存在' }, { status: 404 });
    return NextResponse.json({ success: true, data: stats });
  }

  // 无 target_id 时返回所有评分对象的总览
  const targets = await getAllRatingTargets();
  const overview = await Promise.all(
    targets.map(async (t) => {
      const stats = await getRatingStats(t.id);
      return { target_id: t.id, target_name: t.name, total_raters: stats?.total_raters ?? 0 };
    }),
  );
  return NextResponse.json({ success: true, data: overview });
}
