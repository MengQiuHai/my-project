import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store';
import { RegisterData } from '@/types';

interface FormData extends RegisterData {
  confirmPassword: string;
  agreeToTerms: boolean;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const password = watch('password');

  const onSubmit = async (data: FormData) => {
    try {
      clearError();
      
      const { confirmPassword, agreeToTerms, ...registerData } = data;
      
      await registerUser(registerData);
      toast.success('注册成功！欢迎加入成长银行');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || '注册失败，请重试');
    }
  };

  return (
    <div className=\"min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8\">
      <div className=\"max-w-md w-full space-y-8\">
        <div>
          <div className=\"mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-r from-green-600 to-blue-600\">
            <span className=\"text-white text-2xl font-bold\">🚀</span>
          </div>
          <h2 className=\"mt-6 text-center text-3xl font-extrabold text-gray-900\">
            加入成长银行
          </h2>
          <p className=\"mt-2 text-center text-sm text-gray-600\">
            已有账户？{' '}
            <Link
              to=\"/login\"
              className=\"font-medium text-blue-600 hover:text-blue-500 transition-colors\"
            >
              立即登录
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
              <label htmlFor=\"username\" className=\"block text-sm font-medium text-gray-700\">
                用户名
              </label>
              <input
                {...register('username', {
                  required: '用户名是必需的',
                  minLength: {
                    value: 3,
                    message: '用户名至少需要3个字符',
                  },
                  maxLength: {
                    value: 30,
                    message: '用户名不能超过30个字符',
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: '用户名只能包含字母、数字和下划线',
                  },
                })}
                type=\"text\"
                autoComplete=\"username\"
                className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500\"
                placeholder=\"请输入用户名\"
              />
              {errors.username && (
                <p className=\"mt-1 text-sm text-red-600\">{errors.username.message}</p>
              )}
            </div>

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

            <div className=\"grid grid-cols-1 sm:grid-cols-2 gap-4\">
              <div>
                <label htmlFor=\"first_name\" className=\"block text-sm font-medium text-gray-700\">
                  姓
                </label>
                <input
                  {...register('first_name', {
                    maxLength: {
                      value: 100,
                      message: '姓不能超过100个字符',
                    },
                  })}
                  type=\"text\"
                  autoComplete=\"given-name\"
                  className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500\"
                  placeholder=\"请输入姓\"
                />
                {errors.first_name && (
                  <p className=\"mt-1 text-sm text-red-600\">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor=\"last_name\" className=\"block text-sm font-medium text-gray-700\">
                  名
                </label>
                <input
                  {...register('last_name', {
                    maxLength: {
                      value: 100,
                      message: '名不能超过100个字符',
                    },
                  })}
                  type=\"text\"
                  autoComplete=\"family-name\"
                  className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500\"
                  placeholder=\"请输入名\"
                />
                {errors.last_name && (
                  <p className=\"mt-1 text-sm text-red-600\">{errors.last_name.message}</p>
                )}
              </div>
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
                  autoComplete=\"new-password\"
                  className=\"block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500\"
                  placeholder=\"请输入密码\"
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

            <div>
              <label htmlFor=\"confirmPassword\" className=\"block text-sm font-medium text-gray-700\">
                确认密码
              </label>
              <div className=\"mt-1 relative\">
                <input
                  {...register('confirmPassword', {
                    required: '请确认密码',
                    validate: value =>
                      value === password || '两次输入的密码不一致',
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete=\"new-password\"
                  className=\"block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500\"
                  placeholder=\"请再次输入密码\"
                />
                <button
                  type=\"button\"
                  className=\"absolute inset-y-0 right-0 pr-3 flex items-center\"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className=\"h-5 w-5 text-gray-400\" />
                  ) : (
                    <EyeIcon className=\"h-5 w-5 text-gray-400\" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className=\"mt-1 text-sm text-red-600\">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className=\"flex items-center\">
            <input
              {...register('agreeToTerms', {
                required: '请同意服务条款和隐私政策',
              })}
              id=\"agree-terms\"
              type=\"checkbox\"
              className=\"h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded\"
            />
            <label htmlFor=\"agree-terms\" className=\"ml-2 block text-sm text-gray-900\">
              我同意{' '}
              <a href=\"#\" className=\"text-blue-600 hover:text-blue-500\">
                服务条款
              </a>{' '}
              和{' '}
              <a href=\"#\" className=\"text-blue-600 hover:text-blue-500\">
                隐私政策
              </a>
            </label>
          </div>
          {errors.agreeToTerms && (
            <p className=\"text-sm text-red-600\">{errors.agreeToTerms.message}</p>
          )}

          <div>
            <button
              type=\"submit\"
              disabled={isSubmitting || isLoading}
              className=\"group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200\"
            >
              {(isSubmitting || isLoading) ? (
                <>
                  <svg className=\"animate-spin -ml-1 mr-3 h-5 w-5 text-white\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\">
                    <circle className=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" strokeWidth=\"4\"></circle>
                    <path className=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z\"></path>
                  </svg>
                  注册中...
                </>
              ) : (
                '创建账户'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;