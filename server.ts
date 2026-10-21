import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getDb, queryAll } from './server/db.ts';
import { authMiddleware } from './server/auth.ts';
import apiRoutes from './server/routes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Initialize Database
  console.log('[LUXEWEAR] Initializing database...');
  await getDb();
  console.log('[LUXEWEAR] Database initialized successfully.');

  // Global Middlewares
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(cookieParser());
  app.use(authMiddleware);

  // Serve persistent uploads
  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // SEO: robots.txt
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin/*\nSitemap: ${process.env.APP_URL || ''}/sitemap.xml\n`);
  });

  // SEO: sitemap.xml
  app.get('/sitemap.xml', (_req, res) => {
    try {
      const baseUrl = process.env.APP_URL || 'https://luxewear.com';
      const products = queryAll<{ slug: string; updated_at: string }>('SELECT slug, updated_at FROM products WHERE is_active = 1');
      const categories = queryAll<{ slug: string }>('SELECT slug FROM categories WHERE is_active = 1');

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      xml += `  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
      xml += `  <url><loc>${baseUrl}/shop</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
      xml += `  <url><loc>${baseUrl}/about</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;

      categories.forEach(c => {
        xml += `  <url><loc>${baseUrl}/shop?category=${c.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
      });

      products.forEach(p => {
        xml += `  <url><loc>${baseUrl}/product/${p.slug}</loc><lastmod>${p.updated_at ? p.updated_at.split(' ')[0] : '2026-10-04'}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
      });

      xml += `</urlset>`;
      res.type('application/xml');
      res.send(xml);
    } catch (err) {
      res.status(500).send('Error generating sitemap');
    }
  });

  // Mount API Routes
  app.use('/api', apiRoutes);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', brand: 'LUXEWEAR', timestamp: new Date().toISOString() });
  });

  // Frontend integration: Vite middleware in Dev, Static in Prod
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LUXEWEAR] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[LUXEWEAR] Fatal server startup error:', err);
  process.exit(1);
});
