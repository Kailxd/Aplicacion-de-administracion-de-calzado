/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Size, Role } from '../types';
import { Search, Plus, Trash2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SizeCrudProps {
  sizes: Size[];
  onAddSize: (value: number, gender: 'Dama' | 'Caballero' | 'Unisex') => void;
  onDeleteSize: (id: string) => void;
  userRole: Role;
}

export default function SizeCrud({ sizes, onAddSize, onDeleteSize, userRole }: SizeCrudProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sizeValueInput, setSizeValueInput] = useState('');
  const [sizeGenderInput, setSizeGenderInput] = useState<'Dama' | 'Caballero' | 'Unisex'>('Dama');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isReadOnly = userRole === 'Empleado';

  // Filter sizes based on search term
  const filteredSizes = sizes
    .filter((s) => s.value.toString().includes(searchTerm) || (s.gender && s.gender.toLowerCase().includes(searchTerm.toLowerCase())))
    .sort((a, b) => a.value - b.value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const val = parseFloat(sizeValueInput);
    if (isNaN(val)) {
      setError('Por favor ingresa un número válido.');
      return;
    }

    if (val < 15 || val > 35) {
      setError('La talla debe estar en el rango de 15 a 35.');
      return;
    }

    // Must be either an integer or half size (ends in .5)
    if (val * 2 % 1 !== 0) {
      setError('Solo se permiten tallas enteras o medias tallas (ej. 24 o 24.5).');
      return;
    }

    const exists = sizes.some((s) => s.value === val && s.gender === sizeGenderInput);
    if (exists) {
      setError(`La talla ${val} para ${sizeGenderInput} ya se encuentra registrada.`);
      return;
    }

    onAddSize(val, sizeGenderInput);
    setSuccess(`Talla ${val} (${sizeGenderInput}) agregada con éxito.`);
    setSizeValueInput('');
    setSizeGenderInput('Dama');
    setIsModalOpen(false);

    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDelete = (id: string, value: number) => {
    if (window.confirm(`¿Estás seguro de eliminar la talla ${value}?`)) {
      onDeleteSize(id);
      setSuccess(`Talla ${value} eliminada con éxito.`);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const openAddModal = () => {
    if (isReadOnly) return;
    setSizeValueInput('');
    setError('');
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm" id="size-crud-view">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6" id="size-header-actions">
        <div>
          <h2 className="text-xl font-display font-bold text-stone-900 tracking-tight">Catálogo de Tallas</h2>
          <p className="text-stone-500 text-xs mt-1">Registra y administra las tallas físicas de calzado para dama y caballero.</p>
        </div>

        {!isReadOnly && (
          <button
            id="add-size-btn"
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-all self-start sm:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Talla</span>
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-2" id="size-success-banner">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* SEARCH AND INFO BAR */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6" id="size-search-bar-container">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-stone-400" />
          </div>
          <input
            id="size-search-input"
            type="text"
            placeholder="Buscar tallas (ej. 24, 25.5)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
        <div className="flex items-center text-stone-400 text-[11px] font-mono px-1">
          Total de tallas: {sizes.length}
        </div>
      </div>

      {/* GRID LAYOUT FOR SIZES (Since they are just numbers, a table is less efficient than a grid of chip cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3" id="sizes-chips-grid">
        {filteredSizes.length === 0 ? (
          <div className="col-span-full py-8 text-center text-stone-400 font-mono text-xs border border-stone-100 rounded-xl">
            No se encontraron tallas registradas.
          </div>
        ) : (
          filteredSizes.map((size) => {
            const badgeType = size.gender || 'Unisex';
            let badgeClass = '';
            if (badgeType === 'Dama') {
              badgeClass = 'bg-amber-50 text-amber-800 border-amber-200/60';
            } else if (badgeType === 'Caballero') {
              badgeClass = 'bg-stone-100 text-stone-850 border-stone-300';
            } else {
              badgeClass = 'bg-stone-50/70 text-stone-600 border-stone-200';
            }

            return (
              <div
                key={size.id}
                id={`size-chip-${size.id}`}
                className="p-3.5 border border-stone-100 rounded-xl hover:border-amber-500/30 bg-stone-50/20 flex flex-col justify-between items-center relative group hover:shadow-xs transition-all"
              >
                <div className="text-center w-full">
                  <span className="text-[10px] font-mono text-stone-400 block mb-1">ID: {size.id}</span>
                  <div className="bg-stone-100 rounded-lg py-1.5 px-3">
                    <span className="text-sm text-stone-500 block text-[9px] font-bold uppercase tracking-wider">Talla</span>
                    <span className="text-lg font-mono font-black text-stone-900">{size.value}</span>
                  </div>
                  <div className="mt-1.5">
                    <span className={`inline-block text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                      {badgeType}
                    </span>
                  </div>
                </div>

                <button
                  id={`delete-size-${size.id}`}
                  onClick={() => handleDelete(size.id, size.value)}
                  className="absolute top-1 right-1 p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar Talla"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="size-form-modal">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-100 flex flex-col gap-4 animate-scale-up">
            <div className="flex justify-between items-center" id="size-modal-header">
              <h3 className="text-base font-display font-bold text-stone-900">Agregar Nueva Talla</h3>
              <button
                id="close-size-modal"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2" id="size-modal-error">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" id="size-form">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Valor de Talla (Número en cm)
                </label>
                <input
                  id="size-value-input"
                  type="number"
                  step="0.5"
                  required
                  value={sizeValueInput}
                  onChange={(e) => setSizeValueInput(e.target.value)}
                  placeholder="ej. 24, 25.5, 28"
                  className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
                <span className="text-[10px] text-stone-400 block mt-1 leading-normal">
                  Rango permitido de 15 a 35. Se admiten valores enteros o con decimal .5 (medias tallas).
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Género / Tipo de Talla
                </label>
                <select
                  id="size-gender-input"
                  value={sizeGenderInput}
                  onChange={(e) => setSizeGenderInput(e.target.value as 'Dama' | 'Caballero' | 'Unisex')}
                  className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                >
                  <option value="Dama">Dama</option>
                  <option value="Caballero">Caballero</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2" id="size-modal-footer">
                <button
                  id="cancel-size-form"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  id="submit-size-form"
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all active:scale-95"
                >
                  Guardar Talla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
