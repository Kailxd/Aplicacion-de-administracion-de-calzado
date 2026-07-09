import pg from 'pg';
import {
  INITIAL_BRANDS,
  INITIAL_CATEGORIES,
  INITIAL_COLORS,
  INITIAL_SIZES,
  INITIAL_PRODUCTS,
  INITIAL_STOCK,
  INITIAL_USERS
} from '../src/initialData.js';
import { Brand, Category, Color, Size, Product, StockItem, User } from '../src/types.js';

const { Pool } = pg;

// Default Railway PostgreSQL URL provided
const RAILWAY_DB_URL = 'postgresql://postgres:pOgFynVqLWraQUVQKndhyOzFryLjLHue@hayabusa.proxy.rlwy.net:18015/railway';
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || RAILWAY_DB_URL;

let pool: pg.Pool | null = null;
let usePostgres = false;

// In-memory fallback database for dev preview environment when PostgreSQL server isn't running locally
class MemoryDatabase {
  users: User[] = [...INITIAL_USERS];
  brands: Brand[] = [...INITIAL_BRANDS];
  categories: Category[] = [...INITIAL_CATEGORIES];
  colors: Color[] = [...INITIAL_COLORS];
  sizes: Size[] = [...INITIAL_SIZES];
  products: Product[] = [...INITIAL_PRODUCTS];
  stock: StockItem[] = [...INITIAL_STOCK];

  reset() {
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.brands = JSON.parse(JSON.stringify(INITIAL_BRANDS));
    this.categories = JSON.parse(JSON.stringify(INITIAL_CATEGORIES));
    this.colors = JSON.parse(JSON.stringify(INITIAL_COLORS));
    this.sizes = JSON.parse(JSON.stringify(INITIAL_SIZES));
    this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    this.stock = JSON.parse(JSON.stringify(INITIAL_STOCK));
  }
}

const memDb = new MemoryDatabase();

export async function initDb() {
  if (connectionString || process.env.PGHOST) {
    try {
      const isRemoteHost = connectionString && (
        connectionString.includes('rlwy.net') ||
        connectionString.includes('sslmode=require') ||
        connectionString.includes('render.com') ||
        connectionString.includes('supabase') ||
        connectionString.includes('neon.tech')
      );

      pool = new Pool({
        connectionString,
        host: process.env.PGHOST,
        port: process.env.PGPORT ? parseInt(process.env.PGPORT) : undefined,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 10000,
        ssl: isRemoteHost || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      pool.on('error', (err) => {
        console.error('Unexpected pool error on idle client:', err);
      });

      // Test connection with 5 second timeout
      const connectPromise = pool.connect();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PostgreSQL connection timeout (5s)')), 5000)
      );

      const client = await Promise.race([connectPromise, timeoutPromise]);
      client.release();
      console.log('Successfully connected to PostgreSQL database!');

      // --- AUTOMATED 3FN DATABASE MIGRATION ---
      try {
        // 1. Check if the legacy 'detalles' table exists
        const tableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'detalles'
          );
        `);
        const detallesExists = tableCheck.rows[0].exists;

        if (detallesExists) {
          console.log('Automating schema migration: moving fields from detalles to products...');
          // Add new normalized columns to products if they don't exist
          await pool.query(`
            ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id VARCHAR(100) REFERENCES categories(id) ON DELETE CASCADE;
            ALTER TABLE products ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
          `);

          // Copy data from detalles and genero into products
          await pool.query(`
            UPDATE products p
            SET category_id = d.category_id,
                gender = CASE WHEN g.nombre = 'Dama' THEN 'Mujer' ELSE 'Hombre' END
            FROM detalles d
            LEFT JOIN genero g ON g.id = d.genero_id
            WHERE d.product_id = p.id AND (p.category_id IS NULL OR p.gender IS NULL);
          `);

          // Drop legacy tables
          await pool.query(`
            DROP TABLE IF EXISTS detalles CASCADE;
            DROP TABLE IF EXISTS genero CASCADE;
          `);
          console.log('Schema migration complete: detalles and genero dropped.');
        }

        // 2. Remove redundant color columns from stock if they still exist
        const stockColCheck = await pool.query(`
          SELECT COLUMN_NAME 
          FROM information_schema.columns 
          WHERE table_name = 'stock' AND column_name = 'color_name';
        `);
        if (stockColCheck.rows.length > 0) {
          console.log('Automating schema migration: removing color_name and color_hex from stock...');
          await pool.query(`
            ALTER TABLE stock DROP COLUMN IF EXISTS color_name CASCADE;
            ALTER TABLE stock DROP COLUMN IF EXISTS color_hex CASCADE;
          `);
          console.log('Stock table updated to 3FN.');
        }
      } catch (migErr) {
        console.warn('Migration status / steps executed (tables may already be clean):', (migErr as Error).message);
      }

      // Create/verify tables with clean, normalized schema
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(100) PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          role VARCHAR(50) NOT NULL,
          email VARCHAR(150) NOT NULL,
          password VARCHAR(255) NOT NULL,
          avatar_url TEXT,
          is_verified BOOLEAN DEFAULT TRUE,
          verification_code VARCHAR(10)
        );

        CREATE TABLE IF NOT EXISTS brands (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL,
          description TEXT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'Activo'
        );

        CREATE TABLE IF NOT EXISTS categories (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL,
          description TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS products (
          id VARCHAR(100) PRIMARY KEY,
          code VARCHAR(5) UNIQUE NOT NULL,
          brand_id VARCHAR(100) NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
          category_id VARCHAR(100) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          gender VARCHAR(20) NOT NULL,
          name VARCHAR(50) NOT NULL,
          colors TEXT[] NOT NULL DEFAULT '{}',
          sizes NUMERIC[] NOT NULL DEFAULT '{}',
          description VARCHAR(150) NOT NULL,
          price NUMERIC(10,2) NOT NULL,
          image_url TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS stock (
          id VARCHAR(100) PRIMARY KEY,
          product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          color_id VARCHAR(100) NOT NULL,
          size_value NUMERIC(4,1) NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 0,
          stock_min INTEGER NOT NULL DEFAULT 5,
          stock_max INTEGER NOT NULL DEFAULT 100
        );

        CREATE TABLE IF NOT EXISTS app_settings (
          key VARCHAR(100) PRIMARY KEY,
          value JSONB NOT NULL
        );
      `);

      // Seed tables individually if they are empty
      // 1. Users
      const userCount = await pool.query('SELECT COUNT(*) FROM users');
      if (parseInt(userCount.rows[0].count) === 0) {
        console.log('Seeding initial users into PostgreSQL...');
        for (const u of INITIAL_USERS) {
          await pool.query(
            'INSERT INTO users (id, username, name, role, email, password) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
            [u.id, u.username, u.name, u.role, u.email, u.password || '12345']
          );
        }
      }

      // 2. Brands
      const brandCount = await pool.query('SELECT COUNT(*) FROM brands');
      if (parseInt(brandCount.rows[0].count) === 0) {
        console.log('Seeding initial brands into PostgreSQL...');
        for (const b of INITIAL_BRANDS) {
          await pool.query(
            'INSERT INTO brands (id, name, description, status) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
            [b.id, b.name, b.description, b.status]
          );
        }
      }

      // 3. Categories
      const categoryCount = await pool.query('SELECT COUNT(*) FROM categories');
      if (parseInt(categoryCount.rows[0].count) === 0) {
        console.log('Seeding initial categories into PostgreSQL...');
        for (const c of INITIAL_CATEGORIES) {
          await pool.query(
            'INSERT INTO categories (id, name, description) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [c.id, c.name, c.description]
          );
        }
      }

      // 4. Colors and Sizes settings
      const colorsSetting = await pool.query("SELECT value FROM app_settings WHERE key = 'colors'");
      if (colorsSetting.rows.length === 0) {
        await pool.query("INSERT INTO app_settings (key, value) VALUES ('colors', $1) ON CONFLICT (key) DO NOTHING", [JSON.stringify(INITIAL_COLORS)]);
      }
      const sizesSetting = await pool.query("SELECT value FROM app_settings WHERE key = 'sizes'");
      if (sizesSetting.rows.length === 0) {
        await pool.query("INSERT INTO app_settings (key, value) VALUES ('sizes', $1) ON CONFLICT (key) DO NOTHING", [JSON.stringify(INITIAL_SIZES)]);
      }

      // 5. Products
      const productCount = await pool.query('SELECT COUNT(*) FROM products');
      if (parseInt(productCount.rows[0].count) === 0) {
        console.log('Seeding initial products into PostgreSQL...');
        for (const p of INITIAL_PRODUCTS) {
          await pool.query(
            `INSERT INTO products (id, code, brand_id, category_id, gender, name, colors, sizes, description, price, image_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING`,
            [p.id, p.code, p.brandId, p.categoryId, p.gender, p.name, p.colors, p.sizes, p.description, p.price, p.imageUrl]
          );
        }
      }

      // 6. Stock
      const stockCount = await pool.query('SELECT COUNT(*) FROM stock');
      if (parseInt(stockCount.rows[0].count) === 0) {
        console.log('Seeding initial stock into PostgreSQL...');
        for (const st of INITIAL_STOCK) {
          await pool.query(
            `INSERT INTO stock (id, product_id, color_id, size_value, quantity, stock_min, stock_max)
             VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
            [st.id, st.productId, st.colorId, st.sizeValue, st.quantity, st.stockMin, st.stockMax]
          );
        }
      }

      // Finally enable PostgreSQL
      usePostgres = true;
      console.log('PostgreSQL database successfully initialized and verified!');
    } catch (err) {
      console.warn('PostgreSQL connection error or not configured. Falling back to local relational store:', (err as Error).message);
      usePostgres = false;
    }
  } else {
    console.log('DATABASE_URL not found. Operating with local relational data layer ready for Railway PostgreSQL deployment.');
  }
}

// Database query helpers
export async function getUsers(): Promise<User[]> {
  if (usePostgres && pool) {
    const res = await pool.query('SELECT id, username, name, role, email, password, avatar_url as "avatarUrl", is_verified as "isVerified", verification_code as "verificationCode" FROM users ORDER BY name ASC');
    return res.rows;
  }
  return memDb.users;
}

export async function getUserById(id: string): Promise<User | null> {
  if (usePostgres && pool) {
    const res = await pool.query('SELECT id, username, name, role, email, password, avatar_url as "avatarUrl", is_verified as "isVerified", verification_code as "verificationCode" FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  }
  return memDb.users.find(u => u.id === id) || null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  if (usePostgres && pool) {
    const res = await pool.query('SELECT id, username, name, role, email, password, avatar_url as "avatarUrl", is_verified as "isVerified", verification_code as "verificationCode" FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    return res.rows[0] || null;
  }
  return memDb.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

export async function createUser(u: User): Promise<User> {
  const isVerified = u.isVerified !== undefined ? u.isVerified : false;
  const verificationCode = u.verificationCode || null;
  if (usePostgres && pool) {
    await pool.query(
      'INSERT INTO users (id, username, name, role, email, password, avatar_url, is_verified, verification_code) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [u.id, u.username, u.name, u.role, u.email, u.password, u.avatarUrl, isVerified, verificationCode]
    );
    return { ...u, isVerified, verificationCode: verificationCode || undefined };
  }
  const newUser = { ...u, isVerified, verificationCode: verificationCode || undefined };
  memDb.users.push(newUser);
  return newUser;
}

export async function updateUser(id: string, u: Partial<User>): Promise<User | null> {
  if (usePostgres && pool) {
    const current = await getUserById(id);
    if (!current) return null;
    const name = u.name ?? current.name;
    const role = u.role ?? current.role;
    const email = u.email ?? current.email;
    const password = u.password ?? current.password;
    const avatarUrl = u.avatarUrl ?? current.avatarUrl;
    const isVerified = u.isVerified ?? current.isVerified ?? false;
    const verificationCode = u.verificationCode !== undefined ? u.verificationCode : current.verificationCode;

    await pool.query(
      'UPDATE users SET name=$1, role=$2, email=$3, password=$4, avatar_url=$5, is_verified=$6, verification_code=$7 WHERE id=$8',
      [name, role, email, password, avatarUrl, isVerified, verificationCode, id]
    );
    return (await getUserById(id))!;
  }
  const index = memDb.users.findIndex(item => item.id === id);
  if (index === -1) return null;
  memDb.users[index] = { ...memDb.users[index], ...u };
  return memDb.users[index];
}

export async function deleteUser(id: string): Promise<boolean> {
  if (usePostgres && pool) {
    const res = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
  const lenBefore = memDb.users.length;
  memDb.users = memDb.users.filter(u => u.id !== id);
  return memDb.users.length < lenBefore;
}

// Brands
export async function getBrands(): Promise<Brand[]> {
  if (usePostgres && pool) {
    const res = await pool.query('SELECT id, name, description, status FROM brands ORDER BY name ASC');
    return res.rows;
  }
  return memDb.brands;
}

export async function createBrand(b: Brand): Promise<Brand> {
  if (usePostgres && pool) {
    await pool.query('INSERT INTO brands (id, name, description, status) VALUES ($1, $2, $3, $4)', [b.id, b.name, b.description, b.status]);
    return b;
  }
  memDb.brands.push(b);
  return b;
}

export async function updateBrand(id: string, b: Partial<Brand>): Promise<Brand | null> {
  if (usePostgres && pool) {
    const res = await pool.query(
      'UPDATE brands SET name=COALESCE($1, name), description=COALESCE($2, description), status=COALESCE($3, status) WHERE id=$4 RETURNING id, name, description, status',
      [b.name, b.description, b.status, id]
    );
    return res.rows[0] || null;
  }
  const idx = memDb.brands.findIndex(item => item.id === id);
  if (idx === -1) return null;
  memDb.brands[idx] = { ...memDb.brands[idx], ...b };
  return memDb.brands[idx];
}

export async function deleteBrand(id: string): Promise<boolean> {
  if (usePostgres && pool) {
    const res = await pool.query('DELETE FROM brands WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
  const len = memDb.brands.length;
  memDb.brands = memDb.brands.filter(b => b.id !== id);
  return memDb.brands.length < len;
}

// Categories
export async function getCategories(): Promise<Category[]> {
  if (usePostgres && pool) {
    const res = await pool.query('SELECT id, name, description FROM categories ORDER BY name ASC');
    return res.rows;
  }
  return memDb.categories;
}

export async function createCategory(c: Category): Promise<Category> {
  if (usePostgres && pool) {
    await pool.query('INSERT INTO categories (id, name, description) VALUES ($1, $2, $3)', [c.id, c.name, c.description]);
    return c;
  }
  memDb.categories.push(c);
  return c;
}

export async function updateCategory(id: string, c: Partial<Category>): Promise<Category | null> {
  if (usePostgres && pool) {
    const res = await pool.query(
      'UPDATE categories SET name=COALESCE($1, name), description=COALESCE($2, description) WHERE id=$3 RETURNING id, name, description',
      [c.name, c.description, id]
    );
    return res.rows[0] || null;
  }
  const idx = memDb.categories.findIndex(item => item.id === id);
  if (idx === -1) return null;
  memDb.categories[idx] = { ...memDb.categories[idx], ...c };
  return memDb.categories[idx];
}

export async function deleteCategory(id: string): Promise<boolean> {
  if (usePostgres && pool) {
    const res = await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
  const len = memDb.categories.length;
  memDb.categories = memDb.categories.filter(c => c.id !== id);
  return memDb.categories.length < len;
}

// Colors
export async function getColors(): Promise<Color[]> {
  if (usePostgres && pool) {
    const res = await pool.query("SELECT value FROM app_settings WHERE key = 'colors'");
    if (res.rows.length > 0) {
      memDb.colors = res.rows[0].value as Color[];
      return memDb.colors;
    }
    await pool.query("INSERT INTO app_settings (key, value) VALUES ('colors', $1) ON CONFLICT (key) DO NOTHING", [JSON.stringify(memDb.colors)]);
    return memDb.colors;
  }
  return memDb.colors;
}

export async function createColor(c: Color): Promise<Color> {
  const exists = memDb.colors.some(col => col.id === c.id);
  if (!exists) {
    memDb.colors.push(c);
  }
  if (usePostgres && pool) {
    await pool.query(
      "INSERT INTO app_settings (key, value) VALUES ('colors', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [JSON.stringify(memDb.colors)]
    );
  }
  return c;
}

export async function updateColor(id: string, c: Partial<Color>): Promise<Color | null> {
  const idx = memDb.colors.findIndex(item => item.id === id);
  if (idx === -1) return null;
  memDb.colors[idx] = { ...memDb.colors[idx], ...c };
  if (usePostgres && pool) {
    await pool.query(
      "INSERT INTO app_settings (key, value) VALUES ('colors', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [JSON.stringify(memDb.colors)]
    );
  }
  return memDb.colors[idx];
}

export async function deleteColor(id: string): Promise<boolean> {
  const len = memDb.colors.length;
  memDb.colors = memDb.colors.filter(c => c.id !== id);
  if (memDb.colors.length < len) {
    if (usePostgres && pool) {
      await pool.query(
        "INSERT INTO app_settings (key, value) VALUES ('colors', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [JSON.stringify(memDb.colors)]
      );
    }
    return true;
  }
  return false;
}

// Sizes
export async function getSizes(): Promise<Size[]> {
  if (usePostgres && pool) {
    const res = await pool.query("SELECT value FROM app_settings WHERE key = 'sizes'");
    if (res.rows.length > 0) {
      memDb.sizes = res.rows[0].value as Size[];
      return [...memDb.sizes].sort((a, b) => a.value - b.value);
    }
    await pool.query("INSERT INTO app_settings (key, value) VALUES ('sizes', $1) ON CONFLICT (key) DO NOTHING", [JSON.stringify(memDb.sizes)]);
    return [...memDb.sizes].sort((a, b) => a.value - b.value);
  }
  return [...memDb.sizes].sort((a, b) => a.value - b.value);
}

export async function createSize(s: Size): Promise<Size> {
  memDb.sizes = [...memDb.sizes.filter(existing => !(existing.value === s.value && existing.gender === s.gender)), s].sort((a, b) => a.value - b.value);
  if (usePostgres && pool) {
    await pool.query(
      "INSERT INTO app_settings (key, value) VALUES ('sizes', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [JSON.stringify(memDb.sizes)]
    );
  }
  return s;
}

export async function deleteSize(id: string): Promise<boolean> {
  const len = memDb.sizes.length;
  memDb.sizes = memDb.sizes.filter(s => s.id !== id);
  if (memDb.sizes.length < len) {
    if (usePostgres && pool) {
      await pool.query(
        "INSERT INTO app_settings (key, value) VALUES ('sizes', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [JSON.stringify(memDb.sizes)]
      );
    }
    return true;
  }
  return false;
}

export async function updateSize(id: string, s: Partial<Size>): Promise<Size | null> {
  const idx = memDb.sizes.findIndex(item => item.id === id);
  if (idx === -1) return null;
  memDb.sizes[idx] = { ...memDb.sizes[idx], ...s };
  if (usePostgres && pool) {
    await pool.query(
      "INSERT INTO app_settings (key, value) VALUES ('sizes', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [JSON.stringify(memDb.sizes)]
    );
  }
  return memDb.sizes[idx];
}

// Products
export async function getProducts(): Promise<Product[]> {
  if (usePostgres && pool) {
    const res = await pool.query(`
      SELECT 
        id, 
        code, 
        gender, 
        category_id as "categoryId", 
        brand_id as "brandId", 
        name, 
        colors, 
        sizes::float[] as sizes, 
        description, 
        price::float as price, 
        image_url as "imageUrl" 
      FROM products
      ORDER BY name ASC
    `);
    return res.rows;
  }
  return memDb.products;
}

export async function getProductById(id: string): Promise<Product | null> {
  if (usePostgres && pool) {
    const res = await pool.query(`
      SELECT 
        id, 
        code, 
        gender, 
        category_id as "categoryId", 
        brand_id as "brandId", 
        name, 
        colors, 
        sizes::float[] as sizes, 
        description, 
        price::float as price, 
        image_url as "imageUrl" 
      FROM products
      WHERE id = $1
    `, [id]);
    return res.rows[0] || null;
  }
  return memDb.products.find(p => p.id === id) || null;
}

export async function createProduct(p: Product): Promise<Product> {
  if (usePostgres && pool) {
    await pool.query(
      `INSERT INTO products (id, code, brand_id, category_id, gender, name, colors, sizes, description, price, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [p.id, p.code, p.brandId, p.categoryId, p.gender, p.name, p.colors, p.sizes, p.description, p.price, p.imageUrl]
    );
    return p;
  }
  memDb.products.push(p);
  return p;
}

export async function updateProduct(id: string, pPayload: Partial<Product>): Promise<Product | null> {
  if (usePostgres && pool) {
    const current = await getProductById(id);
    if (!current) return null;
    const code = pPayload.code ?? current.code;
    const brandId = pPayload.brandId ?? current.brandId;
    const categoryId = pPayload.categoryId ?? current.categoryId;
    const gender = pPayload.gender ?? current.gender;
    const name = pPayload.name ?? current.name;
    const colors = pPayload.colors ?? current.colors;
    const sizes = pPayload.sizes ?? current.sizes;
    const description = pPayload.description ?? current.description;
    const price = pPayload.price ?? current.price;
    const imageUrl = pPayload.imageUrl ?? current.imageUrl;

    await pool.query(
      `UPDATE products 
       SET code=$1, brand_id=$2, category_id=$3, gender=$4, name=$5, colors=$6, sizes=$7, description=$8, price=$9, image_url=$10
       WHERE id=$11`,
      [code, brandId, categoryId, gender, name, colors, sizes, description, price, imageUrl, id]
    );

    return (await getProductById(id))!;
  }
  const idx = memDb.products.findIndex(item => item.id === id);
  if (idx === -1) return null;
  memDb.products[idx] = { ...memDb.products[idx], ...pPayload };
  return memDb.products[idx];
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (usePostgres && pool) {
    await pool.query('DELETE FROM stock WHERE product_id = $1', [id]);
    const res = await pool.query('DELETE FROM products WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
  memDb.stock = memDb.stock.filter(s => s.productId !== id);
  const len = memDb.products.length;
  memDb.products = memDb.products.filter(p => p.id !== id);
  return memDb.products.length < len;
}

// Stock
export async function getStock(): Promise<StockItem[]> {
  if (usePostgres && pool) {
    const res = await pool.query(`
      SELECT 
        id, 
        product_id as "productId", 
        color_id as "colorId", 
        size_value::float as "sizeValue", 
        quantity, 
        stock_min as "stockMin", 
        stock_max as "stockMax" 
      FROM stock
    `);
    return res.rows;
  }
  return memDb.stock;
}

export async function createStock(st: StockItem): Promise<StockItem> {
  if (usePostgres && pool) {
    await pool.query(
      `INSERT INTO stock (id, product_id, color_id, size_value, quantity, stock_min, stock_max)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [st.id, st.productId, st.colorId, st.sizeValue, st.quantity, st.stockMin, st.stockMax]
    );
    return st;
  }
  memDb.stock.push(st);
  return st;
}

export async function updateStock(id: string, st: Partial<StockItem>): Promise<StockItem | null> {
  if (usePostgres && pool) {
    const res = await pool.query(
      `UPDATE stock
       SET quantity = COALESCE($1, quantity), stock_min = COALESCE($2, stock_min), stock_max = COALESCE($3, stock_max)
       WHERE id = $4
       RETURNING id, product_id as "productId", color_id as "colorId", size_value::float as "sizeValue", quantity, stock_min as "stockMin", stock_max as "stockMax"`,
      [st.quantity, st.stockMin, st.stockMax, id]
    );
    return res.rows[0] || null;
  }
  const idx = memDb.stock.findIndex(s => s.id === id);
  if (idx === -1) return null;
  memDb.stock[idx] = { ...memDb.stock[idx], ...st };
  return memDb.stock[idx];
}

export async function deleteStock(id: string): Promise<boolean> {
  if (usePostgres && pool) {
    const res = await pool.query('DELETE FROM stock WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
  const len = memDb.stock.length;
  memDb.stock = memDb.stock.filter(s => s.id !== id);
  return memDb.stock.length < len;
}

export async function resetDatabase() {
  if (usePostgres && pool) {
    await pool.query('TRUNCATE users, brands, categories, products, stock, app_settings CASCADE');
    await pool.query(
      "INSERT INTO app_settings (key, value) VALUES ('colors', $1), ('sizes', $2) ON CONFLICT (key) DO NOTHING",
      [JSON.stringify(INITIAL_COLORS), JSON.stringify(INITIAL_SIZES)]
    );
    for (const u of INITIAL_USERS) {
      await pool.query(
        'INSERT INTO users (id, username, name, role, email, password) VALUES ($1, $2, $3, $4, $5, $6)',
        [u.id, u.username, u.name, u.role, u.email, u.password || '12345']
      );
    }
    for (const b of INITIAL_BRANDS) {
      await pool.query(
        'INSERT INTO brands (id, name, description, status) VALUES ($1, $2, $3, $4)',
        [b.id, b.name, b.description, b.status]
      );
    }
    for (const c of INITIAL_CATEGORIES) {
      await pool.query(
        'INSERT INTO categories (id, name, description) VALUES ($1, $2, $3)',
        [c.id, c.name, c.description]
      );
    }

    for (const p of INITIAL_PRODUCTS) {
      await pool.query(
        `INSERT INTO products (id, code, brand_id, category_id, gender, name, colors, sizes, description, price, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [p.id, p.code, p.brandId, p.categoryId, p.gender, p.name, p.colors, p.sizes, p.description, p.price, p.imageUrl]
      );
    }
    for (const st of INITIAL_STOCK) {
      await pool.query(
        `INSERT INTO stock (id, product_id, color_id, size_value, quantity, stock_min, stock_max)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [st.id, st.productId, st.colorId, st.sizeValue, st.quantity, st.stockMin, st.stockMax]
      );
    }
  } else {
    memDb.reset();
  }
}
