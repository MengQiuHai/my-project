import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store';
import { LoginCredentials } from '@/types';

interface FormData extends LoginCredentials {
  rememberMe?: boolean;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      clearError();
      await login(data.email, data.password);
      toast.success('登录成功！');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || '登录失败，请重试');
    }
  };

  return (
    <div className=\"min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8\">
      <div className=\"max-w-md w-full space-y-8\">
        <div>
          <div className=\"mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600\">
            <span className=\"text-white text-2xl font-bold\">💰</span>
          </div>
          <h2 className=\"mt-6 text-center text-3xl font-extrabold text-gray-900\">
            登录到成长银行
          </h2>
          <p className=\"mt-2 text-center text-sm text-gray-600\">
            还没有账户？{' '}
            <Link
              to=\"/register\"
              className=\"font-medium text-blue-600 hover:text-blue-500 transition-colors\"
            >
              立即注册
            </Link>
          </p>
        </div>

        <form className=\"mt-8 space-y-6 bg-white p-8 rounded-lg shadow-lg\" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className=\"bg-red-50 border border-red-200 rounded-md p-4\">
              <p className=\"text-red-800 text-sm\">{error}</p>
            </div>
          )}

          <div className=\"space-y-4\">
            <div>
              <label htmlFor=\"email\" className=\"block text-sm font-medium text-gray-700\">
                邮箱地址
              </label>
              <input
                {...register('email', {
                  required: '邮箱地址是必需的',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i,
                    message: '请输入有效的邮箱地址',
                  },
                })}
                type=\"email\"
                autoComplete=\"email\"
                className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500\"
                placeholder=\"请输入您的邮箱\"
              />
              {errors.email && (
                <p className=\"mt-1 text-sm text-red-600\">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor=\"password\" className=\"block text-sm font-medium text-gray-700\">
                密码
              </label>
              <div className=\"mt-1 relative\">
                <input
                  {...register('password', {
                    required: '密码是必需的',
                    minLength: {
                      value: 6,
                      message: '密码至少需要6个字符',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete=\"current-password\"
                  className=\"block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500\"
                  placeholder=\"请输入您的密码\"
                />
                <button
                  type=\"button\"
                  className=\"absolute inset-y-0 right-0 pr-3 flex items-center\"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className=\"h-5 w-5 text-gray-400\" />
                  ) : (
                    <EyeIcon className=\"h-5 w-5 text-gray-400\" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className=\"mt-1 text-sm text-red-600\">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className=\"flex items-center justify-between\">
            <div className=\"flex items-center\">
              <input
                {...register('rememberMe')}
                id=\"remember-me\"
                type=\"checkbox\"
                className=\"h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded\"
              />
              <label htmlFor=\"remember-me\" className=\"ml-2 block text-sm text-gray-900\">
                记住我
              </label>
            </div>

            <div className=\"text-sm\">
              <a href=\"#\" className=\"font-medium text-blue-600 hover:text-blue-500 transition-colors\">
                忘记密码？
              </a>
            </div>
          </div>

          <div>
            <button
              type=\"submit\"
              disabled={isSubmitting || isLoading}
              className=\"group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200\"
            >
              {(isSubmitting || isLoading) ? (
                <>
                  <svg className=\"animate-spin -ml-1 mr-3 h-5 w-5 text-white\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\">
                    <circle className=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" strokeWidth=\"4\"></circle>
                    <path className=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z\"></path>
                  </svg>
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </div>

          <div className=\"text-center\">
            <p className=\"text-xs text-gray-500\">
              通过登录，您同意我们的{' '}
              <a href=\"#\" className=\"text-blue-600 hover:text-blue-500\">
                服务条款
              </a>{' '}
              和{' '}
              <a href=\"#\" className=\"text-blue-600 hover:text-blue-500\">
                隐私政策
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;