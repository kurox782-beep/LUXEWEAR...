import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, QueryExecResult } from 'sql.js';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'luxewear.sqlite');

let dbInstance: Database | null = null;
let sqlJsPromise: Promise<Database> | null = null;

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (sqlJsPromise) return sqlJsPromise;

  sqlJsPromise = (async () => {
    const SQL = await initSqlJs();
    let db: Database;
    if (fs.existsSync(DB_FILE)) {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }

    dbInstance = db;
    await initSchema(db);
    saveDb();
    return db;
  })();

  return sqlJsPromise;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist database to disk:', err);
  }
}

// Helper for running queries that return rows as objects
export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function execute(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);

  const changes = dbInstance.getRowsModified();
  const idRes = dbInstance.exec('SELECT last_insert_rowid() as id');
  const lastInsertRowid = idRes[0]?.values[0]?.[0] as number || 0;

  saveDb();
  return { changes, lastInsertRowid };
}

export function runTransaction<T>(callback: () => T): T {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run('BEGIN TRANSACTION');
  try {
    const result = callback();
    dbInstance.run('COMMIT');
    saveDb();
    return result;
    } catch (error) {
    try {
      dbInstance.run('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
        throw error;
  }
}

async function initSchema(db: Database) {
  db.run('PRAGMA foreign_keys = ON;');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      description TEXT NOT NULL,
      materials TEXT,
      care_instructions TEXT,
      price REAL NOT NULL,
      sale_price REAL,
      sku TEXT UNIQUE,
      stock INTEGER NOT NULL DEFAULT 10,
      is_featured INTEGER DEFAULT 0,
      is_new_arrival INTEGER DEFAULT 1,
      is_best_seller INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      is_seed INTEGER DEFAULT 0,
      views_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      is_main INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      size TEXT NOT NULL,
      color TEXT NOT NULL,
      stock INTEGER DEFAULT 10,
      sku TEXT
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      user_name TEXT NOT NULL,
      user_email TEXT,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      image_url TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      shipping_address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      coupon_code TEXT,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'WHATSAPP_PENDING',
      notes TEXT,
      whatsapp_opened INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      product_image TEXT,
      product_slug TEXT,
      size TEXT,
      color TEXT,
      quantity INTEGER NOT NULL,
      price_at_purchase REAL NOT NULL,
      subtotal REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL DEFAULT 'percentage',
      discount_value REAL NOT NULL,
      min_order_amount REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      usage_count INTEGER DEFAULT 0,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      product_id INTEGER,
      order_id INTEGER,
      session_id TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      admin_email TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Default Store Settings
  const defaultWhatsApp = process.env.WHATSAPP_NUMBER || '918319090220';
  db.run(`
    INSERT OR IGNORE INTO settings (key, value) VALUES 
      ('whatsapp_number', '${defaultWhatsApp}'),
      ('store_name', 'LUXEWEAR'),
      ('currency_symbol', '₹'),
      ('currency_code', 'INR'),
      ('contact_email', 'atelier@luxewear.com'),
      ('shipping_note', 'Complimentary express dispatch across India on all atelier orders.');
  `);

  // Create/update the initial administrator only when explicit deployment credentials are configured.
  // Never ship default administrator passwords in source code.
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 12) {
      throw new Error('ADMIN_PASSWORD must be at least 12 characters long.');
    }
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(adminPassword, salt);
    const existingAdmin = queryOne('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (!existingAdmin) {
      execute(`
        INSERT INTO users (name, email, password_hash, role)
        VALUES (?, ?, ?, 'admin')
      `, ['LUXEWEAR Atelier Director', adminEmail, hash]);
      console.log(`[LUXEWEAR DB] Initial admin created for configured email.`);
    } else {
      execute('UPDATE users SET role = "admin", password_hash = ? WHERE email = ?', [hash, adminEmail]);
    }
  } else {
    console.warn('[LUXEWEAR DB] ADMIN_EMAIL and ADMIN_PASSWORD are not configured; no initial admin account was created.');
  }

  // Seed sample categories if empty
  const categoryCount = queryOne<{ count: number }>('SELECT count(*) as count FROM categories')?.count || 0;
  if (categoryCount === 0) {
    console.log('[LUXEWEAR DB] Seeding curated luxury categories...');
    const categories = [
      { name: 'Tailoring & Outerwear', slug: 'tailoring-outerwear', desc: 'Sculptural trench coats, double-breasted blazers, and structured wool coats.', order: 1 },
      { name: 'Knitwear & Cashmere', slug: 'knitwear-cashmere', desc: 'Ultra-fine merino knits, brushed cashmere sweaters, and ribbed cardigans.', order: 2 },
      { name: 'Shirts & Tops', slug: 'shirts-tops', desc: 'Silk-blend camp collar shirts, structured poplin, and heavyweight relaxed tees.', order: 3 },
      { name: 'Atelier Accessories', slug: 'accessories', desc: 'Hand-burnished leather tote bags, Italian silk scarves, and minimalist belts.', order: 4 }
    ];

    for (const cat of categories) {
      execute(`
        INSERT INTO categories (name, slug, description, display_order, is_active)
        VALUES (?, ?, ?, ?, 1)
      `, [cat.name, cat.slug, cat.desc, cat.order]);
    }
  }

  // Clean up any legacy trousers category or products as requested
  const trouserCat = queryOne('SELECT id FROM categories WHERE slug = "trousers"');
  if (trouserCat) {
    const trouserProds = queryAll('SELECT id FROM products WHERE category_id = ? OR slug LIKE "%trouser%"', [trouserCat.id]);
    for (const p of trouserProds) {
      execute('DELETE FROM product_images WHERE product_id = ?', [p.id]);
      execute('DELETE FROM product_variants WHERE product_id = ?', [p.id]);
      execute('DELETE FROM reviews WHERE product_id = ?', [p.id]);
      execute('DELETE FROM order_items WHERE product_id = ?', [p.id]);
      execute('DELETE FROM products WHERE id = ?', [p.id]);
    }
    execute('DELETE FROM categories WHERE id = ?', [trouserCat.id]);
  }

  // Seed initial sample products (marked is_seed = 1 for clarity)
  const productCount = queryOne<{ count: number }>('SELECT count(*) as count FROM products')?.count || 0;
  if (productCount === 0) {
    console.log('[LUXEWEAR DB] Seeding initial sample products (marked is_seed=1)...');
    seedSampleProducts();
  }

  // Seed Welcome Coupon if none
  const couponCount = queryOne<{ count: number }>('SELECT count(*) as count FROM coupons')?.count || 0;
  if (couponCount === 0) {
    execute(`
      INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, is_active)
      VALUES ('LUXE10', 'percentage', 10, 1500, 1),
             ('WELCOME500', 'fixed', 500, 3000, 1);
    `);
  }
}

function seedSampleProducts() {
  const cats = queryAll<{ id: number; slug: string }>('SELECT id, slug FROM categories');
  const catMap: Record<string, number> = {};
  cats.forEach(c => { catMap[c.slug] = c.id; });

  const sampleProducts = [
    {
      name: 'Double-Breasted Wool Atelier Coat',
      slug: 'double-breasted-wool-atelier-coat',
      category_id: catMap['tailoring-outerwear'],
      price: 14999,
      sale_price: 12499,
      sku: 'LW-COAT-001',
      stock: 8,
      is_featured: 1,
      is_new_arrival: 1,
      is_best_seller: 1,
      description: 'An architectural silhouette cut from double-faced Australian virgin wool. Designed with dropped shoulders, exaggerated peak lapels, and horn button closures. Unlined for an effortless drape.',
      materials: '100% Virgin Wool (Australian origin), Horn buttons, Bemberg pocket lining',
      care_instructions: 'Specialist dry clean only. Steam gently. Store on wide wooden hanger.',
      images: [
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85'
      ],
      variants: [
        { size: 'S', color: 'Charcoal Camel', stock: 2 },
        { size: 'M', color: 'Charcoal Camel', stock: 3 },
        { size: 'L', color: 'Charcoal Camel', stock: 2 },
        { size: 'XL', color: 'Charcoal Camel', stock: 1 }
      ]
    },
    {
      name: 'Heavyweight Supima Cotton Boxy Tee',
      slug: 'heavyweight-supima-cotton-boxy-tee',
      category_id: catMap['shirts-tops'],
      price: 2499,
      sale_price: 1999,
      sku: 'LW-TEE-002',
      stock: 35,
      is_featured: 1,
      is_new_arrival: 1,
      is_best_seller: 1,
      description: 'Engineered with a dense 280 GSM combed Supima cotton knit. Features a high ribbed collar that retains its shape, blind-stitched hems, and a boxy, modern drape.',
      materials: '100% Long-Staple Supima Cotton (Pre-shrunk)',
      care_instructions: 'Machine wash cold with like colors. Do not tumble dry. Iron medium.',
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=85'
      ],
      variants: [
        { size: 'S', color: 'Bone Chalk', stock: 10 },
        { size: 'M', color: 'Bone Chalk', stock: 12 },
        { size: 'L', color: 'Bone Chalk', stock: 8 },
        { size: 'XL', color: 'Bone Chalk', stock: 5 },
        { size: 'M', color: 'Washed Onyx', stock: 8 },
        { size: 'L', color: 'Washed Onyx', stock: 6 }
      ]
    },
    {
      name: 'Seamless Brushed Cashmere Crewneck',
      slug: 'seamless-brushed-cashmere-crewneck',
      category_id: catMap['knitwear-cashmere'],
      price: 11999,
      sale_price: null,
      sku: 'LW-KNIT-004',
      stock: 11,
      is_featured: 1,
      is_new_arrival: 0,
      is_best_seller: 1,
      description: 'Spun from Grade-A Mongolian cashmere fibers and lightly brushed with natural teasels for a cloud-like halo finish. WholeGarment seamless construction eliminates bulk.',
      materials: '100% Grade-A Mongolian Cashmere (2-ply 12-gauge)',
      care_instructions: 'Hand wash cold using mild wool detergent. Lay flat to dry on towel.',
      images: [
        'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=85'
      ],
      variants: [
        { size: 'S', color: 'Alabaster Ivory', stock: 3 },
        { size: 'M', color: 'Alabaster Ivory', stock: 4 },
        { size: 'L', color: 'Alabaster Ivory', stock: 3 },
        { size: 'XL', color: 'Alabaster Ivory', stock: 1 }
      ]
    },
    {
      name: 'Relaxed Silk-Linen Camp Collar Shirt',
      slug: 'relaxed-silk-linen-camp-collar-shirt',
      category_id: catMap['shirts-tops'],
      price: 4999,
      sale_price: 3999,
      sku: 'LW-SHIRT-005',
      stock: 18,
      is_featured: 0,
      is_new_arrival: 1,
      is_best_seller: 0,
      description: 'Woven with French linen and raw tussah silk for a textured, slubby handfeel that breathes in heat. Features mother-of-pearl buttons and a straight vented hem.',
      materials: '55% French Linen, 45% Raw Silk',
      care_instructions: 'Gentle hand wash cold or delicate machine wash. Line dry in shade.',
      images: [
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=85'
      ],
      variants: [
        { size: 'S', color: 'Sand Beige', stock: 4 },
        { size: 'M', color: 'Sand Beige', stock: 6 },
        { size: 'L', color: 'Sand Beige', stock: 5 },
        { size: 'XL', color: 'Sand Beige', stock: 3 }
      ]
    },
    {
      name: 'Burnished Tuscan Leather Weekender Tote',
      slug: 'burnished-tuscan-leather-weekender-tote',
      category_id: catMap['accessories'],
      price: 16500,
      sale_price: null,
      sku: 'LW-ACC-006',
      stock: 4,
      is_featured: 1,
      is_new_arrival: 1,
      is_best_seller: 0,
      description: 'Vegetable-tanned full-grain leather hand-burnished in Santa Croce, Italy. Develops an organic patina over decades. Accented with solid matte brass hardware and padded laptop sleeve.',
      materials: '100% Full-Grain Vegetable-Tanned Italian Cowhide, Solid Brass Hardware',
      care_instructions: 'Treat periodically with natural beeswax leather balsam. Avoid prolonged water exposure.',
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85'
      ],
      variants: [
        { size: 'One Size', color: 'Deep Espresso', stock: 4 }
      ]
    }
  ];

  for (const p of sampleProducts) {
    const { lastInsertRowid: productId } = execute(`
      INSERT INTO products (
        name, slug, category_id, description, materials, care_instructions,
        price, sale_price, sku, stock, is_featured, is_new_arrival, is_best_seller, is_active, is_seed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
    `, [
      p.name, p.slug, p.category_id || null, p.description, p.materials, p.care_instructions,
      p.price, p.sale_price || null, p.sku, p.stock, p.is_featured, p.is_new_arrival, p.is_best_seller
    ]);

    // Insert Images
    p.images.forEach((img, idx) => {
      execute(`
        INSERT INTO product_images (product_id, image_url, is_main, display_order)
        VALUES (?, ?, ?, ?)
      `, [productId, img, idx === 0 ? 1 : 0, idx]);
    });

    // Insert Variants
    p.variants.forEach(v => {
      execute(`
        INSERT INTO product_variants (product_id, size, color, stock, sku)
        VALUES (?, ?, ?, ?, ?)
      `, [productId, v.size, v.color, v.stock, `${p.sku}-${v.size}-${v.color.replace(/\s+/g, '')}`]);
    });

    // Sample reviews for first product (marked approved so user sees the review section right away)
    if (p.slug === 'double-breasted-wool-atelier-coat') {
      execute(`
        INSERT INTO reviews (product_id, user_name, user_email, rating, comment, status)
        VALUES 
          (?, 'Vikram Malhotra', 'vikram@example.com', 5, 'The drape and handfeel of this coat is exceptional. Feels like Savile Row tailoring. The wool breathes yet cuts out cold wind completely.', 'APPROVED'),
          (?, 'Ananya Sen', 'ananya@example.com', 5, 'Remarkable attention to detail on the horn buttons and lapel proportion. Ordering via WhatsApp was seamless.', 'APPROVED');
      `, [productId, productId]);
    }
  }
}

export function reseedDatabase(force = false): { products: number; categories: number } {
  const cats = queryAll<{ id: number; slug: string }>('SELECT id, slug FROM categories');
  if (cats.length === 0 || force) {
    if (force) {
      execute('DELETE FROM categories');
    }
    const categories = [
      { name: 'Tailoring & Outerwear', slug: 'tailoring-outerwear', desc: 'Sculptural trench coats, double-breasted blazers, and structured wool coats.', order: 1 },
      { name: 'Knitwear & Cashmere', slug: 'knitwear-cashmere', desc: 'Ultra-fine merino knits, brushed cashmere sweaters, and ribbed cardigans.', order: 2 },
      { name: 'Shirts & Tops', slug: 'shirts-tops', desc: 'Silk-blend camp collar shirts, structured poplin, and heavyweight relaxed tees.', order: 3 },
      { name: 'Atelier Accessories', slug: 'accessories', desc: 'Hand-burnished leather tote bags, Italian silk scarves, and minimalist belts.', order: 4 }
    ];

    for (const cat of categories) {
      execute(`
        INSERT OR IGNORE INTO categories (name, slug, description, display_order, is_active)
        VALUES (?, ?, ?, ?, 1)
      `, [cat.name, cat.slug, cat.desc, cat.order]);
    }
  }

  const prodCount = queryOne<{ count: number }>('SELECT count(*) as count FROM products')?.count || 0;
  if (prodCount === 0 || force) {
    if (force) {
      execute('DELETE FROM products WHERE is_seed = 1');
    }
    seedSampleProducts();
  }

  return {
    products: queryOne<{ count: number }>('SELECT count(*) as count FROM products')?.count || 0,
    categories: queryOne<{ count: number }>('SELECT count(*) as count FROM categories')?.count || 0
  };
}

export { seedSampleProducts };
