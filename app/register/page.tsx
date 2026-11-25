'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export default function RegisterPage() {
  const { user, register, verifyEmail, resendVerificationCode } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [pendingEmail, setPendingEmail] = useState('');
  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [infoMessage, setInfoMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSubmitting(true);
    const result = await register({ name, email, phone, password });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || 'Đăng ký thất bại.');
      return;
    }

    if (result.requiresVerification) {
      setPendingEmail(result.email || email.trim().toLowerCase());
      setInfoMessage(
        result.message || 'Mã xác thực 6 chữ số đã được gửi tới Gmail của bạn.'
      );
      setResendCooldown(60);
      setStep('verify');
      return;
    }

    router.push('/');
    router.refresh();
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    const cleanedCode = code.trim();
    if (!/^\d{6}$/.test(cleanedCode)) {
      setError('Vui lòng nhập đúng mã xác thực gồm 6 chữ số.');
      return;
    }

    setSubmitting(true);
    const result = await verifyEmail(pendingEmail, cleanedCode);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || 'Xác thực thất bại.');
      return;
    }

    router.push('/');
    router.refresh();
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setInfoMessage('');
    setSubmitting(true);
    const result = await resendVerificationCode(pendingEmail);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || 'Không thể gửi lại mã.');
      return;
    }

    setInfoMessage(result.message || 'Đã gửi lại mã xác thực mới tới Gmail của bạn.');
    setResendCooldown(60);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg shadow-orange-100/60 border border-gray-100 p-8">
        {step === 'form' ? (
          <>
            <div className="text-center mb-7">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-[#ff7f5c] to-[#ff9e84] flex items-center justify-center text-3xl shadow-md shadow-orange-200">
                🐾
              </div>
              <h1 className="text-2xl font-black text-gray-900">Tạo tài khoản Mèo Cưng</h1>
              <p className="text-sm text-gray-500 mt-1">
                Mã xác thực 6 số sẽ được gửi về Gmail của bạn
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-bold text-gray-700 mb-1.5">
                  Họ và tên
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 focus:bg-white focus:border-[#ff7f5c] focus:ring-2 focus:ring-[#ff7f5c]/20 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-700 mb-1.5">
                  Gmail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ban@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 focus:bg-white focus:border-[#ff7f5c] focus:ring-2 focus:ring-[#ff7f5c]/20 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-bold text-gray-700 mb-1.5">
                  Số điện thoại <span className="text-gray-400 font-normal">(không bắt buộc)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901 234 567"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 focus:bg-white focus:border-[#ff7f5c] focus:ring-2 focus:ring-[#ff7f5c]/20 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-gray-700 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 focus:bg-white focus:border-[#ff7f5c] focus:ring-2 focus:ring-[#ff7f5c]/20 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-gray-700 mb-1.5">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 focus:bg-white focus:border-[#ff7f5c] focus:ring-2 focus:ring-[#ff7f5c]/20 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#ff7f5c] hover:bg-[#f0643d] disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-orange-200 transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{submitting ? 'Đang gửi mã xác thực...' : 'Đăng ký & Gửi mã Gmail'}</span>
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Đã có tài khoản?{' '}
              <Link href="/login" className="font-bold text-[#ff7f5c] hover:underline">
                Đăng nhập
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#ff7f5c]">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black text-gray-900">Xác thực Gmail</h1>
              <p className="text-sm text-gray-500 mt-1">
                Nhập mã 6 chữ số đã gửi đến{' '}
                <span className="font-bold text-gray-800">{pendingEmail}</span>
              </p>
            </div>

            {infoMessage && (
              <div className="mb-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{infoMessage}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label htmlFor="otp-code" className="block text-xs font-bold text-gray-700 mb-1.5">
                  Mã xác thực (6 chữ số)
                </label>
                <input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] text-2xl font-black py-3 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white focus:border-[#ff7f5c] focus:ring-2 focus:ring-[#ff7f5c]/20 outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || code.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#ff7f5c] hover:bg-[#f0643d] disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-orange-200 transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{submitting ? 'Đang xác thực...' : 'Xác nhận & Hoàn tất đăng ký'}</span>
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setCode('');
                  setError('');
                  setInfoMessage('');
                }}
                className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Đổi email</span>
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || submitting}
                onClick={handleResendCode}
                className="inline-flex items-center gap-1 text-[#ff7f5c] hover:underline disabled:text-gray-400 disabled:no-underline font-bold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  {resendCooldown > 0 ? `Gửi lại mã (${resendCooldown}s)` : 'Gửi lại mã'}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
