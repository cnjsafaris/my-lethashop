-- LeatherShop Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT true,
    google_id VARCHAR(255) UNIQUE,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2),
    sku VARCHAR(100) UNIQUE,
    inventory_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    gallery_images JSONB,
    materials TEXT,
    care_instructions TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address JSONB,
    billing_address JSONB,
    payment_method VARCHAR(100),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_published ON products(is_published);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
('Jackets', 'jackets', 'Premium leather jackets for all occasions', 1),
('Bags', 'bags', 'Handcrafted leather bags and accessories', 2),
('Shoes', 'shoes', 'Luxury leather footwear', 3),
('Accessories', 'accessories', 'Leather belts, wallets, and more', 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, slug, description, price, compare_at_price, sku, inventory_quantity, image_url, materials, care_instructions, category_id, is_published, is_featured) VALUES
('Classic Leather Jacket', 'classic-leather-jacket', 'A timeless leather jacket crafted from premium cowhide. Perfect for any season and occasion.', 299.99, 399.99, 'CLJ-001', 15, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&crop=center', 'Premium cowhide leather, cotton lining', 'Wipe clean with damp cloth. Store in cool, dry place.', 1, true, true),
('Vintage Messenger Bag', 'vintage-messenger-bag', 'Handcrafted messenger bag with vintage styling. Perfect for work or travel.', 189.99, 249.99, 'VMB-001', 8, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop&crop=center', 'Full-grain leather, brass hardware', 'Clean with leather conditioner monthly.', 2, true, true),
('Oxford Dress Shoes', 'oxford-dress-shoes', 'Elegant Oxford shoes made from finest Italian leather. Perfect for formal occasions.', 249.99, 299.99, 'ODS-001', 12, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop&crop=center', 'Italian calfskin leather, leather sole', 'Polish regularly with quality shoe cream.', 3, true, false),
('Leather Wallet', 'leather-wallet', 'Minimalist leather wallet with RFID protection. Compact yet spacious design.', 79.99, 99.99, 'LW-001', 25, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&h=500&fit=crop&crop=center', 'Top-grain leather, RFID blocking material', 'Wipe clean with dry cloth.', 4, true, false),
('Biker Leather Jacket', 'biker-leather-jacket', 'Rugged biker jacket with asymmetrical zip and multiple pockets.', 349.99, 449.99, 'BLJ-001', 10, 'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=500&h=500&fit=crop&crop=center', 'Heavy-duty cowhide, quilted lining', 'Professional leather cleaning recommended.', 1, true, true),
('Leather Tote Bag', 'leather-tote-bag', 'Spacious tote bag perfect for daily use. Elegant and practical design.', 159.99, 199.99, 'LTB-001', 18, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=500&fit=crop&crop=center', 'Soft pebbled leather, fabric lining', 'Spot clean with mild soap solution.', 2, true, false)
ON CONFLICT (slug) DO NOTHING;

-- Create admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role, is_active, email_verified) VALUES
('admin@lethashop.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.F5W', 'Admin User', 'admin', true, true)
ON CONFLICT (email) DO NOTHING;