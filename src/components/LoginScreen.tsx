/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types';
import { INITIAL_USERS } from '../initialData';
import { KeyRound, Mail, LogIn, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  users?: User[];
  onLoginSuccess: (user: User) => void;
}

export default function LoginScreen({ users = INITIAL_USERS, onLoginSuccess }: LoginScreenProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Fallback to initial users if users list is empty
  const activeUsers = users && users.length > 0 ? users : INITIAL_USERS;

  const handleLogin = (e: React.FormEvent) => {
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

    // Search user by email OR username
    const foundUser = activeUsers.find(
      (u) =>
        (u.email && u.email.toLowerCase() === cleanIdentifier) ||
        (u.username && u.username.toLowerCase() === cleanIdentifier)
    );

    if (!foundUser) {
      setError('Correo o usuario no encontrado. Revisa tus credenciales.');
      return;
    }

    // Verify password
    const expectedPassword = foundUser.password || '12345';
    if (password !== expectedPassword) {
      setError('Contraseña incorrecta. Por favor verifica tus datos.');
      return;
    }

    setError('');
    onLoginSuccess(foundUser);
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
        <div className="flex items-center gap-2 relative z-10" id="login-logo-tag">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
            <span className="font-display font-bold text-amber-400 text-sm">SDC</span>
          </div>
          <span className="font-display tracking-widest font-semibold text-xs text-stone-300">CALZADO PREMIUM</span>
        </div>

        {/* Core Big Title in the middle */}
        <div className="my-auto py-12 md:py-0 relative z-10" id="login-branding-text">
          <p className="text-amber-400 font-mono text-xs tracking-widest uppercase mb-3 font-semibold">Almacén & Catálogo</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight leading-tight mb-6">
            Sistema de <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-stone-100 to-white">
              Distribución de Calzado
            </span>
          </h1>
          <p className="text-stone-400 text-sm sm:text-base max-w-md leading-relaxed">
            Plataforma integral para el control de inventarios, gestión de existencias en tiempo real, catálogo de productos, tallas, colores y marcas de calzado.
          </p>

          <div className="mt-8 space-y-3 border-t border-white/10 pt-8" id="features-highlights">
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
          © 2026 BigHunters.
        </div>
      </div>

      {/* RIGHT HALF: Login Form Panel */}
      <div 
        id="login-form-panel"
        className="w-full md:w-1/2 bg-white flex flex-col justify-center p-8 sm:p-12 md:p-16 lg:p-20"
      >
        <div className="max-w-md w-full mx-auto" id="login-form-content">
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
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-md shadow-stone-900/10 active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>Ingresar al Sistema</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
