// src/components/shared/Modal.jsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

const Modal = ({ 
  children, 
  onClose, 
  maxWidth = 'max-w-2xl',
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = ''
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  // Handle Escape key
  useEffect(() => {
    if (!closeOnEscape || !onClose) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeOnEscape, onClose]);

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} ${className}`}
        style={{ 
          position: 'relative',
          pointerEvents: 'auto',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;