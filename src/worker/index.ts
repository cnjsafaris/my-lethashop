/// <reference types="@cloudflare/workers-types" />

import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sign, verify } from "hono/jwt";

interface Env {
  JWT_SECRET: string;
  DB: D1Database;
}

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const app = new Hono<{ Bindings: Env; Variables: { user: User } }>();

app.use("*", cors());

// Auth middleware
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '') || getCookie(c, 'auth_token');

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    const user = await c.env.DB.prepare(
      "SELECT * FROM users WHERE id = ? AND is_active = 1"
    ).bind(payload.sub).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    c.set('user', user as User);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

// ------------------ AUTH ROUTES ------------------
app.post(
  "/api/auth/signin",
  zValidator("json", z.object({ email: z.string().email(), password: z.string() })),
  async (c) => {
    const { email } = c.req.valid("json");

    const user = await c.env.DB.prepare(
      "SELECT * FROM users WHERE email = ? AND is_active = 1"
    ).bind(email).first() as User;

    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // For demo purposes, accept any user. In production, verify password hash
    
    const token = await sign(
      { sub: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30) },
      c.env.JWT_SECRET
    );

    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    const { id, name, avatar_url, role, created_at, updated_at } = user;
    return c.json({ 
      user: { id, email, name, avatar_url, role, is_active: true, created_at, updated_at },
      token 
    });
  }
);

app.post(
  "/api/auth/signup",
  zValidator("json", z.object({ email: z.string().email(), password: z.string(), name: z.string().optional() })),
  async (c) => {
    const { email, name } = c.req.valid("json");

    // Check if user exists
    const existingUser = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email).first();

    if (existingUser) {
      return c.json({ error: "User already exists" }, 400);
    }

    // For demo purposes, don't store password. In production, hash and store it

    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      `INSERT INTO users (id, email, name, role, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(userId, email, name, 'user', 1, now, now).run();

    const token = await sign(
      { sub: userId, email, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30) },
      c.env.JWT_SECRET
    );

    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return c.json({ 
      user: { id: userId, email, name, role: 'user', is_active: true, created_at: now, updated_at: now },
      token 
    });
  }
);

app.get("/api/auth/google", async (c) => {
  // Simplified: redirect to Google OAuth (you'd need to implement full OAuth flow)
  return c.redirect(`https://accounts.google.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent('http://localhost:5173/auth/callback')}&response_type=code&scope=openid email profile`);
});

app.get("/api/auth/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.post("/api/auth/signout", async (c) => {
  setCookie(c, 'auth_token', '', {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true });
});

app.put(
  "/api/auth/profile",
  authMiddleware,
  zValidator("json", z.object({ name: z.string().optional(), avatar_url: z.string().optional() })),
  async (c) => {
    const user = c.get('user');
    const updates = c.req.valid("json");

    await c.env.DB.prepare(
      "UPDATE users SET name = COALESCE(?, name), avatar_url = COALESCE(?, avatar_url), updated_at = ? WHERE id = ?"
    ).bind(updates.name, updates.avatar_url, new Date().toISOString(), user.id).run();

    const updatedUser = await c.env.DB.prepare(
      "SELECT * FROM users WHERE id = ?"
    ).bind(user.id).first();

    return c.json(updatedUser);
  }
);

// ------------------ CATEGORIES ------------------
app.get("/api/categories", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM categories ORDER BY sort_order, name"
  ).all();

  return c.json(results);
});

// ------------------ PRODUCTS ------------------
app.get("/api/products", async (c) => {
  const categorySlug = c.req.query("category");
  const featured = c.req.query("featured");

  let query =
    "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_published = 1";
  const params: any[] = [];

  if (categorySlug) {
    query += " AND c.slug = ?";
    params.push(categorySlug);
  }

  if (featured === "true") {
    query += " AND p.is_featured = 1";
  }

  query += " ORDER BY p.created_at DESC";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  return c.json(results);
});

app.get("/api/products/:slug", async (c) => {
  const slug = c.req.param("slug");

  const product = await c.env.DB.prepare(
    "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ? AND p.is_published = 1"
  )
    .bind(slug)
    .first();

  if (!product) {
    return c.json({ error: "Product not found" }, 404);
  }

  return c.json(product);
});

// ------------------ CART ------------------
app.get("/api/cart", authMiddleware, async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    `SELECT c.*, p.name, p.price, p.image_urls FROM cart_items c 
     JOIN products p ON c.product_id = p.id 
     WHERE c.user_id = ?`
  ).bind(user.id).all();

  return c.json(results);
});

app.post("/api/cart", authMiddleware, zValidator("json", z.object({
  product_id: z.number(),
  quantity: z.number().min(1),
  size: z.string().optional(),
  color: z.string().optional()
})), async (c) => {
  const user = c.get('user');
  const { product_id, quantity, size, color } = c.req.valid("json");

  await c.env.DB.prepare(
    `INSERT INTO cart_items (user_id, product_id, quantity, size, color, created_at) 
     VALUES (?, ?, ?, ?, ?, ?) 
     ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + excluded.quantity`
  ).bind(user.id, product_id, quantity, size, color, new Date().toISOString()).run();

  return c.json({ success: true });
});

app.delete("/api/cart/:id", authMiddleware, async (c) => {
  const user = c.get('user');
  const itemId = c.req.param("id");

  await c.env.DB.prepare(
    "DELETE FROM cart_items WHERE id = ? AND user_id = ?"
  ).bind(itemId, user.id).run();

  return c.json({ success: true });
});

// ------------------ ADMIN ROUTES ------------------
app.post("/api/admin/products", authMiddleware, zValidator("json", z.object({
  name: z.string(),
  description: z.string(),
  price: z.number(),
  category_id: z.number(),
  is_featured: z.boolean().default(false),
  image_urls: z.string().optional()
})), async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const product = c.req.valid("json");
  const slug = product.name.toLowerCase().replace(/\s+/g, '-');
  const now = new Date().toISOString();

  const result = await c.env.DB.prepare(
    `INSERT INTO products (name, slug, description, price, category_id, is_featured, is_published, image_urls, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    product.name, slug, product.description, product.price, 
    product.category_id, product.is_featured ? 1 : 0, 1, 
    product.image_urls, now, now
  ).run();

  return c.json({ success: true, id: result.meta.last_row_id });
});

export default app;