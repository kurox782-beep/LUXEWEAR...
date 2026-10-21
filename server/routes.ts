import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { getDb, queryAll, queryOne, execute, runTransaction, reseedDatabase } from './db.ts';
import { AuthenticatedRequest, signToken, requireAdmin, requireAuth } from './auth.ts';

const router = Router();

// Configure Multer for persistent file uploads
const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const unique = `${Date.now()}_${Math.round(Math.random() * 1e5)}`;
    cb(null, `${safeBase}_${unique}${ext || '.jpg'}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

// Helper for logging admin actions
function logAdminAction(adminId: number, adminEmail: string, action: string, entityType: string, entityId?: string | number, details?: any) {
  try {
    execute(`
      INSERT INTO admin_audit_logs (admin_id, admin_email, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [adminId, adminEmail, action, entityType, entityId ? String(entityId) : null, details ? JSON.stringify(details) : null]);
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
}

// Helper to log analytics events
function logAnalyticsEvent(eventType: string, productId?: number | null, orderId?: number | null, sessionId?: string | null, metadata?: any) {
  try {
    execute(`
      INSERT INTO analytics_events (event_type, product_id, order_id, session_id, metadata)
      VALUES (?, ?, ?, ?, ?)
    `, [eventType, productId || null, orderId || null, sessionId || null, metadata ? JSON.stringify(metadata) : null]);
  } catch (err) {
    console.error('Failed to log analytics event:', err);
  }
}

// -------------------------------------------------------------
// 1. AUTHENTICATION ROUTES
// -------------------------------------------------------------

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = queryOne<{ id: number; name: string; email: string; password_hash: string; role: string }>(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    res.cookie('luxewear_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An unexpected error occurred during login.' });
  }
});

router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (String(password).length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = queryOne('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const { lastInsertRowid: userId } = execute(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, 'customer')
    `, [name.trim(), normalizedEmail, hash]);

    const token = signToken({
      userId,
      email: normalizedEmail,
      role: 'customer',
      name: name.trim()
    });

    res.cookie('luxewear_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        role: 'customer'
      }
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

router.get('/auth/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const user = queryOne<{ id: number; name: string; email: string; role: string }>(
    'SELECT id, name, email, role FROM users WHERE id = ?',
    [req.user.userId]
  );

  if (!user) {
    res.status(401).json({ error: 'User account not found' });
    return;
  }

  res.json({ user });
});

router.post('/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('luxewear_session');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// -------------------------------------------------------------
// 2. PUBLIC CATALOG ROUTES
// -------------------------------------------------------------

router.get('/categories', (_req: Request, res: Response) => {
  try {
    const categories = queryAll(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) as product_count
      FROM categories c
      WHERE c.is_active = 1
      ORDER BY c.display_order ASC, c.name ASC
    `);
    res.json(categories);
  } catch (error: any) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/products', (req: Request, res: Response) => {
  try {
    const {
      category,
      min_price,
      max_price,
      size,
      color,
      in_stock,
      sale,
      new_arrival,
      featured,
      best_seller,
      search,
      sort = 'featured',
      limit = '24',
      page = '1'
    } = req.query;

    let whereClauses = ['p.is_active = 1'];
    let params: any[] = [];

    if (category) {
      whereClauses.push('(c.slug = ? OR p.category_id = ?)');
      params.push(category, category);
    }

    if (min_price) {
      whereClauses.push('COALESCE(p.sale_price, p.price) >= ?');
      params.push(Number(min_price));
    }

    if (max_price) {
      whereClauses.push('COALESCE(p.sale_price, p.price) <= ?');
      params.push(Number(max_price));
    }

    if (sale === 'true' || sale === '1') {
      whereClauses.push('p.sale_price IS NOT NULL AND p.sale_price < p.price');
    }

    if (new_arrival === 'true' || new_arrival === '1') {
      whereClauses.push('p.is_new_arrival = 1');
    }

    if (featured === 'true' || featured === '1') {
      whereClauses.push('p.is_featured = 1');
    }

    if (best_seller === 'true' || best_seller === '1') {
      whereClauses.push('p.is_best_seller = 1');
    }

    if (in_stock === 'true' || in_stock === '1') {
      whereClauses.push('p.stock > 0');
    }

    if (search) {
      whereClauses.push('(p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (size) {
      whereClauses.push('p.id IN (SELECT product_id FROM product_variants WHERE size = ? AND stock > 0)');
      params.push(size);
    }

    if (color) {
      whereClauses.push('p.id IN (SELECT product_id FROM product_variants WHERE color LIKE ? AND stock > 0)');
      params.push(`%${color}%`);
    }

    let orderBy = 'p.is_featured DESC, p.created_at DESC';
    if (sort === 'newest') orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'COALESCE(p.sale_price, p.price) ASC';
    if (sort === 'price_desc') orderBy = 'COALESCE(p.sale_price, p.price) DESC';
    if (sort === 'best_seller') orderBy = 'p.is_best_seller DESC, p.views_count DESC';

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total
    const countRow = queryOne<{ total: number }>(`
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereSql}
    `, params);

    const total = countRow?.total || 0;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    const products = queryAll(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ${limitNum} OFFSET ${offset}
    `, params);

    // Attach images and variants
    const productIds = products.map(p => p.id);
    let imagesByProduct: Record<number, any[]> = {};
    let variantsByProduct: Record<number, any[]> = {};

    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      const images = queryAll(`
        SELECT * FROM product_images
        WHERE product_id IN (${placeholders})
        ORDER BY is_main DESC, display_order ASC
      `, productIds);
      
      images.forEach(img => {
        if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
        imagesByProduct[img.product_id].push(img);
      });

      const variants = queryAll(`
        SELECT * FROM product_variants
        WHERE product_id IN (${placeholders})
        ORDER BY id ASC
      `, productIds);

      variants.forEach(v => {
        if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
        variantsByProduct[v.product_id].push(v);
      });
    }

    const items = products.map(p => ({
      ...p,
      images: imagesByProduct[p.id] || [],
      variants: variantsByProduct[p.id] || []
    }));

    res.json({
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

router.get('/products/:slug', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const product = queryOne(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ? AND p.is_active = 1
    `, [slug]);

    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    // Increment view count & log analytics
    execute('UPDATE products SET views_count = views_count + 1 WHERE id = ?', [product.id]);
    logAnalyticsEvent('PRODUCT_VIEW', product.id, null, (req.query.session_id as string) || null);

    const images = queryAll(`
      SELECT * FROM product_images 
      WHERE product_id = ? 
      ORDER BY is_main DESC, display_order ASC
    `, [product.id]);

    const variants = queryAll(`
      SELECT * FROM product_variants 
      WHERE product_id = ? 
      ORDER BY id ASC
    `, [product.id]);

    // Approved reviews
    const reviews = queryAll(`
      SELECT id, user_name, rating, comment, image_url, created_at
      FROM reviews
      WHERE product_id = ? AND status = 'APPROVED'
      ORDER BY created_at DESC
    `, [product.id]);

    const ratingStats = queryOne(`
      SELECT 
        COUNT(*) as total_reviews,
        COALESCE(AVG(rating), 0) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as stars_5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as stars_4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as stars_3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as stars_2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as stars_1
      FROM reviews
      WHERE product_id = ? AND status = 'APPROVED'
    `, [product.id]);

    // Related products in same category for cross-selling
    let related = queryAll(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
      ORDER BY p.is_featured DESC, p.views_count DESC
      LIMIT 4
    `, [product.category_id, product.id]);

    // Fallback to other active pieces if category has fewer than 4 items
    if (related.length < 4) {
      const existingIds = [product.id, ...related.map((r: any) => r.id)];
      const placeholders = existingIds.map(() => '?').join(',');
      const additional = queryAll(`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id NOT IN (${placeholders}) AND p.is_active = 1
        ORDER BY p.is_featured DESC, p.views_count DESC
        LIMIT ${4 - related.length}
      `, existingIds);
      related = [...related, ...additional];
    }

    // Attach images and variants to related products
    const relatedIds = related.map((r: any) => r.id);
    if (relatedIds.length > 0) {
      const relPlaceholders = relatedIds.map(() => '?').join(',');
      const relImages = queryAll(`
        SELECT * FROM product_images WHERE product_id IN (${relPlaceholders}) ORDER BY is_main DESC, display_order ASC
      `, relatedIds);
      const relVariants = queryAll(`
        SELECT * FROM product_variants WHERE product_id IN (${relPlaceholders}) ORDER BY id ASC
      `, relatedIds);

      const relImgMap: Record<number, any[]> = {};
      const relVarMap: Record<number, any[]> = {};
      relImages.forEach(img => {
        if (!relImgMap[img.product_id]) relImgMap[img.product_id] = [];
        relImgMap[img.product_id].push(img);
      });
      relVariants.forEach(v => {
        if (!relVarMap[v.product_id]) relVarMap[v.product_id] = [];
        relVarMap[v.product_id].push(v);
      });

      related = related.map((r: any) => ({
        ...r,
        images: relImgMap[r.id] || [],
        variants: relVarMap[r.id] || []
      }));
    }

    res.json({
      product: {
        ...product,
        images,
        variants,
        reviews,
        ratingStats: {
          totalReviews: ratingStats?.total_reviews || 0,
          averageRating: Number(ratingStats?.average_rating || 0).toFixed(1),
          distribution: {
            5: ratingStats?.stars_5 || 0,
            4: ratingStats?.stars_4 || 0,
            3: ratingStats?.stars_3 || 0,
            2: ratingStats?.stars_2 || 0,
            1: ratingStats?.stars_1 || 0
          }
        },
        related
      }
    });
  } catch (error: any) {
    console.error('Product detail error:', error);
    res.status(500).json({ error: 'Failed to retrieve product details.' });
  }
});

// -------------------------------------------------------------
// 3. REVIEWS SUBMISSION
// -------------------------------------------------------------

router.post('/products/:id/reviews', (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.id);
    const { name, email, rating, comment, image_url } = req.body;

    if (!name || !rating || !comment) {
      res.status(400).json({ error: 'Name, rating (1-5), and review text are required.' });
      return;
    }

    const ratingNum = Math.round(Number(rating));
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
      return;
    }

    const product = queryOne('SELECT id FROM products WHERE id = ?', [productId]);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    execute(`
      INSERT INTO reviews (product_id, user_name, user_email, rating, comment, image_url, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `, [productId, String(name).trim(), email ? String(email).trim() : null, ratingNum, String(comment).trim(), image_url || null]);

    logAnalyticsEvent('REVIEW_SUBMITTED', productId, null, null, { rating: ratingNum });

    res.status(201).json({
      success: true,
      message: 'Your review has been submitted for atelier moderation and will appear once verified.'
    });
  } catch (error: any) {
    console.error('Review submit error:', error);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
});

// -------------------------------------------------------------
// 4. COUPON VALIDATION
// -------------------------------------------------------------

router.post('/coupons/validate', (req: Request, res: Response) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      res.status(400).json({ error: 'Coupon code is required.' });
      return;
    }

    const coupon = queryOne<{
      id: number;
      code: string;
      discount_type: 'percentage' | 'fixed';
      discount_value: number;
      min_order_amount: number;
      is_active: number;
      expires_at: string | null;
    }>('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1', [String(code).trim()]);

    if (!coupon) {
      res.status(404).json({ error: 'Invalid or expired promotional code.' });
      return;
    }

    const currentSubtotal = Number(subtotal) || 0;
    if (coupon.min_order_amount > 0 && currentSubtotal < coupon.min_order_amount) {
      res.status(400).json({
        error: `This code requires a minimum atelier order of ₹${coupon.min_order_amount.toLocaleString()}.`
      });
      return;
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = Math.round((currentSubtotal * coupon.discount_value) / 100);
    } else {
      discount = Math.min(coupon.discount_value, currentSubtotal);
    }

    res.json({
      valid: true,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discount_amount: discount
    });
  } catch (error: any) {
    console.error('Coupon validation error:', error);
    res.status(500).json({ error: 'Failed to validate coupon.' });
  }
});

// -------------------------------------------------------------
// 5. WHATSAPP CHECKOUT & ORDER CREATION (REAL DATABASE PERSISTENCE)
// -------------------------------------------------------------

router.post('/checkout/whatsapp', async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      city,
      state,
      pincode,
      couponCode,
      items
    } = req.body;

    // 1. Validate customer information
    if (!customerName || !customerPhone || !shippingAddress || !city || !state || !pincode) {
      res.status(400).json({ error: 'Please provide full customer name, phone number, address, city, state, and pincode.' });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Your atelier bag is empty.' });
      return;
    }

    // 2. Validate items against real database prices & stock (DO NOT TRUST CLIENT PRICES!)
    const validatedItems: Array<{
      productId: number;
      productName: string;
      productSlug: string;
      productImage: string;
      size: string;
      color: string;
      quantity: number;
      priceAtPurchase: number;
      subtotal: number;
    }> = [];

    let calculatedSubtotal = 0;

    for (const item of items) {
      const product = queryOne<{
        id: number;
        name: string;
        slug: string;
        price: number;
        sale_price: number | null;
        stock: number;
        is_active: number;
      }>('SELECT id, name, slug, price, sale_price, stock, is_active FROM products WHERE id = ?', [Number(item.productId)]);

      if (!product || product.is_active !== 1) {
        res.status(400).json({ error: `Product "${item.name || 'Selected item'}" is no longer available.` });
        return;
      }

      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));

      // Variant stock check if variant provided
      if (item.size && item.color) {
        const variant = queryOne<{ id: number; stock: number }>(
          'SELECT id, stock FROM product_variants WHERE product_id = ? AND size = ? AND color = ?',
          [product.id, item.size, item.color]
        );
        if (variant && variant.stock < qty) {
          res.status(400).json({
            error: `Only ${variant.stock} left for "${product.name}" in size ${item.size} (${item.color}). Please adjust quantity.`
          });
          return;
        }
      } else if (product.stock < qty) {
        res.status(400).json({
          error: `Insufficient stock for "${product.name}". Only ${product.stock} units available.`
        });
        return;
      }

      // Lock real price at purchase time: use sale_price if active, else regular price
      const priceAtPurchase = product.sale_price !== null && product.sale_price > 0 ? product.sale_price : product.price;
      const itemSubtotal = priceAtPurchase * qty;
      calculatedSubtotal += itemSubtotal;

      // Get main image
      const mainImg = queryOne<{ image_url: string }>(
        'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY is_main DESC, display_order ASC LIMIT 1',
        [product.id]
      );

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productImage: mainImg?.image_url || '',
        size: item.size || 'Standard',
        color: item.color || 'Standard',
        quantity: qty,
        priceAtPurchase,
        subtotal: itemSubtotal
      });
    }

    // 3. Calculate discount from coupon if provided
    let verifiedDiscount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = queryOne<{
        id: number;
        code: string;
        discount_type: 'percentage' | 'fixed';
        discount_value: number;
        min_order_amount: number;
        is_active: number;
      }>('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1', [String(couponCode).trim()]);

      if (coupon && (coupon.min_order_amount === 0 || calculatedSubtotal >= coupon.min_order_amount)) {
        if (coupon.discount_type === 'percentage') {
          verifiedDiscount = Math.round((calculatedSubtotal * coupon.discount_value) / 100);
        } else {
          verifiedDiscount = Math.min(coupon.discount_value, calculatedSubtotal);
        }
        appliedCoupon = coupon.code;
        execute('UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?', [coupon.id]);
      }
    }

    const calculatedTotal = Math.max(0, calculatedSubtotal - verifiedDiscount);

    // 4. Generate unique luxury order number (e.g. LW1024)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `LW${randomSuffix}`;

    // 5. Execute transaction: Insert order, insert items, update inventory
    const orderResult = runTransaction(() => {
      const { lastInsertRowid: orderId } = execute(`
        INSERT INTO orders (
          order_number, customer_name, customer_phone, customer_email,
          shipping_address, city, state, pincode,
          subtotal, discount, coupon_code, total, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'WHATSAPP_PENDING')
      `, [
        orderNumber,
        customerName.trim(),
        customerPhone.trim(),
        customerEmail ? customerEmail.trim() : null,
        shippingAddress.trim(),
        city.trim(),
        state.trim(),
        pincode.trim(),
        calculatedSubtotal,
        verifiedDiscount,
        appliedCoupon,
        calculatedTotal
      ]);

      // Insert Order Items with locked price
      for (const item of validatedItems) {
        execute(`
          INSERT INTO order_items (
            order_id, product_id, product_name, product_image, product_slug,
            size, color, quantity, price_at_purchase, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          orderId,
          item.productId,
          item.productName,
          item.productImage,
          item.productSlug,
          item.size,
          item.color,
          item.quantity,
          item.priceAtPurchase,
          item.subtotal
        ]);

        // Decrement product stock
        execute('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?', [item.quantity, item.productId]);
        // Decrement variant stock if exists
        execute(`
          UPDATE product_variants 
          SET stock = MAX(0, stock - ?) 
          WHERE product_id = ? AND size = ? AND color = ?
        `, [item.quantity, item.productId, item.size, item.color]);
      }

      return { orderId, orderNumber };
    });

    // 6. Log analytics event
    logAnalyticsEvent('ORDER_CREATED', null, orderResult.orderId, null, {
      total: calculatedTotal,
      orderNumber: orderResult.orderNumber,
      itemCount: validatedItems.length
    });

    // 7. Get WhatsApp store number from settings or env
    const settingWhatsApp = queryOne<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['whatsapp_number']);
    const rawWhatsApp = settingWhatsApp?.value || process.env.WHATSAPP_NUMBER || '918319090220';
    const cleanWhatsApp = rawWhatsApp.replace(/[^0-9]/g, '');

    // 8. Build WhatsApp Pre-filled message matching the specification
    const appUrl = process.env.APP_URL || '';
    let itemsText = validatedItems
      .map(item => `*${item.productName}*\nSize: ${item.size} | Color: ${item.color}\nQty: ${item.quantity} × ₹${item.priceAtPurchase.toLocaleString()}\nSubtotal: ₹${item.subtotal.toLocaleString()}`)
      .join('\n\n');

    let waMessage = `*LUXEWEAR NEW ORDER*\n\n` +
      `*Order Number:* ${orderResult.orderNumber}\n\n` +
      `*Customer Details:*\n` +
      `Name: ${customerName}\n` +
      `Phone: ${customerPhone}\n` +
      (customerEmail ? `Email: ${customerEmail}\n` : '') +
      `\n*Delivery Address:*\n` +
      `${shippingAddress}\n` +
      `${city}, ${state} - ${pincode}\n\n` +
      `*Items Ordered:*\n` +
      `${itemsText}\n\n` +
      `-------------------------\n` +
      `Subtotal: ₹${calculatedSubtotal.toLocaleString()}\n` +
      (verifiedDiscount > 0 ? `Discount: -₹${verifiedDiscount.toLocaleString()} (${appliedCoupon})\n` : '') +
      `*Total Amount: ₹${calculatedTotal.toLocaleString()}*\n` +
      `-------------------------\n\n` +
      `_Order recorded in LUXEWEAR Atelier system. Please reply to confirm dispatch._`;

    const encodedMessage = encodeURIComponent(waMessage);
    const whatsappUrl = `https://wa.me/${cleanWhatsApp}?text=${encodedMessage}`;

    res.status(201).json({
      success: true,
      orderId: orderResult.orderId,
      orderNumber: orderResult.orderNumber,
      whatsappUrl,
      order: {
        orderNumber: orderResult.orderNumber,
        customerName,
        customerPhone,
        total: calculatedTotal,
        subtotal: calculatedSubtotal,
        discount: verifiedDiscount,
        status: 'WHATSAPP_PENDING',
        items: validatedItems
      }
    });
  } catch (error: any) {
    console.error('WhatsApp checkout error:', error);
    res.status(500).json({ error: error.message || 'Failed to place order.' });
  }
});

// Mark WhatsApp opened
router.post('/orders/:orderNumber/whatsapp-opened', (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    execute('UPDATE orders SET whatsapp_opened = 1 WHERE order_number = ?', [orderNumber]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update order state' });
  }
});

// Track public order by order number
router.get('/orders/:orderNumber', (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const order = queryOne(`
      SELECT * FROM orders WHERE order_number = ?
    `, [orderNumber]);

    if (!order) {
      res.status(404).json({ error: 'Order not found. Please check your order reference.' });
      return;
    }

    const items = queryAll(`
      SELECT * FROM order_items WHERE order_id = ?
    `, [order.id]);

    res.json({
      order: {
        ...order,
        items
      }
    });
  } catch (error: any) {
    console.error('Order lookup error:', error);
    res.status(500).json({ error: 'Failed to retrieve order details.' });
  }
});

// -------------------------------------------------------------
// 6. CLIENT ANALYTICS EVENT TRACKING
// -------------------------------------------------------------

router.post('/analytics/track', (req: Request, res: Response) => {
  try {
    const { event_type, product_id, session_id, metadata } = req.body;
    if (event_type) {
      logAnalyticsEvent(event_type, product_id, null, session_id, metadata);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record event' });
  }
});

// -------------------------------------------------------------
// 7. FILE UPLOAD (FOR PRODUCT IMAGES & EDITORIAL ASSETS)
// -------------------------------------------------------------

router.post('/upload', upload.array('images', 8), (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No image files uploaded.' });
      return;
    }

    const uploadedUrls = files.map(f => ({
      url: `/uploads/${f.filename}`,
      filename: f.filename,
      size: f.size
    }));

    res.json({
      success: true,
      files: uploadedUrls,
      url: uploadedUrls[0].url // First file url convenience
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'File upload failed.' });
  }
});

// -------------------------------------------------------------
// 8. LOGGED-IN CUSTOMER ORDERS
// -------------------------------------------------------------

router.get('/customer/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      res.status(400).json({ error: 'User email missing' });
      return;
    }

    const orders = queryAll(`
      SELECT * FROM orders
      WHERE LOWER(customer_email) = LOWER(?)
      ORDER BY created_at DESC
    `, [userEmail]);

    const orderIds = orders.map(o => o.id);
    let itemsByOrder: Record<number, any[]> = {};

    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      const items = queryAll(`
        SELECT * FROM order_items
        WHERE order_id IN (${placeholders})
      `, orderIds);
      items.forEach(it => {
        if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
        itemsByOrder[it.order_id].push(it);
      });
    }

    const formatted = orders.map(o => ({
      ...o,
      items: itemsByOrder[o.id] || []
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve your orders.' });
  }
});

// -------------------------------------------------------------
// 9. ADMIN PROTECTED ROUTES (STRICTLY REQUIRE ADMIN ROLE)
// -------------------------------------------------------------

// Admin Dashboard Summary Stats (Real database calculations!)
router.get('/admin/stats', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const totalProducts = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM products WHERE is_active = 1')?.count || 0;
    const totalOrders = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM orders')?.count || 0;
    const totalRevenue = queryOne<{ sum: number }>('SELECT COALESCE(SUM(total), 0) as sum FROM orders WHERE status != "CANCELLED"')?.sum || 0;
    const pendingReviews = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM reviews WHERE status = "PENDING"')?.count || 0;

    const viewsEvents = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'PRODUCT_VIEW'")?.count || 0;
    const cartEvents = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'ADD_TO_CART'")?.count || 0;
    const checkoutEvents = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'CHECKOUT_STARTED'")?.count || 0;

    const recentOrders = queryAll(`
      SELECT o.*, 
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT 8
    `);

    res.json({
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingReviews,
      productViews: viewsEvents,
      addToCartEvents: cartEvents,
      checkoutEvents,
      recentOrders
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// Admin All Products Management
router.get('/admin/products', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const products = queryAll(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC
    `);

    const productIds = products.map(p => p.id);
    let imagesByProduct: Record<number, any[]> = {};
    let variantsByProduct: Record<number, any[]> = {};

    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      const images = queryAll(`SELECT * FROM product_images WHERE product_id IN (${placeholders}) ORDER BY is_main DESC, display_order ASC`, productIds);
      images.forEach(img => {
        if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
        imagesByProduct[img.product_id].push(img);
      });

      const variants = queryAll(`SELECT * FROM product_variants WHERE product_id IN (${placeholders}) ORDER BY id ASC`, productIds);
      variants.forEach(v => {
        if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
        variantsByProduct[v.product_id].push(v);
      });
    }

    const result = products.map(p => ({
      ...p,
      images: imagesByProduct[p.id] || [],
      variants: variantsByProduct[p.id] || []
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Admin Create Product
router.post('/admin/products', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      slug,
      category_id,
      description,
      materials,
      care_instructions,
      price,
      sale_price,
      sku,
      stock,
      is_featured,
      is_new_arrival,
      is_best_seller,
      is_active = 1,
      images = [],
      variants = []
    } = req.body;

    if (!name || price === undefined || !description) {
      res.status(400).json({ error: 'Product name, description, and price are required.' });
      return;
    }

    // Generate slug if missing
    let finalSlug = slug ? String(slug).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-') : name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    
    // Check slug collision
    const existing = queryOne('SELECT id FROM products WHERE slug = ?', [finalSlug]);
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const result = runTransaction(() => {
      const { lastInsertRowid: productId } = execute(`
        INSERT INTO products (
          name, slug, category_id, description, materials, care_instructions,
          price, sale_price, sku, stock, is_featured, is_new_arrival, is_best_seller, is_active, is_seed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `, [
        name.trim(),
        finalSlug,
        category_id ? Number(category_id) : null,
        description.trim(),
        materials ? materials.trim() : null,
        care_instructions ? care_instructions.trim() : null,
        Number(price),
        sale_price ? Number(sale_price) : null,
        sku ? sku.trim() : `LW-${Date.now().toString().slice(-5)}`,
        Number(stock) || 0,
        is_featured ? 1 : 0,
        is_new_arrival ? 1 : 0,
        is_best_seller ? 1 : 0,
        is_active ? 1 : 0
      ]);

      // Add images
      if (Array.isArray(images)) {
        images.forEach((img: any, idx: number) => {
          const imgUrl = typeof img === 'string' ? img : img.image_url || img.url;
          if (imgUrl) {
            execute(`
              INSERT INTO product_images (product_id, image_url, is_main, display_order)
              VALUES (?, ?, ?, ?)
            `, [productId, imgUrl, idx === 0 ? 1 : 0, idx]);
          }
        });
      }

      // Add variants
      if (Array.isArray(variants)) {
        variants.forEach((v: any) => {
          if (v.size && v.color) {
            execute(`
              INSERT INTO product_variants (product_id, size, color, stock, sku)
              VALUES (?, ?, ?, ?, ?)
            `, [productId, v.size.trim(), v.color.trim(), Number(v.stock) || 0, v.sku || null]);
          }
        });
      }

      return productId;
    });

    logAdminAction(req.user!.userId, req.user!.email, 'PRODUCT_CREATED', 'product', result, { name, price });
    res.status(201).json({ success: true, productId: result });
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({ error: error.message || 'Failed to create product' });
  }
});

// Admin Edit Product
router.put('/admin/products/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = Number(req.params.id);
    const {
      name,
      slug,
      category_id,
      description,
      materials,
      care_instructions,
      price,
      sale_price,
      sku,
      stock,
      is_featured,
      is_new_arrival,
      is_best_seller,
      is_active,
      images,
      variants
    } = req.body;

    const existingProduct = queryOne<any>('SELECT * FROM products WHERE id = ?', [productId]);
    if (!existingProduct) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const finalName = name !== undefined && name !== null ? String(name).trim() : existingProduct.name;
    const finalSlug = slug !== undefined && slug !== null ? String(slug).trim() : existingProduct.slug;
    const finalCatId = category_id !== undefined ? (category_id ? Number(category_id) : null) : existingProduct.category_id;
    const finalDesc = description !== undefined && description !== null ? String(description).trim() : existingProduct.description;
    const finalMaterials = materials !== undefined ? (materials ? String(materials).trim() : null) : existingProduct.materials;
    const finalCare = care_instructions !== undefined ? (care_instructions ? String(care_instructions).trim() : null) : existingProduct.care_instructions;
    const finalPrice = price !== undefined && price !== null && price !== '' ? Number(price) : existingProduct.price;
    const finalSalePrice = sale_price !== undefined ? (sale_price !== null && sale_price !== '' ? Number(sale_price) : null) : existingProduct.sale_price;
    const finalSku = sku !== undefined ? (sku ? String(sku).trim() : null) : existingProduct.sku;
    const finalStock = stock !== undefined && stock !== null && stock !== '' ? Number(stock) : existingProduct.stock;
    const finalFeatured = is_featured !== undefined ? (is_featured ? 1 : 0) : existingProduct.is_featured;
    const finalNew = is_new_arrival !== undefined ? (is_new_arrival ? 1 : 0) : existingProduct.is_new_arrival;
    const finalBest = is_best_seller !== undefined ? (is_best_seller ? 1 : 0) : existingProduct.is_best_seller;
    const finalActive = is_active !== undefined ? (is_active ? 1 : 0) : existingProduct.is_active;

    runTransaction(() => {
      execute(`
        UPDATE products SET
          name = ?,
          slug = ?,
          category_id = ?,
          description = ?,
          materials = ?,
          care_instructions = ?,
          price = ?,
          sale_price = ?,
          sku = ?,
          stock = ?,
          is_featured = ?,
          is_new_arrival = ?,
          is_best_seller = ?,
          is_active = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        finalName,
        finalSlug,
        finalCatId,
        finalDesc,
        finalMaterials,
        finalCare,
        finalPrice,
        finalSalePrice,
        finalSku,
        finalStock,
        finalFeatured,
        finalNew,
        finalBest,
        finalActive,
        productId
      ]);

      // Update images only if explicitly provided array
      if (Array.isArray(images) && images.length > 0) {
        execute('DELETE FROM product_images WHERE product_id = ?', [productId]);
        images.forEach((img: any, idx: number) => {
          const imgUrl = typeof img === 'string' ? img : img.image_url || img.url;
          const isMain = typeof img === 'object' && img.is_main ? 1 : (idx === 0 ? 1 : 0);
          if (imgUrl) {
            execute(`
              INSERT INTO product_images (product_id, image_url, is_main, display_order)
              VALUES (?, ?, ?, ?)
            `, [productId, imgUrl, isMain, idx]);
          }
        });
      }

      // Update variants only if explicitly provided array
      if (Array.isArray(variants) && variants.length > 0) {
        execute('DELETE FROM product_variants WHERE product_id = ?', [productId]);
        variants.forEach((v: any) => {
          if (v && v.size && v.color) {
            execute(`
              INSERT INTO product_variants (product_id, size, color, stock, sku)
              VALUES (?, ?, ?, ?, ?)
            `, [productId, String(v.size).trim(), String(v.color).trim(), Number(v.stock) || 0, v.sku ? String(v.sku).trim() : null]);
          }
        });
      }
    });

    logAdminAction(req.user!.userId, req.user!.email, 'PRODUCT_EDITED', 'product', productId, {
      oldPrice: existingProduct.price,
      newPrice: finalPrice,
      oldStock: existingProduct.stock,
      newStock: finalStock
    });

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({ error: error.message || 'Failed to update product' });
  }
});

// Admin Toggle Product Active State
router.post('/admin/products/:id/toggle', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = Number(req.params.id);
    const product = queryOne<{ is_active: number }>('SELECT is_active FROM products WHERE id = ?', [productId]);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const nextState = product.is_active === 1 ? 0 : 1;
    execute('UPDATE products SET is_active = ? WHERE id = ?', [nextState, productId]);
    logAdminAction(req.user!.userId, req.user!.email, nextState === 1 ? 'PRODUCT_ACTIVATED' : 'PRODUCT_DEACTIVATED', 'product', productId);

    res.json({ success: true, is_active: nextState });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to toggle product status' });
  }
});

// Admin Delete / Soft Deactivate Product
router.delete('/admin/products/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = Number(req.params.id);
    // Check if product is part of existing orders
    const orderCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?', [productId])?.count || 0;
    
    if (orderCount > 0) {
      // Soft deactivate so historical orders remain valid
      execute('UPDATE products SET is_active = 0 WHERE id = ?', [productId]);
      logAdminAction(req.user!.userId, req.user!.email, 'PRODUCT_SOFT_DELETED', 'product', productId, { reason: 'Has order history' });
      res.json({ success: true, message: 'Product has order history, so it was deactivated to preserve order records.' });
    } else {
      execute('DELETE FROM products WHERE id = ?', [productId]);
      logAdminAction(req.user!.userId, req.user!.email, 'PRODUCT_DELETED', 'product', productId);
      res.json({ success: true, message: 'Product deleted permanently.' });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Admin Orders Management
router.get('/admin/orders', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    let whereClauses: string[] = [];
    let params: any[] = [];

    if (status && status !== 'ALL') {
      whereClauses.push('o.status = ?');
      params.push(status);
    }

    if (search) {
      whereClauses.push('(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const orders = queryAll(`
      SELECT o.*
      FROM orders o
      ${whereSql}
      ORDER BY o.created_at DESC
    `, params);

    const orderIds = orders.map(o => o.id);
    let itemsByOrder: Record<number, any[]> = {};

    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      const items = queryAll(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`, orderIds);
      items.forEach(it => {
        if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
        itemsByOrder[it.order_id].push(it);
      });
    }

    const formatted = orders.map(o => ({
      ...o,
      items: itemsByOrder[o.id] || []
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.put('/admin/orders/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    const validStatuses = ['WHATSAPP_PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const currentOrder = queryOne<{ id: number; status: string; order_number: string }>('SELECT id, status, order_number FROM orders WHERE id = ?', [orderId]);
    if (!currentOrder) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    execute('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, orderId]);
    logAdminAction(req.user!.userId, req.user!.email, 'ORDER_STATUS_CHANGED', 'order', orderId, {
      orderNumber: currentOrder.order_number,
      oldStatus: currentOrder.status,
      newStatus: status
    });

    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Admin Reviews Moderation
router.get('/admin/reviews', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;
    let whereSql = '';
    let params: any[] = [];
    if (status && status !== 'ALL') {
      whereSql = 'WHERE r.status = ?';
      params.push(status);
    }

    const reviews = queryAll(`
      SELECT r.*, p.name as product_name, p.slug as product_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_main DESC, display_order ASC LIMIT 1) as product_image
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      ${whereSql}
      ORDER BY r.created_at DESC
    `, params);

    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.put('/admin/reviews/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const reviewId = Number(req.params.id);
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      res.status(400).json({ error: 'Status must be APPROVED, REJECTED, or PENDING' });
      return;
    }

    execute('UPDATE reviews SET status = ? WHERE id = ?', [status, reviewId]);
    logAdminAction(req.user!.userId, req.user!.email, `REVIEW_${status}`, 'review', reviewId);

    res.json({ success: true, status });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update review status' });
  }
});

router.delete('/admin/reviews/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const reviewId = Number(req.params.id);
    execute('DELETE FROM reviews WHERE id = ?', [reviewId]);
    logAdminAction(req.user!.userId, req.user!.email, 'REVIEW_DELETED', 'review', reviewId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Admin Categories Management
router.get('/admin/categories', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = queryAll(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.display_order ASC
    `);
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

router.post('/admin/categories', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, slug, description, display_order = 0 } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }

    const finalSlug = slug ? String(slug).trim().toLowerCase() : name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const { lastInsertRowid: id } = execute(`
      INSERT INTO categories (name, slug, description, display_order, is_active)
      VALUES (?, ?, ?, ?, 1)
    `, [name.trim(), finalSlug, description ? description.trim() : null, Number(display_order) || 0]);

    logAdminAction(req.user!.userId, req.user!.email, 'CATEGORY_CREATED', 'category', id, { name });
    res.status(201).json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create category' });
  }
});

router.put('/admin/categories/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, slug, description, display_order, is_active } = req.body;

    execute(`
      UPDATE categories SET
        name = ?,
        slug = ?,
        description = ?,
        display_order = ?,
        is_active = ?
      WHERE id = ?
    `, [name.trim(), slug.trim(), description || null, Number(display_order) || 0, is_active ? 1 : 0, id]);

    logAdminAction(req.user!.userId, req.user!.email, 'CATEGORY_EDITED', 'category', id, { name });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/admin/categories/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const prodCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id])?.count || 0;
    if (prodCount > 0) {
      res.status(400).json({ error: `Cannot delete category with ${prodCount} assigned products. Reassign products first.` });
      return;
    }

    execute('DELETE FROM categories WHERE id = ?', [id]);
    logAdminAction(req.user!.userId, req.user!.email, 'CATEGORY_DELETED', 'category', id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Admin Analytics (Real database analytics with funnel & time trends)
router.get('/admin/analytics', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Real Funnel Counts
    const visitorsCount = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'VISIT'")?.count || 0;
    const viewsCount = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'PRODUCT_VIEW'")?.count || 0;
    const cartCount = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'ADD_TO_CART'")?.count || 0;
    const checkoutCount = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'CHECKOUT_STARTED'")?.count || 0;
    const ordersCount = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM orders")?.count || 0;

    // 2. Revenue Summary
    const revSummary = queryOne<{ total_revenue: number; avg_order_value: number }>(`
      SELECT 
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(AVG(total), 0) as avg_order_value
      FROM orders
      WHERE status != 'CANCELLED'
    `);

    // 3. Daily Revenue (last 14 days)
    const dailyRevenue = queryAll(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE status != 'CANCELLED'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 14
    `);

    // 4. Top viewed products
    const topViewed = queryAll(`
      SELECT p.id, p.name, p.slug, p.views_count, p.price,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_main DESC, display_order ASC LIMIT 1) as image_url
      FROM products p
      ORDER BY p.views_count DESC
      LIMIT 5
    `);

    // 5. Best selling products (based on real order items)
    const bestSelling = queryAll(`
      SELECT oi.product_id, oi.product_name, oi.product_slug, oi.product_image,
        SUM(oi.quantity) as units_sold,
        SUM(oi.subtotal) as total_generated
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'CANCELLED'
      GROUP BY oi.product_id, oi.product_name
      ORDER BY units_sold DESC
      LIMIT 5
    `);

    res.json({
      funnel: {
        visitors: visitorsCount,
        productViews: viewsCount,
        addToCarts: cartCount,
        checkoutStarts: checkoutCount,
        orders: ordersCount
      },
      summary: {
        totalRevenue: revSummary?.total_revenue || 0,
        averageOrderValue: Math.round(revSummary?.avg_order_value || 0),
        totalOrders: ordersCount
      },
      dailyRevenue: dailyRevenue.reverse(),
      topViewed,
      bestSelling
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

// Admin Customers Aggregation (Real database customers from orders and user accounts)
router.get('/admin/customers', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const customers = queryAll(`
      SELECT 
        customer_phone,
        customer_name,
        customer_email,
        city,
        state,
        COUNT(*) as order_count,
        SUM(total) as total_spent,
        MAX(created_at) as last_order_date
      FROM orders
      WHERE status != 'CANCELLED'
      GROUP BY customer_phone
      ORDER BY total_spent DESC
      LIMIT 50
    `);

    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load customers' });
  }
});

// Admin Coupons Management
router.get('/admin/coupons', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const coupons = queryAll('SELECT * FROM coupons ORDER BY id DESC');
    res.json(coupons);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

router.post('/admin/coupons', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, discount_type = 'percentage', discount_value, min_order_amount = 0, expires_at } = req.body;
    if (!code || !discount_value) {
      res.status(400).json({ error: 'Coupon code and discount value are required.' });
      return;
    }

    const { lastInsertRowid: id } = execute(`
      INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `, [
      String(code).trim().toUpperCase(),
      discount_type,
      Number(discount_value),
      Number(min_order_amount) || 0,
      expires_at || null
    ]);

    logAdminAction(req.user!.userId, req.user!.email, 'COUPON_CREATED', 'coupon', id, { code });
    res.status(201).json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create coupon' });
  }
});

router.delete('/admin/coupons/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    execute('DELETE FROM coupons WHERE id = ?', [id]);
    logAdminAction(req.user!.userId, req.user!.email, 'COUPON_DELETED', 'coupon', id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// Admin Audit Logs
router.get('/admin/audit-logs', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = queryAll(`
      SELECT * FROM admin_audit_logs
      ORDER BY created_at DESC
      LIMIT 100
    `);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Admin Settings
router.get('/admin/settings', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = queryAll('SELECT key, value FROM settings');
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });
    res.json(settingsMap);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

router.put('/admin/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const entries = Object.entries(req.body);
    runTransaction(() => {
      for (const [key, value] of entries) {
        execute(`
          INSERT INTO settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
        `, [key, String(value), String(value)]);
      }
    });

    logAdminAction(req.user!.userId, req.user!.email, 'SETTINGS_UPDATED', 'settings', undefined, req.body);
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Admin Database Diagnostics & Reseed
router.get('/admin/database/diagnostics', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const productsCount = queryOne<{ count: number }>('SELECT count(*) as count FROM products')?.count || 0;
    const categoriesCount = queryOne<{ count: number }>('SELECT count(*) as count FROM categories')?.count || 0;
    const ordersCount = queryOne<{ count: number }>('SELECT count(*) as count FROM orders')?.count || 0;
    const reviewsCount = queryOne<{ count: number }>('SELECT count(*) as count FROM reviews')?.count || 0;
    const usersCount = queryOne<{ count: number }>('SELECT count(*) as count FROM users')?.count || 0;
    const couponsCount = queryOne<{ count: number }>('SELECT count(*) as count FROM coupons')?.count || 0;

    res.json({
      status: 'healthy',
      counts: {
        products: productsCount,
        categories: categoriesCount,
        orders: ordersCount,
        reviews: reviewsCount,
        users: usersCount,
        coupons: couponsCount
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Database diagnostics failed', details: err.message });
  }
});

router.post('/admin/database/reseed', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { force = false } = req.body || {};
    const result = reseedDatabase(force);
    logAdminAction(req.user!.userId, req.user!.email, 'DATABASE_RESEEDED', 'database', undefined, { force });
    res.json({ success: true, message: 'Database sample records restored successfully.', counts: result });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reseed database', details: err.message });
  }
});

export default router;
