import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Car, Mail, Lock, AlertCircle, Eye, EyeOff, ChevronRight, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('error');
  
  const { login, isLoading, user, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if there's a redirect message in the location state
  useEffect(() => {
    if (location.state && location.state.message) {
      setAlertMessage(location.state.message);
      setAlertType(location.state.type || 'error');
      setShowAlert(true);
      
      // Auto-hide the alert after 5 seconds
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);
  
  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      // Điều hướng dựa trên vai trò người dùng
      if (user.role === 'admin' || user.role === 'evm_staff') {
        navigate('/admin/product-management');
      } else if (user.role === 'dealer_staff') {
        navigate('/portal/car');
      } else {
        navigate('/portal/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    
    if (!email || !password) {
      return;
    }
    
    try {
      const success = await login(email, password);
      
      if (success) {
        // Show success message
        setAlertMessage('Đăng nhập thành công! Đang chuyển hướng...');
        setAlertType('success');
        setShowAlert(true);
        
        // Save email to localStorage if rememberMe is checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        // Navigate to dashboard after a short delay
        setTimeout(() => {
          // Điều hướng dựa trên vai trò người dùng
          if (user?.role === 'admin' || user?.role === 'evm_staff') {
            navigate('/admin/product-management');
          } else if (user?.role === 'dealer_staff') {
            navigate('/portal/car');
          } else {
            navigate('/portal/dashboard');
          }
        }, 1000);
      } else {
        // Handle failed login
        setLoginAttempts(prev => prev + 1);
        setAlertMessage(authError || 'Email hoặc mật khẩu không chính xác');
        setAlertType('error');
        setShowAlert(true);
      }
    } catch (error) {
      setAlertMessage('Có lỗi xảy ra khi đăng nhập');
      setAlertType('error');
      setShowAlert(true);
    }
  };
  
  // Load remembered email if available
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Alert Message */}
        {showAlert && (
          <div className={`mb-6 p-4 rounded-lg flex items-start justify-between ${
            alertType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {alertType === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              )}
              <span className="text-sm">{alertMessage}</span>
            </div>
            <button onClick={() => setShowAlert(false)} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Car className="h-12 w-12 text-green-600" />
            <span className="text-3xl font-bold text-gray-900">VinFast</span>
          </div>
          <h2 className="text-xl text-gray-600">Hệ thống quản lý đại lý xe điện</h2>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Đăng nhập</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border ${formSubmitted && !email ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors`}
                  placeholder="example@vinfast.vn"
                />
              </div>
              {formSubmitted && !email && (
                <p className="mt-1 text-sm text-red-600">Vui lòng nhập email</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mật khẩu
                </label>
                <a href="#" className="text-xs text-green-600 hover:text-green-800">
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border ${formSubmitted && !password ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {formSubmitted && !password && (
                <p className="mt-1 text-sm text-red-600">Vui lòng nhập mật khẩu</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>© 2025 VinFast EVM. Tất cả quyền được bảo lưu.</p>
            <p className="mt-1">Phiên bản 2.5.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}