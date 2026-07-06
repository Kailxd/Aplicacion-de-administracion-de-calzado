/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { User } from '../types';
import { 
  X, 
  Camera, 
  KeyRound, 
  Mail, 
  User as UserIcon, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Check, 
  Lock,
  Trash2,
  Sparkles
} from 'lucide-react';

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (updatedUser: User) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
];

export default function UserProfileModal({ user, isOpen, onClose, onSaveProfile }: UserProfileModalProps) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError('La imagen es demasiado grande. Por favor elige una imagen menor a 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: User = {
      ...user,
      avatarUrl: avatarUrl.trim() || undefined
    };

    onSaveProfile(updated);
    setSuccess('¡Foto de perfil actualizada con éxito!');
    setTimeout(() => {
      setSuccess('');
      onClose();
    }, 1200);
  };

  let badgeColor = '';
  if (user.role === 'Gerente') badgeColor = 'bg-amber-100 text-amber-900 border-amber-200';
  else if (user.role === 'Administrador') badgeColor = 'bg-blue-100 text-blue-900 border-blue-200';
  else badgeColor = 'bg-stone-100 text-stone-800 border-stone-200';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="profile-modal-overlay">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-100 relative overflow-hidden flex flex-col gap-5 max-h-[90vh] overflow-y-auto" id="profile-modal-container">
        
        {/* Modal Close Button */}
        <button
          id="close-profile-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-2 rounded-full hover:bg-stone-100 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-amber-600 font-semibold block mb-0.5">
            Información de la Cuenta
          </span>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-stone-900 tracking-tight">
            Mi Perfil de Usuario
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Visualización de credenciales de acceso y actualización de imagen de perfil.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl" id="profile-error-alert">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2" id="profile-success-alert">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* AVATAR SECTION */}
        <div className="flex flex-col items-center justify-center bg-stone-50/75 p-5 rounded-2xl border border-stone-150 relative" id="profile-avatar-section">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-stone-200 border-4 border-white shadow-md flex items-center justify-center text-stone-700 font-bold text-2xl uppercase overflow-hidden relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.name.charAt(0) || 'U'}</span>
              )}
            </div>

            {/* Upload Button overlay */}
            <button
              type="button"
              id="upload-avatar-trigger"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full shadow-lg border-2 border-white transition-transform active:scale-90"
              title="Cambiar foto de perfil"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            id="avatar-file-input"
          />

          <div className="mt-3 text-center">
            <h3 className="text-sm font-bold text-stone-900">{user.name}</h3>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 border rounded-full uppercase tracking-wider ${badgeColor}`}>
                {user.role}
              </span>
              <span className="text-xs text-stone-500 font-mono">@{user.username}</span>
            </div>
          </div>

          {/* Quick Avatar Presets */}
          <div className="mt-4 w-full border-t border-stone-200/60 pt-3">
            <p className="text-[10px] text-stone-500 font-medium mb-2 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>O elige una imagen predefinida:</span>
            </p>
            <div className="flex items-center justify-center gap-2">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${
                    avatarUrl === url ? 'border-amber-500 scale-110 shadow-sm' : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="w-8 h-8 rounded-full bg-stone-200 text-stone-600 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-xs transition-colors"
                  title="Quitar foto de perfil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PROFILE READ-ONLY DETAILS & AVATAR FORM */}
        <form onSubmit={handleSubmit} className="space-y-4" id="profile-edit-form">
          {/* Email (READ ONLY) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                Correo Electrónico
              </label>
              <span className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                <Lock className="w-3 h-3 text-stone-400" />
                Solo lectura
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-stone-400" />
              </div>
              <input
                id="profile-email-input"
                type="email"
                readOnly
                disabled
                value={user.email}
                className="block w-full pl-9 pr-3 py-2.5 border border-stone-200 rounded-xl text-xs bg-stone-100/80 text-stone-600 font-mono cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* Password (READ ONLY WITH TOGGLE VISIBILITY) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                Contraseña de Acceso
              </label>
              <span className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                <Lock className="w-3 h-3 text-stone-400" />
                Solo lectura
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="w-4 h-4 text-stone-400" />
              </div>
              <input
                id="profile-password-input"
                type={showPassword ? 'text' : 'password'}
                readOnly
                disabled
                value={user.password || '12345'}
                className="block w-full pl-9 pr-9 py-2.5 border border-stone-200 rounded-xl text-xs bg-stone-100/80 text-stone-600 font-mono cursor-not-allowed select-none"
              />
              <button
                type="button"
                id="toggle-profile-password-visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500 hover:text-stone-800 transition-colors z-10"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Optional Direct Avatar URL */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Enlace directo de Foto de Perfil (Opcional)
            </label>
            <input
              id="profile-avatar-url-input"
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://ejemplo.com/mifoto.jpg"
              className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-stone-100" id="profile-modal-footer">
            <button
              id="cancel-profile-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-stone-200 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-all"
            >
              Cerrar
            </button>
            <button
              id="save-profile-btn"
              type="submit"
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              Guardar Imagen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
