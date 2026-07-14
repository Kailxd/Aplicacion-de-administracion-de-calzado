/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Brand, Category, Color, Size, Product, StockItem, User, Role } from './types';
import { api } from './api';

// Component imports
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import BrandCrud from './components/BrandCrud';
import CategoryCrud from './components/CategoryCrud';
import ColorCrud from './components/ColorCrud';
import SizeCrud from './components/SizeCrud';
import ProductCrud from './components/ProductCrud';
import WarehouseModule from './components/WarehouseModule';
import UserCrud from './components/UserCrud';
import UserProfileModal from './components/UserProfileModal';

// Icons for the main panel
import { 
  ShieldCheck, 
  RefreshCw, 
  HelpCircle, 
  Briefcase, 
  ChevronRight, 
  AlertCircle,
  Database
} from 'lucide-react';

export default function App() {
  // Global States loaded from PostgreSQL backend API
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth & UI States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('almacen'); // Default main view: Warehouse
  const [resetNotification, setResetNotification] = useState('');

  // Fetch all initial data from PostgreSQL Backend
  const refreshAllData = async () => {
    try {
      setLoading(true);
      const [b, c, col, s, p, st, u] = await Promise.all([
        api.getBrands(),
        api.getCategories(),
        api.getColors(),
        api.getSizes(),
        api.getProducts(),
        api.getStock(),
        api.getUsers()
      ]);
      setBrands(b);
      setCategories(c);
      setColors(col);
      setSizes(s);
      setProducts(p);
      setStock(st);
      setUsers(u);
    } catch (err) {
      console.error('Error al cargar datos desde el backend PostgreSQL:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();

    const localCurrentUser = sessionStorage.getItem('sdc_current_user');
    if (localCurrentUser) {
      try {
        const parsedUser = JSON.parse(localCurrentUser);
        setCurrentUser(parsedUser);
        if (parsedUser.role === 'Administrador') {
          setCurrentView('usuarios');
        } else {
          setCurrentView('almacen');
        }
      } catch (e) {
        sessionStorage.removeItem('sdc_current_user');
      }
    }
  }, []);

  // Reset database to initial test dataset
  const handleResetDatabase = async () => {
    if (window.confirm('¿Estás seguro de que deseas restablecer la base de datos PostgreSQL a sus valores iniciales de prueba?')) {
      try {
        await api.resetDatabase();
        await refreshAllData();
        setResetNotification('Base de datos restablecida con éxito.');
        setTimeout(() => setResetNotification(''), 4000);
      } catch (err: any) {
        alert(err.message || 'Error al restablecer la base de datos.');
      }
    }
  };

  // Session handling
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('sdc_current_user', JSON.stringify(user));
    if (user.role === 'Administrador') {
      setCurrentView('usuarios');
    } else {
      setCurrentView('almacen');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('sdc_current_user');
  };

  // --- CRUD Handlers Async PostgreSQL ---

  // Brand CRUD handlers
  const handleAddBrand = async (name: string, description: string, status: 'Activo' | 'Inactivo') => {
    try {
      await api.createBrand(name, description, status);
      const updatedBrands = await api.getBrands();
      setBrands(updatedBrands);
    } catch (err: any) {
      alert(err.message || 'Error al crear marca');
    }
  };

  const handleEditBrand = async (id: string, name: string, description: string, status: 'Activo' | 'Inactivo') => {
    try {
      await api.updateBrand(id, name, description, status);
      const updatedBrands = await api.getBrands();
      setBrands(updatedBrands);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar marca');
    }
  };

  const handleDeleteBrand = async (id: string) => {
    try {
      await api.deleteBrand(id);
      const updatedBrands = await api.getBrands();
      setBrands(updatedBrands);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar marca');
    }
  };

  // Category CRUD handlers
  const handleAddCategory = async (name: string, description: string) => {
    try {
      await api.createCategory(name, description);
      const updatedCats = await api.getCategories();
      setCategories(updatedCats);
    } catch (err: any) {
      alert(err.message || 'Error al crear categoría');
    }
  };

  const handleEditCategory = async (id: string, name: string, description: string) => {
    try {
      await api.updateCategory(id, name, description);
      const updatedCats = await api.getCategories();
      setCategories(updatedCats);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar categoría');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await api.deleteCategory(id);
      const updatedCats = await api.getCategories();
      setCategories(updatedCats);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar categoría');
    }
  };

  // Color CRUD handlers
  const handleAddColor = async (name: string, hex: string) => {
    try {
      await api.createColor(name, hex);
      const updatedCols = await api.getColors();
      setColors(updatedCols);
    } catch (err: any) {
      alert(err.message || 'Error al crear color');
    }
  };

  const handleEditColor = async (id: string, name: string, hex: string) => {
    try {
      await api.updateColor(id, name, hex);
      const updatedCols = await api.getColors();
      setColors(updatedCols);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar color');
    }
  };

  const handleDeleteColor = async (id: string) => {
    try {
      await api.deleteColor(id);
      const updatedCols = await api.getColors();
      setColors(updatedCols);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar color');
    }
  };

  // Size CRUD handlers
  const handleAddSize = async (value: number, gender: 'Dama' | 'Caballero' | 'Ambos') => {
    try {
      if (gender === 'Ambos') {
        await api.createSize(value, 'Dama');
        await api.createSize(value, 'Caballero');
      } else {
        await api.createSize(value, gender);
      }
      const updatedSizes = await api.getSizes();
      setSizes(updatedSizes);
    } catch (err: any) {
      alert(err.message || 'Error al crear talla');
    }
  };

  const handleEditSize = async (id: string, value: number, gender: 'Dama' | 'Caballero' | 'Ambos') => {
    try {
      if (gender === 'Ambos') {
        const existingSize = sizes.find((s) => s.id === id);
        const originalGender = existingSize ? existingSize.gender : 'Dama';
        await api.updateSize(id, value, originalGender);
        const otherGender = originalGender === 'Dama' ? 'Caballero' : 'Dama';
        await api.createSize(value, otherGender);
      } else {
        await api.updateSize(id, value, gender);
      }
      const updatedSizes = await api.getSizes();
      setSizes(updatedSizes);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar talla');
    }
  };

  const handleDeleteSize = async (id: string) => {
    try {
      await api.deleteSize(id);
      const updatedSizes = await api.getSizes();
      setSizes(updatedSizes);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar talla');
    }
  };

  // Product CRUD handlers
  const handleAddProduct = async (pPayload: Omit<Product, 'id'>) => {
    try {
      await api.createProduct(pPayload);
      const [updatedProducts, updatedStock] = await Promise.all([
        api.getProducts(),
        api.getStock()
      ]);
      setProducts(updatedProducts);
      setStock(updatedStock);
    } catch (err: any) {
      alert(err.message || 'Error al guardar producto');
    }
  };

  const handleEditProduct = async (id: string, pPayload: Omit<Product, 'id'>) => {
    try {
      await api.updateProduct(id, pPayload);
      const updatedProducts = await api.getProducts();
      setProducts(updatedProducts);
    } catch (err: any) {
      alert(err.message || 'Error al editar producto');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.deleteProduct(id);
      const [updatedProducts, updatedStock] = await Promise.all([
        api.getProducts(),
        api.getStock()
      ]);
      setProducts(updatedProducts);
      setStock(updatedStock);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar producto');
    }
  };

  // Warehouse/Stock Handlers
  const handleAddStock = async (itemPayload: Omit<StockItem, 'id'>) => {
    try {
      await api.createStock(itemPayload);
      const updatedStock = await api.getStock();
      setStock(updatedStock);
    } catch (err: any) {
      alert(err.message || 'Error al agregar existencias');
    }
  };

  const handleEditStock = async (id: string, updatedFields: Partial<StockItem>) => {
    try {
      await api.updateStock(id, updatedFields);
      const updatedStock = await api.getStock();
      setStock(updatedStock);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar existencias');
    }
  };

  const handleDeleteStock = async (id: string) => {
    try {
      await api.deleteStock(id);
      const updatedStock = await api.getStock();
      setStock(updatedStock);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar existencias');
    }
  };

  // User Management Handlers (Administrador)
  const handleAddUser = async (uName: string, fullName: string, uRole: Role, uEmail: string, uPass: string): Promise<User | undefined> => {
    try {
      const newUser = await api.createUser({ username: uName, name: fullName, role: uRole, email: uEmail, password: uPass });
      const updatedUsers = await api.getUsers();
      setUsers(updatedUsers);
      return newUser;
    } catch (err: any) {
      alert(err.message || 'Error al agregar usuario');
      return undefined;
    }
  };

  const handleEditUser = async (id: string, fullName: string, uRole: Role, uEmail: string, uPass?: string) => {
    try {
      await api.updateUser(id, { name: fullName, role: uRole, email: uEmail, password: uPass });
      const updatedUsers = await api.getUsers();
      setUsers(updatedUsers);

      if (currentUser && currentUser.id === id) {
        const updatedSelf = updatedUsers.find((u) => u.id === id);
        if (updatedSelf) {
          setCurrentUser(updatedSelf);
          sessionStorage.setItem('sdc_current_user', JSON.stringify(updatedSelf));
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error al actualizar usuario');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.deleteUser(id);
      const updatedUsers = await api.getUsers();
      setUsers(updatedUsers);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar usuario');
    }
  };

  const handleSaveProfile = async (updatedUser: User) => {
    try {
      await api.updateUser(updatedUser.id, updatedUser);
      setCurrentUser(updatedUser);
      sessionStorage.setItem('sdc_current_user', JSON.stringify(updatedUser));
      const updatedUsers = await api.getUsers();
      setUsers(updatedUsers);
    } catch (err: any) {
      alert(err.message || 'Error al guardar perfil');
    }
  };

  // --- RENDER MAIN BODY ---
  if (!currentUser) {
    return <LoginScreen users={users} onLoginSuccess={handleLoginSuccess} />;
  }

  // Active view helper
  const renderCurrentView = () => {
    // Role-based view guards to strictly restrict user accesses
    let effectiveView = currentView;
    if (currentUser.role === 'Administrador') {
      effectiveView = 'usuarios';
    } else if (currentUser.role === 'Empleado') {
      effectiveView = 'almacen';
    } else if (currentUser.role === 'Gerente' && effectiveView === 'usuarios') {
      effectiveView = 'almacen';
    }

    switch (effectiveView) {
      case 'almacen':
        return (
          <WarehouseModule
            stock={stock}
            products={products}
            brands={brands}
            categories={categories}
            colors={colors}
            sizes={sizes}
            onAddStock={handleAddStock}
            onEditStock={handleEditStock}
            onDeleteStock={handleDeleteStock}
            userRole={currentUser.role}
          />
        );
      case 'producto':
        return (
          <ProductCrud
            products={products}
            brands={brands}
            categories={categories}
            colors={colors}
            sizes={sizes}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            userRole={currentUser.role}
          />
        );
      case 'categoria':
        return (
          <CategoryCrud
            categories={categories}
            products={products}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            userRole={currentUser.role}
          />
        );
      case 'tallas':
        return (
          <SizeCrud
            sizes={sizes}
            onAddSize={handleAddSize}
            onEditSize={handleEditSize}
            onDeleteSize={handleDeleteSize}
            userRole={currentUser.role}
          />
        );
      case 'colores':
        return (
          <ColorCrud
            colors={colors}
            onAddColor={handleAddColor}
            onEditColor={handleEditColor}
            onDeleteColor={handleDeleteColor}
            userRole={currentUser.role}
          />
        );
      case 'marca':
        return (
          <BrandCrud
            brands={brands}
            products={products}
            onAddBrand={handleAddBrand}
            onEditBrand={handleEditBrand}
            onDeleteBrand={handleDeleteBrand}
            userRole={currentUser.role}
          />
        );
      case 'usuarios':
        return (
          <UserCrud
            users={users}
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            currentUser={currentUser}
          />
        );
      default:
        return <div className="p-8 font-mono text-xs">Error: Sección no encontrada.</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans bg-[#f9fafb]" id="app-root-layout">
      
      {/* 1. SMALL COMPLIANT HEADER */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* 2. HAMBURGER SLIDEOUT SIDEBAR */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentView={currentView}
        onSelectView={setCurrentView}
        userRole={currentUser.role}
      />

      {/* 3. MAIN WORKSPACE CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8" id="app-workspace">
        

        {/* Dynamic Rendered Component View */}
        <div className="animate-fade-in" id="workspace-dynamic-render">
          {renderCurrentView()}
        </div>
      </main>

      {/* 4. SIMPLE COMPLIANT FOOTER */}
      <Footer />

      {/* 5. USER PROFILE MODAL */}
      <UserProfileModal
        user={currentUser}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSaveProfile={handleSaveProfile}
      />
    </div>
  );
}
