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
import { db } from '../../src/lib/database';

// Helper function to check if user is admin
const isAdmin = (user: any) => {
  return user?.email?.includes('admin') || user?.email?.endsWith('@lethashop.com');
};

// Admin middleware
const adminMiddleware = async (c: any, next: any) => {
  const user = c.get('user');
  if (!user || !isAdmin(user)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  await next();
};

// User registration middleware
const registerUserMiddleware = async (c: any, next: any) => {
  const user = c.get('user');
  if (user) {
    try {
      // Check if user exists in our database
      const existingUser = await db.getUserByEmail(user.email);
      if (!existingUser) {
        // Create user in our database
        await db.createUser({
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          role: isAdmin(user) ? 'admin' : 'user',
          is_active: true
        });
      }
    } catch (error) {
      console.error('Error registering user:', error);
    }
  }
  await next();
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

app.get('/users/me', authMiddleware, registerUserMiddleware, async (c) => {
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
    const categories = await db.getAllCategories();
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

    let products;

    if (categorySlug) {
      products = await db.getProductsByCategory(categorySlug);
    } else if (featured === 'true') {
      products = await db.getFeaturedProducts();
    } else {
      products = await db.getAllProducts(false); // Only published products
    }

    return c.json(products);
  } catch (error) {
    console.error('Products error:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

app.get('/products/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const product = await db.getProductBySlug(slug);

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    return c.json(product);
  } catch (error) {
    console.error('Product error:', error);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
});

// ------------------ CART ROUTES ------------------
app.get('/cart', authMiddleware, registerUserMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }
    const cartItems = await db.getCartItems(user.id);
    return c.json(cartItems);
  } catch (error) {
    console.error('Cart error:', error);
    return c.json({ error: 'Failed to fetch cart' }, 500);
  }
});

app.post('/cart/add', authMiddleware, registerUserMiddleware, zValidator('json', z.object({
  product_id: z.number(),
  quantity: z.number().min(1),
})), async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }
    const body = c.req.valid('json');
    
    const cartItem = await db.addToCart(user.id, body.product_id, body.quantity);
    return c.json(cartItem);
  } catch (error) {
    console.error('Add to cart error:', error);
    return c.json({ error: 'Failed to add to cart' }, 500);
  }
});

app.put('/cart/:productId', authMiddleware, registerUserMiddleware, zValidator('json', z.object({
  quantity: z.number().min(1),
})), async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }
    const productId = parseInt(c.req.param('productId'));
    const body = c.req.valid('json');
    
    const cartItem = await db.updateCartItem(user.id, productId, body.quantity);
    return c.json(cartItem);
  } catch (error) {
    console.error('Update cart error:', error);
    return c.json({ error: 'Failed to update cart' }, 500);
  }
});

app.delete('/cart/:productId', authMiddleware, registerUserMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }
    const productId = parseInt(c.req.param('productId'));
    
    await db.removeFromCart(user.id, productId);
    return c.json({ success: true });
  } catch (error) {
    console.error('Remove from cart error:', error);
    return c.json({ error: 'Failed to remove from cart' }, 500);
  }
});

app.delete('/cart', authMiddleware, registerUserMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }
    await db.clearCart(user.id);
    return c.json({ success: true });
  } catch (error) {
    console.error('Clear cart error:', error);
    return c.json({ error: 'Failed to clear cart' }, 500);
  }
});

// ------------------ ADMIN ROUTES ------------------

// Admin Products
app.get('/admin/products', authMiddleware, registerUserMiddleware, adminMiddleware, async (c) => {
  try {
    const products = await db.getAllProducts(true); // Include unpublished products
    return c.json(products);
  } catch (error) {
    console.error('Admin products error:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

app.post('/admin/products', authMiddleware, registerUserMiddleware, adminMiddleware, zValidator('json', z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  price: z.number(),
  compare_at_price: z.number().optional(),
  sku: z.string().optional(),
  inventory_quantity: z.number().default(0),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(true),
  category_id: z.number().optional(),
  image_url: z.string().optional(),
  materials: z.string().optional(),
  care_instructions: z.string().optional(),
})), async (c) => {
  try {
    const body = c.req.valid('json');
    const product = await db.createProduct(body);
    return c.json({ id: product.id, message: 'Product created successfully' });
  } catch (error) {
    console.error('Create product error:', error);
    return c.json({ error: 'Failed to create product' }, 500);
  }
});

app.put('/admin/products/:id', authMiddleware, registerUserMiddleware, adminMiddleware, zValidator('json', z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  price: z.number(),
  compare_at_price: z.number().optional(),
  sku: z.string().optional(),
  inventory_quantity: z.number().default(0),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(true),
  category_id: z.number().optional(),
  image_url: z.string().optional(),
  materials: z.string().optional(),
  care_instructions: z.string().optional(),
})), async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = c.req.valid('json');
    
    const product = await db.updateProduct(id, body);
    return c.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    return c.json({ error: 'Failed to update product' }, 500);
  }
});

app.delete('/admin/products/:id', authMiddleware, registerUserMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    await db.deleteProduct(id);
    return c.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return c.json({ error: 'Failed to delete product' }, 500);
  }
});

// Admin Users
app.get('/admin/users', authMiddleware, registerUserMiddleware, adminMiddleware, async (c) => {
  try {
    const users = await db.getAllUsers();
    return c.json(users);
  } catch (error) {
    console.error('Admin users error:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

app.put('/admin/users/:id/status', authMiddleware, registerUserMiddleware, adminMiddleware, zValidator('json', z.object({
  is_active: z.boolean(),
})), async (c) => {
  try {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    
    await db.updateUser(id, { is_active: body.is_active });
    return c.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Update user status error:', error);
    return c.json({ error: 'Failed to update user status' }, 500);
  }
});

app.put('/admin/users/:id/role', authMiddleware, registerUserMiddleware, adminMiddleware, zValidator('json', z.object({
  role: z.enum(['admin', 'user']),
})), async (c) => {
  try {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    
    await db.updateUser(id, { role: body.role });
    return c.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    return c.json({ error: 'Failed to update user role' }, 500);
  }
});

// Admin Orders
app.get('/admin/orders', authMiddleware, registerUserMiddleware, adminMiddleware, async (c) => {
  try {
    const orders = await db.getAllOrders();
    return c.json(orders);
  } catch (error) {
    console.error('Admin orders error:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

app.put('/admin/orders/:id/status', authMiddleware, registerUserMiddleware, adminMiddleware, zValidator('json', z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
})), async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = c.req.valid('json');
    
    await db.updateOrderStatus(id, body.status);
    return c.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    return c.json({ error: 'Failed to update order status' }, 500);
  }
});

app.get('/admin/orders/:id', authMiddleware, registerUserMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const order = await db.getOrderById(id);
    
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    return c.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    return c.json({ error: 'Failed to fetch order' }, 500);
  }
});

// Admin Categories
app.post('/admin/categories', authMiddleware, registerUserMiddleware, adminMiddleware, zValidator('json', z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  parent_id: z.number().optional(),
  sort_order: z.number().default(0),
})), async (c) => {
  try {
    const body = c.req.valid('json');
    const category = await db.createCategory(body);
    return c.json({ id: category.id, message: 'Category created successfully' });
  } catch (error) {
    console.error('Create category error:', error);
    return c.json({ error: 'Failed to create category' }, 500);
  }
});

app.put('/admin/categories/:id', authMiddleware, registerUserMiddleware, adminMiddleware, zValidator('json', z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  parent_id: z.number().optional(),
  sort_order: z.number().default(0),
})), async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = c.req.valid('json');
    
    await db.updateCategory(id, body);
    return c.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    return c.json({ error: 'Failed to update category' }, 500);
  }
});

app.delete('/admin/categories/:id', authMiddleware, registerUserMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    // Check if any products are using this category
    const products = await db.getAllProducts(true);
    const productsUsingCategory = products.filter(p => p.category_id === id);
    if (productsUsingCategory.length > 0) {
      return c.json({ error: 'Cannot delete category with associated products' }, 400);
    }
    
    await db.deleteCategory(id);
    return c.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    return c.json({ error: 'Failed to delete category' }, 500);
  }
});

// ------------------ ORDER ROUTES ------------------
app.post('/orders', authMiddleware, registerUserMiddleware, zValidator('json', z.object({
  items: z.array(z.object({
    product_id: z.number(),
    quantity: z.number(),
    price: z.number(),
  })),
  total_amount: z.number(),
  shipping_address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postal_code: z.string(),
    country: z.string(),
  }),
  billing_address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postal_code: z.string(),
    country: z.string(),
  }).optional(),
  notes: z.string().optional(),
})), async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }
    const body = c.req.valid('json');
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Use billing address same as shipping if not provided
    const billingAddress = body.billing_address || body.shipping_address;
    
    const order = await db.createOrder({
      user_id: user.id,
      order_number: orderNumber,
      status: 'pending',
      total_amount: body.total_amount,
      shipping_address_line1: body.shipping_address.line1,
      shipping_address_line2: body.shipping_address.line2,
      shipping_city: body.shipping_address.city,
      shipping_state: body.shipping_address.state,
      shipping_postal_code: body.shipping_address.postal_code,
      shipping_country: body.shipping_address.country,
      billing_address_line1: billingAddress.line1,
      billing_address_line2: billingAddress.line2,
      billing_city: billingAddress.city,
      billing_state: billingAddress.state,
      billing_postal_code: billingAddress.postal_code,
      billing_country: billingAddress.country,
      notes: body.notes,
    });
    
    // Clear the user's cart after successful order
    await db.clearCart(user.id);
    
    return c.json({ order_id: order.id, order_number: order.order_number });
  } catch (error) {
    console.error('Create order error:', error);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

// Convert Hono app to Netlify Function
export const handler: Handler = async (event, context) => {
  try {
    // Handle query string parameters properly
    let queryString = '';
    if (event.queryStringParameters) {
      const params = new URLSearchParams();
      Object.entries(event.queryStringParameters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params.append(key, value);
        }
      });
      const paramString = params.toString();
      if (paramString) {
        queryString = '?' + paramString;
      }
    }

    const request = new Request(
      `https://netlify.app${event.path}${queryString}`,
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