import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Star, Filter, Grid, List } from "lucide-react";
import { Product, Category } from "@/shared/types";
import { apiClient } from "@/shared/api";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const selectedCategory = searchParams.get('category');

  useEffect(() => {
    // Fetch categories
    apiClient.getCategories()
      .then(setCategories)
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = selectedCategory ? { category: selectedCategory } : {};
    
    apiClient.getProducts(params)
      .then(products => {
        setProducts(products);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch products:', error);
        setLoading(false);
      });
  }, [selectedCategory]);

  const clearCategory = () => {
    setSearchParams({});
  };

  const selectedCategoryName = categories.find(c => c.slug === selectedCategory)?.name;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            {selectedCategoryName || 'All Products'}
          </h1>
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${products.length} products found`}
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-l-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-r-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            </div>
            
            {/* Categories */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Categories</h4>
              <div className="space-y-2">
                <button
                  onClick={clearCategory}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    !selectedCategory 
                      ? 'bg-amber-100 text-amber-700 font-medium' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  All Products
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSearchParams({ category: category.slug })}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedCategory === category.slug
                        ? 'bg-amber-100 text-amber-700 font-medium' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-pulse">
                  <div className="w-full h-64 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your filters or browse all products.
              </p>
              <button
                onClick={clearCategory}
                className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:from-amber-700 hover:to-orange-700 transition-all duration-300"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-6"
            }>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} viewMode={viewMode} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
}

function ProductCard({ product, viewMode }: ProductCardProps) {
  if (viewMode === 'list') {
    return (
      <Link
        to={`/products/${product.slug}`}
        className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex"
      >
        <div className="w-48 flex-shrink-0">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=300&fit=crop&crop=center'}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-amber-700 transition-colors">
                {product.name}
              </h3>
              <p className="text-gray-600 mb-3 line-clamp-2">
                {product.description || 'Premium handcrafted leather product with attention to every detail.'}
              </p>
              <div className="flex items-center mb-3">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-gray-500 ml-2">(24)</span>
              </div>
              {product.category_name && (
                <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {product.category_name}
                </span>
              )}
            </div>
            <div className="text-right ml-6">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                ${product.price.toFixed(2)}
              </div>
              {product.compare_at_price && (
                <div className="text-sm text-gray-500 line-through">
                  ${product.compare_at_price.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden hover:scale-105"
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
        {product.category_name && (
          <div className="mt-3">
            <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
              {product.category_name}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
