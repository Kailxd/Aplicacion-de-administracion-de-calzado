import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import * as db from './server/db.js';
import { validateProductData, validatePassword } from './server/validators.js';
import { sendVerificationEmail } from './server/email.js';

function getNextSequentialId(ids: string[], prefix: string): string {
  let maxId = 0;
  const regex = new RegExp(`^${prefix.replace('-', '\\-')}(\\d+)$`, 'i');
  ids.forEach(id => {
    const match = id.match(regex);
    if (match) {
      const val = parseInt(match[1]);
      if (val > maxId && val < 1000000) {
        maxId = val;
      }
    }
  });
  const nextVal = maxId + 1;
  if (prefix === 'col-') {
    return `col-${nextVal.toString().padStart(2, '0')}`;
  }
  return `${prefix}${nextVal}`;
}

async function startServer() {
  try {
    await db.initDb();
  } catch (err) {
    console.error('Error during database initialization:', err);
  }

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Configure Multer for product image uploads (Max 5MB, JPG/JPEG/PNG only)
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, 'prod-' + uniqueSuffix + ext);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB maximum limit
    fileFilter: (_req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se aceptan archivos en formato JPG, JPEG o PNG.'));
      }
    }
  });

  // --- API ROUTES ---

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Image Upload Route
  app.post('/api/upload', (req, res) => {
    upload.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'El tamaño de la imagen excede el límite máximo permitido de 5 MB.' });
        }
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No se recibió ningún archivo de imagen.' });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ imageUrl });
    });
  });

  // --- ROLE SECURITY MIDDLEWARE (OPTION B) ---
  const requireRoles = (allowedRoles: string[]) => {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const userId = req.headers['x-user-id'] as string;
        const userRole = req.headers['x-user-role'] as string;

        if (!userId || !userRole) {
          return res.status(401).json({ error: 'Acceso denegado. Se requiere una sesión de usuario válida.' });
        }

        const user = await db.getUserById(userId);
        if (!user || user.role !== userRole) {
          return res.status(403).json({ error: 'Sesión inválida o credenciales de usuario modificadas.' });
        }

        if (!allowedRoles.includes(user.role)) {
          return res.status(403).json({ error: `No tienes permisos para realizar esta acción. Se requiere rol: ${allowedRoles.join(' o ')}` });
        }

        next();
      } catch (err) {
        console.error('[AUTH MIDDLEWARE ERROR]', err);
        res.status(500).json({ error: 'Error del servidor al validar los permisos.' });
      }
    };
  };

  // Auth / Login
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
    }

    const user = await db.getUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas. Por favor verifique su usuario y contraseña.' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  // Reset database
  app.post('/api/reset', requireRoles(['Administrador']), async (_req, res) => {
    try {
      await db.resetDatabase();
      res.json({ message: 'Base de datos restablecida con éxito.' });
    } catch (err) {
      res.status(500).json({ error: 'Error al restablecer la base de datos.' });
    }
  });

  // Users
  app.get('/api/users', async (_req, res) => {
    const users = await db.getUsers();
    res.json(users);
  });

  app.post('/api/users', requireRoles(['Administrador']), async (req, res) => {
    const { username, name, role, email, password } = req.body;
    if (!username || !name || !role || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios para crear un usuario.' });
    }

    const passError = validatePassword(password);
    if (passError) {
      return res.status(400).json({ error: passError });
    }

    const existing = await db.getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const users = await db.getUsers();
    const nextId = getNextSequentialId(users.map(u => u.id), 'u-');

    const newUser = {
      id: nextId,
      username,
      name,
      role,
      email,
      password,
      isVerified: false,
      verificationCode
    };
    await db.createUser(newUser);

    // Send verification email asynchronously
    sendVerificationEmail({
      toEmail: email,
      userName: name,
      code: verificationCode
    }).catch(err => console.error('[EMAIL REGISTRATION ERROR]', err));

    res.status(201).json(newUser);
  });

  app.post('/api/users/send-code', async (req, res) => {
    const { userId, email } = req.body;
    if (!userId && !email) {
      return res.status(400).json({ error: 'Se requiere ID de usuario o correo electrónico.' });
    }

    const users = await db.getUsers();
    const user = users.find(u => u.id === userId || u.email.toLowerCase() === (email || '').toLowerCase());

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado con el correo especificado.' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    await db.updateUser(user.id, { verificationCode, isVerified: false });

    console.log(`[VERIFICATION EMAIL] Enviando código ${verificationCode} a ${user.email}`);

    const emailResult = await sendVerificationEmail({
      toEmail: user.email,
      userName: user.name,
      code: verificationCode
    });

    res.json({
      success: true,
      message: emailResult.success
        ? `Código de verificación enviado a ${user.email}`
        : `Código generado (${verificationCode}). Estado del correo: ${emailResult.error}`,
      code: verificationCode,
      previewUrl: emailResult.previewUrl
    });
  });

  app.post('/api/users/verify-code', async (req, res) => {
    const { userId, email, code } = req.body;
    if (!code || (!userId && !email)) {
      return res.status(400).json({ error: 'El código de verificación y el usuario/correo son obligatorios.' });
    }

    const users = await db.getUsers();
    const user = users.find(u => u.id === userId || u.email.toLowerCase() === (email || '').toLowerCase());

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (user.verificationCode !== code.trim()) {
      return res.status(400).json({ error: 'El código de verificación ingresado es incorrecto o ha caducado.' });
    }

    const updated = await db.updateUser(user.id, {
      isVerified: true,
      verificationCode: undefined
    });

    res.json({
      success: true,
      message: '¡Correo verificado exitosamente!',
      user: updated
    });
  });

  app.put('/api/users/:id', async (req, res) => {
    const requesterId = req.headers['x-user-id'] as string;
    const requesterRole = req.headers['x-user-role'] as string;
    if (requesterId !== req.params.id && requesterRole !== 'Administrador') {
      return res.status(403).json({ error: 'Acceso denegado. No tienes permisos para modificar este usuario.' });
    }

    if (req.body.password && req.body.password.trim()) {
      const passError = validatePassword(req.body.password.trim());
      if (passError) {
        return res.status(400).json({ error: passError });
      }
    }
    const updated = await db.updateUser(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json(updated);
  });

  app.delete('/api/users/:id', requireRoles(['Administrador']), async (req, res) => {
    const deleted = await db.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json({ success: true });
  });

  // Brands
  app.get('/api/brands', async (_req, res) => {
    const brands = await db.getBrands();
    res.json(brands);
  });

  app.post('/api/brands', requireRoles(['Gerente', 'Administrador']), async (req, res) => {
    const { name, description, status } = req.body;
    if (!name || !description) {
      return res.status(400).json({ error: 'Nombre y descripción son requeridos.' });
    }
    const brands = await db.getBrands();
    const nextId = getNextSequentialId(brands.map(b => b.id), 'b-');
    const newBrand = {
      id: nextId,
      name: name.trim(),
      description: description.trim(),
      status: status || 'Activo'
    };
    await db.createBrand(newBrand);
    res.status(201).json(newBrand);
  });

  app.put('/api/brands/:id', requireRoles(['Gerente', 'Administrador']), async (req, res) => {
    const updated = await db.updateBrand(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Marca no encontrada.' });
    }
    res.json(updated);
  });

  app.delete('/api/brands/:id', requireRoles(['Gerente', 'Administrador']), async (req, res) => {
    const deleted = await db.deleteBrand(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Marca no encontrada.' });
    }
    res.json({ success: true });
  });

  // Categories
  app.get('/api/categories', async (_req, res) => {
    const categories = await db.getCategories();
    res.json(categories);
  });

  app.post('/api/categories', requireRoles(['Gerente', 'Administrador']), async (req, res) => {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({ error: 'Nombre y descripción son requeridos.' });
    }
    const categories = await db.getCategories();
    const nextId = getNextSequentialId(categories.map(c => c.id), 'c-');
    const newCat = {
      id: nextId,
      name: name.trim(),
      description: description.trim()
    };
    await db.createCategory(newCat);
    res.status(201).json(newCat);
  });

  app.put('/api/categories/:id', requireRoles(['Gerente', 'Administrador']), async (req, res) => {
    const updated = await db.updateCategory(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Categoría no encontrada.' });
    }
    res.json(updated);
  });

  app.delete('/api/categories/:id', requireRoles(['Gerente', 'Administrador']), async (req, res) => {
    const deleted = await db.deleteCategory(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Categoría no encontrada.' });
    }
    res.json({ success: true });
  });

  // Colors
  app.get('/api/colors', async (_req, res) => {
    const colors = await db.getColors();
    res.json(colors);
  });

  app.post('/api/colors', requireRoles(['Gerente', 'Administrador']), async (req, res) => {
    const { name, hex } = req.body;
    if (!name || !hex) {
      return res.status(400).json({ error: 'Nombre y código Hexadecimal son requeridos.' });
    }
    const colors = await db.getColors();
    const nextId = getNextSequentialId(colors.map(col => col.id), 'col-');
    const newColor = {
      id: nextId,
      name: name.trim(),
      hex: hex.trim()
    };
    await db.createColor(newColor);
    res.status(201).json(newColor);
  });

  app.put('/api/colors/:id', requireRoles(['Gerente', 'Administrador']), async (req, res) => {
    const updated = await db.updateColor(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Color no encontrado.' });
    }
    res.json(updated);
  });

  app.delete('/api/colors/:id', requireRoles(['Gerente', 'Administrador']), async (req, res) => {
    const deleted = await db.deleteColor(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Color no encontrado.' });
    }
    res.json({ success: true });
  });

  // Sizes
  app.get('/api/sizes', async (_req, res) => {
    const sizes = await db.getSizes();
    res.json(sizes);
  });

  app.post('/api/sizes', requireRoles(['Gerente', 'Administrador']), async (req, res) => {
    const { value, gender } = req.body;
    if (value === undefined || !gender) {
      return res.status(400).json({ error: 'Valor numérico de talla y género son requeridos.' });
    }
    if (gender !== 'Dama' && gender !== 'Caballero') {
      return res.status(400).json({ error: 'El género de la talla debe ser Dama o Caballero.' });
    }
    const valNum = Number(value);
    if (gender === 'Dama' && valNum < 22) {
      return res.status(400).json({ error: 'El límite mínimo permitido para calzado de Dama (Mujer) es la talla 22.' });
    }
    if (gender === 'Dama' && valNum > 26) {
      return res.status(400).json({ error: 'El límite máximo permitido para calzado de Dama (Mujer) es la talla 26.' });
    }
    if (gender === 'Caballero' && valNum < 23) {
      return res.status(400).json({ error: 'El límite mínimo permitido para calzado de Caballero (Hombre) es la talla 23.' });
    }
    if (gender === 'Caballero' && valNum > 30) {
      return res.status(400).json({ error: 'El límite máximo permitido para calzado de Caballero (Hombre) es la talla 30.' });
    }
    const newSize = {
      id: `s-${value}-${gender.toLowerCase()}`,
      value: valNum,
      gender: gender as 'Dama' | 'Caballero'
    };
    await db.createSize(newSize);
    res.status(201).json(newSize);
  });

  app.put('/api/sizes/:id', requireRoles(['Gerente', 'Administrador']), async (req, res) => {
    const { value, gender } = req.body;
    if (value === undefined || !gender) {
      return res.status(400).json({ error: 'Valor numérico de talla y género son requeridos.' });
    }
    if (gender !== 'Dama' && gender !== 'Caballero') {
      return res.status(400).json({ error: 'El género de la talla debe ser Dama o Caballero.' });
    }
    const valNum = Number(value);
    if (gender === 'Dama' && valNum < 22) {
      return res.status(400).json({ error: 'El límite mínimo permitido para calzado de Dama (Mujer) es la talla 22.' });
    }
    if (gender === 'Dama' && valNum > 26) {
      return res.status(400).json({ error: 'El límite máximo permitido para calzado de Dama (Mujer) es la talla 26.' });
    }
    if (gender === 'Caballero' && valNum < 23) {
      return res.status(400).json({ error: 'El límite mínimo permitido para calzado de Caballero (Hombre) es la talla 23.' });
    }
    if (gender === 'Caballero' && valNum > 30) {
      return res.status(400).json({ error: 'El límite máximo permitido para calzado de Caballero (Hombre) es la talla 30.' });
    }
    const updated = await db.updateSize(req.params.id, { value: valNum, gender: gender as 'Dama' | 'Caballero' });
    if (!updated) {
      return res.status(404).json({ error: 'Talla no encontrada.' });
    }
    res.json(updated);
  });

  app.delete('/api/sizes/:id', requireRoles(['Gerente', 'Administrador']), async (req, res) => {
    const deleted = await db.deleteSize(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Talla no encontrada.' });
    }
    res.json({ success: true });
  });

  // Products (With QA rules validation)
  app.get('/api/products', async (_req, res) => {
    const products = await db.getProducts();
    res.json(products);
  });

  app.post('/api/products', requireRoles(['Gerente', 'Administrador']), async (req, res) => {
    const validationErrors = await validateProductData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors, error: validationErrors[0].message });
    }

    const products = await db.getProducts();
    const nextId = getNextSequentialId(products.map(p => p.id), 'p-');

    const newProduct = {
      id: nextId,
      code: req.body.code.trim(),
      gender: req.body.gender,
      categoryId: req.body.categoryId,
      brandId: req.body.brandId,
      name: req.body.name.trim(),
      colors: req.body.colors,
      sizes: req.body.sizes.map(Number),
      description: req.body.description.trim(),
      price: Number(req.body.price),
      imageUrl: req.body.imageUrl.trim()
    };

    await db.createProduct(newProduct);
    res.status(201).json(newProduct);
  });

  app.put('/api/products/:id', requireRoles(['Gerente', 'Administrador']), async (req, res) => {
    const id = req.params.id;
    const existing = await db.getProductById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    const validationErrors = await validateProductData(req.body, id);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors, error: validationErrors[0].message });
    }

    const updated = await db.updateProduct(id, {
      code: req.body.code.trim(),
      gender: req.body.gender,
      categoryId: req.body.categoryId,
      brandId: req.body.brandId,
      name: req.body.name.trim(),
      colors: req.body.colors,
      sizes: req.body.sizes.map(Number),
      description: req.body.description.trim(),
      price: Number(req.body.price),
      imageUrl: req.body.imageUrl.trim()
    });

    res.json(updated);
  });

  app.delete('/api/products/:id', requireRoles(['Gerente', 'Administrador']), async (req, res) => {
    const deleted = await db.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.json({ success: true });
  });

  // Stock / Warehouse
  app.get('/api/stock', async (_req, res) => {
    const stockItems = await db.getStock();
    res.json(stockItems);
  });

  app.post('/api/stock', requireRoles(['Gerente', 'Empleado', 'Administrador']), async (req, res) => {
    const { productId, colorId, sizeValue, quantity, stockMin, stockMax } = req.body;
    if (!productId || !colorId || sizeValue === undefined) {
      return res.status(400).json({ error: 'Producto, color y talla son requeridos.' });
    }

    const stockItems = await db.getStock();
    const nextId = getNextSequentialId(stockItems.map(st => st.id), 'st-');

    const newStock = {
      id: nextId,
      productId,
      colorId,
      sizeValue: Number(sizeValue),
      quantity: Number(quantity || 0),
      stockMin: Number(stockMin || 5),
      stockMax: Number(stockMax || 100)
    };

    await db.createStock(newStock);
    res.status(201).json(newStock);
  });

  app.put('/api/stock/:id', requireRoles(['Gerente', 'Empleado', 'Administrador']), async (req, res) => {
    const updated = await db.updateStock(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Registro de existencias no encontrado.' });
    }
    res.json(updated);
  });

  app.delete('/api/stock/:id', requireRoles(['Gerente', 'Empleado', 'Administrador']), async (req, res) => {
    const deleted = await db.deleteStock(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Registro de existencias no encontrado.' });
    }
    res.json({ success: true });
  });

  // Vite middleware for development or Static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use(express.static(path.join(process.cwd(), 'public')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
