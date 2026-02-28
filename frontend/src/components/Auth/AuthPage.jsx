import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen min-h-dvh flex items-center justify-center p-6 bg-[#FBFBFF]">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-[#FFFFFF] border border-[#E9E7F5] rounded-[20px] shadow-xl shadow-black/8 p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#7C5CFF] text-white shadow-lg shadow-[#7C5CFF]/25 mb-5">
              <span className="text-2xl">📚</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#1F2937] mb-2 tracking-tight">
              MasteryPath
            </h1>
            <p className="text-[#6B7280] text-lg sm:text-xl font-bold">
              {isLogin ? 'Sign in to continue' : 'Create your account'}
            </p>
            {isLogin && (
              <p className="text-[#6B7280] text-sm sm:text-base font-medium mt-1">
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
