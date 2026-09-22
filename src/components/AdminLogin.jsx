import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Loader, UserPlus, ArrowLeft, Eye, EyeOff, Shield, Users, GraduationCap, Heart } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate email format
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful');
      
      // Save to localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // Show success feedback before navigation
      setTimeout(() => {
        navigate('/dashboard');
      }, 300);
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // User-friendly error messages
      switch(error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          setError('Invalid email or password. Please try again.');
          break;
        case 'auth/user-not-found':
          setError('Account not found. Please check your email.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection.');
          break;
        default:
          setError('Login failed. Please try again.');
      }
      
      // Shake animation on error
      const form = e.target;
      form.classList.add('shake-animation');
      setTimeout(() => form.classList.remove('shake-animation'), 500);
    } finally {
      setIsLoading(false);
    }
  };

  // Load remembered email on component mount
useEffect(() => {
  const rememberedEmail = localStorage.getItem('rememberedEmail');
  if (rememberedEmail) {
    setEmail(rememberedEmail);
    setRememberMe(true);
  }
}, []);

  const loginTypes = [
    {
      title: "Parent Portal",
      description: "Monitor your child's progress",
      icon: <Heart className="w-6 h-6" />,
      color: "from-pink-500 to-rose-600",
      link: "/parent/login",
      featured: true
    },
    {
      title: "Staff Portal",
      description: "Faculty & Administration",
      icon: <Shield className="w-6 h-6" />,
      color: "from-emerald-500 to-emerald-700",
      link: "/admin/login",
      current: true
    },
    {
      title: "Student Portal",
      description: "Access assignments & grades",
      icon: <GraduationCap className="w-6 h-6" />,
      color: "from-blue-500 to-blue-700",
      link: "/student/login"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      
      <div className="max-w-6xl w-full space-y-8 relative z-10">
        {/* Header Section */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Evergreen Academy Portal
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Secure access to your educational platform. Choose your login portal below.
          </p>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Portal Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Portal</h2>
                  <p className="text-gray-600">Choose the appropriate login portal for your role</p>
                </div>
                
                {/* Portal Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {loginTypes.map((portal, index) => (
                    <Link
                      key={index}
                      to={portal.link}
                      className={`group relative rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                        portal.featured 
                          ? 'border-pink-300 bg-gradient-to-br from-pink-50 to-white transform -translate-y-1 shadow-lg' 
                          : portal.current
                          ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-white'
                          : 'border-gray-200 hover:border-emerald-200'
                      }`}
                    >
                      {portal.featured && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-gradient-to-r from-pink-500 to-rose-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                            RECOMMENDED
                          </span>
                        </div>
                      )}
                      
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                          portal.featured 
                            ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg' 
                            : portal.current
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                            : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                        }`}>
                          {portal.icon}
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {portal.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          {portal.description}
                        </p>
                        
                        <div className={`text-sm font-medium flex items-center gap-2 ${
                          portal.featured ? 'text-pink-600' : 
                          portal.current ? 'text-emerald-600' : 
                          'text-gray-500'
                        }`}>
                          <span>Access Portal</span>
                          <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                
                {/* Portal Features */}
                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Secure & Encrypted</h4>
                    <p className="text-sm text-gray-600 mt-1">Enterprise-grade security</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Multi-role Access</h4>
                    <p className="text-sm text-gray-600 mt-1">Different portals for different needs</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <GraduationCap className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">24/7 Access</h4>
                    <p className="text-sm text-gray-600 mt-1">Access your portal anytime</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Staff Login Form */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 h-fit">
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Staff Login</h2>
                <p className="text-gray-600">Faculty & administration access</p>
              </div>

              {error && (
                <div className="mb-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors hover:border-gray-400"
                      placeholder="staff@evergreen.edu"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-800 font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors hover:border-gray-400"
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me on this device
                  </label>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin mr-3" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 mr-3" />
                        Sign In to Staff Portal
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Password strength:</span>
                      <span className={`font-medium ${
                        password.length < 6 ? 'text-red-600' :
                        password.length < 8 ? 'text-yellow-600' :
                        'text-emerald-600'
                      }`}>
                        {password.length < 6 ? 'Weak' :
                         password.length < 8 ? 'Medium' :
                         'Strong'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          password.length < 6 ? 'bg-red-500 w-1/3' :
                          password.length < 8 ? 'bg-yellow-500 w-2/3' :
                          'bg-emerald-500 w-full'
                        }`}
                      ></div>
                    </div>
                  </div>
                )}
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Don't have staff access?</span>
                </div>
              </div>

              {/* Apply as Teacher Button */}
              <Link to="/teacher-signup">
                <button className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl group">
                  <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Apply as Teacher
                </button>
              </Link>

              {/* Information Box */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-blue-800">
                      New teachers must apply and be approved by administration before accessing the portal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Test (Dev Only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-3 text-center font-medium">Quick Test (Development):</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('admin@school.edu');
                        setPassword('admin123');
                      }}
                      className="text-sm bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 py-2.5 px-3 rounded-lg hover:from-purple-200 hover:to-purple-100 transition-all duration-200 font-medium border border-purple-200 hover:border-purple-300"
                    >
                      Admin Account
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('teacher@school.edu');
                        setPassword('teacher123');
                      }}
                      className="text-sm bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 py-2.5 px-3 rounded-lg hover:from-blue-200 hover:to-blue-100 transition-all duration-200 font-medium border border-blue-200 hover:border-blue-300"
                    >
                      Teacher Account
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
              <button
                onClick={() => navigate('/')}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-3 group transition-colors"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Homepage</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center text-sm text-gray-500">
          <p className="mb-2">
            Need help?{' '}
            <Link to="/support" className="text-emerald-600 hover:text-emerald-800 font-medium">
              Contact Support
            </Link>
          </p>
          <p className="text-xs">
            © {new Date().getFullYear()} Evergreen Academy. All rights reserved.
          </p>
        </div>
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        .shake-animation {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .bg-grid-pattern {
          background-image: linear-gradient(to right, #8882 1px, transparent 1px),
                            linear-gradient(to bottom, #8882 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;