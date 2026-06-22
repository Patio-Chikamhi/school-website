// src/components/ContactView.jsx - UPDATED VERSION
import React, { useState, useRef } from 'react';
import { 
  Mail, Phone, MapPin, User, MessageSquare, Send, Loader, 
  Calendar, Clock, Building, Globe, Sparkles, ArrowRight,
  Shield, CheckCircle, Users, Award, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';

const ContactView = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  
  // Gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const carouselRef = useRef();

  // Gallery images for carousel
  const galleryImages = [
    { 
      id: 1, 
      src: 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?w=1200&auto=compress&cs=tinysrgb&dpr=2', 
      title: 'Main Office',
      description: 'Our administrative center where we welcome visitors'
    },
    { 
      id: 2, 
      src: 'https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?w=1200&auto=compress&cs=tinysrgb&dpr=2', 
      title: 'Admissions Office',
      description: 'Meet with our admissions team for personalized guidance'
    },
    { 
      id: 3, 
      src: 'https://images.pexels.com/photos/159740/library-la-trobe-study-students-159740.jpeg?w=1200&auto=compress&cs=tinysrgb&dpr=2', 
      title: 'Reception Area',
      description: 'Comfortable waiting area for visitors and parents'
    }
  ];

  // Auto-rotate gallery images
  React.useEffect(() => {
    const interval = setInterval(() => {
      nextImage();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentImageIndex]);

  const nextImage = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
      );
      setIsTransitioning(false);
    }, 300);
  };

  const prevImage = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? galleryImages.length - 1 : prevIndex - 1
      );
      setIsTransitioning(false);
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      await addDoc(collection(db, 'contactMessages'), {
        ...formData,
        status: 'unread',
        read: false,
        createdAt: serverTimestamp(),
        ipAddress: '',
        userAgent: navigator.userAgent
      });

      setSubmitStatus({
        type: 'success',
        message: 'Message sent successfully! We will get back to you within 24 hours.'
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });

    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to send message. Please try again or email us directly.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section with Carousel */}
      <div className="relative overflow-hidden min-h-[400px] lg:min-h-[500px]">
        {/* Background Carousel */}
        <div className="absolute inset-0">
          {galleryImages.map((image, index) => (
            <div
              key={image.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                index === currentImageIndex
                  ? 'opacity-100 scale-105'
                  : 'opacity-0 scale-100'
              }`}
            >
              <img
                className="w-full h-full object-cover"
                src={image.src}
                alt={image.title}
                onError={(e) => {
                  const fallbackColors = [
                    'bg-gradient-to-r from-emerald-600 to-emerald-800',
                    'bg-gradient-to-r from-blue-600 to-blue-800',
                    'bg-gradient-to-r from-purple-600 to-purple-800'
                  ];
                  e.target.parentElement.innerHTML = `
                    <div class="w-full h-full ${fallbackColors[index]} flex items-center justify-center">
                      <div class="text-center text-white p-8">
                        <div class="text-4xl mb-4">${image.title}</div>
                        <div class="text-xl opacity-80">${image.description}</div>
                      </div>
                    </div>
                  `;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/70 to-blue-900/60"></div>
            </div>
          ))}
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-6 right-4 z-20 flex gap-2">
          {galleryImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentImageIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>

        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="py-12 sm:py-16 lg:py-20">
              <div className="lg:max-w-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                  <span className="text-white font-semibold tracking-wider">GET IN TOUCH</span>
                </div>
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block">Let's Connect</span>
                  <span className="block text-yellow-300 mt-2">With Our Community</span>
                </h1>
                <p className="mt-6 text-lg text-white sm:text-xl max-w-xl">
                  Have questions or ready to join our vibrant community? We're here to guide you every step of the way.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="py-16 bg-gradient-to-b from-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-700 rounded-full mb-4">
              <Users className="w-5 h-5" />
              <span className="font-semibold">WE'RE HERE FOR YOU</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
              Multiple Ways to Reach Us
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Choose the method that works best for you - we're always ready to help
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <Mail className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Email Us</h3>
              <p className="text-gray-600 mb-6">For general inquiries and information</p>
              <a 
                href="mailto:info@evergreenacademy.edu" 
                className="inline-flex items-center text-emerald-600 hover:text-emerald-800 font-medium group"
              >
                info@evergreenacademy.edu
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Call Us</h3>
              <p className="text-gray-600 mb-6">Speak directly with our team</p>
              <div className="space-y-2">
                <a 
                  href="tel:+1234567890" 
                  className="block text-blue-600 hover:text-blue-800 font-medium"
                >
                  +1 (234) 567-8900
                </a>
                <p className="text-sm text-gray-500">Monday-Friday, 8AM-4:30PM</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Visit Us</h3>
              <p className="text-gray-600 mb-4">Schedule a campus tour and see for yourself</p>
              <a 
                href="https://maps.google.com/?q=1400+Pine+Street+City+State+12345"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium group"
              >
                1400 Pine Street, City, State 12345
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Office Hours</h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Mon-Fri:</span>
                  <span className="font-medium">8:00 AM - 4:30 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span className="font-medium">9:00 AM - 12:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span className="font-medium">Closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Contact Section */}
      <div className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Form - Left Side */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100">
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Send us a Message</h3>
                      <p className="text-gray-600 mt-1">Fill out the form and we'll respond within 24 hours</p>
                    </div>
                  </div>
                </div>

                {/* Status Messages */}
                {submitStatus && (
                  <div className={`mb-6 p-4 rounded-xl border ${
                    submitStatus.type === 'success' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      {submitStatus.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                      <span>{submitStatus.message}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="pl-12 w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-gray-400"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="pl-12 w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-gray-400"
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="pl-12 w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-gray-400"
                          placeholder="+1 (234) 567-8900"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-gray-400 appearance-none bg-white cursor-pointer"
                        required
                      >
                        <option value="">Select a subject</option>
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Admissions">Admissions</option>
                        <option value="Academic Programs">Academic Programs</option>
                        <option value="Student Services">Student Services</option>
                        <option value="Campus Visit">Campus Visit</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Message *
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                      <textarea
                        id="message"
                        name="message"
                        rows="5"
                        value={formData.message}
                        onChange={handleChange}
                        className="pl-12 w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-gray-400"
                        placeholder="Tell us how we can help you..."
                        required
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Please include any relevant details so we can assist you better
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="consent"
                      required
                      className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="consent" className="text-sm text-gray-700 cursor-pointer">
                      I agree to the privacy policy and consent to Evergreen Academy collecting 
                      and storing my personal information to respond to my inquiry.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Additional Information - Right Side */}
            <div className="lg:col-span-1 space-y-8">
              {/* Emergency Contact */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-3xl p-8 text-white shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-8 h-8 text-white" />
                  <div>
                    <h3 className="text-2xl font-bold">Emergency Contact</h3>
                    <p className="text-white/90">For urgent matters outside office hours</p>
                  </div>
                </div>
                <a 
                  href="tel:+1234567899" 
                  className="text-2xl font-bold hover:text-white/80 block mb-4"
                >
                  +1 (234) 567-8999
                </a>
                <p className="text-white/80 text-sm">
                  Available 24/7 for emergencies only
                </p>
              </div>

              {/* Departments */}
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Contact Specific Departments</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-medium text-gray-900">Admissions Office</p>
                        <p className="text-sm text-gray-600">Enrollment & applications</p>
                      </div>
                    </div>
                    <a 
                      href="mailto:admissions@evergreenacademy.edu" 
                      className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                    >
                      Email →
                    </a>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">Academic Affairs</p>
                        <p className="text-sm text-gray-600">Curriculum & programs</p>
                      </div>
                    </div>
                    <a 
                      href="mailto:academics@evergreenacademy.edu" 
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Email →
                    </a>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900">Student Services</p>
                        <p className="text-sm text-gray-600">Counseling & support</p>
                      </div>
                    </div>
                    <a 
                      href="mailto:studentservices@evergreenacademy.edu" 
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                    >
                      Email →
                    </a>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-gray-900">Alumni Relations</p>
                        <p className="text-sm text-gray-600">Graduate connections</p>
                      </div>
                    </div>
                    <a 
                      href="mailto:alumni@evergreenacademy.edu" 
                      className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                    >
                      Email →
                    </a>
                  </div>
                </div>
              </div>

              {/* Map Preview */}
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Find Our Campus</h3>
                    <p className="text-gray-600 text-sm">Easy access from all major highways</p>
                  </div>
                </div>
                
                <div className="relative h-48 rounded-xl overflow-hidden mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
                    <div className="text-center text-white p-6">
                      <MapPin className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-bold">1400 Pine Street</p>
                      <p className="text-sm">City, State 12345</p>
                    </div>
                  </div>
                </div>
                
                <a 
                  href="https://www.google.com/maps/place/Harvard+University/@42.3744353,-71.1367028,2108m/data=!3m2!1e3!4b1!4m6!3m5!1s0x89e377427d7f0199:0x5937c65cee2427f0!8m2!3d42.3744368!4d-71.1182488!16zL20vMDNrc3k?entry=ttu&g_ep=EgoyMDI2MDIwMS4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors duration-200 w-full justify-center gap-2"
                >
                  <span>Open in Google Maps</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-100 text-blue-700 rounded-full mb-4">
              <MessageSquare className="w-5 h-5" />
              <span className="font-semibold">FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
              Quick Answers to Common Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h4 className="text-lg font-bold text-gray-900 mb-3">How long does it take to get a response?</h4>
              <p className="text-gray-600">
                We typically respond within 24-48 hours during business days. For urgent matters, please use our emergency contact number.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h4 className="text-lg font-bold text-gray-900 mb-3">Can I schedule a campus tour?</h4>
              <p className="text-gray-600">
                Absolutely! Mention your preferred dates in your message or contact our admissions office directly to schedule a personalized tour.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h4 className="text-lg font-bold text-gray-900 mb-3">Where can I find application forms?</h4>
              <p className="text-gray-600">
                All application materials are available on our Admissions page or can be requested through this form or directly from our admissions office.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h4 className="text-lg font-bold text-gray-900 mb-3">Do you offer financial aid?</h4>
              <p className="text-gray-600">
                Yes! We offer various financial aid options and scholarships. Contact our financial aid office for detailed information and application procedures.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/faq"
              className="inline-flex items-center px-8 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl"
            >
              <span>View All FAQs</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section - Consistent with HomeView */}
      <div className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-fixed bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1519681393784-d120267933ba?w=2000&auto=format&fit=crop&q=80')`,
            backgroundAttachment: 'fixed',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/85 via-blue-900/75 to-purple-900/65"></div>
        </div>
        
        <div className="relative z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full mb-6">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">READY TO CONNECT?</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6">
              Let's Start the Conversation
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Whether you're a prospective student, parent, or community member, we're excited to connect with you and answer all your questions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/admissions"
                className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>Explore Admissions</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-8 py-4 bg-transparent text-white font-semibold rounded-xl border-2 border-white hover:bg-white/10 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>Send Another Message</span>
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-white/80">
              <div className="flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                <span>24-Hour Response</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" />
                <span>Direct Phone Support</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Campus Tours Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ContactView;