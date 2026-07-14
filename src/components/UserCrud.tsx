/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Role } from '../types';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle2, ShieldAlert, Eye, EyeOff, Mail, BadgeCheck, Send } from 'lucide-react';
import { api } from '../api';

interface UserCrudProps {
  users: User[];
  onAddUser: (username: string, name: string, role: Role, email: string, password: string) => Promise<User | undefined>;
  onEditUser: (id: string, name: string, role: Role, email: string, password?: string) => void;
  onDeleteUser: (id: string) => void;
  currentUser: User;
}

export default function UserCrud({ users, onAddUser, onEditUser, onDeleteUser, currentUser }: UserCrudProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Email Verification Modal state
  const [verifyingUser, setVerifyingUser] = useState<User | null>(null);
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);

  // Form Fields
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('Empleado');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showTableRowPassword, setShowTableRowPassword] = useState<{ [key: string]: boolean }>({});

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendCode = async (user: User) => {
    setVerifyingUser(user);
    setVerificationCodeInput('');
    setVerificationError('');
    setVerificationMessage('Generando y enviando código de verificación...');
    setIsSendingCode(true);

    try {
      const res = await api.sendVerificationCode(user.id, user.email);
      setIsSendingCode(false);
      setVerificationMessage(`Código enviado a ${user.email}. (Código de prueba: ${res.code})`);
    } catch (err: any) {
      setIsSendingCode(false);
      setVerificationError(err.message || 'Error al enviar código de verificación.');
    }
  };

  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingUser || !verificationCodeInput.trim()) return;

    setVerificationError('');
    try {
      const res = await api.verifyCode(verificationCodeInput.trim(), verifyingUser.id, verifyingUser.email);
      setSuccess(`¡Correo de ${verifyingUser.name} verificado con éxito!`);
      setVerifyingUser(null);
      // Refresh window state if needed
      window.location.reload();
    } catch (err: any) {
      setVerificationError(err.message || 'Código de verificación inválido.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() && !editingUser) {
      setError('El nombre de usuario es obligatorio.');
      return;
    }
    const cleanName = name.trim();
    if (!cleanName) {
      setError('El nombre completo es obligatorio.');
      return;
    }

    if (/\d/.test(cleanName)) {
      setError('El nombre completo no puede contener números.');
      return;
    }

    if (cleanName.length > 10) {
      setError('El nombre completo no puede exceder los 10 caracteres.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!editingUser) {
      if (!password.trim()) {
        setError('Por favor define una contraseña para la cuenta.');
        return;
      }

      const p = password.trim();
      if (p.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (!/[A-Z]/.test(p)) {
        setError('La contraseña debe incluir al menos una letra mayúscula (A-Z).');
        return;
      }
      if (!/[a-z]/.test(p)) {
        setError('La contraseña debe incluir al menos una letra minúscula (a-z).');
        return;
      }
      if (!/\d/.test(p)) {
        setError('La contraseña debe incluir al menos un número (0-9).');
        return;
      }
      if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/]/.test(p)) {
        setError('La contraseña debe incluir al menos un carácter especial (ej. !@#$%^&*).');
        return;
      }

      // Check if username or email exists
      const usernameExists = users.some(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (usernameExists) {
        setError('El nombre de usuario ya se encuentra registrado.');
        return;
      }

      const emailExists = users.some(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (emailExists) {
        setError('Ese correo electrónico ya está asociado a otra cuenta.');
        return;
      }

      const newUser = await onAddUser(username.trim().toLowerCase(), name.trim(), role, email.trim().toLowerCase(), password.trim());
      if (newUser && newUser.verificationCode) {
        setSuccess(`Empleado registrado con éxito. CÓDIGO DE VERIFICACIÓN: ${newUser.verificationCode} (Compártelo con el empleado)`);
      } else {
        setSuccess('Empleado registrado con éxito.');
      }
    } else {
      if (password.trim()) {
        const p = password.trim();
        if (p.length < 8) {
          setError('La nueva contraseña debe tener al menos 8 caracteres.');
          return;
        }
        if (!/[A-Z]/.test(p)) {
          setError('La nueva contraseña debe incluir al menos una letra mayúscula (A-Z).');
          return;
        }
        if (!/[a-z]/.test(p)) {
          setError('La nueva contraseña debe incluir al menos una letra minúscula (a-z).');
          return;
        }
        if (!/\d/.test(p)) {
          setError('La nueva contraseña debe incluir al menos un número (0-9).');
          return;
        }
        if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/]/.test(p)) {
          setError('La nueva contraseña debe incluir al menos un carácter especial (ej. !@#$%^&*).');
          return;
        }
      }

      onEditUser(editingUser.id, name.trim(), role, email.trim().toLowerCase(), password.trim() ? password.trim() : undefined);
      setSuccess('Información del empleado actualizada con éxito.');
    }

    setIsModalOpen(false);
    resetForm();
    // Use longer timeout if there's a verification code so it's not hidden too quickly
    setTimeout(() => setSuccess(''), 15000);
  };

  const resetForm = () => {
    setEditingUser(null);
    setUsername('');
    setName('');
    setRole('Empleado');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setError('');
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setUsername(user.username);
    setName(user.name);
    setRole(user.role);
    setEmail(user.email);
    setPassword(user.password || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = (user: User) => {
    if (user.id === currentUser.id) {
      alert('No puedes eliminar tu propio usuario con el que tienes sesión iniciada.');
      return;
    }
    if (window.confirm(`¿Estás seguro de eliminar el acceso para el empleado ${user.name}?`)) {
      onDeleteUser(user.id);
      setSuccess('Usuario de empleado eliminado del sistema.');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const toggleRowPassword = (userId: string) => {
    setShowTableRowPassword(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm" id="user-crud-view">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6" id="user-header-actions">
        <div>
          <h2 className="text-xl font-display font-bold text-stone-900 tracking-tight">Administración de Empleados</h2>
          <p className="text-stone-500 text-xs mt-1">
            Manten actualizada la información del personal del sistema, sus correos de acceso y contraseñas.
          </p>
        </div>

        {currentUser.role === 'Administrador' ? (
          <button
            id="add-user-btn"
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-all self-start sm:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Empleado</span>
          </button>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Acceso de administración exclusivo para rol Administrador</span>
          </div>
        )}
      </div>

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-2" id="user-success-banner">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* SEARCH AND INFO BAR */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6" id="user-search-bar-container">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-stone-400" />
          </div>
          <input
            id="user-search-input"
            type="text"
            placeholder="Buscar empleados por nombre, usuario, rol o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
        <div className="flex items-center text-stone-400 text-[11px] font-mono px-1">
          Usuarios registrados: {users.length}
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto border border-stone-100 rounded-xl" id="user-table-wrapper">
        <table className="w-full text-left border-collapse" id="user-table">
          <thead>
            <tr className="bg-stone-50/75 border-b border-stone-100 text-stone-500 text-[10px] font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Empleado</th>
              <th className="py-3 px-4">Correo Electrónico</th>
              <th className="py-3 px-4">Estado Correo</th>
              <th className="py-3 px-4">Usuario</th>
              <th className="py-3 px-4">Rol</th>
              <th className="py-3 px-4">Contraseña</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-stone-400 font-mono text-xs">
                  No se encontraron empleados registrados.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                let badgeStyle = '';
                if (user.role === 'Gerente') badgeStyle = 'bg-amber-100 text-amber-800 border-amber-200';
                else if (user.role === 'Administrador') badgeStyle = 'bg-blue-100 text-blue-800 border-blue-200';
                else badgeStyle = 'bg-stone-100 text-stone-800 border-stone-200';

                const isPassVisible = showTableRowPassword[user.id];

                return (
                  <tr key={user.id} className="hover:bg-stone-50/30 transition-colors" id={`user-item-row-${user.id}`}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 font-bold flex items-center justify-center border border-stone-200 shrink-0 uppercase overflow-hidden">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-stone-900 block truncate">{user.name}</span>
                          {user.id === currentUser.id && (
                            <span className="text-[9px] bg-neutral-900 text-white font-semibold py-0.5 px-1.5 rounded-md uppercase tracking-wider">
                              Tu Sesión
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-stone-700 text-[11px]">
                      {user.email}
                    </td>
                    <td className="py-3.5 px-4">
                      {user.isVerified !== false ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Verificado
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendCode(user)}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full transition-all"
                          title="Haz clic para enviar y verificar el código de 6 dígitos"
                        >
                          <Mail className="w-3 h-3 text-amber-600" />
                          Verificar Correo
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-stone-500">
                      @{user.username}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold py-0.5 px-2.5 border rounded-full uppercase ${badgeStyle}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="flex items-center gap-2">
                        <span>{isPassVisible ? (user.password || '12345') : '••••••••'}</span>
                        <button
                          type="button"
                          onClick={() => toggleRowPassword(user.id)}
                          className="text-stone-400 hover:text-stone-600 p-0.5"
                          title={isPassVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                          {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`edit-user-${user.id}`}
                          onClick={() => handleEdit(user)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
                          title="Editar Perfil y Contraseña"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-user-${user.id}`}
                          disabled={user.id === currentUser.id}
                          onClick={() => handleDelete(user)}
                          className="p-1.5 rounded-lg text-stone-400 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          title={user.id === currentUser.id ? 'No puedes eliminar tu propio usuario con sesión activa' : 'Eliminar Acceso'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="user-form-modal">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-100 flex flex-col gap-4 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100" id="user-modal-header">
              <h3 className="text-base font-display font-bold text-stone-900">
                {editingUser ? 'Actualizar Cuenta' : 'Registrar Empleado'}
              </h3>
              <button
                id="close-user-modal"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2" id="user-modal-error">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" id="user-form">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Nombre del Personal (máx. 10 carac., sin números)*
                </label>
                <input
                  id="user-name-input"
                  type="text"
                  required
                  maxLength={10}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej. Sofía"
                  className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
                <div className="flex justify-between text-[9px] text-stone-400 mt-1 font-mono">
                  <span>Sin números permitidos</span>
                  <span className={name.trim().length > 10 || /\d/.test(name) ? 'text-rose-600 font-bold' : ''}>
                    {name.length}/10 carac.
                  </span>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico (Para Iniciar Sesión)*
                </label>
                <input
                  id="user-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej. sofia@calzadodist.com"
                  className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                />
              </div>

              {/* Username - Disabled when editing */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Nombre de Usuario Corto*
                </label>
                <input
                  id="user-username-input"
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))} // no spaces
                  placeholder="ej. sofia_calzado"
                  className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Rol del Sistema*
                </label>
                <select
                  id="user-role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                >
                  <option value="Empleado">Empleado (Consulta Almacén)</option>
                  <option value="Gerente">Gerente (Catálogo & Almacén)</option>
                  <option value="Administrador">Administrador (Mantener Personal)</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                    Contraseña {editingUser && '(Opcional, dejar blanco para no cambiar)'}
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="user-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required={!editingUser}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser ? 'Nueva contraseña...' : 'ej. Admin#2026!'}
                    className="block w-full pl-3 pr-9 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Password Requirement Checklist */}
                {(password.length > 0 || !editingUser) && (
                  <div className="mt-2.5 p-2.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Requisitos estándar de contraseña:
                    </p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                      <span className={password.length >= 8 ? "text-emerald-600 font-semibold flex items-center gap-1" : "text-stone-400 flex items-center gap-1"}>
                        {password.length >= 8 ? "✓" : "○"} Mínimo 8 caracteres
                      </span>
                      <span className={/[A-Z]/.test(password) ? "text-emerald-600 font-semibold flex items-center gap-1" : "text-stone-400 flex items-center gap-1"}>
                        {/[A-Z]/.test(password) ? "✓" : "○"} Mayúscula (A-Z)
                      </span>
                      <span className={/[a-z]/.test(password) ? "text-emerald-600 font-semibold flex items-center gap-1" : "text-stone-400 flex items-center gap-1"}>
                        {/[a-z]/.test(password) ? "✓" : "○"} Minúscula (a-z)
                      </span>
                      <span className={/\d/.test(password) ? "text-emerald-600 font-semibold flex items-center gap-1" : "text-stone-400 flex items-center gap-1"}>
                        {/\d/.test(password) ? "✓" : "○"} Número (0-9)
                      </span>
                      <span className={/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/]/.test(password) ? "text-emerald-600 font-semibold flex items-center gap-1 col-span-2" : "text-stone-400 flex items-center gap-1 col-span-2"}>
                        {/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/]/.test(password) ? "✓" : "○"} Carácter especial (!@#$%^&*)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2" id="user-modal-footer">
                <button
                  id="cancel-user-form"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  id="submit-user-form"
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all active:scale-95"
                >
                  {editingUser ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMAIL VERIFICATION CODE MODAL */}
      {verifyingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="user-verification-modal">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-100 flex flex-col gap-4 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-display font-bold text-stone-900">
                  Verificar Correo Electrónico
                </h3>
              </div>
              <button
                onClick={() => setVerifyingUser(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Ingresa el código de 6 dígitos enviado al correo de <strong className="text-stone-900 font-mono">{verifyingUser.email}</strong>:
            </p>

            {verificationMessage && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-2">
                <Send className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="font-mono text-[11px]">{verificationMessage}</span>
              </div>
            )}

            {verificationError && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{verificationError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Código de Verificación (6 dígitos)*
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="ej. 123456"
                  value={verificationCodeInput}
                  onChange={(e) => setVerificationCodeInput(e.target.value.replace(/\D/g, ''))}
                  className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-sm font-mono tracking-widest text-center bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  disabled={isSendingCode}
                  onClick={() => handleSendCode(verifyingUser)}
                  className="text-amber-700 hover:text-amber-800 text-[11px] font-semibold underline underline-offset-2 disabled:opacity-50"
                >
                  {isSendingCode ? 'Reenviando...' : 'Reenviar código'}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifyingUser(null)}
                    className="px-3 py-1.5 border border-stone-200 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all active:scale-95"
                  >
                    Verificar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
