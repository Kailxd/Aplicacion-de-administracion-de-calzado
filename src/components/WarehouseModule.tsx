/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StockItem, Product, Brand, Category, Color, Size, Role } from '../types';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle2, SlidersHorizontal, RefreshCcw, Footprints, HelpCircle, Package, ArrowRight, ArrowLeft } from 'lucide-react';

interface WarehouseModuleProps {
  stock: StockItem[];
  products: Product[];
  brands: Brand[];
  categories: Category[];
  colors: Color[];
  sizes: Size[];
  onAddStock: (stock: Omit<StockItem, 'id'>) => void;
  onEditStock: (id: string, updated: Partial<StockItem>) => void;
  onDeleteStock: (id: string) => void;
  userRole: Role;
}

export default function WarehouseModule({
  stock,
  products,
  brands,
  categories,
  colors,
  sizes,
  onAddStock,
  onEditStock,
  onDeleteStock,
  userRole
}: WarehouseModuleProps) {
  const [activeWarehouseSubTab, setActiveWarehouseSubTab] = useState<'lookup' | 'inventory'>('lookup');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Interactive Lookup tool state
  const [lookupType, setLookupType] = useState<'model' | 'color'>('model');
  const [selectedLookupProductId, setSelectedLookupProductId] = useState<string>(products[0]?.id || '');
  const [selectedLookupColorId, setSelectedLookupColorId] = useState<string>(colors[0]?.id || '');

  // Filters for the global stock list
  const [filterBrandId, setFilterBrandId] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterProductId, setFilterProductId] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStockItem, setEditingStockItem] = useState<StockItem | null>(null);
  
  // Form fields
  const [formProductId, setFormProductId] = useState('');
  const [formColorId, setFormColorId] = useState('');
  const [formSizeValue, setFormSizeValue] = useState<number>(25);
  const [formQuantity, setFormQuantity] = useState('10');
  const [formStockMin, setFormStockMin] = useState('5');
  const [formStockMax, setFormStockMax] = useState('30');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isReadOnly = userRole === 'Empleado';

  // Get active product colors and sizes for the form
  const currentFormProduct = products.find((p) => p.id === formProductId);
  const formAvailableColors = currentFormProduct ? colors.filter((c) => currentFormProduct.colors.includes(c.id)) : colors;
  const formAvailableSizes = currentFormProduct ? currentFormProduct.sizes : [];

  // Reset filter helpers
  const handleResetFilters = () => {
    setFilterBrandId('');
    setFilterGender('');
    setFilterProductId('');
    setSearchTerm('');
  };

  // Helper to get stock status
  const getStockStatus = (item: StockItem) => {
    if (item.quantity < item.stockMin) {
      return {
        label: 'STOCK CRÍTICO (BAJO MÍNIMO)',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        textClass: 'text-rose-600',
        dotClass: 'bg-rose-500'
      };
    } else if (item.quantity > item.stockMax) {
      return {
        label: 'EXCESO (SOBRE MÁXIMO)',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        textClass: 'text-amber-600',
        dotClass: 'bg-amber-500'
      };
    } else {
      return {
        label: 'STOCK ÓPTIMO (ADECUADO)',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        textClass: 'text-emerald-600',
        dotClass: 'bg-emerald-500'
      };
    }
  };

  const sortedStock = [...stock].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' })
  );

  // Filtering global inventory entries
  const filteredStockList = sortedStock.filter((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return false;

    const brand = brands.find((b) => b.id === product.brandId);
    const color = colors.find((c) => c.id === item.colorId);
    
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.includes(searchTerm) ||
      (color?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBrand = !filterBrandId || product.brandId === filterBrandId;
    const matchesGender = !filterGender || product.gender === filterGender;
    const matchesProduct = !filterProductId || item.productId === filterProductId;

    return matchesSearch && matchesBrand && matchesGender && matchesProduct;
  });

  // Interactive Query Results:
  // QUERY A: "Si selecciono un modelo, me diga qué colores y tallas tiene, con existencias"
  const lookupProduct = products.find((p) => p.id === selectedLookupProductId);
  const lookupProductColors = lookupProduct
    ? colors.filter((c) => lookupProduct.colors.includes(c.id))
    : [];
  const lookupProductSizes = lookupProduct ? lookupProduct.sizes : [];
  const lookupProductStock = stock.filter((item) => item.productId === selectedLookupProductId);

  // QUERY B: "Si selecciono un color, me diga en qué modelos hay y qué tallas, con existencias"
  const lookupColor = colors.find((c) => c.id === selectedLookupColorId);
  const lookupColorProducts = products.filter((p) => p.colors.includes(selectedLookupColorId));
  const lookupColorStock = stock.filter((item) => item.colorId === selectedLookupColorId);

  // Handle Form Submissions
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const qty = parseInt(formQuantity);
    const min = parseInt(formStockMin);
    const max = parseInt(formStockMax);

    if (isNaN(qty) || qty < 0) {
      setError('La cantidad en existencias debe ser un número entero mayor o igual a 0.');
      return;
    }
    if (isNaN(min) || min < 0) {
      setError('El stock mínimo debe ser un número entero mayor o igual a 0.');
      return;
    }
    if (isNaN(max) || max < min) {
      setError('El stock máximo debe ser mayor o igual al stock mínimo.');
      return;
    }

    if (!formProductId) {
      setError('Debes seleccionar un calzado/modelo.');
      return;
    }
    if (!formColorId) {
      setError('Debes seleccionar un color.');
      return;
    }

    // Double check that size is valid for the product's gender
    const prod = products.find((p) => p.id === formProductId);
    if (prod) {
      if (prod.gender === 'Mujer' && (formSizeValue < 22 || formSizeValue > 26)) {
        setError('El calzado seleccionado es para Mujer y requiere una talla entre 22 y 26.');
        return;
      }
      if (prod.gender === 'Hombre' && (formSizeValue < 23 || formSizeValue > 30)) {
        setError('El calzado seleccionado es para Hombre y requiere una talla entre 23 y 30.');
        return;
      }
    }

    // Check duplicate combinations
    const combinationExists = stock.some(
      (item) =>
        item.productId === formProductId &&
        item.colorId === formColorId &&
        item.sizeValue === formSizeValue &&
        (!editingStockItem || item.id !== editingStockItem.id)
    );

    if (combinationExists) {
      setError('Esta combinación de calzado, color y talla ya se encuentra registrada en el almacén. Edita su cantidad en la lista.');
      return;
    }

    const payload = {
      productId: formProductId,
      colorId: formColorId,
      sizeValue: formSizeValue,
      quantity: qty,
      stockMin: min,
      stockMax: max
    };

    if (editingStockItem) {
      onEditStock(editingStockItem.id, payload);
      setSuccess('Existencias de almacén actualizadas con éxito.');
    } else {
      onAddStock(payload);
      setSuccess('Nueva partida de almacén registrada con éxito.');
    }

    setIsModalOpen(false);
    resetForm();
    setTimeout(() => setSuccess(''), 3000);
  };

  const resetForm = () => {
    setEditingStockItem(null);
    setFormProductId(products[0]?.id || '');
    setFormColorId('');
    setFormQuantity('10');
    setFormStockMin('5');
    setFormStockMax('30');
    setError('');
  };

  const handleEdit = (item: StockItem) => {
    if (isReadOnly) return;
    setEditingStockItem(item);
    setFormProductId(item.productId);
    setFormColorId(item.colorId);
    setFormSizeValue(item.sizeValue);
    setFormQuantity(item.quantity.toString());
    setFormStockMin(item.stockMin.toString());
    setFormStockMax(item.stockMax.toString());
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este lote de existencias del inventario?')) {
      onDeleteStock(id);
      setSuccess('Existencias eliminadas del inventario.');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const openAddModal = () => {
    if (isReadOnly) return;
    resetForm();
    // Default form values
    if (products.length > 0) {
      setFormProductId(products[0].id);
      if (products[0].colors.length > 0) {
        setFormColorId(products[0].colors[0]);
      }
      if (products[0].sizes.length > 0) {
        setFormSizeValue(products[0].sizes[0]);
      }
    }
    setIsModalOpen(true);
  };

  // Whenever product selection changes inside the Form, update corresponding default colors & sizes
  const handleFormProductChange = (prodId: string) => {
    setFormProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      if (prod.colors.length > 0) {
        setFormColorId(prod.colors[0]);
      } else {
        setFormColorId('');
      }
      if (prod.sizes.length > 0) {
        setFormSizeValue(prod.sizes[0]);
      }
    }
  };

  return (
    <div className="space-y-8" id="warehouse-module-view">
      
      {/* Selector de Sub-Módulo de Almacén */}
      <div className="flex border-b border-stone-200" id="warehouse-sub-tabs">
        <button
          id="tab-btn-lookup"
          onClick={() => setActiveWarehouseSubTab('lookup')}
          className={`pb-4 px-6 text-sm font-semibold transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
            activeWarehouseSubTab === 'lookup'
              ? 'border-amber-500 text-stone-900 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Consulta Cruzada de Almacén</span>
        </button>
        <button
          id="tab-btn-inventory"
          onClick={() => setActiveWarehouseSubTab('inventory')}
          className={`pb-4 px-6 text-sm font-semibold transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
            activeWarehouseSubTab === 'inventory'
              ? 'border-amber-500 text-stone-900 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Control de Inventario de Almacén</span>
        </button>
      </div>

      {activeWarehouseSubTab === 'lookup' && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-150 shadow-sm text-stone-900" id="lookup-tool-card">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-amber-400 text-stone-900 text-[10px] font-bold py-0.5 px-2.5 rounded-full uppercase tracking-wider">Interactiva</span>
              <h2 className="text-lg md:text-xl font-display font-bold text-stone-900 tracking-tight">Consulta Cruzada de Almacén</h2>
            </div>
            <p className="text-stone-500 text-xs mt-1">
              Toma un modelo para ver sus colores y tallas, o toma un color para ver sus modelos y tallas con sus existencias reales.
            </p>
          </div>

          {/* Toggle lookup type */}
          <div className="flex bg-stone-100 p-1 rounded-xl self-start md:self-auto border border-stone-200" id="lookup-mode-toggles">
            <button
              id="lookup-by-model-tab"
              onClick={() => setLookupType('model')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                lookupType === 'model' ? 'bg-amber-400 text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Por Modelo</span>
            </button>
            <button
              id="lookup-by-color-tab"
              onClick={() => setLookupType('color')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                lookupType === 'color' ? 'bg-amber-400 text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Por Color</span>
            </button>
          </div>
        </div>

        {/* LOOKUP PANEL CONTENT */}
        <div className="space-y-6" id="lookup-content-wrapper">
          {/* Selector row/bar (Top) */}
          <div className="bg-stone-50/50 p-5 rounded-2xl border border-stone-200" id="lookup-selectors">
            {lookupType === 'model' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center" id="model-selector-group">
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Selecciona el Modelo de Calzado:
                  </label>
                  <select
                    id="lookup-product-select"
                    value={selectedLookupProductId}
                    onChange={(e) => setSelectedLookupProductId(e.target.value)}
                    className="block w-full bg-white border border-stone-250 text-stone-800 rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs font-medium"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] - {p.name} ({p.gender})
                      </option>
                    ))}
                  </select>
                </div>

                {lookupProduct && (
                  <div className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-stone-150 shadow-sm" id="lookup-product-mini-preview">
                    <img
                      src={lookupProduct.imageUrl}
                      alt={lookupProduct.name}
                      className="w-20 h-16 rounded-xl object-cover border border-stone-200 shrink-0 shadow-2xs"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60';
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wide">
                        {brands.find((b) => b.id === lookupProduct.brandId)?.name || 'Marca'}
                      </p>
                      <h4 className="text-sm font-bold text-stone-900 truncate leading-snug">{lookupProduct.name}</h4>
                      <p className="text-xs font-mono text-stone-500 font-semibold mt-1">Precio: <span className="text-amber-700 font-bold">${lookupProduct.price.toFixed(2)}</span></p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div id="color-selector-group" className="space-y-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Selecciona el Color Base:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3" id="lookup-colors-grid">
                  {colors.map((c) => {
                    const isSelected = selectedLookupColorId === c.id;
                    return (
                      <button
                        key={c.id}
                        id={`lookup-color-btn-${c.id}`}
                        onClick={() => setSelectedLookupColorId(c.id)}
                        className={`flex items-center gap-2.5 p-3 border rounded-xl transition-all shadow-2xs ${
                          isSelected ? 'bg-amber-400/15 border-amber-500 ring-2 ring-amber-500/20' : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <span
                          className="w-4.5 h-4.5 rounded-full border border-stone-250 shadow-2xs shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-[11px] text-stone-850 font-bold truncate">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Results section (Bottom, Full Width) */}
          <div className="space-y-4" id="lookup-results">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-stone-100 pb-2">
              <span>Resultado de la búsqueda</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            </h3>

            {lookupType === 'model' && lookupProduct ? (
              <div className="space-y-6" id="lookup-model-results">
                {/* Available attributes summarizing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="lookup-summary-cards">
                  <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block font-bold uppercase mb-1.5">Colores Disponibles:</span>
                    <div className="flex flex-wrap gap-2">
                      {lookupProductColors.map((c) => (
                        <span key={c.id} className="inline-flex items-center gap-1.5 bg-white border border-stone-200 text-stone-700 text-[10px] py-1 px-2.5 rounded-full shadow-2xs">
                          <span className="w-2.5 h-2.5 rounded-full border border-stone-200" style={{ backgroundColor: c.hex }} />
                          <span className="font-semibold">{c.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block font-bold uppercase mb-1.5">Tallas Oficiales del Modelo:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {lookupProductSizes.map((sz) => (
                        <span key={sz} className="bg-white border border-stone-200 text-stone-800 font-mono text-[10px] py-1 px-2.5 rounded-lg font-bold shadow-2xs">
                          {sz}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stock Details matrix breakdown */}
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs" id="lookup-model-matrix">
                  <h4 className="text-xs font-bold text-stone-800 mb-3">Detalle de Existencias de Modelos por Color y Talla:</h4>
                  <div className="overflow-x-auto border border-stone-100 rounded-xl">
                    <table className="w-full text-left text-xs text-stone-700">
                      <thead>
                        <tr className="bg-stone-50/75 border-b border-stone-150 text-[9px] text-stone-500 font-bold uppercase">
                          <th className="py-2.5 px-3">Color</th>
                          <th className="py-2.5 px-3 font-mono">Talla</th>
                          <th className="py-2.5 px-3 text-center">Existencias</th>
                          <th className="py-2.5 px-3 text-center">Stock Mín/Máx</th>
                          <th className="py-2.5 px-3 text-right">Estatus Almacén</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {lookupProductColors.flatMap((c) =>
                          lookupProductSizes.map((sz) => {
                            const exactStock = lookupProductStock.find(
                              (item) => item.colorId === c.id && item.sizeValue === sz
                            );
                            
                            const quantityVal = exactStock ? exactStock.quantity : 0;
                            const hasItem = !!exactStock;
                            
                            let alertBadge = (
                              <span className="text-[9px] text-stone-400 bg-stone-50 border border-stone-200 py-0.5 px-2 rounded-md font-medium">
                                Sin inventario físico
                              </span>
                            );

                            if (hasItem) {
                              const status = getStockStatus(exactStock);
                              alertBadge = (
                                <span className={`text-[9px] font-bold py-0.5 px-2 border rounded-md ${status.badgeClass}`}>
                                  {status.label}
                                </span>
                              );
                            }

                            return (
                              <tr key={`${c.id}-${sz}`} className="hover:bg-stone-50/30">
                                <td className="py-2 px-3 flex items-center gap-1.5 font-semibold text-stone-800">
                                  <span className="w-2.5 h-2.5 rounded-full border border-stone-200 shadow-2xs" style={{ backgroundColor: c.hex }} />
                                  <span>{c.name}</span>
                                </td>
                                <td className="py-2 px-3 font-mono text-amber-700 font-bold">{sz}</td>
                                <td className="py-2 px-3 text-center font-mono font-bold text-stone-900">
                                  {quantityVal} pzas
                                </td>
                                <td className="py-2 px-3 text-center text-stone-500 text-[10px] font-mono">
                                  {hasItem ? `${exactStock.stockMin} / ${exactStock.stockMax}` : 'N/A'}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {alertBadge}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : lookupType === 'color' && lookupColor ? (
              <div className="space-y-4" id="lookup-color-results">
                {/* Summarize Models that have this color */}
                <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 block font-bold uppercase mb-2">Modelos (Calzado) que usan el color "{lookupColor.name}":</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3" id="lookup-color-models-list">
                    {lookupColorProducts.length === 0 ? (
                      <p className="text-xs text-stone-500 col-span-full">Ningún calzado cuenta actualmente con este color.</p>
                    ) : (
                      lookupColorProducts.map((p) => (
                        <div key={p.id} className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-stone-200 shadow-2xs">
                          <img
                            src={p.imageUrl}
                            className="w-10 h-10 object-cover rounded border border-stone-150"
                            alt={p.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60';
                            }}
                          />
                          <div className="min-w-0">
                            <span className="font-mono text-[9px] text-amber-700 font-bold block">Mod: {p.code}</span>
                            <span className="text-xs font-bold text-stone-900 truncate block">{p.name}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Sizes available in this color */}
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs" id="lookup-color-matrix">
                  <h4 className="text-xs font-bold text-stone-800 mb-3">Detalle de Existencias de Modelos que tienen color "{lookupColor.name}":</h4>
                  <div className="overflow-x-auto border border-stone-100 rounded-xl">
                    <table className="w-full text-left text-xs text-stone-700">
                      <thead>
                        <tr className="bg-stone-50/75 border-b border-stone-150 text-[9px] text-stone-500 font-bold uppercase">
                          <th className="py-2.5 px-3">Modelo Calzado</th>
                          <th className="py-2.5 px-3 font-mono">Talla</th>
                          <th className="py-2.5 px-3 text-center">Existencias</th>
                          <th className="py-2.5 px-3 text-center">Stock Mín/Máx</th>
                          <th className="py-2.5 px-3 text-right">Estatus Almacén</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {lookupColorProducts.flatMap((p) =>
                          p.sizes.map((sz) => {
                            const exactStock = lookupColorStock.find(
                              (item) => item.productId === p.id && item.sizeValue === sz
                            );

                            const quantityVal = exactStock ? exactStock.quantity : 0;
                            const hasItem = !!exactStock;

                            let alertBadge = (
                              <span className="text-[9px] text-stone-400 bg-stone-50 border border-stone-200 py-0.5 px-2 rounded-md font-medium">
                                Sin inventario físico
                              </span>
                            );

                            if (hasItem) {
                              const status = getStockStatus(exactStock);
                              alertBadge = (
                                <span className={`text-[9px] font-bold py-0.5 px-2 border rounded-md ${status.badgeClass}`}>
                                  {status.label}
                                </span>
                              );
                            }

                            return (
                              <tr key={`${p.id}-${sz}`} className="hover:bg-stone-50/30">
                                <td className="py-2 px-3 text-stone-800 font-medium">
                                  <span className="font-mono text-[10px] bg-stone-100 border border-stone-200 text-stone-600 px-1.5 py-0.5 rounded mr-2 font-bold">
                                    {p.code}
                                  </span>
                                  <span>{p.name} ({p.gender})</span>
                                </td>
                                <td className="py-2 px-3 font-mono text-amber-700 font-bold">{sz}</td>
                                <td className="py-2 px-3 text-center font-mono font-bold text-stone-900">
                                  {quantityVal} pzas
                                </td>
                                <td className="py-2 px-3 text-center text-stone-500 text-[10px] font-mono">
                                  {hasItem ? `${exactStock.stockMin} / ${exactStock.stockMax}` : 'N/A'}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {alertBadge}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      )}


      {/* 2. GLOBAL STOCK LISTING AND MANAGEMENT */}
      {activeWarehouseSubTab === 'inventory' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm" id="stock-list-panel">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6" id="stock-header-actions">
          <div>
            <h2 className="text-xl font-display font-bold text-stone-900 tracking-tight">Módulo Inventario de Almacén</h2>
            <p className="text-stone-500 text-xs mt-1">
              Registro físico detallado por combinación de modelo de calzado, color y talla con alertas de mínimos/máximos.
            </p>
          </div>

          {!isReadOnly && (
            <button
              id="add-stock-btn"
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-all self-start sm:self-auto active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Entrada / Stock</span>
            </button>
          )}
        </div>

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-2" id="stock-success-banner">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* SEARCH AND EXTENDED FILTERS BAR */}
        <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-150 space-y-4 mb-6" id="stock-filters-panel">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Search inputs */}
            <div className="relative sm:col-span-1">
              <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">Buscar por texto</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-stone-400" />
                </div>
                <input
                  id="stock-search-input"
                  type="text"
                  placeholder="Modelo, color..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-8 pr-2.5 py-1.5 border border-stone-200 rounded-lg text-xs bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">Filtrar por Marca</label>
              <select
                id="stock-filter-brand"
                value={filterBrandId}
                onChange={(e) => setFilterBrandId(e.target.value)}
                className="block w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/10 transition-all text-stone-700"
              >
                <option value="">Todas las marcas</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">Filtrar por Género</label>
              <select
                id="stock-filter-gender"
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="block w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/10 transition-all text-stone-700"
              >
                <option value="">Ambos géneros</option>
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
              </select>
            </div>

            {/* Product Filter */}
            <div>
              <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">Filtrar por Calzado</label>
              <select
                id="stock-filter-product"
                value={filterProductId}
                onChange={(e) => setFilterProductId(e.target.value)}
                className="block w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/10 transition-all text-stone-700"
              >
                <option value="">Todos los modelos</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-stone-200/50" id="filter-panel-footer">
            <span className="text-[10px] text-stone-400 font-mono">
              Registros filtrados: {filteredStockList.length} de {stock.length} combinaciones
            </span>
            <button
              id="reset-stock-filters-btn"
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[10px] font-bold text-stone-600 hover:text-stone-900 transition-all"
            >
              <RefreshCcw className="w-3 h-3" />
              <span>Limpiar Filtros</span>
            </button>
          </div>
        </div>

        {/* INVENTORY TABLE - HIGHLIGHTING STOCK, MIN AND MAX AS DIRECTLY REQUESTED */}
        <div className="overflow-x-auto border border-stone-100 rounded-xl" id="stock-table-wrapper">
          <table className="w-full text-left border-collapse" id="stock-table">
            <thead>
              <tr className="bg-stone-50/75 border-b border-stone-100 text-stone-500 text-[10px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Calzado / Modelo</th>
                <th className="py-3 px-4">Color</th>
                <th className="py-3 px-4 font-mono">Talla</th>
                <th className="py-3 px-4 text-center bg-stone-100/50">Existencia Física (Lote)</th>
                <th className="py-3 px-4 text-center">Stock Mínimo</th>
                <th className="py-3 px-4 text-center">Stock Máximo</th>
                <th className="py-3 px-4">Estatus</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {filteredStockList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400 font-mono text-xs">
                    No se encontraron combinaciones de stock registradas para los filtros activos.
                  </td>
                </tr>
              ) : (
                filteredStockList.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  const brand = product ? brands.find((b) => b.id === product.brandId)?.name : '';
                  const category = product ? categories.find((c) => c.id === product.categoryId)?.name : '';
                  const color = colors.find((c) => c.id === item.colorId);
                  const status = getStockStatus(item);

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/30 transition-colors" id={`stock-item-row-${item.id}`}>
                      {/* Product details */}
                      <td className="py-3.5 px-4">
                        {product ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-8 h-8 rounded object-cover shrink-0 border border-stone-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60';
                              }}
                            />
                            <div className="min-w-0">
                              <span className="font-mono text-[9px] bg-stone-100 text-stone-500 py-0.5 px-1 rounded block w-max font-bold mb-0.5">
                                MOD: {product.code}
                              </span>
                              <span className="font-semibold text-stone-900 truncate block text-[11px]">{product.name}</span>
                              <span className="text-[9px] text-stone-400 block">{brand} • {category} ({product.gender})</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">Desconocido</span>
                        )}
                      </td>

                      {/* Color details */}
                      <td className="py-3.5 px-4">
                        {color ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full border border-stone-300 shadow-2xs shrink-0" style={{ backgroundColor: color.hex }} />
                            <span className="font-medium text-stone-900">{color.name}</span>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">Desconocido</span>
                        )}
                      </td>

                      {/* Size details */}
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-600 text-sm">
                        {item.sizeValue}
                      </td>

                      {/* Quantity - EXTREMELY REINFORCED */}
                      <td className="py-3.5 px-4 text-center bg-stone-100/30 font-mono">
                        <span className={`text-sm font-bold block ${
                          item.quantity < item.stockMin ? 'text-rose-600 font-extrabold' : 'text-stone-900'
                        }`}>
                          {item.quantity}
                        </span>
                        <span className="text-[9px] text-stone-400 block uppercase">unidades</span>
                      </td>

                      {/* Stock limits */}
                      <td className="py-3.5 px-4 text-center font-mono text-stone-500">
                        {item.stockMin}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-stone-500">
                        {item.stockMax}
                      </td>

                      {/* Warning badges */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold py-1 px-2.5 border rounded-full uppercase ${status.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                          <span>{status.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isReadOnly && (
                            <button
                              id={`edit-stock-${item.id}`}
                              onClick={() => handleEdit(item)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
                              title="Editar existencias"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            id={`delete-stock-${item.id}`}
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            title="Eliminar partida"
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
      </div>
      )}

      {/* STOCK REGISTER / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="stock-form-modal">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-100 flex flex-col gap-5 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100" id="stock-modal-header">
              <h3 className="text-base font-display font-bold text-stone-900">
                {editingStockItem ? 'Editar Existencias de Almacén' : 'Registrar Entrada de Stock'}
              </h3>
              <button
                id="close-stock-modal"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2" id="stock-modal-error">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" id="stock-form">
              {/* Product Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Selecciona el Modelo de Calzado*
                </label>
                <select
                  id="s-form-product"
                  value={formProductId}
                  onChange={(e) => handleFormProductChange(e.target.value)}
                  disabled={!!editingStockItem}
                  className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                >
                  <option value="">Seleccione un calzado...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] - {p.name} ({p.gender})
                    </option>
                  ))}
                </select>
              </div>

              {/* Color & Size Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Color*
                  </label>
                  <select
                    id="s-form-color"
                    value={formColorId}
                    onChange={(e) => setFormColorId(e.target.value)}
                    disabled={!!editingStockItem}
                    className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  >
                    <option value="">Selecciona color...</option>
                    {formAvailableColors.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Talla*
                  </label>
                  <select
                    id="s-form-size"
                    value={formSizeValue}
                    onChange={(e) => setFormSizeValue(parseFloat(e.target.value))}
                    disabled={!!editingStockItem}
                    className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50/50 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                  >
                    {formAvailableSizes.map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stock Numbers - RECALC AND EMPHASIZE LIMITS */}
              <div className="p-4 border border-stone-150 rounded-xl bg-stone-50/50 space-y-3" id="stock-numbers-fields">
                <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Configuración de Existencias y Límites</span>
                
                <div>
                  <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Existencias Actuales (Cantidad en Almacén)*
                  </label>
                  <input
                    id="s-form-qty"
                    type="number"
                    min="0"
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    placeholder="ej. 15"
                    className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Stock Mínimo*
                    </label>
                    <input
                      id="s-form-min"
                      type="number"
                      min="0"
                      required
                      value={formStockMin}
                      onChange={(e) => setFormStockMin(e.target.value)}
                      placeholder="ej. 5"
                      className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Stock Máximo*
                    </label>
                    <input
                      id="s-form-max"
                      type="number"
                      min="1"
                      required
                      value={formStockMax}
                      onChange={(e) => setFormStockMax(e.target.value)}
                      placeholder="ej. 30"
                      className="block w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2" id="stock-modal-footer">
                <button
                  id="cancel-stock-form"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  id="submit-stock-form"
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all active:scale-95"
                >
                  {editingStockItem ? 'Actualizar Existencias' : 'Registrar Existencias'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
