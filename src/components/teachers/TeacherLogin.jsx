// src/components/TeacherLogin.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { 
  Loader, Eye, EyeOff, GraduationCap, Lock, Mail, 
  ArrowLeft, UserPlus, Users, Shield, Check, BookOpen,
  Award, Clock, Calendar, MessageSquare
} from 'lucide-react';

const TeacherLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showApplicationInfo, setShowApplicationInfo] = useState(false);
  const navigate = useNavigate();

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('teacherRememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (rememberMe) {
        localStorage.setItem('teacherRememberedEmail', email);
      } else {
        localStorage.removeItem('teacherRememberedEmail');
      }
      
      // Success animation
      const form = e.target;
      form.classList.add('success-animation');
      
      setTimeout(() => {
        navigate('/teacher/dashboard');
      }, 500);
      
    } catch (error) {
      console.error('❌ Teacher login error:', error);
      
      // User-friendly error messages
      switch(error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          setError('Invalid email or password');
          break;
        case 'auth/user-not-found':
          setError('No teacher account found. Please apply through the teacher application form.');
          setShowApplicationInfo(true);
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again in a few minutes.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection.');
          break;
        default:
          setError('Unable to login. Please try again.');
      }
      
      // Error animation
      const form = e.target;
      form.classList.add('shake-animation');
      setTimeout(() => form.classList.remove('shake-animation'), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail('teacher@demo.com');
    setPassword('teacher123');
  };

  const applicationSteps = [
    { step: 1, title: "Submit Application", description: "Complete the teacher application form" },
    { step: 2, title: "Document Verification", description: "Upload your credentials and certifications" },
    { step: 3, title: "Interview Process", description: "Meet with the academic committee" },
    { step: 4, title: "Account Activation", description: "Receive login credentials via email" }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      
      <div className="max-w-6xl w-full space-y-8 relative z-10">
        {/* Header with Teacher Focus */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl animate-float">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Teacher Portal
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Empower learning, track progress, and engage with students
          </p>
        </div>
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Login Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-8">
              {/* Application Info Banner */}
              {showApplicationInfo && (
                <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 animate-slideDown">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-blue-800">New to Evergreen Academy?</h3>
                        <p className="text-sm text-blue-700">Follow these steps to join our faculty</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowApplicationInfo(false)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {applicationSteps.map((step) => (
                      <div key={step.step} className="text-center">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold text-blue-600 border-2 border-blue-200">
                          {step.step}
                        </div>
                        <p className="text-xs font-medium text-blue-800">{step.title}</p>
                        <p className="text-xs text-blue-600 mt-1">{step.description}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-center">
                    <Link 
                      to="/teacher-signup" 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Apply as Teacher
                    </Link>
                  </div>
                </div>
              )}
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Teacher Login</h2>
                <p className="text-gray-600">Access your classroom management dashboard</p>
              </div>

              {error && (
                <div className={`mb-6 rounded-xl p-4 animate-fadeIn ${
                  error.includes('No teacher account found') 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200' 
                    : 'bg-gradient-to-r from-red-50 to-red-100 border border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      error.includes('No teacher account found') ? 'bg-blue-100' : 'bg-red-100'
                    }`}>
                      {error.includes('No teacher account found') ? (
                        <Users className="w-4 h-4 text-blue-600" />
                      ) : (
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${
                        error.includes('No teacher account found') ? 'text-blue-800' : 'text-red-800'
                      }`}>
                        {error}
                      </p>
                      {error.includes('No teacher account found') && (
                        <button
                          onClick={() => setShowApplicationInfo(true)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View application steps →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    School Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300"
                    placeholder="teacher@school.edu"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gray-400" />
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 pr-12"
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {/* Password Strength */}
                  {password.length > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Password strength</span>
                        <span className={`font-medium ${
                          password.length < 6 ? 'text-red-500' :
                          password.length < 8 ? 'text-yellow-500' :
                          'text-emerald-500'
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
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickDemo}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Try demo account
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin mr-3" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <GraduationCap className="w-5 h-5 mr-3" />
                        Sign In as Teacher
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Not a teacher yet?</span>
                </div>
              </div>

              {/* Application Button */}
              <Link to="/teacher-signup">
                <button className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl group">
                  <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Apply for Teaching Position
                </button>
              </Link>

              {/* Information Box */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-800">
                      All teachers must have their credentials verified before accessing the portal. 
                      Applications are typically processed within 2-3 business days.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Demo Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    For demonstration purposes, you can use:
                  </p>
                  <div className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-left">
                      <p className="text-xs text-gray-600 font-medium mb-1">Email:</p>
                      <p className="text-sm font-mono text-gray-800">teacher@demo.com</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-600 font-medium mb-1">Password:</p>
                      <p className="text-sm font-mono text-gray-800">teacher123</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate('/')}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 group transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span>Back to Homepage</span>
                </button>
                <Link to="/support" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Need help?
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Teacher Features */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 h-fit">
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Teacher Features</h2>
                <p className="text-gray-600">Tools designed for educators</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-blue-50 transition-colors group">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Course Management</h3>
                    <p className="text-sm text-gray-600">Create and manage courses, materials, and syllabi</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-emerald-50 transition-colors group">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Award className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Gradebook</h3>
                    <p className="text-sm text-gray-600">Record and manage student grades efficiently</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-purple-50 transition-colors group">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Attendance Tracking</h3>
                    <p className="text-sm text-gray-600">Take and monitor attendance in real-time</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-amber-50 transition-colors group">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Assignment Portal</h3>
                    <p className="text-sm text-gray-600">Post assignments and collect submissions</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-rose-50 transition-colors group">
                  <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Parent Communication</h3>
                    <p className="text-sm text-gray-600">Direct messaging with parents and guardians</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">50+</div>
                    <div className="text-xs text-gray-600">Active Teachers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">15:1</div>
                    <div className="text-xs text-gray-600">Student Ratio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">95%</div>
                    <div className="text-xs text-gray-600">Retention</div>
                  </div>
                </div>
              </div>

              {/* Testimonial */}
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    MJ
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Michael Johnson</h4>
                    <p className="text-sm text-gray-600">Mathematics Teacher, 8 years</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 italic">
                  "The teacher portal has streamlined my workflow significantly. I can manage all my classes, grades, and communicate with parents from one place."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center text-sm text-gray-500">
          <p className="mb-2">
            Questions about joining our faculty?{' '}
            <Link to="/contact" className="text-blue-600 hover:text-blue-800 font-medium">
              Contact HR Department
            </Link>
          </p>
          <p className="text-xs">
            © {new Date().getFullYear()} Evergreen Academy Teacher Portal. All rights reserved.
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes success {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .shake-animation {
          animation: shake 0.5s ease-in-out;
        }
        
        .success-animation {
          animation: success 0.5s ease-in-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
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

export default TeacherLogin;