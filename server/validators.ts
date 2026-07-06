import { Product } from '../src/types.js';
import * as db from './db.js';

export interface ValidationError {
  field: string;
  message: string;
}

export async function validateProductData(
  p: Omit<Product, 'id'>,
  productIdToIgnore?: string
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // 1. Modelo del producto (code): 5-digit integer, mandatory and unique
  if (!p.code || !p.code.trim()) {
    errors.push({ field: 'code', message: 'El modelo del producto es obligatorio.' });
  } else if (!/^\d{5}$/.exec(p.code.trim())) {
    errors.push({ field: 'code', message: 'El modelo del producto debe ser un número entero de exactamente 5 dígitos (ej. 10024).' });
  } else {
    const existingProducts = await db.getProducts();
    const duplicateCode = existingProducts.find(
      prod => prod.code === p.code.trim() && prod.id !== productIdToIgnore
    );
    if (duplicateCode) {
      errors.push({ field: 'code', message: `El modelo ${p.code} ya se encuentra registrado en la base de datos.` });
    }
  }

  // 2. Género: Mandatory. Only 'Hombre' or 'Mujer'
  if (!p.gender || (p.gender !== 'Hombre' && p.gender !== 'Mujer')) {
    errors.push({ field: 'gender', message: 'El género es obligatorio y solo permite "Hombre" o "Mujer".' });
  }

  // 3. Categoría: Mandatory, must exist in DB
  if (!p.categoryId) {
    errors.push({ field: 'categoryId', message: 'La categoría es obligatoria.' });
  } else {
    const categories = await db.getCategories();
    if (!categories.some(c => c.id === p.categoryId)) {
      errors.push({ field: 'categoryId', message: 'La categoría seleccionada no existe en el sistema.' });
    }
  }

  // 4. Marca: Mandatory, must exist in DB
  if (!p.brandId) {
    errors.push({ field: 'brandId', message: 'La marca es obligatoria.' });
  } else {
    const brands = await db.getBrands();
    if (!brands.some(b => b.id === p.brandId)) {
      errors.push({ field: 'brandId', message: 'La marca seleccionada no existe en el sistema.' });
    }
  }

  // 5. Nombre del producto: Mandatory. Unique for same brand + category. Length 10 to 50 chars
  const trimmedName = p.name ? p.name.trim() : '';
  if (!trimmedName) {
    errors.push({ field: 'name', message: 'El nombre del producto es obligatorio.' });
  } else if (trimmedName.length < 10 || trimmedName.length > 50) {
    errors.push({ field: 'name', message: 'El nombre del producto debe tener entre 10 y 50 caracteres.' });
  } else if (p.brandId && p.categoryId) {
    const existingProducts = await db.getProducts();
    const duplicateName = existingProducts.find(
      prod =>
        prod.brandId === p.brandId &&
        prod.categoryId === p.categoryId &&
        prod.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        prod.id !== productIdToIgnore
    );
    if (duplicateName) {
      errors.push({
        field: 'name',
        message: 'Ya existe un producto con el mismo nombre para la misma marca y categoría.'
      });
    }
  }

  // 6. Color: Mandatory selection, registered in system
  if (!p.colors || !Array.isArray(p.colors) || p.colors.length === 0) {
    errors.push({ field: 'colors', message: 'Debe seleccionar al menos un color registrado en el sistema.' });
  } else {
    const allColors = await db.getColors();
    const invalidColor = p.colors.find(colId => !allColors.some(c => c.id === colId));
    if (invalidColor) {
      errors.push({ field: 'colors', message: 'Uno o más colores seleccionados no están registrados en el sistema.' });
    }
  }

  // 7. Talla: Mandatory selection. 22 to 26 for Mujer, 23 to 30 for Hombre
  if (!p.sizes || !Array.isArray(p.sizes) || p.sizes.length === 0) {
    errors.push({ field: 'sizes', message: 'Debe seleccionar al menos una talla disponible.' });
  } else {
    const minSize = p.gender === 'Mujer' ? 22 : 23;
    const maxSize = p.gender === 'Mujer' ? 26 : 30;

    for (const sz of p.sizes) {
      const szNum = Number(sz);
      if (isNaN(szNum) || szNum < minSize || szNum > maxSize) {
        errors.push({
          field: 'sizes',
          message: `La talla ${sz} está fuera del rango permitido para ${p.gender} (${minSize} a ${maxSize}).`
        });
        break;
      }
    }
  }

  // 8. Descripción del producto: Mandatory. Length 20 to 150 chars
  const trimmedDesc = p.description ? p.description.trim() : '';
  if (!trimmedDesc) {
    errors.push({ field: 'description', message: 'La descripción del producto es obligatoria.' });
  } else if (trimmedDesc.length < 20 || trimmedDesc.length > 150) {
    errors.push({ field: 'description', message: 'La descripción del producto debe contener entre 20 y 150 caracteres.' });
  }

  // 9. Precio: Mandatory. Numeric value > 300.00 and <= 5000.00, max 2 decimals
  if (p.price === undefined || p.price === null || isNaN(Number(p.price))) {
    errors.push({ field: 'price', message: 'El precio del producto es obligatorio.' });
  } else {
    const priceNum = Number(p.price);
    if (priceNum <= 300.00 || priceNum > 5000.00) {
      errors.push({ field: 'price', message: 'El precio debe ser mayor a $300.00 y menor o igual a $5,000.00.' });
    } else {
      const decimals = (priceNum.toString().split('.')[1] || '').length;
      if (decimals > 2) {
        errors.push({ field: 'price', message: 'El precio solo puede incluir hasta dos decimales.' });
      }
    }
  }

  // 10. Imagen del producto: Mandatory. Format JPG, JPEG or PNG. Max 5MB (validated via URL/file)
  if (!p.imageUrl || !p.imageUrl.trim()) {
    errors.push({ field: 'imageUrl', message: 'La fotografía del producto es obligatoria.' });
  } else if (
    !p.imageUrl.startsWith('/uploads/') &&
    !p.imageUrl.startsWith('data:image/') &&
    !/\.(jpg|jpeg|png)($|\?)/i.test(p.imageUrl)
  ) {
    errors.push({ field: 'imageUrl', message: 'Solo se aceptan fotografías en formato JPG, JPEG o PNG.' });
  }

  return errors;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return 'La contraseña es obligatoria.';
  }
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra mayúscula (A-Z).';
  }
  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra minúscula (a-z).';
  }
  if (!/\d/.test(password)) {
    return 'La contraseña debe incluir al menos un número (0-9).';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/]/.test(password)) {
    return 'La contraseña debe incluir al menos un carácter especial (ej. !@#$%^&*).';
  }
  return null;
}
