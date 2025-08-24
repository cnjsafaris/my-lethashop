import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Star, Truck, Shield, Award } from "lucide-react";
import { Product } from "@/shared/types";
import { apiClient } from "@/shared/api";

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getProducts({ featured: true })
      .then(products => {
        setFeaturedProducts(products.slice(0, 4));
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch featured products:', error);
        setLoading(false);
      });
  }, []);

  const categories = [
    {
      name: "Leather Jackets",
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=600&fit=crop&crop=center",
      href: "/products?category=clothing"
    },
    {
      name: "Leather Bags",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=600&fit=crop&crop=center",
      href: "/products?category=bags"
    },
    {
      name: "Leather Shoes",
      image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=600&fit=crop&crop=center",
      href: "/products?category=footwear"
    },
    {
      name: "Home & Office",
      image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&h=600&fit=crop&crop=center",
      href: "/products?category=home"
    }
  ];

  const features = [
    {
      icon: <Award className="w-6 h-6" />,
      title: "Premium Quality",
      description: "Hand-selected leather from the finest tanneries worldwide"
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Free Shipping",
      description: "Complimentary shipping on all orders over $150"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Lifetime Warranty",
      description: "Our commitment to quality backed by lifetime repairs"
    }
  ];

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=1080&fit=crop&crop=center')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
        </div>
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Timeless
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              Leather Craft
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 leading-relaxed">
            Discover our collection of handcrafted leather goods, where traditional craftsmanship meets modern design.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all duration-300 shadow-2xl hover:shadow-amber-500/25 hover:scale-105"
            >
              <span>Shop Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-lg font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300">
              <span>Watch Our Story</span>
            </button>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Explore Our Collections
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From everyday essentials to statement pieces, discover leather goods crafted for every lifestyle.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link
              key={index}
              to={category.href}
              className="group relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105"
            >
              <div className="aspect-w-4 aspect-h-5 overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {category.name}
                </h3>
                <div className="flex items-center text-amber-400 group-hover:text-amber-300 transition-colors">
                  <span className="text-sm font-medium">Explore Collection</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {!loading && featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Featured Products
            </h2>
            <p className="text-xl text-gray-600">
              Handpicked pieces that showcase our finest craftsmanship
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.slug}`}
                className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-105"
              >
                <div className="aspect-w-1 aspect-h-1 overflow-hidden">
                  <img
                    src={product.image_url || 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=400&fit=crop&crop=center'}
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-amber-700 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center mb-2">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 ml-2">(24)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.compare_at_price && (
                      <span className="text-sm text-gray-500 line-through">
                        ${product.compare_at_price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="bg-gradient-to-r from-amber-50 to-orange-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              The LetheShop Promise
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every piece is crafted with care, designed to last, and backed by our commitment to excellence.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-full mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=800&fit=crop&crop=center')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/60"></div>
        </div>
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ready to Find Your Perfect Piece?
          </h2>
          <p className="text-xl mb-8 text-gray-200">
            Join thousands of satisfied customers who trust LetheShop for their finest leather goods.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all duration-300 shadow-2xl hover:shadow-amber-500/25 hover:scale-105"
          >
            <span>Browse All Products</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
