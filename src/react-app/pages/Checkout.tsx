import { useEffect, useState } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router";
import { ArrowLeft, Smartphone, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { CartItem } from "@/shared/types";

interface CheckoutFormData {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export default function CheckoutPage() {
  const { user, redirectToLogin } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [orderId, setOrderId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    phoneNumber: '',
    firstName: user?.google_user_data?.given_name || '',
    lastName: user?.google_user_data?.family_name || '',
    email: user?.email || '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Kenya',
  });

  useEffect(() => {
    if (!user) {
      redirectToLogin();
      return;
    }

    fetch('/api/cart')
      .then(res => res.json())
      .then(items => {
        setCartItems(items);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, redirectToLogin]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const shipping = subtotal > 150 ? 0 : 15;
  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Convert to Kenyan format (254XXXXXXXXX)
    if (cleaned.startsWith('0')) {
      return '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('254')) {
      return cleaned;
    } else if (cleaned.startsWith('+254')) {
      return cleaned.substring(1);
    } else if (cleaned.length === 9) {
      return '254' + cleaned;
    }
    
    return cleaned;
  };

  const processPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    const phoneNumber = formatPhoneNumber(formData.phoneNumber);
    if (phoneNumber.length !== 12 || !phoneNumber.startsWith('254')) {
      alert('Please enter a valid Kenyan phone number (e.g., 0712345678)');
      return;
    }

    setProcessing(true);
    setPaymentStatus('processing');

    try {
      // Create order first
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          total_amount: total,
          shipping_address: {
            line1: formData.address,
            city: formData.city,
            postal_code: formData.postalCode,
            country: formData.country,
          },
          customer_info: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: phoneNumber,
          },
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const order = await orderResponse.json();
      setOrderId(order.order_number);

      // Initiate M-Pesa payment
      const paymentResponse = await fetch('/api/payments/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber,
          amount: Math.round(total),
          order_id: order.id,
          account_reference: order.order_number,
          transaction_desc: `LethaShop Order ${order.order_number}`,
        }),
      });

      const paymentResult = await paymentResponse.json();

      if (paymentResponse.ok && paymentResult.ResponseCode === '0') {
        // Payment initiated successfully
        // Poll for payment status
        pollPaymentStatus(order.id);
      } else {
        throw new Error(paymentResult.errorMessage || 'Failed to initiate payment');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Payment failed. Please try again.');
      setPaymentStatus('failed');
      setProcessing(false);
    }
  };

  const pollPaymentStatus = async (orderId: number) => {
    const maxAttempts = 30; // Poll for 5 minutes (10 second intervals)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}/status`);
        const order = await response.json();

        if (order.status === 'paid') {
          setPaymentStatus('success');
          setProcessing(false);
          // Clear cart
          await fetch('/api/cart', { method: 'DELETE' });
          return;
        } else if (order.status === 'failed') {
          setPaymentStatus('failed');
          setProcessing(false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          setPaymentStatus('failed');
          setProcessing(false);
          alert('Payment timeout. Please check your M-Pesa and contact support if money was deducted.');
        }
      } catch (error) {
        console.error('Polling error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        } else {
          setPaymentStatus('failed');
          setProcessing(false);
        }
      }
    };

    poll();
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-8 w-1/3"></div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cart is Empty</h2>
          <p className="text-gray-600 mb-6">Add some items to your cart before proceeding to checkout.</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all duration-300"
          >
            Shop Products
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your order. Your order number is <strong>{orderId}</strong>.
            You will receive a confirmation email shortly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/products')}
              className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all duration-300"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Cart</span>
        </button>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
        Checkout
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={processPayment} className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <select
                      name="country"
                      required
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="Kenya">Kenya</option>
                      <option value="Uganda">Uganda</option>
                      <option value="Tanzania">Tanzania</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
              
              <div className="space-y-4">
                <div className="flex items-center p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                  <Smartphone className="w-6 h-6 text-green-600 mr-3" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900">M-Pesa Payment</h4>
                    <p className="text-sm text-green-700">Pay securely with your M-Pesa mobile money</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    M-Pesa Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    required
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="0712345678"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the phone number registered with M-Pesa
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={processing}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-5 h-5" />
                  <span>Pay with M-Pesa - KES {total.toFixed(2)}</span>
                </>
              )}
            </button>

            {paymentStatus === 'processing' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin mr-3" />
                  <div>
                    <h4 className="font-medium text-blue-900">Payment in Progress</h4>
                    <p className="text-sm text-blue-700">
                      Please check your phone for the M-Pesa prompt and enter your PIN to complete the payment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-red-900">Payment Failed</h4>
                    <p className="text-sm text-red-700">
                      There was an issue processing your payment. Please try again or contact support.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm sticky top-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=60&h=60&fit=crop&crop=center'}
                    alt={item.product_name || 'Product'}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{item.product_name}</h4>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    KES {((item.price || 0) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">KES {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  {shipping === 0 ? 'Free' : `KES ${shipping.toFixed(2)}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-amber-600">
                  Free shipping on orders over KES 150
                </p>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>KES {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              <p>
                By placing your order, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
