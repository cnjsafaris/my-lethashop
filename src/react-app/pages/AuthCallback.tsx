import { useEffect } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const { exchangeCodeForSessionToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await exchangeCodeForSessionToken();
        // Redirect to home page after successful authentication
        navigate('/', { replace: true });
      } catch (error) {
        console.error('Authentication error:', error);
        // Redirect to home page even if there's an error
        navigate('/', { replace: true });
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="text-center">
        <div className="animate-spin mb-4">
          <Loader2 className="w-12 h-12 text-amber-600 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Signing you in...
        </h2>
        <p className="text-gray-600">
          Please wait while we complete your authentication.
        </p>
      </div>
    </div>
  );
}
