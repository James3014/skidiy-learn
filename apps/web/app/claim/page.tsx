'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { api } from '../../lib/api/client';
import type { InvitationInfo, ClaimInvitationRequest } from '../../lib/api/client';

export default function ClaimSeatPage() {
  const router = useRouter();
  const [step, setStep] = useState<'code' | 'form' | 'success'>('code');
  const [invitationCode, setInvitationCode] = useState('');
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [studentName, setStudentName] = useState('');
  const [studentEnglish, setStudentEnglish] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isMinor, setIsMinor] = useState(false);
  const [hasExternalInsurance, setHasExternalInsurance] = useState(false);
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [note, setNote] = useState('');

  const [claimedInfo, setClaimedInfo] = useState<{ seatId: string; mappingId: string } | null>(null);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationCode.trim()) return;

    setLoading(true);
    setError('');

    try {
      const info = await api.invitations.verify(invitationCode);

      if (info.isExpired) {
        setError('此邀請碼已過期');
        setLoading(false);
        return;
      }

      if (info.isClaimed) {
        setError('此邀請碼已被使用');
        setLoading(false);
        return;
      }

      setInvitationInfo(info);
      setStep('form');
    } catch (err: any) {
      setError(err.response?.data?.message || '邀請碼無效或不存在');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setError('請輸入學生姓名');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data: ClaimInvitationRequest = {
        code: invitationCode,
        studentName,
        studentEnglish: studentEnglish || undefined,
        birthDate: birthDate || undefined,
        contactEmail: contactEmail || undefined,
        guardianEmail: guardianEmail || undefined,
        contactPhone: contactPhone || undefined,
        isMinor,
        hasExternalInsurance,
        insuranceProvider: insuranceProvider || undefined,
        note: note || undefined
      };

      const response = await api.invitations.claim(data);
      setClaimedInfo({ seatId: response.seatId, mappingId: response.mappingId });
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.message || '座位領取失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 p-4">
      <div className="bg-white dark:bg-zinc-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/40 border border-zinc-200 dark:border-zinc-700 w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            領取課程座位
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            請輸入教練提供的邀請碼
          </p>
        </div>

        {/* Step 1: Enter Invitation Code */}
        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                邀請碼（8位字元）
              </label>
              <input
                type="text"
                id="code"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-center text-2xl tracking-widest font-mono"
                placeholder="XXXXXXXX"
                maxLength={8}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || invitationCode.length !== 8}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 dark:disabled:bg-zinc-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? '驗證中...' : '驗證邀請碼'}
            </button>
          </form>
        )}

        {/* Step 2: Fill Student Information */}
        {step === 'form' && invitationInfo && (
          <div className="space-y-6">
            {/* Invitation Info Display */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-medium">座位 ID：</span>{invitationInfo.seatId}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                <span className="font-medium">有效期限：</span>
                {new Date(invitationInfo.expiresAt).toLocaleString('zh-TW')}
              </p>
            </div>

            <form onSubmit={handleClaimSeat} className="space-y-4">
              {/* Student Name (Required) */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  學生姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                  placeholder="請輸入中文全名"
                  required
                />
              </div>

              {/* Student English Name (Optional) */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  英文姓名（選填）
                </label>
                <input
                  type="text"
                  value={studentEnglish}
                  onChange={(e) => setStudentEnglish(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                  placeholder="English Name"
                />
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  出生日期（選填）
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Is Minor Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isMinor"
                  checked={isMinor}
                  onChange={(e) => setIsMinor(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-300 rounded"
                />
                <label htmlFor="isMinor" className="ml-2 text-sm text-zinc-700 dark:text-zinc-300">
                  未成年（18歲以下）
                </label>
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  聯絡 Email（選填）
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                  placeholder="student@example.com"
                />
              </div>

              {/* Guardian Email (if minor) */}
              {isMinor && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    監護人 Email
                  </label>
                  <input
                    type="email"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                    placeholder="guardian@example.com"
                  />
                </div>
              )}

              {/* Contact Phone */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  聯絡電話（選填）
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                  placeholder="0912-345-678"
                />
              </div>

              {/* External Insurance */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasInsurance"
                  checked={hasExternalInsurance}
                  onChange={(e) => setHasExternalInsurance(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-300 rounded"
                />
                <label htmlFor="hasInsurance" className="ml-2 text-sm text-zinc-700 dark:text-zinc-300">
                  已有外部保險
                </label>
              </div>

              {hasExternalInsurance && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    保險公司名稱
                  </label>
                  <input
                    type="text"
                    value={insuranceProvider}
                    onChange={(e) => setInsuranceProvider(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                    placeholder="請輸入保險公司"
                  />
                </div>
              )}

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  備註（選填）
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition resize-none"
                  rows={3}
                  placeholder="其他需要說明的事項..."
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep('code');
                    setError('');
                  }}
                  className="flex-1 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium py-3 px-4 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                >
                  返回
                </button>
                <button
                  type="submit"
                  disabled={loading || !studentName.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 dark:disabled:bg-zinc-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  {loading ? '領取中...' : '確認領取座位'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && claimedInfo && (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <svg
                className="h-16 w-16 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                座位領取成功！
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                您已成功領取課程座位
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-left">
              <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                <span className="font-medium">座位 ID：</span>{claimedInfo.seatId}
              </p>
              <p className="text-sm text-green-800 dark:text-green-300">
                <span className="font-medium">學生 ID：</span>{claimedInfo.mappingId}
              </p>
            </div>

            <div className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-700/30 rounded-lg p-4">
              <p className="mb-2">接下來您可以：</p>
              <ul className="list-disc list-inside space-y-1 text-left">
                <li>等待教練通知上課時間</li>
                <li>完成課前自我評估（如有需要）</li>
                <li>課後查看教練評分與回饋</li>
              </ul>
            </div>

            <button
              onClick={() => router.push('/lessons')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02]"
            >
              前往課程頁面
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
