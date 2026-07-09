/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Size, Role } from '../types';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle2, SlidersHorizontal } from 'lucide-react';

interface SizeCrudProps {
  sizes: Size[];
  onAddSize: (value: number, gender: 'Dama' | 'Caballero' | 'Ambos') => void;
  onEditSize: (id: string, value: number, gender: 'Dama' | 'Caballero' | 'Ambos') => void;
  onDeleteSize: (id: string) => void;
  userRole: Role;
}

export default function SizeCrud({ sizes, onAddSize, onEditSize, onDeleteSize, userRole }: SizeCrudProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGenderTab, setActiveGenderTab] = useState<'Dama' | 'Caballero'>('Dama');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  
  // Form values
  const [sizeValueInput, setSizeValueInput] = useState('');
  const [sizeGenderInput, setSizeGenderInput] = useState<'Dama' | 'Caballero' | 'Ambos'>('Dama');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isReadOnly = userRole === 'Empleado';

  // Filter sizes based on active gender tab AND search term
  const filteredSizes = sizes
    .filter((s) => {
      const matchesGender = s.gender === activeGenderTab;
      const matchesSearch = s.value.toString().includes(searchTerm);
      return matchesGender && matchesSearch;
    })
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

    if (sizeGenderInput === 'Dama' && val < 22) {
      setError('El límite mínimo permitido para calzado de Dama (Mujer) es la talla 22.');
      return;
    }

    if (sizeGenderInput === 'Dama' && val > 26) {
      setError('El límite máximo permitido para calzado de Dama (Mujer) es la talla 26.');
      return;
    }

    if (sizeGenderInput === 'Caballero' && val < 23) {
      setError('El límite mínimo permitido para calzado de Caballero (Hombre) es la talla 23.');
      return;
    }

    if (sizeGenderInput === 'Caballero' && val > 30) {
      setError('El límite máximo permitido para calzado de Caballero (Hombre) es la talla 30.');
      return;
    }

    if (sizeGenderInput === 'Ambos' && (val < 23 || val > 26)) {
      setError('Para registrar en ambos géneros, la talla debe estar en el rango de 23 a 26 (permitido tanto para Dama como para Caballero).');
      return;
    }

    // Must be either an integer or half size (ends in .5)
    if ((val * 2) % 1 !== 0) {
      setError('Solo se permiten tallas enteras o medias tallas (ej. 24 o 24.5).');
      return;
    }

    // Check uniqueness (ignoring the one being edited, if any)
    if (sizeGenderInput === 'Ambos') {
      const existsDama = sizes.some(
        (s) => s.value === val && s.gender === 'Dama' && (!editingSize || s.id !== editingSize.id)
      );
      const existsCaballero = sizes.some(
        (s) => s.value === val && s.gender === 'Caballero' && (!editingSize || s.id !== editingSize.id)
      );
      if (existsDama && existsCaballero) {
        setError(`La talla ${val} ya se encuentra registrada tanto para Dama como para Caballero.`);
        return;
      }
    } else {
      const exists = sizes.some(
        (s) => s.value === val && s.gender === sizeGenderInput && (!editingSize || s.id !== editingSize.id)
      );
      if (exists) {
        setError(`La talla ${val} para ${sizeGenderInput} ya se encuentra registrada.`);
        return;
      }
    }

    if (editingSize) {
      // Modify size flow
      onEditSize(editingSize.id, val, sizeGenderInput);
      setSuccess(`Talla ${val} (${sizeGenderInput === 'Ambos' ? 'Ambos' : sizeGenderInput}) modificada con éxito.`);
    } else {
      // Add size flow
      onAddSize(val, sizeGenderInput);
      setSuccess(`Talla ${val} (${sizeGenderInput === 'Ambos' ? 'Ambos' : sizeGenderInput}) agregada con éxito.`);
    }

    setIsModalOpen(false);
    resetForm();

    setTimeout(() => setSuccess(''), 3000);
  };

  const resetForm = () => {
    setEditingSize(null);
    setSizeValueInput('');
    setSizeGenderInput(activeGenderTab);
    setError('');
  };

  const handleEdit = (size: Size) => {
    if (isReadOnly) return;
    setEditingSize(size);
    setSizeValueInput(size.value.toString());
    setSizeGenderInput(size.gender);
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, value: number, gender: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la talla ${value} para ${gender}?`)) {
      onDeleteSize(id);
      setSuccess(`Talla ${value} eliminada con éxito.`);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const openAddModal = () => {
    if (isReadOnly) return;
    resetForm();
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
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-all self-start sm:self-auto active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Talla</span>
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-fade-in" id="size-success-banner">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* GENDER TABS (Hombre / Mujer Selection) */}
      <div className="flex border-b border-stone-100 mb-6" id="size-gender-tabs">
        <button
          id="size-tab-dama"
          onClick={() => {
            setActiveGenderTab('Dama');
            setSizeGenderInput('Dama');
          }}
          className={`pb-3.5 px-6 text-sm font-semibold transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
            activeGenderTab === 'Dama'
              ? 'border-amber-500 text-stone-900 font-bold'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <span>Dama (Mujer)</span>
          <span className="text-[10px] bg-stone-150 text-stone-600 px-2 py-0.5 rounded-full font-mono font-medium">
            {sizes.filter((s) => s.gender === 'Dama').length}
          </span>
        </button>
        <button
          id="size-tab-caballero"
          onClick={() => {
            setActiveGenderTab('Caballero');
            setSizeGenderInput('Caballero');
          }}
          className={`pb-3.5 px-6 text-sm font-semibold transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
            activeGenderTab === 'Caballero'
              ? 'border-amber-500 text-stone-900 font-bold'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <span>Caballero (Hombre)</span>
          <span className="text-[10px] bg-stone-150 text-stone-600 px-2 py-0.5 rounded-full font-mono font-medium">
            {sizes.filter((s) => s.gender === 'Caballero').length}
          </span>
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6" id="size-search-bar-container">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-stone-400" />
          </div>
          <input
            id="size-search-input"
            type="text"
            placeholder={`Buscar tallas registradas para ${activeGenderTab === 'Dama' ? 'Dama' : 'Caballero'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
      </div>

      {/* GRID LAYOUT FOR FILTERED SIZES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3" id="sizes-chips-grid">
        {filteredSizes.length === 0 ? (
          <div className="col-span-full py-8 text-center text-stone-400 font-mono text-xs border border-stone-100 rounded-xl">
            No se encontraron tallas de {activeGenderTab === 'Dama' ? 'Dama' : 'Caballero'} que coincidan.
          </div>
        ) : (
          filteredSizes.map((size) => (
            <div
              key={size.id}
              id={`size-chip-${size.id}`}
              className="p-3.5 border border-stone-100 rounded-xl hover:border-amber-500/30 bg-stone-50/20 flex flex-col justify-between items-center relative group hover:shadow-xs transition-all"
            >
              <div className="text-center w-full">
                <span className="text-[9px] font-mono text-stone-400 block mb-1">ID: {size.id}</span>
                <div className="bg-stone-50 rounded-lg py-2 px-3 border border-stone-100 shadow-3xs">
                  <span className="text-stone-400 block text-[9px] font-bold uppercase tracking-wider">Talla</span>
                  <span className="text-lg font-mono font-black text-stone-900">{size.value}</span>
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex gap-1.5 mt-3 justify-center w-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    id={`edit-size-${size.id}`}
                    onClick={() => handleEdit(size)}
                    className="p-1 rounded bg-white border border-stone-200 hover:border-amber-500 hover:text-amber-600 text-stone-500 hover:shadow-2xs transition-all cursor-pointer"
                    title="Editar Talla"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id={`delete-size-${size.id}`}
                    onClick={() => handleDelete(size.id, size.value, size.gender)}
                    className="p-1 rounded bg-white border border-stone-200 hover:border-rose-500 hover:text-rose-600 text-stone-500 hover:shadow-2xs transition-all cursor-pointer"
                    title="Eliminar Talla"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* FORM MODAL (Add / Edit Talla) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="size-form-modal">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-100 flex flex-col gap-4 animate-scale-up">
            <div className="flex justify-between items-center" id="size-modal-header">
              <h3 className="text-base font-display font-bold text-stone-900">
                {editingSize ? 'Modificar Talla Existente' : 'Agregar Nueva Talla'}
              </h3>
              <button
                id="close-size-modal"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-50 transition-all cursor-pointer"
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
                  Género / Tipo de Talla
                </label>
                <select
                  id="size-gender-input"
                  value={sizeGenderInput}
                  onChange={(e) => setSizeGenderInput(e.target.value as 'Dama' | 'Caballero' | 'Ambos')}
                  className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                >
                  <option value="Dama">Dama (Mujer)</option>
                  <option value="Caballero">Caballero (Hombre)</option>
                  <option value="Ambos">Ambos (Dama y Caballero)</option>
                </select>
              </div>

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

              <div className="flex justify-end gap-2 pt-2" id="size-modal-footer">
                <button
                  id="cancel-size-form"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="submit-size-form"
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                >
                  {editingSize ? 'Guardar Cambios' : 'Registrar Talla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
