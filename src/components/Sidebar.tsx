/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Footprints, Bookmark, Ruler, Palette, Tag, Home, Users, HelpCircle, HardDrive } from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onSelectView: (view: string) => void;
  userRole: Role;
}

export default function Sidebar({ isOpen, onClose, currentView, onSelectView, userRole }: SidebarProps) {
  const menuItems = [
    { id: 'almacen', label: 'Módulo Almacén (Inventario)', icon: HardDrive, roles: ['Gerente', 'Empleado'] },
    { id: 'producto', label: 'Producto (Catálogo)', icon: Footprints, roles: ['Gerente'] },
    { id: 'categoria', label: 'Categorías', icon: Bookmark, roles: ['Gerente'] },
    { id: 'tallas', label: 'Tallas', icon: Ruler, roles: ['Gerente'] },
    { id: 'colores', label: 'Colores', icon: Palette, roles: ['Gerente'] },
    { id: 'marca', label: 'Marca', icon: Tag, roles: ['Gerente'] },
    { id: 'usuarios', label: 'Empleados / Personal', icon: Users, roles: ['Administrador'] }
  ];

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {/* Overlay Backdrop */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        id="sidebar-drawer"
        className={`fixed inset-y-0 left-0 w-72 bg-neutral-900 text-white z-50 p-6 flex flex-col justify-between shadow-2xl transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6" id="sidebar-top-section">
          {/* Header row with Title & Close Icon */}
          <div className="flex justify-between items-center pb-4 border-b border-white/10" id="sidebar-header">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center border border-white/10 overflow-hidden shadow-xs">
                <img 
                  src="/src/assets/images/shoeflow_logo.jpg" 
                  alt="ShoeFlow Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="font-display font-bold text-xs tracking-tight block text-white leading-none">Menú Principal</span>
                <span className="text-[8.5px] font-mono uppercase tracking-wider text-amber-400 block mt-1 font-bold">ShoeFlow App</span>
              </div>
            </div>

            <button
              id="close-sidebar-btn"
              onClick={onClose}
              className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
              aria-label="Cerrar navegación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items list */}
          <nav className="space-y-1.5" id="sidebar-nav">
            <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest block mb-2 px-3">
              Módulos del Sistema
            </span>
            {filteredMenuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    onSelectView(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-xs font-semibold text-left transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 shadow-md shadow-amber-500/10 font-bold'
                      : 'text-stone-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${isActive ? 'text-neutral-950' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Panel footer showing role restriction info */}
        <div className="pt-4 border-t border-white/10 text-stone-400 text-[10px]" id="sidebar-footer">
          <span className="block text-stone-500 font-semibold mb-1">Acceso Autorizado:</span>
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/5" id="sidebar-user-summary">
            <p className="font-bold text-white text-xs truncate">Rol: {userRole}</p>
            <p className="mt-0.5 opacity-80 leading-normal">
              {userRole === 'Empleado' && 'Acceso limitado únicamente a consultas de stock.'}
              {userRole === 'Gerente' && 'Permisos de administración total sobre el catálogo de calzado e inventarios.'}
              {userRole === 'Administrador' && 'Permisos de administración del personal y cuentas de usuario.'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
