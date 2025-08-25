import { ReactNode } from "react";
import { Link } from "react-router";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { ShoppingBag, User, LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  // Fetch cart count for authenticated users
  useEffect(() => {
    if (user) {
      fetch("/api/cart")
        .then(res => res.json())
        .then(items => setCartCount(items.length))
        .catch(() => setCartCount(0));
    } else {
      setCartCount(0);
    }
  }, [user]);

  const categories = [
    { name: "Clothing & Apparel", slug: "clothing" },
    { name: "Footwear", slug: "footwear" },
    { name: "Bags & Accessories", slug: "bags" },
    { name: "Home & Office", slug: "home" },
    { name: "Automotive", slug: "automotive" },
    { name: "Lifestyle", slug: "lifestyle" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-amber-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-orange-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LS</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-800 to-orange-800 bg-clip-text text-transparent" style={{ fontFamily: "'Playfair Display', serif" }}>
                LethaShop
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/products" className="text-gray-700 hover:text-amber-700 font-medium transition-colors">
                All Products
              </Link>
              <div className="relative group">
                <button className="text-gray-700 hover:text-amber-700 font-medium transition-colors">
                  Categories
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100">
                  <div className="py-2">
                    {categories.map((category) => (
                      <Link
                        key={category.slug}
                        to={`/products?category=${category.slug}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </nav>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link to="/cart" className="relative p-2 text-gray-700 hover:text-amber-700 transition-colors">
                    <ShoppingBag className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-600 text-white text-xs rounded-full flex items-center justify-center">
                        {cartCount > 9 ? "9+" : cartCount}
                      </span>
                    )}
                  </Link>
                  {(user.email?.includes('admin') || user.email?.endsWith('@lethashop.com')) && (
                    <Link 
                      to="/admin" 
                      className="hidden sm:block text-gray-700 hover:text-amber-700 font-medium transition-colors px-3 py-2 rounded-md hover:bg-amber-50"
                    >
                      Admin
                    </Link>
                  )}
                  <div className="flex items-center space-x-2">
                    {user.avatar_url && (
                      <img
                        src={user.avatar_url}
                        alt="Profile"
                        className="w-8 h-8 rounded-full border-2 border-amber-200"
                      />
                    )}
                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                      {user.name || user.email}
                    </span>
                    <button
                      onClick={signOut}
                      className="p-2 text-gray-700 hover:text-amber-700 transition-colors"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:from-amber-700 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-amber-700 transition-colors"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-2 space-y-1">
              <Link
                to="/products"
                className="block px-3 py-2 text-gray-700 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                All Products
              </Link>
              {user && (user.email?.includes('admin') || user.email?.endsWith('@lethashop.com')) && (
                <Link
                  to="/admin"
                  className="block px-3 py-2 text-gray-700 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to={`/products?category=${category.slug}`}
                  className="block px-3 py-2 text-gray-700 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-amber-900 via-orange-900 to-amber-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LS</span>
                </div>
                <span className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                  LethaShop
                </span>
              </div>
              <p className="text-amber-100 mb-4 leading-relaxed">
                Crafting premium leather goods with passion and precision. Each piece tells a story of timeless elegance and uncompromising quality.
              </p>
              <p className="text-amber-200 text-sm">
                © 2024 LethaShop. All rights reserved.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Categories</h3>
              <ul className="space-y-2 text-sm">
                {categories.slice(0, 3).map((category) => (
                  <li key={category.slug}>
                    <Link
                      to={`/products?category=${category.slug}`}
                      className="text-amber-100 hover:text-white transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Support</h3>
              <ul className="space-y-2 text-sm text-amber-100">
                <li>Care Instructions</li>
                <li>Size Guide</li>
                <li>Returns & Exchange</li>
                <li>Contact Us</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
