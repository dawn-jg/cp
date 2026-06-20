import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/admin-login', '/api/auth'];
const ADMIN_ROUTES = ['/admin', '/api/admin'];

function parseJwt(token: string): { userId: string; role: string; exp: number } | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静态资源放行
  if (pathname.startsWith('/_next') || pathname.match(/\.(svg|png|jpg|jpeg|gif|ico|css|js|woff2?)$/)) {
    return NextResponse.next();
  }

  // 公开路径放行
  if (PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Token 检查
  const token = request.cookies.get('token')?.value;
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 解析 Token
  const payload = parseJwt(token);
  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  // 管理员路由权限检查
  if (ADMIN_ROUTES.some((p) => pathname.startsWith(p)) && payload.role !== 'admin') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}
