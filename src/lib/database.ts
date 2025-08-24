import { Pool } from 'pg';

// Database connection pool
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Helper function to execute transactions
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Database models
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  sku?: string;
  inventory_quantity: number;
  image_url?: string;
  gallery_images?: any;
  materials?: string;
  care_instructions?: string;
  category_id?: number;
  category_name?: string;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  user_id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  created_at: string;
}

export interface CartItem {
  id: number;
  user_id: string;
  product_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

// Database service functions
export const db = {
  // Users
  async createUser(userData: Partial<User>): Promise<User> {
    const result = await query(
      `INSERT INTO users (email, name, avatar_url, role, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userData.email, userData.name, userData.avatar_url, userData.role || 'user', userData.is_active ?? true]
    );
    return result.rows[0];
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async getUserById(id: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const fields = Object.keys(userData).filter(key => key !== 'id');
    const values = fields.map(field => userData[field as keyof User]);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  },

  async getAllUsers(): Promise<User[]> {
    const result = await query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  },

  // Categories
  async getAllCategories(): Promise<Category[]> {
    const result = await query('SELECT * FROM categories ORDER BY sort_order ASC');
    return result.rows;
  },

  async createCategory(categoryData: Partial<Category>): Promise<Category> {
    const result = await query(
      `INSERT INTO categories (name, slug, description, parent_id, sort_order) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [categoryData.name, categoryData.slug, categoryData.description, categoryData.parent_id, categoryData.sort_order || 0]
    );
    return result.rows[0];
  },

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category> {
    const fields = Object.keys(categoryData).filter(key => key !== 'id');
    const values = fields.map(field => categoryData[field as keyof Category]);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE categories SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  },

  async deleteCategory(id: number): Promise<void> {
    await query('DELETE FROM categories WHERE id = $1', [id]);
  },

  // Products
  async getAllProducts(includeUnpublished = false): Promise<Product[]> {
    const whereClause = includeUnpublished ? '' : 'WHERE p.is_published = true';
    const result = await query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ${whereClause}
      ORDER BY p.created_at DESC
    `);
    return result.rows;
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    const result = await query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.slug = $1 AND p.is_published = true
    `, [slug]);
    return result.rows[0] || null;
  },

  async getProductsByCategory(categorySlug: string): Promise<Product[]> {
    const result = await query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE c.slug = $1 AND p.is_published = true
      ORDER BY p.created_at DESC
    `, [categorySlug]);
    return result.rows;
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const result = await query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_featured = true AND p.is_published = true
      ORDER BY p.created_at DESC
    `);
    return result.rows;
  },

  async createProduct(productData: Partial<Product>): Promise<Product> {
    const result = await query(`
      INSERT INTO products (
        name, slug, description, price, compare_at_price, sku, 
        inventory_quantity, image_url, gallery_images, materials, 
        care_instructions, category_id, is_published, is_featured
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
      RETURNING *
    `, [
      productData.name, productData.slug, productData.description, 
      productData.price, productData.compare_at_price, productData.sku,
      productData.inventory_quantity || 0, productData.image_url, 
      productData.gallery_images, productData.materials, 
      productData.care_instructions, productData.category_id,
      productData.is_published ?? true, productData.is_featured ?? false
    ]);
    return result.rows[0];
  },

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product> {
    const fields = Object.keys(productData).filter(key => key !== 'id' && key !== 'category_name');
    const values = fields.map(field => productData[field as keyof Product]);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE products SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  },

  async deleteProduct(id: number): Promise<void> {
    await query('DELETE FROM products WHERE id = $1', [id]);
  },

  // Orders
  async getAllOrders(): Promise<Order[]> {
    const result = await query('SELECT * FROM orders ORDER BY created_at DESC');
    return result.rows;
  },

  async getOrderById(id: number): Promise<Order | null> {
    const result = await query('SELECT * FROM orders WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    const result = await query(`
      INSERT INTO orders (
        user_id, order_number, status, total_amount,
        shipping_address_line1, shipping_address_line2, shipping_city, 
        shipping_state, shipping_postal_code, shipping_country,
        billing_address_line1, billing_address_line2, billing_city, 
        billing_state, billing_postal_code, billing_country, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
      RETURNING *
    `, [
      orderData.user_id, orderData.order_number, orderData.status || 'pending',
      orderData.total_amount, orderData.shipping_address_line1, 
      orderData.shipping_address_line2, orderData.shipping_city,
      orderData.shipping_state, orderData.shipping_postal_code, 
      orderData.shipping_country, orderData.billing_address_line1,
      orderData.billing_address_line2, orderData.billing_city,
      orderData.billing_state, orderData.billing_postal_code,
      orderData.billing_country, orderData.notes
    ]);
    return result.rows[0];
  },

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const result = await query(
      'UPDATE orders SET status = $2 WHERE id = $1 RETURNING *',
      [id, status]
    );
    return result.rows[0];
  },

  // Cart
  async getCartItems(userId: string): Promise<CartItem[]> {
    const result = await query(`
      SELECT ci.*, p.name, p.price, p.image_url 
      FROM cart_items ci 
      JOIN products p ON ci.product_id = p.id 
      WHERE ci.user_id = $1
    `, [userId]);
    return result.rows;
  },

  async addToCart(userId: string, productId: number, quantity: number): Promise<CartItem> {
    const result = await query(`
      INSERT INTO cart_items (user_id, product_id, quantity) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (user_id, product_id) 
      DO UPDATE SET quantity = cart_items.quantity + $3, updated_at = NOW()
      RETURNING *
    `, [userId, productId, quantity]);
    return result.rows[0];
  },

  async updateCartItem(userId: string, productId: number, quantity: number): Promise<CartItem> {
    const result = await query(`
      UPDATE cart_items 
      SET quantity = $3, updated_at = NOW() 
      WHERE user_id = $1 AND product_id = $2 
      RETURNING *
    `, [userId, productId, quantity]);
    return result.rows[0];
  },

  async removeFromCart(userId: string, productId: number): Promise<void> {
    await query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [userId, productId]);
  },

  async clearCart(userId: string): Promise<void> {
    await query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
  }
};