import { Handler } from '@netlify/functions';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from '@getmocha/users-service/backend';
import { getCookie, setCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

// Simple in-memory store for development (replace with actual database for production)
const db = {
  categories: [
    { id: 1, name: 'Jackets', slug: 'jackets', sort_order: 1 },
    { id: 2, name: 'Bags', slug: 'bags', sort_order: 2 },
    { id: 3, name: 'Shoes', slug: 'shoes', sort_order: 3 },
    { id: 4, name: 'Accessories', slug: 'accessories', sort_order: 4 },
  ],
  products: [
    {
      id: 1,
      name: 'Classic Leather Jacket',
      slug: 'classic-leather-jacket',
      description: 'Premium handcrafted leather jacket',
      price: 299.99,
      image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
      category_id: 1,
      category_name: 'Jackets',
      is_published: 1,
      is_featured: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Leather Messenger Bag',
      slug: 'leather-messenger-bag',
      description: 'Stylish leather messenger bag for professionals',
      price: 179.99,
      image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
      category_id: 2,
      category_name: 'Bags',
      is_published: 1,
      is_featured: 1,
      created_at: new Date().toISOString()
    },
  ]
};

const app = new Hono();

app.use('*', cors({
  origin: ['http://localhost:5173', 'https://your-netlify-site.netlify.app'],
  credentials: true,
}));

// ------------------ AUTH ROUTES ------------------
app.get('/oauth/google/redirect_url', async (c) => {
  try {
    const redirectUrl = await getOAuthRedirectUrl('google', {
      apiUrl: process.env.MOCHA_USERS_SERVICE_API_URL || '',
      apiKey: process.env.MOCHA_USERS_SERVICE_API_KEY || '',
    });

    return c.json({ redirectUrl }, 200);
  } catch (error) {
    console.error('OAuth redirect error:', error);
    return c.json({ error: 'Failed to generate redirect URL' }, 500);
  }
});

app.post(
  '/sessions',
  zValidator('json', z.object({ code: z.string() })),
  async (c) => {
    try {
      const body = c.req.valid('json');

      const sessionToken = await exchangeCodeForSessionToken(body.code, {
        apiUrl: process.env.MOCHA_USERS_SERVICE_API_URL || '',
        apiKey: process.env.MOCHA_USERS_SERVICE_API_KEY || '',
      });

      setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        path: '/',
        sameSite: 'none',
        secure: true,
        maxAge: 60 * 24 * 60 * 60, // 60 days
      });

      return c.json({ success: true }, 200);
    } catch (error) {
      console.error('Session creation error:', error);
      return c.json({ error: 'Failed to create session' }, 500);
    }
  }
);

app.get('/users/me', authMiddleware, async (c) => {
  return c.json(c.get('user'));
});

app.get('/logout', async (c) => {
  try {
    const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

    if (typeof sessionToken === 'string') {
      await deleteSession(sessionToken, {
        apiUrl: process.env.MOCHA_USERS_SERVICE_API_URL || '',
        apiKey: process.env.MOCHA_USERS_SERVICE_API_KEY || '',
      });
    }

    setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
      httpOnly: true,
      path: '/',
      sameSite: 'none',
      secure: true,
      maxAge: 0,
    });

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Failed to logout' }, 500);
  }
});

// ------------------ CATEGORIES ------------------
app.get('/categories', async (c) => {
  try {
    // In production, replace with actual database query
    const categories = db.categories.sort((a, b) => a.sort_order - b.sort_order);
    return c.json(categories);
  } catch (error) {
    console.error('Categories error:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// ------------------ PRODUCTS ------------------
app.get('/products', async (c) => {
  try {
    const categorySlug = c.req.query('category');
    const featured = c.req.query('featured');

    let products = db.products.filter(p => p.is_published === 1);

    if (categorySlug) {
      const category = db.categories.find(cat => cat.slug === categorySlug);
      if (category) {
        products = products.filter(p => p.category_id === category.id);
      }
    }

    if (featured === 'true') {
      products = products.filter(p => p.is_featured === 1);
    }

    products = products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return c.json(products);
  } catch (error) {
    console.error('Products error:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

app.get('/products/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const product = db.products.find(p => p.slug === slug && p.is_published === 1);

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    return c.json(product);
  } catch (error) {
    console.error('Product error:', error);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
});

// Convert Hono app to Netlify Function
export const handler: Handler = async (event, context) => {
  try {
    const request = new Request(
      `https://netlify.app${event.path}${event.queryStringParameters ? '?' + new URLSearchParams(event.queryStringParameters).toString() : ''}`,
      {
        method: event.httpMethod,
        headers: event.headers as Record<string, string>,
        body: event.body ? event.body : undefined,
      }
    );

    const response = await app.fetch(request);
    const body = await response.text();

    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: body,
    };
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};