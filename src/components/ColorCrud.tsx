/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Color, Role } from '../types';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ColorCrudProps {
  colors: Color[];
  onAddColor: (name: string, hex: string) => void;
  onEditColor: (id: string, name: string, hex: string) => void;
  onDeleteColor: (id: string) => void;
  userRole: Role;
}

export default function ColorCrud({ colors, onAddColor, onEditColor, onDeleteColor, userRole }: ColorCrudProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#000000');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isReadOnly = userRole === 'Empleado';

  const sortedColors = [...colors].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' })
  );

  const filteredColors = sortedColors.filter((col) =>
    col.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    col.hex.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanColorName = colorName.trim();
    if (!cleanColorName) {
      setError('El nombre del color es obligatorio.');
      return;
    }
    if (/\d/.test(cleanColorName)) {
      setError('El nombre del color no puede contener números.');
      return;
    }
    if (cleanColorName.length > 10) {
      setError('El nombre del color no puede tener más de 10 caracteres.');
      return;
    }
    
    const cleanColorHex = colorHex.trim();
    if (!cleanColorHex) {
      setError('El código hexadecimal es obligatorio.');
      return;
    }

    if (editingColor) {
      const isUnchanged = cleanColorName.toLowerCase() === editingColor.name.toLowerCase() && cleanColorHex.toLowerCase() === editingColor.hex.toLowerCase();
      if (isUnchanged) {
        const msg = 'Debes modificar el nombre o el color hexadecimal antes de guardar.';
        setError(msg);
        alert(msg);
        return;
      }
    }

    const exists = colors.some(
      (c) => c.name.toLowerCase() === cleanColorName.toLowerCase() && (!editingColor || c.id !== editingColor.id)
    );

    if (exists) {
      setError('Este color ya se encuentra registrado con ese nombre.');
      return;
    }

    if (editingColor) {
      onEditColor(editingColor.id, cleanColorName, cleanColorHex);
      setSuccess('Color actualizado con éxito.');
    } else {
      onAddColor(cleanColorName, cleanColorHex);
      setSuccess('Color agregado con éxito.');
    }

    setColorName('');
    setColorHex('#000000');
    setEditingColor(null);
    setIsModalOpen(false);

    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEdit = (col: Color) => {
    if (isReadOnly) return;
    setEditingColor(col);
    setColorName(col.name);
    setColorHex(col.hex);
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este color?')) {
      onDeleteColor(id);
      setSuccess('Color eliminado con éxito.');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const openAddModal = () => {
    if (isReadOnly) return;
    setEditingColor(null);
    setColorName('');
    setColorHex('#000000');
    setError('');
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm" id="color-crud-view">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6" id="color-header-actions">
        <div>
          <h2 className="text-xl font-display font-bold text-stone-900 tracking-tight">Catálogo de Colores</h2>
          <p className="text-stone-500 text-xs mt-1">Registra la gama de colores para las opciones de calzado en stock.</p>
        </div>

        {!isReadOnly && (
          <button
            id="add-color-btn"
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-all self-start sm:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Color</span>
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-2" id="color-success-banner">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* SEARCH AND INFO BAR */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6" id="color-search-bar-container">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-stone-400" />
          </div>
          <input
            id="color-search-input"
            type="text"
            placeholder="Buscar colores por nombre o hex..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
        <div className="flex items-center text-stone-400 text-[11px] font-mono px-1">
          Total de colores: {colors.length}
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto border border-stone-100 rounded-xl" id="color-table-wrapper">
        <table className="w-full text-left border-collapse" id="color-table">
          <thead>
            <tr className="bg-stone-50/75 border-b border-stone-100 text-stone-500 text-[10px] font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">VISTA PREVIA</th>
              <th className="py-3 px-4">NOMBRE DEL COLOR</th>
              <th className="py-3 px-4 font-mono">CÓDIGO HEX</th>
              <th className="py-3 px-4 text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
            {filteredColors.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-stone-400 font-mono text-xs">
                  No se encontraron colores registrados.
                </td>
              </tr>
            ) : (
              filteredColors.map((col) => (
                <tr key={col.id} className="hover:bg-stone-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500">{col.id}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border border-stone-200/80 shadow-xs shrink-0"
                        style={{ backgroundColor: col.hex }}
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-stone-900">{col.name}</td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500">{col.hex.toUpperCase()}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!isReadOnly && (
                        <button
                          id={`edit-color-${col.id}`}
                          onClick={() => handleEdit(col)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
                          title="Editar Color"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        id={`delete-color-${col.id}`}
                        onClick={() => handleDelete(col.id)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        title="Eliminar Color"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="color-form-modal">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl border border-stone-100 flex flex-col gap-6 animate-scale-up">
            <div className="flex justify-between items-center" id="color-modal-header">
              <h3 className="text-base font-display font-bold text-stone-900">
                {editingColor ? 'Editar Color' : 'Agregar Nuevo Color'}
              </h3>
              <button
                id="close-color-modal"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2" id="color-modal-error">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" id="color-form">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide mb-2">
                  NOMBRE DEL COLOR (MÁX. 10 CARAC., SIN NÚMEROS)
                </label>
                <input
                  id="color-name-input"
                  type="text"
                  required
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  placeholder="ej. Negro, Blanco"
                  className="block w-full px-4 py-3 border border-stone-200 rounded-xl text-xs bg-white text-stone-850 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  maxLength={10}
                />
                <div className="flex justify-between text-[9px] text-stone-400 mt-1 font-mono">
                  <span>Sin números permitidos</span>
                  <span className={colorName.trim().length > 10 || /\d/.test(colorName) ? 'text-rose-600 font-bold' : ''}>
                    {colorName.length}/10 carac.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wide mb-2">
                  VALOR DEL COLOR (HEX / SELECTOR)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl border border-stone-200 shadow-xs shrink-0 relative overflow-hidden" style={{ backgroundColor: colorHex }}>
                    <input
                      id="color-hex-picker"
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <input
                    id="color-hex-text-input"
                    type="text"
                    required
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    placeholder="#000000"
                    className="block flex-1 px-4 py-3 border border-stone-200 rounded-xl text-xs bg-white text-stone-850 font-mono placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    pattern="^#([A-Fa-f0-9]{6})$"
                    title="Debe ser un código HEX válido, ej: #FF5733"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2" id="color-modal-footer">
                <button
                  id="cancel-color-form"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 border border-stone-200 rounded-full text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  id="submit-color-form"
                  type="submit"
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-xs font-semibold transition-all active:scale-95"
                >
                  {editingColor ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
