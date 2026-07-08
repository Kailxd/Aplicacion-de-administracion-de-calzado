/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Brand, Role } from '../types';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BrandCrudProps {
  brands: Brand[];
  onAddBrand: (name: string, description: string, status: 'Activo' | 'Inactivo') => void;
  onEditBrand: (id: string, name: string, description: string, status: 'Activo' | 'Inactivo') => void;
  onDeleteBrand: (id: string) => void;
  userRole: Role;
}

export default function BrandCrud({ brands, onAddBrand, onEditBrand, onDeleteBrand, userRole }: BrandCrudProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [brandStatus, setBrandStatus] = useState<'Activo' | 'Inactivo'>('Activo');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isReadOnly = userRole === 'Empleado';

  const sortedBrands = [...brands].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' })
  );

  const filteredBrands = sortedBrands.filter((brand) =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (brand.description && brand.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanName = brandName.trim();
    if (!cleanName) {
      setError('El nombre de la marca es obligatorio.');
      return;
    }

    if (/\d/.test(cleanName)) {
      setError('El nombre de la marca no puede contener números.');
      return;
    }

    if (cleanName.length > 10) {
      setError('El nombre de la marca no puede tener más de 10 caracteres.');
      return;
    }

    const cleanDesc = brandDescription.trim();
    if (!cleanDesc) {
      setError('La descripción de la marca es obligatoria.');
      return;
    }

    if (/\d/.test(cleanDesc)) {
      setError('La descripción no puede contener números.');
      return;
    }

    if (cleanDesc.length < 5 || cleanDesc.length > 100) {
      setError('La descripción de la marca debe tener entre 5 y 100 caracteres.');
      return;
    }

    const exists = brands.some(
      (b) => b.name.toLowerCase() === brandName.trim().toLowerCase() && (!editingBrand || b.id !== editingBrand.id)
    );

    if (exists) {
      setError('Esta marca ya se encuentra registrada.');
      return;
    }

    if (editingBrand) {
      onEditBrand(editingBrand.id, brandName.trim(), brandDescription.trim(), brandStatus);
      setSuccess('Marca actualizada con éxito.');
    } else {
      onAddBrand(brandName.trim(), brandDescription.trim(), brandStatus);
      setSuccess('Marca agregada con éxito.');
    }

    setBrandName('');
    setBrandDescription('');
    setBrandStatus('Activo');
    setEditingBrand(null);
    setIsModalOpen(false);

    // Clear success banner after 3 seconds
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEdit = (brand: Brand) => {
    if (isReadOnly) return;
    setEditingBrand(brand);
    setBrandName(brand.name);
    setBrandDescription(brand.description || '');
    setBrandStatus(brand.status || 'Activo');
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta marca?')) {
      onDeleteBrand(id);
      setSuccess('Marca eliminada con éxito.');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const openAddModal = () => {
    if (isReadOnly) return;
    setEditingBrand(null);
    setBrandName('');
    setBrandDescription('');
    setBrandStatus('Activo');
    setError('');
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm" id="brand-crud-view">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6" id="brand-header-actions">
        <div>
          <h2 className="text-xl font-display font-bold text-stone-900 tracking-tight">Catálogo de Marcas</h2>
          <p className="text-stone-500 text-xs mt-1">Registra y administra las marcas de calzado disponibles en la tienda.</p>
        </div>

        {!isReadOnly && (
          <button
            id="add-brand-btn"
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-all self-start sm:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Marca</span>
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-2" id="brand-success-banner">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* SEARCH AND INFO BAR */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6" id="brand-search-bar-container">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-stone-400" />
          </div>
          <input
            id="brand-search-input"
            type="text"
            placeholder="Buscar marcas por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
        <div className="flex items-center text-stone-400 text-[11px] font-mono px-1">
          Total de marcas: {brands.length}
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto border border-stone-100 rounded-xl" id="brand-table-wrapper">
        <table className="w-full text-left border-collapse" id="brand-table">
          <thead>
            <tr className="bg-stone-50/75 border-b border-stone-100 text-stone-500 text-[10px] font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Nombre de la Marca</th>
              <th className="py-3 px-4">Descripción</th>
              <th className="py-3 px-4">Estatus</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
            {filteredBrands.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-stone-400 font-mono text-xs">
                  No se encontraron marcas registradas.
                </td>
              </tr>
            ) : (
              filteredBrands.map((brand) => (
                <tr key={brand.id} className="hover:bg-stone-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500">{brand.id}</td>
                  <td className="py-3.5 px-4 font-semibold text-stone-900">{brand.name}</td>
                  <td className="py-3.5 px-4 text-stone-500 max-w-xs truncate" title={brand.description}>{brand.description}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      brand.status === 'Activo'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-stone-100 text-stone-600 border-stone-200'
                    }`}>
                      {brand.status || 'Activo'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!isReadOnly && (
                        <button
                          id={`edit-brand-${brand.id}`}
                          onClick={() => handleEdit(brand)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
                          title="Editar Marca"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        id={`delete-brand-${brand.id}`}
                        onClick={() => handleDelete(brand.id)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        title="Eliminar Marca"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="brand-form-modal">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-100 flex flex-col gap-4 animate-scale-up">
            <div className="flex justify-between items-center" id="brand-modal-header">
              <h3 className="text-base font-display font-bold text-stone-900">
                {editingBrand ? 'Editar Marca' : 'Agregar Nueva Marca'}
              </h3>
              <button
                id="close-brand-modal"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2" id="brand-modal-error">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" id="brand-form">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Nombre de la Marca (máx. 10 carac., sin números)
                </label>
                <input
                  id="brand-name-input"
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="ej. Nike"
                  className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  maxLength={10}
                />
                <div className="flex justify-between text-[9px] text-stone-400 mt-1 font-mono">
                  <span>Sin números permitidos</span>
                  <span className={brandName.trim().length > 10 || /\d/.test(brandName) ? 'text-rose-600 font-bold' : ''}>
                    {brandName.length}/10 carac.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Descripción de la Marca (5 a 100 caracteres, sin números)
                </label>
                <textarea
                  id="brand-description-input"
                  required
                  value={brandDescription}
                  onChange={(e) => setBrandDescription(e.target.value)}
                  placeholder="Describe la marca o su enfoque principal..."
                  rows={3}
                  className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                  maxLength={100}
                />
                <div className="flex justify-between text-[9px] text-stone-400 mt-1 font-mono">
                  <span>Sin números permitidos</span>
                  <span className={brandDescription.trim().length < 5 || brandDescription.trim().length > 100 || /\d/.test(brandDescription) ? 'text-rose-600 font-bold' : ''}>
                    {brandDescription.length}/100 carac.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Estatus
                </label>
                <select
                  id="brand-status-input"
                  value={brandStatus}
                  onChange={(e) => setBrandStatus(e.target.value as 'Activo' | 'Inactivo')}
                  className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2" id="brand-modal-footer">
                <button
                  id="cancel-brand-form"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  id="submit-brand-form"
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all active:scale-95"
                >
                  {editingBrand ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
