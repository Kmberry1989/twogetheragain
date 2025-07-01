import React from 'react';

const Modal = ({ isOpen, onClose, title, children, showConfirmButton = false, onConfirm = () => {}, confirmText = 'Confirm', closeButtonText = 'Close' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg transform transition-all duration-300 ease-in-out scale-95">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-2xl font-bold text-pink-600">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl font-light">&times;</button>
        </div>
        <div className="text-gray-700 max-h-[60vh] overflow-y-auto pr-2">
          {children}
        </div>
        <div className="mt-6 flex justify-end space-x-3 pt-3 border-t">
          {showConfirmButton && (
            <button onClick={onConfirm} className="btn-danger">
              {confirmText}
            </button>
          )}
          <button onClick={onClose} className="btn-primary">
            {closeButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
