import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { Star, Plus, Minus, ShoppingBag, Heart, Truck, Shield, RotateCcw } from "lucide-react";
import { Product } from "@/shared/types";
import { apiClient } from "@/shared/api";

export default function ProductPage() {
  const { slug } = useParams();
  const { user, redirectToLogin } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (slug) {
      apiClient.getProduct(slug)
        .then(product => {
          setProduct(product);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Failed to fetch product:', error);
          setProduct(null);
          setLoading(false);
        });
    }
  }, [slug]);

  const addToCart = async () => {
    if (!user) {
      redirectToLogin();
      return;
    }

    if (!product) return;

    setAddingToCart(true);
    try {
      await apiClient.addToCart(product.id, quantity);
      // Show success message or update UI
      alert('Product added to cart!');
    } catch (error) {
      console.error('Error adding product to cart:', error);
      alert('Error adding product to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="animate-pulse">
            <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg mb-4"></div>
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-w-1 aspect-h-1 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 rounded mb-4 w-2/3"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
        <p className="text-gray-600">The product you're looking for doesn't exist.</p>
      </div>
    );
  }

  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const colors = ['Black', 'Brown', 'Tan', 'Cognac'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Product Images */}
        <div>
          <div className="aspect-w-1 aspect-h-1 mb-4 overflow-hidden rounded-lg bg-gray-100">
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&h=600&fit=crop&crop=center'}
              alt={product.name}
              className="w-full h-96 object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
          
          {/* Thumbnail Gallery */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-w-1 aspect-h-1 overflow-hidden rounded bg-gray-100 cursor-pointer hover:opacity-75 transition-opacity">
                <img
                  src={`https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=150&h=150&fit=crop&crop=center&sig=${i}`}
                  alt={`${product.name} ${i}`}
                  className="w-full h-20 object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            {product.name}
          </h1>
          
          <div className="flex items-center mb-4">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
            <span className="text-sm text-gray-500 ml-2">(24 reviews)</span>
          </div>

          <div className="flex items-baseline space-x-4 mb-6">
            <span className="text-3xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.compare_at_price && (
              <span className="text-xl text-gray-500 line-through">
                ${product.compare_at_price.toFixed(2)}
              </span>
            )}
          </div>

          <p className="text-gray-600 mb-8 leading-relaxed">
            {product.description || 'This premium leather product is handcrafted with the finest materials and attention to detail. Each piece is unique and built to last, developing a beautiful patina over time.'}
          </p>

          {/* Size Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Size</h3>
            <div className="flex space-x-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 border border-gray-200 rounded-lg text-sm font-medium transition-all ${
                    selectedSize === size
                      ? 'border-amber-600 bg-amber-50 text-amber-700'
                      : 'hover:border-gray-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Color</h3>
            <div className="flex space-x-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium transition-all ${
                    selectedColor === color
                      ? 'border-amber-600 bg-amber-50 text-amber-700'
                      : 'hover:border-gray-300'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity and Add to Cart */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900 mr-4">Quantity</span>
              <div className="flex items-center bg-white border border-gray-200 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-50 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 mb-8">
            <button
              onClick={addToCart}
              disabled={addingToCart}
              className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
            </button>
            <button className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          </div>

          {/* Product Features */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Product Features
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Truck className="w-5 h-5 text-amber-600" />
                <span className="text-sm text-gray-600">Free shipping on orders over $150</span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-amber-600" />
                <span className="text-sm text-gray-600">Lifetime warranty on craftsmanship</span>
              </div>
              <div className="flex items-center space-x-3">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <span className="text-sm text-gray-600">30-day return policy</span>
              </div>
            </div>
          </div>

          {/* Materials & Care */}
          <div className="border-t border-gray-200 pt-8 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Materials & Care
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Materials:</strong> {product.materials || 'Premium full-grain leather, brass hardware'}</p>
              <p><strong>Care:</strong> {product.care_instructions || 'Clean with leather cleaner. Apply leather conditioner every 3-6 months. Store in dust bag when not in use.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
