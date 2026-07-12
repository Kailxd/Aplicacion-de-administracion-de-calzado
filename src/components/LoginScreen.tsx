/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types';
import { INITIAL_USERS } from '../initialData';
import { KeyRound, Mail, LogIn, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from '../api';

interface LoginScreenProps {
  users?: User[];
  onLoginSuccess: (user: User) => void;
}

export default function LoginScreen({ users = INITIAL_USERS, onLoginSuccess }: LoginScreenProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verification state
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationUserId, setVerificationUserId] = useState('');
  const [verificationInfo, setVerificationInfo] = useState('');
  const [resendingCode, setResendingCode] = useState(false);

  // Fallback to initial users if users list is empty
  const activeUsers = users && users.length > 0 ? users : INITIAL_USERS;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdentifier = identifier.trim().toLowerCase();
    
    if (!cleanIdentifier) {
      setError('Por favor ingresa tu correo electrónico o usuario.');
      return;
    }

    if (!password) {
      setError('Por favor ingresa tu contraseña.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const loggedInUser = await api.login(cleanIdentifier, password);
      onLoginSuccess(loggedInUser);
    } catch (err: any) {
      if (err.unverified) {
        setVerificationEmail(err.email || cleanIdentifier);
        setVerificationUserId(err.userId || '');
        setIsVerifyingCode(true);
        setVerificationInfo('Tu correo electrónico debe ser validado (verificado) antes de poder iniciar sesión. Se ha enviado un código de verificación de 6 dígitos.');
        setError('');
      } else {
        setError(err.message || 'Contraseña incorrecta o usuario no encontrado. Por favor verifica tus datos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError('Por favor ingresa el código de verificación.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.verifyCode(verificationCode.trim(), verificationUserId, verificationEmail);
      setVerificationInfo('');
      
      if (res.user) {
        onLoginSuccess(res.user);
      } else {
        setIsVerifyingCode(false);
        setVerificationCode('');
        setError('');
        alert('¡Correo verificado con éxito! Ahora puedes iniciar sesión con tus credenciales.');
      }
    } catch (err: any) {
      setError(err.message || 'El código de verificación ingresado es incorrecto o ha caducado.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setResendingCode(true);
      setError('');
      const res = await api.sendVerificationCode(verificationUserId, verificationEmail);
      if (res.code) {
        setVerificationInfo(`Código de verificación reenviado con éxito a ${verificationEmail}. (Código para pruebas rápidas: ${res.code})`);
      } else {
        setVerificationInfo(`Código de verificación reenviado con éxito a ${verificationEmail}.`);
      }
    } catch (err: any) {
      setError(err.message || 'Error al reenviar el código de verificación.');
    } finally {
      setResendingCode(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-gray-50 font-sans" id="login-container">
      {/* LEFT HALF: Title & Branding Panel */}
      <div 
        id="login-branding-panel"
        className="w-full md:w-1/2 bg-gradient-to-br from-neutral-900 via-neutral-800 to-stone-900 text-white p-8 md:p-16 flex flex-col justify-between relative overflow-hidden"
      >
        {/* Subtle decorative background glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />

        {/* Small top-left logo tag */}
        <div className="flex items-center gap-2.5 relative z-10" id="login-logo-tag">
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/15 overflow-hidden shadow-inner">
            <img 
              src="/shoeflow_logo.jpg" 
              alt="ShoeFlow Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="font-display tracking-widest font-black text-sm text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-stone-200 to-amber-500 uppercase">ShoeFlow</span>
        </div>
 
        {/* Core Big Title in the middle */}
        <div className="my-auto py-8 md:py-0 relative z-10" id="login-branding-text">
          <p className="text-amber-400 font-mono text-[10px] tracking-widest uppercase mb-3 font-semibold">Almacén & Catálogo Inteligente</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight leading-none mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-stone-100 to-amber-500">
              ShoeFlow
            </span>
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm max-w-sm leading-relaxed mb-6">
            Plataforma integral de control de inventarios y gestión de existencias en tiempo real para calzado de dama y caballero.
          </p>
 
          <div className="mt-6 space-y-2.5 border-t border-white/10 pt-6" id="features-highlights">
            <div className="flex items-center gap-2 text-stone-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Acceso seguro individual por Correo y Contraseña</span>
            </div>
            <div className="flex items-center gap-2 text-stone-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Control exacto de stock mínimo y máximo por talla/color</span>
            </div>
            <div className="flex items-center gap-2 text-stone-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Privilegios definidos por roles (Gerente, Admin, Empleado)</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright info */}
        <div className="text-stone-500 text-xs relative z-10" id="login-footer-branding">
          © 2026 BugHunters.
        </div>
      </div>

      {/* RIGHT HALF: Login Form Panel */}
      <div 
        id="login-form-panel"
        className="w-full md:w-1/2 bg-white flex flex-col justify-center p-8 sm:p-12 md:p-16 lg:p-20"
      >
        <div className="max-w-md w-full mx-auto" id="login-form-content">
          {!isVerifyingCode ? (
            <>
              <div className="mb-8" id="login-form-header">
                <h2 className="text-2xl font-display font-bold text-stone-900 tracking-tight">Iniciar Sesión</h2>
                <p className="text-stone-500 text-sm mt-1">Ingresa tu correo y contraseña para acceder al sistema.</p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2" id="login-error-alert">
                  <span className="w-2 h-2 bg-rose-500 rounded-full shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5" id="login-form-element">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    Correo Electrónico o Usuario
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-stone-400" />
                    </div>
                    <input
                      id="login-username-input"
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="ej. sofia.martinez@calzadodist.com o gerente"
                      className="block w-full pl-10 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                      Contraseña
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-4 w-4 text-stone-400" />
                    </div>
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 border border-stone-200 rounded-xl text-sm bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      id="toggle-password-visibility-login"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-md shadow-stone-900/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Ingresando...' : 'Ingresar al Sistema'}</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6" id="verification-form-header">
                <button
                  type="button"
                  onClick={() => {
                    setIsVerifyingCode(false);
                    setError('');
                  }}
                  className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-850 font-semibold mb-4 transition-colors"
                >
                  <span>← Volver al inicio de sesión</span>
                </button>
                <h2 className="text-2xl font-display font-bold text-stone-900 tracking-tight">Validar Correo Electrónico</h2>
                <p className="text-stone-500 text-sm mt-1">Tu cuenta requiere verificación antes de poder acceder al sistema.</p>
              </div>

              {verificationInfo && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex flex-col gap-1.5 shadow-xs leading-relaxed" id="verification-info-alert">
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="w-2 h-2 bg-amber-500 rounded-full shrink-0 animate-ping" />
                    <span>Validación Requerida</span>
                  </div>
                  <p className="text-amber-800">{verificationInfo}</p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2" id="verification-error-alert">
                  <span className="w-2 h-2 bg-rose-500 rounded-full shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyCodeSubmit} className="space-y-5" id="verification-form-element">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                      Código de Verificación (6 dígitos)
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-4 w-4 text-stone-400" />
                    </div>
                    <input
                      id="verification-code-input"
                      type="text"
                      required
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="ej. 123456"
                      className="block w-full pl-10 pr-3 py-2.5 border border-stone-200 rounded-xl text-center text-lg font-mono tracking-widest bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  id="verification-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-md shadow-stone-900/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  )}
                  <span>{loading ? 'Verificando...' : 'Verificar y Acceder'}</span>
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    disabled={resendingCode}
                    onClick={handleResendCode}
                    className="text-xs text-amber-800 hover:text-amber-900 font-semibold underline underline-offset-4 disabled:opacity-50 transition-colors"
                  >
                    {resendingCode ? 'Reenviando Código...' : '¿No recibiste el código? Reenviar código de verificación'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
