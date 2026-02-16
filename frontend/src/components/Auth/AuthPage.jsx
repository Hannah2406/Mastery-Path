import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-slate-800/90 border border-slate-600 rounded-2xl shadow-2xl p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-xl mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">
              MasteryPath
            </h1>
            <p className="text-slate-400 text-sm">
              {isLogin ? 'Sign in to continue' : 'Create your account'}
            </p>
            {isLogin && (
              <p className="text-slate-500 text-xs mt-1">
                New here? Create an account to get started.
              </p>
            )}
          </div>
          {isLogin ? (
            <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
}
