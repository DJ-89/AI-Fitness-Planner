import React from 'react';

// This defines what information the Modal needs to work
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
}

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Yes, Delete" 
}: ConfirmModalProps) {
  
  // If isOpen is false, don't render anything!
  if (!isOpen) return null;

  return (
    // The "fixed inset-0 z-50" is what forces it perfectly to the front!
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* The actual white box */}
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl scale-in-center">
        
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-red-600 font-bold text-xl">!</span>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">{title}</h3>
        <p className="text-sm text-gray-500 text-center mb-6">{message}</p>
        
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition"
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}