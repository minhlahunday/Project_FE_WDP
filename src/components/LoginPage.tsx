import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Car, AlertCircle, Eye, EyeOff, CheckCircle2, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error">("error");

  const { login, isLoading, user, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.message) {
      setAlertMessage(location.state.message);
      setAlertType(location.state.type || "error");
      setShowAlert(true);

      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleRedirect = (user: any) => {
    if (user?.role === "admin" ) {
      navigate("/admin/admin-staff-management");
    } else if (user?.role === "evm") {
      navigate("/");
    } else if (user?.role === "dealer_staff") {
      navigate("/portal/car");
    } else {
      navigate("/portal/dashboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);

    if (!email || !password) {
      return;
    }

    try {
      const success = await login(email, password, handleRedirect);

      if (success) {
        setAlertMessage("Đăng nhập thành công! Đang chuyển hướng...");
        setAlertType("success");
        setShowAlert(true);

        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

      } else {
        setLoginAttempts((prev) => prev + 1);
        setAlertMessage(authError || "Email hoặc mật khẩu không chính xác");
        setAlertType("error");
        setShowAlert(true);
      }
    } catch (error) {
      setAlertMessage("Có lỗi xảy ra khi đăng nhập");
      setAlertType("error");
      setShowAlert(true);
    }
  };

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1563349755297-d3fce17b1bcd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')`,
          }}
        />

        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          className="absolute inset-0 w-full h-full object-cover opacity-6000"
        >
          <source src="/videos/VinFast.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black bg-opacity-40" />
      </div>

      <div className="flex-1 lg:w-1/2 bg-black flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {showAlert && (
            <div
              className={`mb-6 p-4 rounded-lg border ${
                alertType === "success"
                  ? "bg-green-900/20 text-green-400 border-green-700"
                  : "bg-red-900/20 text-red-400 border-red-700"
              }`}
            >
              <div className="flex items-center space-x-2">
                {alertType === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                )}
                <span className="text-sm">{alertMessage}</span>
                <button
                  onClick={() => setShowAlert(false)}
                  className="ml-auto text-gray-400 hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <Car className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold text-white">VinFast</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-8">
                PLEASE LOG IN
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-red-500 focus:outline-none transition-colors"
                  required
                />
                {formSubmitted && !email && (
                  <p className="mt-1 text-sm text-red-400">
                    Please enter your email
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-red-500 focus:outline-none transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {formSubmitted && !password && (
                  <p className="mt-1 text-sm text-red-400">
                    Please enter your password
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-3 px-4 rounded font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>LOGGING IN...</span>
                  </>
                ) : (
                  <span>LOG IN</span>
                )}
              </button>

              {/* Google Login Button */}
              {/* <button
                type="button"
                className="w-full bg-white hover:bg-gray-100 text-black py-3 px-4 rounded font-medium transition-colors duration-200 flex items-center justify-center space-x-2 border"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>CONTINUE WITH GOOGLE</span>
              </button> */}

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 rounded bg-gray-800"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-400"
                  >
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  {/* <a href="#" className="text-red-500 hover:text-red-400">
                    Forgot your password?
                  </a> */}
                </div>
              </div>

              <div className="mt-8 space-y-3 border-t border-gray-700 pt-6">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("admin@example.com");
                      setPassword("Admin123!");
                    }}
                    className="text-xs bg-gray-800 text-gray-300 px-3 py-2 rounded border border-gray-600 hover:bg-gray-700"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("staff@example.com");
                      setPassword("Staff123!");
                    }}
                    className="text-xs bg-gray-800 text-gray-300 px-3 py-2 rounded border border-gray-600 hover:bg-gray-700"
                  >
                    Staff Dealer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("evm@example.com");
                      setPassword("Evm123!");
                    }}
                    className="text-xs bg-gray-800 text-gray-300 px-3 py-2 rounded border border-gray-600 hover:bg-gray-700"
                  >
                    EVM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("manager@example.com");
                      setPassword("Manager123!");
                    }}
                    className="text-xs bg-gray-800 text-gray-300 px-3 py-2 rounded border border-gray-600 hover:bg-gray-700"
                  >
                    Dealer Manager
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
