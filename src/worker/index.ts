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

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

// Auth routes
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", zValidator("json", z.object({ code: z.string() })), async (c) => {
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
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
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
});

// Categories API
app.get("/api/categories", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM categories ORDER BY sort_order, name"
  ).all();
  
  return c.json(results);
});

// Products API
app.get("/api/products", async (c) => {
  const categorySlug = c.req.query("category");
  const featured = c.req.query("featured");
  
  let query = "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_published = 1";
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
  ).bind(slug).first();
  
  if (!product) {
    return c.json({ error: "Product not found" }, 404);
  }
  
  return c.json(product);
});

// Cart API (protected routes)
app.get("/api/cart", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const { results } = await c.env.DB.prepare(`
    SELECT ci.*, p.name as product_name, p.price, p.image_url 
    FROM cart_items ci 
    JOIN products p ON ci.product_id = p.id 
    WHERE ci.user_id = ? 
    ORDER BY ci.created_at DESC
  `).bind(user!.id).all();
  
  return c.json(results);
});

app.post("/api/cart", authMiddleware, zValidator("json", z.object({
  product_id: z.number(),
  quantity: z.number().positive(),
  size: z.string().optional(),
  color: z.string().optional(),
})), async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");
  
  // Check if item already exists
  const existing = await c.env.DB.prepare(
    "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?"
  ).bind(user!.id, body.product_id, body.size || null, body.color || null).first();
  
  if (existing) {
    // Update quantity
    await c.env.DB.prepare(
      "UPDATE cart_items SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(body.quantity, existing.id).run();
  } else {
    // Insert new item
    await c.env.DB.prepare(
      "INSERT INTO cart_items (user_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?)"
    ).bind(user!.id, body.product_id, body.quantity, body.size || null, body.color || null).run();
  }
  
  return c.json({ success: true });
});

app.delete("/api/cart/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const itemId = c.req.param("id");
  
  await c.env.DB.prepare(
    "DELETE FROM cart_items WHERE id = ? AND user_id = ?"
  ).bind(itemId, user!.id).run();
  
  return c.json({ success: true });
});

// Admin API endpoints (protected)
app.post("/api/admin/products", authMiddleware, zValidator("json", z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  compare_at_price: z.number().positive().optional(),
  sku: z.string().optional(),
  inventory_quantity: z.number().min(0).default(0),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(true),
  category_id: z.number().optional(),
  image_url: z.string().url().optional(),
  materials: z.string().optional(),
  care_instructions: z.string().optional(),
})), async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");
  
  // Simple admin check - in production, you'd want proper role-based auth
  if (!user?.email?.includes('admin') && !user?.email?.endsWith('@lethashop.com')) {
    return c.json({ error: "Admin access required" }, 403);
  }
  
  try {
    const result = await c.env.DB.prepare(`
      INSERT INTO products (
        name, slug, description, price, compare_at_price, sku, 
        inventory_quantity, is_featured, is_published, category_id, 
        image_url, materials, care_instructions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.name,
      body.slug,
      body.description || null,
      body.price,
      body.compare_at_price || null,
      body.sku || null,
      body.inventory_quantity,
      body.is_featured ? 1 : 0,
      body.is_published ? 1 : 0,
      body.category_id || null,
      body.image_url || null,
      body.materials || null,
      body.care_instructions || null
    ).run();
    
    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return c.json({ error: "Product slug already exists" }, 400);
    }
    return c.json({ error: "Failed to create product" }, 500);
  }
});

app.delete("/api/admin/products/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const productId = c.req.param("id");
  
  // Simple admin check - in production, you'd want proper role-based auth
  if (!user?.email?.includes('admin') && !user?.email?.endsWith('@lethashop.com')) {
    return c.json({ error: "Admin access required" }, 403);
  }
  
  try {
    // First check if product exists
    const product = await c.env.DB.prepare(
      "SELECT id FROM products WHERE id = ?"
    ).bind(productId).first();
    
    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }
    
    // Delete the product
    await c.env.DB.prepare(
      "DELETE FROM products WHERE id = ?"
    ).bind(productId).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete product" }, 500);
  }
});

app.put("/api/admin/products/:id", authMiddleware, zValidator("json", z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  compare_at_price: z.number().positive().optional(),
  sku: z.string().optional(),
  inventory_quantity: z.number().min(0),
  is_featured: z.boolean(),
  is_published: z.boolean(),
  category_id: z.number().optional(),
  image_url: z.string().url().optional(),
  materials: z.string().optional(),
  care_instructions: z.string().optional(),
})), async (c) => {
  const user = c.get("user");
  const productId = c.req.param("id");
  const body = c.req.valid("json");
  
  // Simple admin check - in production, you'd want proper role-based auth
  if (!user?.email?.includes('admin') && !user?.email?.endsWith('@lethashop.com')) {
    return c.json({ error: "Admin access required" }, 403);
  }
  
  try {
    // Check if product exists
    const product = await c.env.DB.prepare(
      "SELECT id FROM products WHERE id = ?"
    ).bind(productId).first();
    
    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }
    
    // Update the product
    await c.env.DB.prepare(`
      UPDATE products SET 
        name = ?, slug = ?, description = ?, price = ?, compare_at_price = ?, 
        sku = ?, inventory_quantity = ?, is_featured = ?, is_published = ?, 
        category_id = ?, image_url = ?, materials = ?, care_instructions = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.name,
      body.slug,
      body.description || null,
      body.price,
      body.compare_at_price || null,
      body.sku || null,
      body.inventory_quantity,
      body.is_featured ? 1 : 0,
      body.is_published ? 1 : 0,
      body.category_id || null,
      body.image_url || null,
      body.materials || null,
      body.care_instructions || null,
      productId
    ).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return c.json({ error: "Product slug already exists" }, 400);
    }
    return c.json({ error: "Failed to update product" }, 500);
  }
});

// Orders API
app.post("/api/orders", authMiddleware, zValidator("json", z.object({
  items: z.array(z.object({
    id: z.number(),
    product_id: z.number(),
    quantity: z.number(),
    price: z.number(),
  })),
  total_amount: z.number(),
  shipping_address: z.object({
    line1: z.string(),
    city: z.string(),
    postal_code: z.string().optional(),
    country: z.string(),
  }),
  customer_info: z.object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
    phone: z.string(),
  }),
})), async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");
  
  try {
    // Generate order number
    const orderNumber = `LS-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Create order
    const orderResult = await c.env.DB.prepare(`
      INSERT INTO orders (
        user_id, order_number, status, total_amount,
        shipping_address_line1, shipping_city, shipping_postal_code, shipping_country
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user!.id,
      orderNumber,
      'pending',
      body.total_amount,
      body.shipping_address.line1,
      body.shipping_address.city,
      body.shipping_address.postal_code || null,
      body.shipping_address.country
    ).run();
    
    const orderId = orderResult.meta.last_row_id;
    
    // Create order items
    for (const item of body.items) {
      await c.env.DB.prepare(`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `).bind(orderId, item.product_id, item.quantity, item.price).run();
    }
    
    return c.json({ 
      id: orderId, 
      order_number: orderNumber,
      status: 'pending'
    });
  } catch (error) {
    return c.json({ error: "Failed to create order" }, 500);
  }
});

app.get("/api/orders/:id/status", authMiddleware, async (c) => {
  const user = c.get("user");
  const orderId = c.req.param("id");
  
  const order = await c.env.DB.prepare(
    "SELECT * FROM orders WHERE id = ? AND user_id = ?"
  ).bind(orderId, user!.id).first();
  
  if (!order) {
    return c.json({ error: "Order not found" }, 404);
  }
  
  return c.json(order);
});

// M-Pesa Payment API
app.post("/api/payments/mpesa/stkpush", authMiddleware, zValidator("json", z.object({
  phone_number: z.string(),
  amount: z.number(),
  order_id: z.number(),
  account_reference: z.string(),
  transaction_desc: z.string(),
})), async (c) => {
  const body = c.req.valid("json");
  
  try {
    // Get M-Pesa access token
    const authUrl = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    const authCredentials = btoa(`${c.env.MPESA_CONSUMER_KEY}:${c.env.MPESA_CONSUMER_SECRET}`);
    
    const authResponse = await fetch(authUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authCredentials}`,
      },
    });
    
    const authData = await authResponse.json() as { access_token?: string };
    
    if (!authData.access_token) {
      throw new Error('Failed to get M-Pesa access token');
    }
    
    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = btoa(`${c.env.MPESA_SHORTCODE}${c.env.MPESA_PASSKEY}${timestamp}`);
    
    // STK Push request
    const stkPushUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    const stkPushData = {
      BusinessShortCode: c.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: body.amount,
      PartyA: body.phone_number,
      PartyB: c.env.MPESA_SHORTCODE,
      PhoneNumber: body.phone_number,
      CallBackURL: `${new URL(c.req.url).origin}/api/payments/mpesa/callback`,
      AccountReference: body.account_reference,
      TransactionDesc: body.transaction_desc,
    };
    
    const stkResponse = await fetch(stkPushUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushData),
    });
    
    const stkResult = await stkResponse.json() as {
      ResponseCode?: string;
      CheckoutRequestID?: string;
      MerchantRequestID?: string;
      ResponseDescription?: string;
      errorMessage?: string;
    };
    
    if (stkResult.ResponseCode === '0') {
      // Store payment request for tracking
      await c.env.DB.prepare(`
        INSERT INTO payment_requests (
          order_id, checkout_request_id, merchant_request_id, 
          phone_number, amount, status
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        body.order_id,
        stkResult.CheckoutRequestID,
        stkResult.MerchantRequestID,
        body.phone_number,
        body.amount,
        'pending'
      ).run();
    }
    
    return c.json(stkResult);
  } catch (error: any) {
    return c.json({ 
      error: "Payment initiation failed",
      details: error.message 
    }, 500);
  }
});

app.post("/api/payments/mpesa/callback", async (c) => {
  try {
    const body = await c.req.json();
    const stkCallback = body.Body?.stkCallback;
    
    if (!stkCallback) {
      return c.json({ success: false });
    }
    
    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    
    // Find the payment request
    const paymentRequest = await c.env.DB.prepare(
      "SELECT * FROM payment_requests WHERE checkout_request_id = ?"
    ).bind(checkoutRequestId).first();
    
    if (!paymentRequest) {
      return c.json({ success: false });
    }
    
    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
      const mpesaReceiptNumber = callbackMetadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      
      // Update payment request
      await c.env.DB.prepare(`
        UPDATE payment_requests 
        SET status = ?, mpesa_receipt_number = ?, updated_at = CURRENT_TIMESTAMP
        WHERE checkout_request_id = ?
      `).bind('completed', mpesaReceiptNumber, checkoutRequestId).run();
      
      // Update order status
      await c.env.DB.prepare(`
        UPDATE orders 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind('paid', paymentRequest.order_id).run();
      
    } else {
      // Payment failed
      await c.env.DB.prepare(`
        UPDATE payment_requests 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE checkout_request_id = ?
      `).bind('failed', checkoutRequestId).run();
      
      await c.env.DB.prepare(`
        UPDATE orders 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind('failed', paymentRequest.order_id).run();
    }
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false });
  }
});

// Clear cart endpoint
app.delete("/api/cart", authMiddleware, async (c) => {
  const user = c.get("user");
  
  await c.env.DB.prepare(
    "DELETE FROM cart_items WHERE user_id = ?"
  ).bind(user!.id).run();
  
  return c.json({ success: true });
});

export default app;
