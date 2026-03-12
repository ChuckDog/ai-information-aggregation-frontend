'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { Lock, Mail } from 'lucide-react';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', data);
      const { access_token } = response.data;
      
      // Fetch user profile after login
      // For now, let's decode or fetch. 
      // Assuming the backend returns the token, we can then fetch the profile.
      // But for simplicity, we'll optimistically set the user or fetch profile immediately.
      
      // Let's manually set the token to cookie first in api call logic or here?
      // The store handles cookie setting.
      
      // We need user details. Let's assume we can fetch profile with the new token.
      // Or we can modify the backend to return user details on login.
      // For now, let's just decode if possible, or fetch profile.
      // Since we don't have jwt-decode, let's do a quick profile fetch with the token.
      
      // Wait, api interceptor needs the cookie. Store login sets the cookie.
      // So we call login with a dummy user first or just token, then fetch profile?
      // The store login expects a user object.
      
      // Let's update store to allow fetching or just passing what we have.
      // Actually, let's just fetch the profile using the token in the header manually for this request.
      
      const profileResponse = await api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      login(access_token, profileResponse.data);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md space-y-8">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">
            Sign in
          </CardTitle>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Please enter your details.
          </p>
        </CardHeader>
        <CardContent>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 rounded-md shadow-sm">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  className="pl-10"
                  {...register('email', { required: 'Email is required' })}
                  error={errors.email?.message}
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  className="pl-10"
                  {...register('password', { required: 'Password is required' })}
                  error={errors.password?.message}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div>
              <Button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                isLoading={isLoading}
              >
                Sign in
              </Button>
            </div>
            
             <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  Default Accounts (Seed):<br/>
                  Admin: admin@example.com / admin123<br/>
                  Demo: demo@example.com / demo123
                </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
