/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Category, Role } from '../types';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CategoryCrudProps {
  categories: Category[];
  onAddCategory: (name: string, description: string) => void;
  onEditCategory: (id: string, name: string, description: string) => void;
  onDeleteCategory: (id: string) => void;
  userRole: Role;
}

export default function CategoryCrud({ categories, onAddCategory, onEditCategory, onDeleteCategory, userRole }: CategoryCrudProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isReadOnly = userRole === 'Empleado';

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanCatName = categoryName.trim();
    if (!cleanCatName) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }

    if (/\d/.test(cleanCatName)) {
      setError('El nombre de la categoría no puede contener números.');
      return;
    }

    if (cleanCatName.length > 10) {
      setError('El nombre de la categoría no puede tener más de 10 caracteres.');
      return;
    }

    const cleanDesc = categoryDescription.trim();
    if (!cleanDesc) {
      setError('La descripción de la categoría es obligatoria.');
      return;
    }

    if (/\d/.test(cleanDesc)) {
      setError('La descripción no puede contener números.');
      return;
    }

    if (cleanDesc.length < 5 || cleanDesc.length > 100) {
      setError('La descripción de la categoría debe tener entre 5 y 100 caracteres.');
      return;
    }

    const exists = categories.some(
      (c) => c.name.toLowerCase() === categoryName.trim().toLowerCase() && (!editingCategory || c.id !== editingCategory.id)
    );

    if (exists) {
      setError('Esta categoría ya se encuentra registrada.');
      return;
    }

    if (editingCategory) {
      onEditCategory(editingCategory.id, categoryName.trim(), categoryDescription.trim());
      setSuccess('Categoría actualizada con éxito.');
    } else {
      onAddCategory(categoryName.trim(), categoryDescription.trim());
      setSuccess('Categoría agregada con éxito.');
    }

    setCategoryName('');
    setCategoryDescription('');
    setEditingCategory(null);
    setIsModalOpen(false);

    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEdit = (cat: Category) => {
    if (isReadOnly) return;
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryDescription(cat.description || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta categoría?')) {
      onDeleteCategory(id);
      setSuccess('Categoría eliminada con éxito.');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const openAddModal = () => {
    if (isReadOnly) return;
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDescription('');
    setError('');
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm" id="category-crud-view">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6" id="category-header-actions">
        <div>
          <h2 className="text-xl font-display font-bold text-stone-900 tracking-tight">Catálogo de Categorías</h2>
          <p className="text-stone-500 text-xs mt-1">Administra los tipos de calzado como Zapatillas, Mocasines, Botas, Tenis, Calzado Formal, Pantuflas, Tenis Skate, etc.</p>
        </div>

        {!isReadOnly && (
          <button
            id="add-category-btn"
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-all self-start sm:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Categoría</span>
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-2" id="category-success-banner">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* SEARCH AND INFO BAR */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6" id="category-search-bar-container">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-stone-400" />
          </div>
          <input
            id="category-search-input"
            type="text"
            placeholder="Buscar categorías por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
        <div className="flex items-center text-stone-400 text-[11px] font-mono px-1">
          Total de categorías: {categories.length}
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto border border-stone-100 rounded-xl" id="category-table-wrapper">
        <table className="w-full text-left border-collapse" id="category-table">
          <thead>
            <tr className="bg-stone-50/75 border-b border-stone-100 text-stone-500 text-[10px] font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Nombre de la Categoría</th>
              <th className="py-3 px-4">Descripción</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-stone-400 font-mono text-xs">
                  No se encontraron categorías registradas.
                </td>
              </tr>
            ) : (
              filteredCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-stone-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500">{cat.id}</td>
                  <td className="py-3.5 px-4 font-semibold text-stone-900">{cat.name}</td>
                  <td className="py-3.5 px-4 text-stone-500 max-w-xs truncate" title={cat.description}>{cat.description}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!isReadOnly && (
                        <button
                          id={`edit-category-${cat.id}`}
                          onClick={() => handleEdit(cat)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
                          title="Editar Categoría"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        id={`delete-category-${cat.id}`}
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        title="Eliminar Categoría"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="category-form-modal">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-100 flex flex-col gap-4 animate-scale-up">
            <div className="flex justify-between items-center" id="category-modal-header">
              <h3 className="text-base font-display font-bold text-stone-900">
                {editingCategory ? 'Editar Categoría' : 'Agregar Nueva Categoría'}
              </h3>
              <button
                id="close-category-modal"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2" id="category-modal-error">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" id="category-form">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Nombre de la Categoría (máx. 10 carac., sin números)
                </label>
                <input
                  id="category-name-input"
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="ej. Botas"
                  className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  maxLength={10}
                />
                <div className="flex justify-between text-[9px] text-stone-400 mt-1 font-mono">
                  <span>Sin números permitidos</span>
                  <span className={categoryName.trim().length > 10 || /\d/.test(categoryName) ? 'text-rose-600 font-bold' : ''}>
                    {categoryName.length}/10 carac.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Descripción de la Categoría (5 a 100 caracteres, sin números)
                </label>
                <textarea
                  id="category-description-input"
                  required
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  placeholder="Describe qué tipos de calzado incluye esta categoría..."
                  rows={3}
                  className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                  maxLength={100}
                />
                <div className="flex justify-between text-[9px] text-stone-400 mt-1 font-mono">
                  <span>Sin números permitidos</span>
                  <span className={categoryDescription.trim().length < 5 || categoryDescription.trim().length > 100 || /\d/.test(categoryDescription) ? 'text-rose-600 font-bold' : ''}>
                    {categoryDescription.length}/100 carac.
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2" id="category-modal-footer">
                <button
                  id="cancel-category-form"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  id="submit-category-form"
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all active:scale-95"
                >
                  {editingCategory ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
