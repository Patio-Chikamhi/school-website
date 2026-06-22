import React, {useState} from 'react';
import { X, Play, Maximize2, MapPin, Users, BookOpen, Building } from 'lucide-react';

const VirtualTour = ({ isOpen, onClose }) => {
  const tourSections = [
    { 
      id: 'campus', 
      title: 'Campus Overview', 
      icon: Building,
      description: 'Explore our beautiful 50-acre campus with state-of-the-art facilities'
    },
    { 
      id: 'classrooms', 
      title: 'Smart Classrooms', 
      icon: BookOpen,
      description: 'Interactive learning spaces with modern technology'
    },
    { 
      id: 'labs', 
      title: 'Science & Innovation Labs', 
      icon: MapPin,
      description: 'Hands-on experimentation spaces for STEM education'
    },
    { 
      id: 'sports', 
      title: 'Athletic Facilities', 
      icon: Users,
      description: 'Olympic-size pool, gymnasium, and sports fields'
    }
  ];

  const [activeTour, setActiveTour] = useState('campus');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-4">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity" 
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-4 md:p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Virtual Campus Tour</h2>
              <p className="text-gray-600 mt-1">Experience Evergreen Academy from anywhere in the world</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Maximize2 className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          {/* Main Tour Viewer */}
          <div className="bg-gray-900 rounded-xl overflow-hidden mb-6">
            <div className="aspect-video relative">
              {/* Placeholder for actual tour (could be YouTube embed, 360° viewer, etc.) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-emerald-600/20 rounded-full flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {tourSections.find(t => t.id === activeTour)?.title}
                </h3>
                <p className="text-gray-300 text-center max-w-md">
                  {tourSections.find(t => t.id === activeTour)?.description}
                </p>
                <button className="mt-6 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                  Start Interactive Tour
                </button>
              </div>
              
              {/* Simulated navigation controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <button className="px-4 py-2 bg-black/50 text-white rounded-lg hover:bg-black/70">
                  360° View
                </button>
                <button className="px-4 py-2 bg-black/50 text-white rounded-lg hover:bg-black/70">
                  Floor Plan
                </button>
                <button className="px-4 py-2 bg-black/50 text-white rounded-lg hover:bg-black/70">
                  Photo Gallery
                </button>
              </div>
            </div>
          </div>
          
          {/* Tour Sections */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Explore Our Campus</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {tourSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveTour(section.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      activeTour === section.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`p-2 rounded-lg mb-2 ${
                        activeTour === section.id ? 'bg-emerald-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          activeTour === section.id ? 'text-emerald-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <span className="font-medium text-gray-900">{section.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Additional Information */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Ready to see more?</h4>
                <p className="text-sm text-gray-600">Schedule an in-person tour with our admissions team</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Close Tour
                </button>
                <button
                  onClick={() => {
                    onClose();
                    // You could trigger the ApplyModal here
                    alert('Redirecting to admissions page...');
                  }}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Schedule In-Person Tour
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualTour;