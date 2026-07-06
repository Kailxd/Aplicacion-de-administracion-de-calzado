/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Brand, Category, Color, Size, Product, StockItem, User } from './types';

export const INITIAL_BRANDS: Brand[] = [
  { id: 'b-1', name: 'Nike', description: 'Marca líder mundial en calzado deportivo, innovación y rendimiento de alto nivel.', status: 'Activo' },
  { id: 'b-2', name: 'Adidas', description: 'Calzado icónico de alto rendimiento y estilo de vida con suela Boost y tecnología avanzada.', status: 'Activo' },
  { id: 'b-3', name: 'Puma', description: 'Diseños dinámicos que fusionan el deporte, la velocidad y las tendencias de moda urbana.', status: 'Activo' },
  { id: 'b-4', name: 'Under Armour', description: 'Calzado diseñado para atletas que buscan máxima amortiguación y retorno de energía.', status: 'Activo' },
  { id: 'b-5', name: 'Reebok', description: 'Herencia clásica del fitness y el calzado retro urbano de alta durabilidad.', status: 'Activo' }
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'c-1', name: 'Tenis Deportivo', description: 'Calzado ligero y acolchado diseñado específicamente para correr, entrenar o realizar actividades atléticas.' },
  { id: 'c-2', name: 'Botas', description: 'Calzado de caña media o alta, ideal para climas fríos, senderismo o un estilo urbano robusto.' },
  { id: 'c-3', name: 'Sandalias', description: 'Calzado abierto de verano, diseñado para descanso, playa, alberca o comodidad diaria.' },
  { id: 'c-4', name: 'Mocasines', description: 'Zapatos clásicos sin agujetas, elegantes y sumamente cómodos para un look casual de vestir.' },
  { id: 'c-5', name: 'Zapatillas', description: 'Calzado formal de tacón para dama, ideal para eventos de gala, oficina o etiqueta.' },
  { id: 'c-6', name: 'Calzado Formal', description: 'Zapatos clásicos de vestir con agujetas o hebillas, elaborados en piel o gamuza de alta calidad.' },
  { id: 'c-7', name: 'Pantuflas', description: 'Calzado ultra suave y abrigador diseñado exclusivamente para descanso dentro del hogar.' },
  { id: 'c-8', name: 'Tenis Skate', description: 'Calzado plano y de suela vulcanizada reforzada para soportar el desgaste de la patineta y el uso rudo.' }
];

export const INITIAL_COLORS: Color[] = [
  { id: 'col-1', name: 'Negro', hex: '#000000' },
  { id: 'col-2', name: 'Blanco', hex: '#FFFFFF' },
  { id: 'col-3', name: 'Azul Marino', hex: '#1E3A8A' },
  { id: 'col-4', name: 'Rojo', hex: '#EF4444' },
  { id: 'col-5', name: 'Gris', hex: '#6B7280' },
  { id: 'col-6', name: 'Rosa Pastel', hex: '#FBCFE8' }
];

export const INITIAL_SIZES: Size[] = [
  // For standard sizing representation
  { id: 's-22', value: 22, gender: 'Dama' },
  { id: 's-22.5', value: 22.5, gender: 'Dama' },
  { id: 's-23', value: 23, gender: 'Dama' },
  { id: 's-23.5', value: 23.5, gender: 'Dama' },
  { id: 's-24', value: 24, gender: 'Dama' },
  { id: 's-24.5', value: 24.5, gender: 'Dama' },
  { id: 's-25', value: 25, gender: 'Unisex' },
  { id: 's-25.5', value: 25.5, gender: 'Unisex' },
  { id: 's-26', value: 26, gender: 'Unisex' },
  { id: 's-26.5', value: 26.5, gender: 'Caballero' },
  { id: 's-27', value: 27, gender: 'Caballero' },
  { id: 's-27.5', value: 27.5, gender: 'Caballero' },
  { id: 's-28', value: 28, gender: 'Caballero' },
  { id: 's-28.5', value: 28.5, gender: 'Caballero' },
  { id: 's-29', value: 29, gender: 'Caballero' },
  { id: 's-29.5', value: 29.5, gender: 'Caballero' },
  { id: 's-30', value: 30, gender: 'Caballero' }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p-1',
    code: '10024',
    gender: 'Hombre',
    categoryId: 'c-1', // Tenis Deportivo
    brandId: 'b-1', // Nike
    name: 'Air Max Invigor Run',
    colors: ['col-1', 'col-2', 'col-3'],
    sizes: [25, 25.5, 26, 26.5, 27, 27.5, 28],
    description: 'Tenis de correr de alto rendimiento con amortiguación de aire premium.',
    price: 1899.00,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'p-2',
    code: '20150',
    gender: 'Hombre',
    categoryId: 'c-1', // Tenis Deportivo
    brandId: 'b-2', // Adidas
    name: 'Ultraboost Comfort',
    colors: ['col-1', 'col-2', 'col-5'],
    sizes: [26, 26.5, 27, 27.5, 28, 28.5, 29],
    description: 'Calzado deportivo premium con suela boost para máxima comodidad diaria.',
    price: 2499.00,
    imageUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'p-3',
    code: '30521',
    gender: 'Mujer',
    categoryId: 'c-5', // Zapatillas
    brandId: 'b-5', // Reebok
    name: 'Zapatillas Elegance Night',
    colors: ['col-1', 'col-4', 'col-6'],
    sizes: [22, 22.5, 23, 23.5, 24, 24.5, 25],
    description: 'Zapatillas de tacón elegante y cómodo para eventos formales y cenas.',
    price: 1250.00,
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'p-4',
    code: '40810',
    gender: 'Hombre',
    categoryId: 'c-2', // Botas
    brandId: 'b-3', // Puma
    name: 'Botas Timber Adventure',
    colors: ['col-1', 'col-3', 'col-5'],
    sizes: [25, 26, 27, 28, 29],
    description: 'Botas resistentes e impermeables listas para terrenos difíciles y caminatas.',
    price: 2199.00,
    imageUrl: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'p-5',
    code: '50233',
    gender: 'Mujer',
    categoryId: 'c-3', // Sandalias
    brandId: 'b-2', // Adidas
    name: 'Sandalia Soft Cloud',
    colors: ['col-2', 'col-6'],
    sizes: [22, 23, 24, 25, 26],
    description: 'Sandalias ultra suaves para descanso e hidratación post-entrenamiento.',
    price: 599.00,
    imageUrl: 'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'p-6',
    code: '60124',
    gender: 'Hombre',
    categoryId: 'c-6', // Calzado Formal
    brandId: 'b-3', // Puma
    name: 'Oxford de Piel Elegante',
    colors: ['col-1', 'col-5'],
    sizes: [25, 26, 27, 28, 29],
    description: 'Zapatos Oxford clásicos elaborados con fina piel genuina para eventos de gala.',
    price: 1999.00,
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'p-7',
    code: '70251',
    gender: 'Mujer',
    categoryId: 'c-7', // Pantuflas
    brandId: 'b-2', // Adidas
    name: 'Pantuflas Ultra Soft Home',
    colors: ['col-5', 'col-6'],
    sizes: [22, 23, 24, 25, 26],
    description: 'Pantuflas sumamente abrigadoras con felpa interior de alta densidad.',
    price: 499.00,
    imageUrl: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'p-8',
    code: '80920',
    gender: 'Hombre',
    categoryId: 'c-8', // Tenis Skate
    brandId: 'b-1', // Nike
    name: 'Tenis Skate Pro Rider',
    colors: ['col-1', 'col-2', 'col-4'],
    sizes: [24, 25, 26, 27, 28, 29, 30],
    description: 'Tenis de skate con plantilla amortiguadora reforzada y suela de alta adherencia.',
    price: 1499.00,
    imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&auto=format&fit=crop&q=60'
  }
];

export const INITIAL_STOCK: StockItem[] = [
  // Air Max Invigor Run (p-1)
  { id: 'st-1', productId: 'p-1', colorId: 'col-1', sizeValue: 26, quantity: 12, stockMin: 5, stockMax: 30 },
  { id: 'st-2', productId: 'p-1', colorId: 'col-1', sizeValue: 27, quantity: 4, stockMin: 5, stockMax: 30 }, // Alert: Below stockMin!
  { id: 'st-3', productId: 'p-1', colorId: 'col-2', sizeValue: 25.5, quantity: 28, stockMin: 5, stockMax: 30 },
  { id: 'st-4', productId: 'p-1', colorId: 'col-2', sizeValue: 26.5, quantity: 35, stockMin: 5, stockMax: 30 }, // Alert: Above stockMax!
  { id: 'st-5', productId: 'p-1', colorId: 'col-3', sizeValue: 27, quantity: 15, stockMin: 5, stockMax: 30 },

  // Ultraboost Comfort (p-2)
  { id: 'st-6', productId: 'p-2', colorId: 'col-1', sizeValue: 27, quantity: 18, stockMin: 4, stockMax: 25 },
  { id: 'st-7', productId: 'p-2', colorId: 'col-1', sizeValue: 28, quantity: 2, stockMin: 4, stockMax: 25 }, // Below min
  { id: 'st-8', productId: 'p-2', colorId: 'col-5', sizeValue: 26.5, quantity: 10, stockMin: 4, stockMax: 25 },

  // Zapatillas Elegance Night (p-3)
  { id: 'st-9', productId: 'p-3', colorId: 'col-1', sizeValue: 23, quantity: 14, stockMin: 3, stockMax: 20 },
  { id: 'st-10', productId: 'p-3', colorId: 'col-4', sizeValue: 24, quantity: 1, stockMin: 3, stockMax: 20 }, // Below min
  { id: 'st-11', productId: 'p-3', colorId: 'col-6', sizeValue: 23.5, quantity: 22, stockMin: 3, stockMax: 20 }, // Above max

  // Botas Timber Adventure (p-4)
  { id: 'st-12', productId: 'p-4', colorId: 'col-3', sizeValue: 28, quantity: 8, stockMin: 2, stockMax: 15 },
  { id: 'st-13', productId: 'p-4', colorId: 'col-5', sizeValue: 27, quantity: 15, stockMin: 2, stockMax: 15 },

  // Sandalia Soft Cloud (p-5)
  { id: 'st-14', productId: 'p-5', colorId: 'col-6', sizeValue: 24, quantity: 20, stockMin: 5, stockMax: 20 },

  // Oxford de Piel Elegante (p-6)
  { id: 'st-15', productId: 'p-6', colorId: 'col-1', sizeValue: 27, quantity: 10, stockMin: 3, stockMax: 20 },
  { id: 'st-16', productId: 'p-6', colorId: 'col-5', sizeValue: 28, quantity: 12, stockMin: 3, stockMax: 20 },

  // Pantuflas Ultra Soft Home (p-7)
  { id: 'st-17', productId: 'p-7', colorId: 'col-6', sizeValue: 23, quantity: 15, stockMin: 5, stockMax: 25 },
  { id: 'st-18', productId: 'p-7', colorId: 'col-5', sizeValue: 24, quantity: 8, stockMin: 5, stockMax: 25 },

  // Tenis Skate Pro Rider (p-8)
  { id: 'st-19', productId: 'p-8', colorId: 'col-1', sizeValue: 26, quantity: 18, stockMin: 4, stockMax: 30 },
  { id: 'st-20', productId: 'p-8', colorId: 'col-2', sizeValue: 27, quantity: 25, stockMin: 4, stockMax: 30 },
  { id: 'st-21', productId: 'p-8', colorId: 'col-4', sizeValue: 28, quantity: 3, stockMin: 4, stockMax: 30 } // Below min
];

export const INITIAL_USERS: User[] = [
  {
    id: 'u-1',
    username: 'gerente',
    name: 'Sofía Martínez',
    role: 'Gerente',
    email: 'sofia.martinez@calzadodist.com',
    password: 'Gerente#2026'
  },
  {
    id: 'u-2',
    username: 'admin',
    name: 'Carlos López',
    role: 'Administrador',
    email: 'carlos.lopez@calzadodist.com',
    password: 'Admin#2026'
  },
  {
    id: 'u-3',
    username: 'empleado',
    name: 'Luis Hernández',
    role: 'Empleado',
    email: 'luis.hernandez@calzadodist.com',
    password: 'Empleado#2026'
  }
];
