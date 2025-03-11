'use client';

import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';

interface GoogleLoginProps {
  onSuccess: (token: string) => void;
  onError: (error: string) => void;
}

export const GoogleLogin = ({ onSuccess, onError }: GoogleLoginProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setIsLoading(false);
      if (tokenResponse.access_token) {
        onSuccess(tokenResponse.access_token);
      } else {
        onError('登入失敗：未獲得存取權杖');
      }
    },
    onError: (error) => {
      setIsLoading(false);
      onError(error instanceof Error ? error.message : '登入失敗');
    },
    onNonOAuthError: (error) => {
      setIsLoading(false);
      onError(error.type === 'popup_closed_by_user' ? '登入已取消' : '登入失敗');
    },
    flow: 'implicit',
    scope: 'https://www.googleapis.com/auth/spreadsheets'
  });

  const handleClick = () => {
    setIsLoading(true);
    login();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
    >
      {isLoading ? (
        <>
          <svg 
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          登入中...
        </>
      ) : (
        <>
          <svg 
            className="w-5 h-5 mr-2" 
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          使用 Google 登入
        </>
      )}
    </button>
  );
}; 