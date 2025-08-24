/// <reference types="@cloudflare/workers-types" />

import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { getCookie, setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

/**
 * Env type – all secrets are required
 * (you’ll need to provide these in Cloudflare Workers / Netlify environment variables)
 */
interface Env {
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
  DB: D1Database;

}

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

// ------------------ AUTH ROUTES ------------------
app.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post(
  "/api/sessions",
  zValidator("json", z.object({ code: z.string() })),
  async (c) => {
    const body = c.req.valid("json");

    const sessionToken = await exchangeCodeForSessionToken(body.code, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });

    setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 60 * 24 * 60 * 60, // 60 days
    });

    return c.json({ success: true }, 200);
  }
);

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

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

// ------------------ CART, ADMIN, ORDERS, MPESA ------------------
// keep your existing endpoints as they were…

export default app;
