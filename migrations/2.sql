
-- Insert categories (ignore if already exists)
INSERT OR IGNORE INTO categories (name, slug, description, sort_order) VALUES
('Clothing & Apparel', 'clothing', 'Premium leather clothing including jackets, pants, skirts, and accessories', 1),
('Footwear', 'footwear', 'Handcrafted leather shoes, boots, sandals, and sneakers', 2),
('Bags & Accessories', 'bags', 'Leather handbags, backpacks, wallets, belts, and travel accessories', 3),
('Home & Office', 'home', 'Leather furniture, desk accessories, and home decor items', 4),
('Automotive', 'automotive', 'Premium leather car accessories and interior enhancements', 5),
('Lifestyle', 'lifestyle', 'Everyday leather accessories for modern living', 6);

-- Insert sample products (ignore if already exists)
INSERT OR IGNORE INTO products (name, slug, description, price, compare_at_price, sku, inventory_quantity, is_featured, is_published, category_id, image_url, materials, care_instructions) VALUES

-- Clothing & Apparel
('Classic Black Leather Jacket', 'classic-black-leather-jacket', 'Timeless black leather jacket crafted from premium cowhide. Features asymmetrical zipper, quilted shoulders, and multiple pockets. Perfect for any season and style.', 299.99, 399.99, 'CLJ-001', 25, 1, 1, 1, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=600&fit=crop&crop=center', 'Premium full-grain cowhide leather, YKK zippers, polyester lining', 'Clean with leather cleaner. Apply conditioner every 3-6 months. Store on hanger.'),

('Brown Leather Bomber Jacket', 'brown-leather-bomber-jacket', 'Vintage-inspired brown leather bomber jacket with ribbed cuffs and hem. Soft lambskin construction with comfortable cotton lining.', 349.99, 449.99, 'BLB-002', 18, 1, 1, 1, 'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=600&h=600&fit=crop&crop=center', 'Premium lambskin leather, cotton lining, brass hardware', 'Professional leather cleaning recommended. Condition regularly.'),

('Leather Pants - Skinny Fit', 'leather-pants-skinny-fit', 'Sleek black leather pants with skinny fit. Made from supple lambskin for comfort and style. Features front zip and side pockets.', 199.99, 249.99, 'LP-003', 30, 0, 1, 1, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=600&fit=crop&crop=center', 'Supple lambskin leather, stretch lining', 'Spot clean only. Professional cleaning recommended.'),

('Leather Mini Skirt', 'leather-mini-skirt', 'Chic black leather mini skirt with A-line silhouette. Perfect for night out or casual styling. High-quality construction with smooth finish.', 129.99, 159.99, 'LMS-004', 22, 1, 1, 1, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=600&fit=crop&crop=center', 'Full-grain leather, cotton lining', 'Dry clean only. Store flat or hanging.'),

-- Footwear
('Oxford Leather Dress Shoes', 'oxford-leather-dress-shoes', 'Classic black oxford shoes handcrafted from Italian calfskin. Goodyear welted construction ensures durability and comfort for formal occasions.', 279.99, 349.99, 'ODS-005', 35, 1, 1, 2, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop&crop=center', 'Italian calfskin leather, leather sole, cork footbed', 'Polish regularly. Use cedar shoe trees. Rotate wear.'),

('Chelsea Leather Boots', 'chelsea-leather-boots', 'Elegant brown Chelsea boots with elastic side panels. Premium full-grain leather upper with comfortable rubber sole. Versatile for casual and semi-formal wear.', 199.99, 259.99, 'CLB-006', 28, 1, 1, 2, 'https://images.unsplash.com/photo-1608256246200-53e8b47b2569?w=600&h=600&fit=crop&crop=center', 'Full-grain leather, elastic panels, rubber sole', 'Clean with damp cloth. Condition monthly. Air dry naturally.'),

('Biker Leather Boots', 'biker-leather-boots', 'Rugged black biker boots with buckle details and steel toe protection. Built for durability with oil-resistant sole and reinforced stitching.', 249.99, 299.99, 'BLB-007', 20, 0, 1, 2, 'https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=600&h=600&fit=crop&crop=center', 'Full-grain leather, steel toe, oil-resistant sole', 'Clean with leather cleaner. Condition regularly. Waterproof treatment recommended.'),

-- Bags & Accessories
('Executive Leather Briefcase', 'executive-leather-briefcase', 'Professional brown leather briefcase with multiple compartments. Padded laptop section fits up to 15" devices. Combination lock for security.', 189.99, 239.99, 'ELB-008', 15, 1, 1, 3, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop&crop=center', 'Full-grain leather, padded interior, brass hardware', 'Clean with leather cleaner. Store in dust bag when not in use.'),

('Vintage Leather Backpack', 'vintage-leather-backpack', 'Rustic brown leather backpack with vintage styling. Multiple pockets and laptop compartment. Adjustable padded straps for comfort.', 159.99, 199.99, 'VLB-009', 25, 1, 1, 3, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop&crop=center', 'Vintage-treated leather, canvas lining, antique brass hardware', 'Condition every 3 months. Avoid excessive moisture.'),

('Minimalist Leather Wallet', 'minimalist-leather-wallet', 'Slim black leather wallet with RFID blocking technology. Holds up to 8 cards and cash. Compact design perfect for front pocket carry.', 49.99, 69.99, 'MLW-010', 50, 1, 1, 3, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=600&fit=crop&crop=center', 'Top-grain leather, RFID blocking material', 'Wipe clean with damp cloth. Condition monthly.'),

('Premium Leather Belt', 'premium-leather-belt', 'Classic brown leather belt with removable buckle. Full-grain leather construction with edge finishing. Available in multiple sizes.', 79.99, 99.99, 'PLB-011', 40, 0, 1, 3, 'https://images.unsplash.com/photo-1594736797933-d0db0da39438?w=600&h=600&fit=crop&crop=center', 'Full-grain leather, solid brass buckle', 'Condition every 2-3 months. Store hanging or flat.'),

-- Home & Office
('Executive Leather Office Chair', 'executive-leather-office-chair', 'Luxurious brown leather executive chair with ergonomic design. High-back support with adjustable height and tilt. Premium comfort for long work sessions.', 899.99, 1199.99, 'EOC-012', 8, 1, 1, 4, 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&h=600&fit=crop&crop=center', 'Top-grain leather upholstery, steel frame, memory foam padding', 'Clean with leather cleaner. Condition every 6 months.'),

('Leather Desk Mat', 'leather-desk-mat', 'Large black leather desk mat with stitched edges. Protects desk surface while adding sophisticated style to your workspace. Water-resistant finish.', 89.99, 119.99, 'LDM-013', 30, 0, 1, 4, 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&h=600&fit=crop&crop=center', 'Full-grain leather, water-resistant coating, reinforced edges', 'Wipe clean with damp cloth. Apply leather protector periodically.'),

-- Automotive
('Leather Steering Wheel Cover', 'leather-steering-wheel-cover', 'Premium black leather steering wheel cover with hand-stitched details. Enhances grip and comfort while protecting original wheel. Universal fit.', 69.99, 89.99, 'SWC-014', 35, 0, 1, 5, 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=600&fit=crop&crop=center', 'Genuine leather, reinforced stitching, anti-slip backing', 'Clean with leather wipes. Condition monthly for best appearance.'),

-- Lifestyle
('Leather Phone Case', 'leather-phone-case', 'Elegant brown leather phone case with card slots. Magnetic closure and precise cutouts. Compatible with wireless charging. Available for multiple phone models.', 39.99, 49.99, 'LPC-015', 60, 1, 1, 6, 'https://images.unsplash.com/photo-1520637836862-4d197d17c13a?w=600&h=600&fit=crop&crop=center', 'Premium leather, microfiber lining, magnetic closure', 'Clean with dry cloth. Avoid excessive moisture.'),

('Leather Watch Strap', 'leather-watch-strap', 'Handcrafted brown leather watch strap with vintage buckle. Available in multiple sizes. Quick-release pins for easy installation. Ages beautifully with wear.', 29.99, 39.99, 'LWS-016', 45, 0, 1, 6, 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&h=600&fit=crop&crop=center', 'Vegetable-tanned leather, stainless steel buckle', 'Condition regularly. Avoid water exposure when possible.');
