/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Brand, Category, Color, Size, Role } from '../types';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle2, Eye, Tag, DollarSign } from 'lucide-react';

interface ProductCrudProps {
  products: Product[];
  brands: Brand[];
  categories: Category[];
  colors: Color[];
  sizes: Size[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onEditProduct: (id: string, product: Omit<Product, 'id'>) => void;
  onDeleteProduct: (id: string) => void;
  userRole: Role;
}

const PRESET_IMAGES = [
  { name: 'Deportivo Rojo', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60' },
  { name: 'Casual Azul', url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=60' },
  { name: 'Deportivo Gris', url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=60' },
  { name: 'Bota Clasica', url: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&auto=format&fit=crop&q=60' },
  { name: 'Zapato Casual', url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&auto=format&fit=crop&q=60' },
  { name: 'Sandalias Playas', url: 'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=600&auto=format&fit=crop&q=60' },
  { name: 'Zapato Vestir', url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=60' },
  { name: 'Slippers Descanso', url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&auto=format&fit=crop&q=60' },
  { name: 'Tenis Skate Pro', url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&auto=format&fit=crop&q=60' }
];

export default function ProductCrud({
  products,
  brands,
  categories,
  colors,
  sizes,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  userRole
}: ProductCrudProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [gender, setGender] = useState<'Hombre' | 'Mujer'>('Hombre');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [name, setName] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  const isReadOnly = userRole === 'Empleado';

  // Synchronize size filters dynamically when gender changes
  useEffect(() => {
    // Standard Woman: 22-26, Standard Man: 23-30
    // If the selected sizes are out of bounds for the newly selected gender, we filter them out
    if (gender === 'Mujer') {
      setSelectedSizes((prev) => prev.filter((sz) => sz >= 22 && sz <= 26));
    } else {
      setSelectedSizes((prev) => prev.filter((sz) => sz >= 23 && sz <= 30));
    }
  }, [gender]);

  const filteredProducts = products.filter((p) => {
    const brandName = brands.find((b) => b.id === p.brandId)?.name || '';
    const catName = categories.find((c) => c.id === p.categoryId)?.name || '';
    return (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.includes(searchTerm) ||
      brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      catName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Handle image file upload directly to backend
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen excede el límite máximo permitido de 5 MB.');
      return;
    }

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setError('Formato inválido. Solo se admiten archivos en formato JPG, JPEG o PNG.');
      return;
    }

    try {
      const { api } = await import('../api');
      const uploadedUrl = await api.uploadImage(file);
      setImageUrl(uploadedUrl);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen al servidor.');
    }
  };

  const validateForm = (): boolean => {
    // 1. Code: 5 digits integer
    if (!/^\d{5}$/.test(code)) {
      setError('El modelo del producto debe ser un número entero de exactamente 5 dígitos.');
      return false;
    }

    // Code uniqueness
    const codeExists = products.some(
      (p) => p.code === code && (!editingProduct || p.id !== editingProduct.id)
    );
    if (codeExists) {
      setError('El modelo (código de 5 dígitos) ya existe en la base de datos.');
      return false;
    }

    // 2. Brand & Category
    if (!brandId) {
      setError('Debes seleccionar una marca registrada.');
      return false;
    }
    if (!categoryId) {
      setError('Debes seleccionar una categoría.');
      return false;
    }

    // 3. Name: 10 to 50 chars, unique for same brand + category
    const cleanProdName = name.trim();
    if (!cleanProdName) {
      setError('El nombre del producto es obligatorio.');
      return false;
    }
    if (cleanProdName.length < 10 || cleanProdName.length > 50) {
      setError('El nombre del producto debe contener entre 10 y 50 caracteres.');
      return false;
    }

    const nameExists = products.some(
      (p) =>
        p.brandId === brandId &&
        p.categoryId === categoryId &&
        p.name.toLowerCase() === name.trim().toLowerCase() &&
        (!editingProduct || p.id !== editingProduct.id)
    );
    if (nameExists) {
      setError('Ya existe un producto con el mismo nombre para la combinación de marca y categoría seleccionadas.');
      return false;
    }

    // 4. Color & Size selection
    if (selectedColors.length === 0) {
      setError('Debes seleccionar al menos un color registrado.');
      return false;
    }
    if (selectedSizes.length === 0) {
      setError('Debes seleccionar al menos una talla disponible.');
      return false;
    }

    // 5. Description: 20 to 150 chars
    const cleanDesc = description.trim();
    if (cleanDesc.length < 20 || cleanDesc.length > 150) {
      setError('La descripción del producto debe contener entre 20 y 150 caracteres.');
      return false;
    }

    // 6. Price: strictly > 300 and <= 5000, max 2 decimals
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 300 || numPrice > 5000) {
      setError('El precio debe ser un valor numérico mayor que $300.00 y menor o igual a $5,000.00 pesos.');
      return false;
    }

    const decimals = (price.split('.')[1] || '').length;
    if (decimals > 2) {
      setError('El precio solo permite hasta dos decimales.');
      return false;
    }

    // 7. Image
    if (!imageUrl) {
      setError('La fotografía del producto es obligatoria.');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    const productPayload = {
      code,
      gender,
      categoryId,
      brandId,
      name: name.trim(),
      colors: selectedColors,
      sizes: selectedSizes.sort((a, b) => a - b),
      description: description.trim(),
      price: parseFloat(price),
      imageUrl
    };

    if (editingProduct) {
      onEditProduct(editingProduct.id, productPayload);
      setSuccess('Producto actualizado con éxito en el catálogo.');
    } else {
      onAddProduct(productPayload);
      setSuccess('Producto registrado con éxito en el catálogo.');
    }

    setIsModalOpen(false);
    resetForm();

    setTimeout(() => setSuccess(''), 3000);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setCode('');
    setGender('Hombre');
    setCategoryId(categories[0]?.id || '');
    const firstActiveBrand = brands.find(b => b.status !== 'Inactivo') || brands[0];
    setBrandId(firstActiveBrand?.id || '');
    setName('');
    setSelectedColors([]);
    setSelectedSizes([]);
    setDescription('');
    setPrice('');
    setImageUrl('');
    setError('');
  };

  const handleEdit = (p: Product) => {
    if (isReadOnly) return;
    setEditingProduct(p);
    setCode(p.code);
    setGender(p.gender);
    setCategoryId(p.categoryId);
    setBrandId(p.brandId);
    setName(p.name);
    setSelectedColors(p.colors);
    setSelectedSizes(p.sizes);
    setDescription(p.description);
    setPrice(p.price.toString());
    setImageUrl(p.imageUrl);
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto del catálogo? Esto podría eliminar su stock asociado.')) {
      onDeleteProduct(id);
      setSuccess('Producto eliminado con éxito.');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const openAddModal = () => {
    if (isReadOnly) return;
    resetForm();
    if (categories.length > 0) setCategoryId(categories[0].id);
    const firstActiveBrand = brands.find(b => b.status !== 'Inactivo') || brands[0];
    if (firstActiveBrand) setBrandId(firstActiveBrand.id);
    setIsModalOpen(true);
  };

  const toggleColor = (colorId: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorId) ? prev.filter((id) => id !== colorId) : [...prev, colorId]
    );
  };

  const toggleSize = (sizeVal: number) => {
    setSelectedSizes((prev) =>
      prev.includes(sizeVal) ? prev.filter((v) => v !== sizeVal) : [...prev, sizeVal]
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm" id="product-crud-view">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6" id="product-header-actions">
        <div>
          <h2 className="text-xl font-display font-bold text-stone-900 tracking-tight">Catálogo de Calzado</h2>
          <p className="text-stone-500 text-xs mt-1">Registra nuevos modelos de zapatos, define sus combinaciones base y precios.</p>
        </div>

        {!isReadOnly && (
          <button
            id="add-product-btn"
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-all self-start sm:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Producto</span>
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-2" id="product-success-banner">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* SEARCH AND INFO BAR */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6" id="product-search-bar-container">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-stone-400" />
          </div>
          <input
            id="product-search-input"
            type="text"
            placeholder="Buscar calzado por modelo, nombre, marca o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
        <div className="flex items-center text-stone-400 text-[11px] font-mono px-1">
          Modelos registrados: {products.length}
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="products-grid-list">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-stone-400 font-mono text-xs border border-stone-100 rounded-2xl bg-stone-50/20">
            No se encontraron productos registrados en el catálogo.
          </div>
        ) : (
          filteredProducts.map((product) => {
            const productBrand = brands.find((b) => b.id === product.brandId)?.name || 'Sin Marca';
            const productCategory = categories.find((c) => c.id === product.categoryId)?.name || 'Sin Categoría';

            return (
              <div
                key={product.id}
                id={`product-card-${product.id}`}
                className="bg-white rounded-2xl border border-stone-150 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Image & Badge Cover */}
                <div className="relative aspect-video w-full bg-stone-100 overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback image in case of broken link
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60';
                    }}
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                    <span className="bg-stone-900/90 text-white font-mono text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-sm">
                      Mod: {product.code}
                    </span>
                    <span className={`text-[9px] font-bold py-0.5 px-2 rounded-md uppercase tracking-wider ${
                      product.gender === 'Hombre' ? 'bg-sky-100 text-sky-800' : 'bg-pink-100 text-pink-800'
                    }`}>
                      {product.gender}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs py-1 px-2.5 rounded-lg border border-stone-100 text-stone-900 font-bold font-mono text-xs shadow-sm">
                    ${product.price.toFixed(2)}
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between" id={`product-info-${product.id}`}>
                  <div>
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">
                      <span>{productBrand}</span>
                      <span className="text-stone-300">•</span>
                      <span>{productCategory}</span>
                    </div>
                    <h3 className="text-sm font-bold text-stone-900 leading-snug tracking-tight mb-2">
                      {product.name}
                    </h3>
                    <p className="text-stone-500 text-xs line-clamp-2 leading-relaxed mb-4">
                      {product.description}
                    </p>
                  </div>

                  {/* Attributes Badges */}
                  <div className="space-y-3.5 pt-3.5 border-t border-stone-100">
                    {/* Colors */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider w-12">Colores:</span>
                      <div className="flex flex-wrap gap-1">
                        {product.colors.map((colId) => {
                          const col = colors.find((c) => c.id === colId);
                          return col ? (
                            <div
                              key={colId}
                              className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-2xs"
                              title={col.name}
                              style={{ backgroundColor: col.hex }}
                            />
                          ) : null;
                        })}
                      </div>
                    </div>

                    {/* Sizes */}
                    <div className="flex items-start gap-1.5">
                      <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider w-12 pt-0.5">Tallas:</span>
                      <div className="flex flex-wrap gap-1">
                        {product.sizes.map((sz) => (
                          <span
                            key={sz}
                            className="bg-stone-50 text-stone-600 font-mono text-[10px] py-0.5 px-1.5 border border-stone-100 rounded-md"
                          >
                            {sz}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-100 flex justify-between items-center" id={`product-footer-${product.id}`}>
                  <button
                    id={`view-product-details-${product.id}`}
                    onClick={() => setPreviewProduct(product)}
                    className="flex items-center gap-1 text-stone-500 hover:text-stone-800 text-[11px] font-medium transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Ficha</span>
                  </button>

                  <div className="flex gap-1">
                    {!isReadOnly && (
                      <button
                        id={`edit-product-${product.id}`}
                        onClick={() => handleEdit(product)}
                        className="p-1 text-stone-500 hover:text-amber-600 transition-all rounded"
                        title="Editar Calzado"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      id={`delete-product-${product.id}`}
                      onClick={() => handleDelete(product.id)}
                      className="p-1 text-stone-500 hover:text-rose-600 transition-all rounded"
                      title="Eliminar Calzado"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in" id="product-form-modal">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] md:max-h-[85vh] shadow-2xl border border-stone-100 my-4 flex flex-col animate-scale-up overflow-hidden"
            id="product-form"
          >
            {/* Modal Header (fixed/sticky) */}
            <div className="flex justify-between items-center border-b border-stone-100 px-6 py-4 sm:px-8 sm:py-5 shrink-0" id="product-modal-header">
              <h3 className="text-base sm:text-lg font-display font-bold text-stone-900">
                {editingProduct ? 'Editar Producto de Calzado' : 'Registrar Nuevo Calzado'}
              </h3>
              <button
                id="close-product-modal"
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Content Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6" id="product-modal-scroll-body">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2" id="product-modal-error">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {/* Grid 1: Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="form-basic-grid">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Modelo (5 dígitos)*
                  </label>
                  <input
                    id="p-form-code"
                    type="text"
                    required
                    maxLength={5}
                    placeholder="ej. 10024"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // only digits
                    className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Género*
                  </label>
                  <select
                    id="p-form-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Hombre' | 'Mujer')}
                    className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  >
                    <option value="Hombre">Hombre</option>
                    <option value="Mujer">Mujer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Precio ($)*
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-stone-400 text-xs font-mono">$</span>
                    <input
                      id="p-form-price"
                      type="number"
                      step="0.01"
                      min="300"
                      max="5000"
                      required
                      placeholder="999.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="block w-full pl-6 pr-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Grid 2: Brand & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="form-relations-grid">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Marca*
                  </label>
                  <select
                    id="p-form-brand"
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    required
                    className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  >
                    <option value="">Seleccione una marca</option>
                    {brands.map((b) => {
                      const isCurrentlySelected = b.id === brandId;
                      // If the brand is inactive and is not the one currently selected, hide it
                      if (b.status === 'Inactivo' && !isCurrentlySelected) {
                        return null;
                      }
                      return (
                        <option key={b.id} value={b.id}>
                          {b.name} {b.status === 'Inactivo' ? ' (Inactiva)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Categoría*
                  </label>
                  <select
                    id="p-form-category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  >
                    <option value="">Seleccione una categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Name & Description */}
              <div className="space-y-4" id="form-texts-grid">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Nombre del Producto (10 a 50 caracteres)*
                  </label>
                  <input
                    id="p-form-name"
                    type="text"
                    required
                    minLength={10}
                    maxLength={50}
                    placeholder="ej. Air Max Invigor Run"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                  <div className="flex justify-between text-[9px] text-stone-400 mt-0.5 font-mono">
                    <span>Único para la misma marca y categoría</span>
                    <span className={name.trim().length < 10 || name.trim().length > 50 ? 'text-rose-600 font-bold' : ''}>
                      {name.length}/50 carac. (mín. 10)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Descripción del Calzado (20 a 150 caracteres)*
                  </label>
                  <textarea
                    id="p-form-description"
                    required
                    minLength={20}
                    maxLength={150}
                    rows={2}
                    placeholder="Proporciona una descripción detallada del producto (de 20 a 150 caracteres)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                  />
                  <div className="flex justify-between text-[9px] text-stone-400 mt-0.5 font-mono">
                    <span>Obligatorio</span>
                    <span className={description.trim().length < 20 || description.trim().length > 150 ? 'text-rose-600 font-bold' : ''}>
                      {description.length}/150 carac. (mín. 20)
                    </span>
                  </div>
                </div>
              </div>

              {/* Colors Selection (Pre-registered) */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Colores Disponibles*
                </label>
                <div className="flex flex-wrap gap-2.5 p-3.5 border border-stone-150 rounded-xl bg-stone-50/30" id="form-colors-checkboxes">
                  {colors.map((col) => {
                    const isSelected = selectedColors.includes(col.id);
                    return (
                      <button
                        key={col.id}
                        id={`form-color-toggle-${col.id}`}
                        type="button"
                        onClick={() => toggleColor(col.id)}
                        className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs'
                            : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: col.hex }}
                        />
                        <span>{col.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sizes Selection (Dynamically restricted based on gender!) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                    Tallas Disponibles para {gender}*
                  </label>
                  <span className="text-[10px] text-amber-600 font-medium">
                    {gender === 'Mujer' ? 'Restringido: 22 a 26' : 'Restringido: 23 a 30'}
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 p-3.5 border border-stone-150 rounded-xl bg-stone-50/30" id="form-sizes-checkboxes">
                  {sizes
                    .filter((s) => (gender === 'Mujer' ? s.value >= 22 && s.value <= 26 : s.value >= 23 && s.value <= 30))
                    .map((size) => {
                      const isSelected = selectedSizes.includes(size.value);
                      return (
                        <button
                          key={size.id}
                          id={`form-size-toggle-${size.id}`}
                          type="button"
                          onClick={() => toggleSize(size.value)}
                          className={`py-1.5 px-2 rounded-lg border text-xs font-mono font-bold transition-all text-center ${
                            isSelected
                              ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs'
                              : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                          }`}
                        >
                          {size.value}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Image selector & upload */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Fotografía / Imagen del Producto* (JPG, PNG - Máx 5MB)
                </label>
                <div className="space-y-4 p-4 border border-stone-150 rounded-xl bg-stone-50/30" id="form-image-handling">
                  {/* Preset library */}
                  <div>
                    <span className="text-[10px] text-stone-400 block mb-2 font-medium">Opción A: Elegir de nuestra galería predeterminada:</span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2" id="form-presets-images">
                      {PRESET_IMAGES.map((img) => (
                        <button
                          key={img.name}
                          id={`preset-img-btn-${img.name.replace(' ', '')}`}
                          type="button"
                          onClick={() => setImageUrl(img.url)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            imageUrl === img.url ? 'border-amber-500 scale-95 shadow-md' : 'border-stone-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual upload or URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-200/50" id="form-upload-methods">
                    <div>
                      <span className="text-[10px] text-stone-400 block mb-1.5 font-medium">Opción B: Cargar archivo local:</span>
                      <input
                        id="p-form-file-input"
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleImageFileChange}
                        className="block w-full text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-stone-200 file:text-stone-700 hover:file:bg-stone-300 transition-all cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block mb-1.5 font-medium">Opción C: Insertar URL de imagen:</span>
                      <input
                        id="p-form-url-input"
                        type="url"
                        placeholder="https://ejemplo.com/calzado.png"
                        value={imageUrl.startsWith('data:') ? '' : imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="block w-full px-3 py-1.5 border border-stone-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Live preview of image */}
                  {imageUrl && (
                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-stone-200/60" id="form-image-preview-strip">
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-stone-100 border border-stone-200">
                        <img
                          src={imageUrl}
                          alt="preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-emerald-600 font-bold block">✓ Imagen lista</span>
                        <span className="text-[9px] text-stone-400 block truncate font-mono">{imageUrl}</span>
                      </div>
                      <button
                        id="p-form-clear-img"
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="text-stone-400 hover:text-stone-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div> {/* End of Scrollable Body */}

            {/* Modal Footer (fixed/sticky) */}
            <div className="flex justify-end gap-2 px-6 py-4 sm:px-8 border-t border-stone-100 bg-stone-50/50 shrink-0" id="product-modal-footer">
              <button
                id="cancel-product-form"
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-50 transition-all"
              >
                Cancelar
              </button>
              <button
                id="submit-product-form"
                type="submit"
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all active:scale-95"
              >
                {editingProduct ? 'Guardar Cambios' : 'Registrar Calzado'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW PRODUCT SHEET DETAIL MODAL */}
      {previewProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="product-preview-modal">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-100 animate-scale-up">
            <div className="relative aspect-video w-full bg-stone-100">
              <img
                src={previewProduct.imageUrl}
                alt={previewProduct.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60';
                }}
              />
              <button
                id="close-preview-modal"
                onClick={() => setPreviewProduct(null)}
                className="absolute top-4 right-4 bg-white/95 text-stone-700 p-2 rounded-full shadow-lg hover:bg-white hover:scale-105 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-4 left-4 flex flex-col gap-1 items-start">
                <span className="bg-stone-900 text-white text-[10px] font-mono font-semibold px-2 py-0.5 rounded">
                  Modelo: {previewProduct.code}
                </span>
                <span className="bg-amber-400 text-stone-950 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {brands.find((b) => b.id === previewProduct.brandId)?.name}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4" id="product-detail-sheet-body">
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest block">
                  {categories.find((c) => c.id === previewProduct.categoryId)?.name} • {previewProduct.gender}
                </span>
                <h3 className="text-lg font-display font-bold text-stone-900 leading-tight mt-1">
                  {previewProduct.name}
                </h3>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100">
                {previewProduct.description}
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs pt-2" id="product-preview-grid">
                <div>
                  <span className="text-stone-400 block font-medium">Precio Sugerido:</span>
                  <span className="text-stone-900 font-bold text-base font-mono">${previewProduct.price.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-stone-400 block font-medium">Género Destinatario:</span>
                  <span className="text-stone-900 font-semibold">{previewProduct.gender}</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-stone-100" id="product-preview-attributes">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider w-16 shrink-0">Colores:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {previewProduct.colors.map((colId) => {
                      const col = colors.find((c) => c.id === colId);
                      return col ? (
                        <span key={colId} className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 text-[10px] font-medium py-1 px-2.5 rounded-full border border-stone-200">
                          <span className="w-2 h-2 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: col.hex }} />
                          <span>{col.name}</span>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider w-16 shrink-0">Tallas:</span>
                  <div className="flex flex-wrap gap-1">
                    {previewProduct.sizes.map((sz) => (
                      <span key={sz} className="bg-stone-50 text-stone-700 font-mono text-[10px] font-bold py-1 px-2.5 border border-stone-200/70 rounded-lg">
                        {sz}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex justify-end" id="product-preview-modal-footer">
              <button
                id="close-preview-sheet-btn"
                onClick={() => setPreviewProduct(null)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all active:scale-95"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
