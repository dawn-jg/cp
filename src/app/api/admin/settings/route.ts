import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getRegistrationEnabled, setRegistrationEnabled } from '@/lib/db';

async function checkAdmin(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    if (!payload) return null;
    if (payload.role === 'admin') return payload;
    return null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  return NextResponse.json({
    success: true,
    data: { registrationEnabled: getRegistrationEnabled() },
  });
}

export async function POST(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  const { registrationEnabled } = await req.json();
  if (typeof registrationEnabled !== 'boolean') {
    return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
  }
  setRegistrationEnabled(registrationEnabled);
  return NextResponse.json({
    success: true,
    data: { registrationEnabled: getRegistrationEnabled() },
    message: registrationEnabled ? '注册功能已开启' : '注册功能已关闭',
  });
}
