# Lethashop E-commerce Platform

A modern, full-stack e-commerce platform built with React, TypeScript, and PostgreSQL, featuring a comprehensive admin panel for managing products, users, and orders.

## 🚀 Features

### Customer Features
- **Product Catalog**: Browse premium leather products with detailed descriptions
- **Category Filtering**: Filter products by categories (Jackets, Bags, Shoes, Accessories)
- **Shopping Cart**: Add/remove items with persistent cart functionality
- **User Authentication**: Secure Google OAuth integration via Mocha Users Service
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Product Search**: Search products by name and SKU

### Admin Features
- **Dashboard**: Overview of key metrics and recent activity
- **Product Management**: Create, edit, delete, and manage product inventory
- **User Management**: View and manage user accounts and permissions
- **Order Management**: Track and update order statuses
- **Category Management**: Organize products into categories
- **Role-based Access**: Admin-only access to management features

## 🛠 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Router** for navigation

### Backend
- **Netlify Functions** with Hono framework
- **PostgreSQL** database with connection pooling
- **Zod** for request validation
- **Mocha Users Service** for authentication

### Infrastructure
- **Netlify** for hosting and serverless functions
- **Neon** (recommended) or any PostgreSQL provider
- **Environment-based configuration**

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- Mocha Users Service account
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd my-premium-lethashop
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:5432/database_name

# Mocha Users Service Configuration
MOCHA_USERS_SERVICE_API_URL=https://api.getmocha.com
MOCHA_USERS_SERVICE_API_KEY=your_mocha_api_key_here

# Environment
NODE_ENV=development
```

### 4. Database Setup
Run the database setup script to create tables and insert sample data:
```bash
npm run db:setup
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- **users**: User accounts and authentication
- **categories**: Product categories
- **products**: Product catalog with inventory
- **orders**: Customer orders
- **order_items**: Individual items in orders
- **cart_items**: Persistent shopping cart

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full access to admin panel and management features
- **User**: Standard customer access

### Admin Access
Users with email addresses containing "admin" or ending with "@lethashop.com" automatically receive admin privileges.

## 🚀 Deployment

### Netlify Deployment

1. **Connect Repository**: Link your GitHub repository to Netlify

2. **Environment Variables**: Set the following in Netlify dashboard:
   ```
   DATABASE_URL=your_production_database_url
   MOCHA_USERS_SERVICE_API_URL=https://api.getmocha.com
   MOCHA_USERS_SERVICE_API_KEY=your_production_api_key
   NODE_ENV=production
   NETLIFY=true
   ```

3. **Build Settings**:
   - Build command: `npm run build:netlify`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

4. **Deploy**: Push to your main branch to trigger automatic deployment

## 📁 Project Structure

```
my-premium-lethashop/
├── src/
│   ├── react-app/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   └── App.tsx        # Main app component
│   ├── shared/
│   │   ├── types.ts       # TypeScript type definitions
│   │   └── api.ts         # API client
│   └── lib/
│       └── database.ts    # Database connection and models
├── netlify/
│   └── functions/
│       └── api.ts         # Serverless API functions
├── database/
│   └── schema.sql         # Database schema
├── scripts/
│   └── setup-database.js  # Database setup script
└── public/               # Static assets
```

## 🛡️ API Endpoints

### Public Endpoints
- `GET /api/categories` - Get all categories
- `GET /api/products` - Get products (with filtering)
- `GET /api/products/:slug` - Get single product

### Authenticated Endpoints
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/:productId` - Update cart item
- `DELETE /api/cart/:productId` - Remove from cart
- `POST /api/orders` - Create new order

### Admin Endpoints
- `GET /api/admin/products` - Get all products (including unpublished)
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id/status` - Update order status

## 🧪 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:netlify` - Build for Netlify deployment
- `npm run lint` - Run ESLint
- `npm run db:setup` - Setup database with schema and sample data
- `npm run db:reset` - Reset database (same as setup)

### Adding New Products
1. Use the admin panel at `/admin` (requires admin access)
2. Click "Add Product" and fill in the form
3. Products can be marked as featured and published/unpublished

### Customizing Styles
The project uses Tailwind CSS. Customize the design by:
1. Editing `tailwind.config.js` for theme customization
2. Modifying component styles in the respective `.tsx` files
3. Adding custom CSS in the component files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the documentation above
2. Review the code comments
3. Create an issue in the repository
4. Contact the development team

## 🔄 Updates & Maintenance

### Database Migrations
When updating the database schema:
1. Modify `database/schema.sql`
2. Run `npm run db:reset` for development
3. For production, create migration scripts

### Adding New Features
1. Update TypeScript types in `src/shared/types.ts`
2. Add API endpoints in `netlify/functions/api.ts`
3. Create/update React components
4. Update this README if needed

---

Built with ❤️ using modern web technologies