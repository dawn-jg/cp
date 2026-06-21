import { NextRequest, NextResponse } from 'next/server';
import { createUser, getRegistrationEnabled } from '@/lib/db';
import { createToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // 检查注册开关
    if (!(await getRegistrationEnabled())) {
      return NextResponse.json({ success: false, error: '注册功能已关闭，请联系管理员' }, { status: 403 });
    }

    const { email, password, username } = await req.json();
    if (!password || !username) {
      return NextResponse.json({ success: false, error: '用户名和密码不能为空' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: '密码至少6位' }, { status: 400 });
    }

    // 如果没有邮箱，自动生成
    const userEmail = email || `${username}@eval.local`;

    const user = await createUser(userEmail, password, username);
    if (!user) {
      return NextResponse.json({ success: false, error: '用户名已存在' }, { status: 409 });
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      group_id: user.group_id,
    });

    const res = NextResponse.json({ success: true, data: { user, token } });
    res.cookies.set('token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    });
    return res;
  } catch {
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
