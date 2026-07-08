/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'Gerente' | 'Administrador' | 'Empleado';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  email: string;
  password?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  verificationCode?: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  status: 'Activo' | 'Inactivo';
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Color {
  id: string;
  name: string;
  hex: string;
}

export interface Size {
  id: string;
  value: number; // e.g. 22, 22.5, 23...
  gender: 'Dama' | 'Caballero';
}

export interface Product {
  id: string;
  code: string; // 5-digit string, required & unique
  gender: 'Hombre' | 'Mujer';
  categoryId: string;
  brandId: string;
  name: string; // unique for same brand + category, 10 to 50 chars
  colors: string[]; // List of color IDs
  sizes: number[]; // List of size values
  description: string; // 20 to 150 chars
  price: number; // 300 to 5000
  imageUrl: string;
}

export interface StockItem {
  id: string;
  productId: string;
  colorId: string;
  sizeValue: number;
  quantity: number; // Existencias
  stockMin: number;
  stockMax: number;
}
