/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onToggleSidebar: () => void;
  onOpenProfile?: () => void;
}

export default function Header({ currentUser, onLogout, onToggleSidebar, onOpenProfile }: HeaderProps) {
  return (
    <header className="sticky top-0 bg-white border-b border-stone-150 py-3 px-4 md:px-6 z-40 shadow-2xs" id="app-header">
      <div className="max-w-7xl mx-auto flex items-center justify-between" id="header-container">
        {/* Left Section: Menu Toggle & Small Logo */}
        <div className="flex items-center gap-3.5" id="header-left">
          {currentUser && (
            <button
              id="sidebar-toggle-btn"
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/10 active:scale-95"
              aria-label="Abrir navegación"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Micro Logo */}
          <div className="flex items-center gap-2" id="header-logo">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center border border-stone-800">
              <span className="font-display font-black text-amber-400 text-xs tracking-tighter">S</span>
            </div>
            <div className="min-w-0">
              <span className="font-display font-bold text-xs tracking-tight text-stone-900 block leading-none">DistCalzado</span>
              <span className="text-[8px] font-mono tracking-widest text-stone-400 uppercase leading-none block mt-0.5">Almacén</span>
            </div>
          </div>
        </div>

        {/* Right Section: User details & logout button */}
        {currentUser && (
          <div className="flex items-center gap-3" id="header-right">
            {/* User Profile Trigger Button */}
            <button
              id="header-user-profile-trigger"
              onClick={onOpenProfile}
              type="button"
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-stone-100/80 transition-all border border-transparent hover:border-stone-200 group text-left focus:outline-none"
              title="Ver datos de cuenta y cambiar foto de perfil"
            >
              {/* User Badge Info */}
              <div className="hidden sm:flex flex-col items-end text-right" id="user-display-info">
                <span className="text-[11px] font-bold text-stone-900 leading-tight block group-hover:text-amber-700 transition-colors">
                  {currentUser.name}
                </span>
                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/50 rounded-full px-2 py-0.5 leading-none block mt-0.5 uppercase tracking-wider font-mono">
                  {currentUser.role}
                </span>
              </div>

              {/* User Avatar Circle / Custom Image */}
              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center border border-stone-250 text-stone-600 font-bold text-xs shrink-0 uppercase select-none overflow-hidden relative shadow-2xs group-hover:border-amber-400 transition-all">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser.name.charAt(0)}</span>
                )}
              </div>
            </button>

            {/* Logout button */}
            <button
              id="header-logout-btn"
              onClick={onLogout}
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
