import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto animate-fade-in">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            专业测评与民主评价平台
          </h1>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed">
            集职业技能评测与职工民主评价于一体。
            支持按组别定制的专业能力测试，以及多维度匿名互评，为团队管理与人才发展提供数据支撑。
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register" className="btn btn-primary btn-lg">
              立即注册开始评测 →
            </Link>
            <Link href="/login" className="btn btn-outline btn-lg">
              已有账号？登录
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-20">
          <div className="card text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="text-4xl mb-4">📝</div>
            <h3 className="font-semibold text-lg mb-2">专业能力测试</h3>
            <p className="text-sm text-gray-500">
              按组别定制题库，单选、多选、简答全覆盖，自动判分生成详细分析报告
            </p>
          </div>
          <div className="card text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="font-semibold text-lg mb-2">职工民主评价</h3>
            <p className="text-sm text-gray-500">
              按组别匿名互评，多维度评分量化，结果可视化呈现，以数据辅助民主决策
            </p>
          </div>
          <div className="card text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="font-semibold text-lg mb-2">灵活管理</h3>
            <p className="text-sm text-gray-500">
              分组管理用户与题库，批量导入导出，注册开关控制，全方位后台掌控
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
