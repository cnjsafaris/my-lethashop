import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../../src/lib/database';
import { AuthService } from '../../src/lib/auth';
const app = new Hono();
// CORS middleware
app.use('*', cors({
    origin: ['http://localhost:5173', 'https://your-netlify-domain.netlify.app'],
    credentials: true,
}));
// Helper function to check if user is admin
const isAdmin = (user) => {
    return user?.role === 'admin' || user?.email?.includes('admin') || user?.email?.endsWith('@lethashop.com');
};
// Authentication middleware
const authMiddleware = async (c, next) => {
    try {
        const authHeader = c.req.header('Authorization');
        const user = await AuthService.authenticateRequest(authHeader);
        c.set('user', user);
        await next();
    }
    catch (error) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
};
// Admin middleware
const adminMiddleware = async (c, next) => {
    const user = c.get('user');
    if (!user || !isAdmin(user)) {
        return c.json({ error: 'Unauthorized' }, 403);
    }
    await next();
};
// Validation schemas
const signUpSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
});
const signInSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});
const productSchema = z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    price: z.number().positive(),
    compare_at_price: z.number().positive().optional(),
    sku: z.string().optional(),
    inventory_quantity: z.number().int().min(0),
    image_url: z.string().url().optional(),
    materials: z.string().optional(),
    care_instructions: z.string().optional(),
    category_id: z.number().int().optional(),
    is_published: z.boolean().optional(),
    is_featured: z.boolean().optional(),
});
// Authentication routes
app.post('/auth/signup', zValidator('json', signUpSchema), async (c) => {
    try {
        const { email, password, name } = c.req.valid('json');
        const user = await AuthService.createUser({ email, password, name });
        const token = AuthService.generateToken(user.id);
        return c.json({ user, token });
    }
    catch (error) {
        return c.json({ error: error.message }, 400);
    }
});
app.post('/auth/signin', zValidator('json', signInSchema), async (c) => {
    try {
        const { email, password } = c.req.valid('json');
        const result = await AuthService.signIn({ email, password });
        return c.json(result);
    }
    catch (error) {
        return c.json({ error: error.message }, 400);
    }
});
app.get('/auth/me', authMiddleware, async (c) => {
    const user = c.get('user');
    return c.json(user);
});
app.post('/auth/signout', authMiddleware, async (c) => {
    // In a real app, you might want to blacklist the token
    return c.json({ message: 'Signed out successfully' });
});
app.put('/auth/profile', authMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const updateData = await c.req.json();
        const updatedUser = await AuthService.updateUser(user.id, updateData);
        return c.json(updatedUser);
    }
    catch (error) {
        return c.json({ error: error.message }, 400);
    }
});
// Public routes
app.get('/categories', async (c) => {
    try {
        const categories = await db.getAllCategories();
        return c.json(categories);
    }
    catch (error) {
        return c.json({ error: 'Failed to fetch categories' }, 500);
    }
});
app.get('/products', async (c) => {
    try {
        const category = c.req.query('category');
        const featured = c.req.query('featured') === 'true';
        let products;
        if (featured) {
            products = await db.getFeaturedProducts();
        }
        else if (category) {
            products = await db.getProductsByCategory(category);
        }
        else {
            products = await db.getAllProducts(false);
        }
        return c.json(products);
    }
    catch (error) {
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
    }
    catch (error) {
        return c.json({ error: 'Failed to fetch product' }, 500);
    }
});
// Protected routes (require authentication)
app.get('/cart', authMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const cartItems = await db.getCartItems(user.id);
        return c.json(cartItems);
    }
    catch (error) {
        return c.json({ error: 'Failed to fetch cart' }, 500);
    }
});
app.post('/cart/add', authMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const { product_id, quantity } = await c.req.json();
        await db.addToCart(user.id, product_id, quantity);
        return c.json({ message: 'Item added to cart' });
    }
    catch (error) {
        return c.json({ error: 'Failed to add item to cart' }, 500);
    }
});
app.put('/cart/:productId', authMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const productId = parseInt(c.req.param('productId'));
        const { quantity } = await c.req.json();
        await db.updateCartItem(user.id, productId, quantity);
        return c.json({ message: 'Cart updated' });
    }
    catch (error) {
        return c.json({ error: 'Failed to update cart' }, 500);
    }
});
app.delete('/cart/:productId', authMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const productId = parseInt(c.req.param('productId'));
        await db.removeFromCart(user.id, productId);
        return c.json({ message: 'Item removed from cart' });
    }
    catch (error) {
        return c.json({ error: 'Failed to remove item from cart' }, 500);
    }
});
app.post('/orders', authMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const orderData = await c.req.json();
        const order = await db.createOrder({ user_id: user.id, ...orderData });
        return c.json(order);
    }
    catch (error) {
        return c.json({ error: 'Failed to create order' }, 500);
    }
});
// Admin routes
app.get('/admin/products', authMiddleware, adminMiddleware, async (c) => {
    try {
        const products = await db.getAllProducts(true);
        return c.json(products);
    }
    catch (error) {
        return c.json({ error: 'Failed to fetch products' }, 500);
    }
});
app.post('/admin/products', authMiddleware, adminMiddleware, zValidator('json', productSchema), async (c) => {
    try {
        const productData = c.req.valid('json');
        const product = await db.createProduct(productData);
        return c.json(product);
    }
    catch (error) {
        return c.json({ error: error.message || 'Failed to create product' }, 500);
    }
});
app.put('/admin/products/:id', authMiddleware, adminMiddleware, zValidator('json', productSchema), async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        const productData = c.req.valid('json');
        const product = await db.updateProduct(id, productData);
        return c.json(product);
    }
    catch (error) {
        return c.json({ error: error.message || 'Failed to update product' }, 500);
    }
});
app.delete('/admin/products/:id', authMiddleware, adminMiddleware, async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        await db.deleteProduct(id);
        return c.json({ message: 'Product deleted successfully' });
    }
    catch (error) {
        return c.json({ error: 'Failed to delete product' }, 500);
    }
});
app.get('/admin/users', authMiddleware, adminMiddleware, async (c) => {
    try {
        const users = await db.getAllUsers();
        return c.json(users);
    }
    catch (error) {
        return c.json({ error: 'Failed to fetch users' }, 500);
    }
});
app.put('/admin/users/:id/status', authMiddleware, adminMiddleware, async (c) => {
    try {
        const id = c.req.param('id');
        const { is_active } = await c.req.json();
        if (is_active) {
            await db.activateUser(id);
        }
        else {
            await AuthService.deactivateUser(id);
        }
        return c.json({ message: 'User status updated' });
    }
    catch (error) {
        return c.json({ error: 'Failed to update user status' }, 500);
    }
});
app.get('/admin/orders', authMiddleware, adminMiddleware, async (c) => {
    try {
        const orders = await db.getAllOrders();
        return c.json(orders);
    }
    catch (error) {
        return c.json({ error: 'Failed to fetch orders' }, 500);
    }
});
app.put('/admin/orders/:id/status', authMiddleware, adminMiddleware, async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        const { status } = await c.req.json();
        await db.updateOrderStatus(id, status);
        return c.json({ message: 'Order status updated' });
    }
    catch (error) {
        return c.json({ error: 'Failed to update order status' }, 500);
    }
});
// Health check
app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 404 handler
app.notFound((c) => {
    return c.json({ error: 'Not found' }, 404);
});
// Error handler
app.onError((err, c) => {
    console.error('API Error:', err);
    return c.json({ error: 'Internal server error' }, 500);
});
// Netlify function handler
const handler = async (event, _context) => {
    const queryString = event.queryStringParameters
        ? '?' + Object.entries(event.queryStringParameters).map(([key, value]) => `${key}=${value}`).join('&')
        : '';
    const response = await app.fetch(new Request(`https://${event.headers.host}${event.path}${queryString}`, {
        method: event.httpMethod,
        headers: event.headers,
        body: event.body,
    }));
    return {
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: await response.text(),
    };
};
export { handler };
