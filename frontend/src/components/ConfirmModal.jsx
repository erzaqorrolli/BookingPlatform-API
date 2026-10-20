import { AlertTriangle, Info } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  isLoading,
  confirmText = "Delete",
  cancelText = "Cancel",
  hideDeleteStyle = false 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${
            hideDeleteStyle ? 'bg-blue-100' : 'bg-red-100'
          }`}>
            {hideDeleteStyle 
              ? <Info className="w-6 h-6 text-blue-600" />
              : <AlertTriangle className="w-6 h-6 text-red-600" />
            }
          </div>
          
          <h3 className="text-lg font-bold text-center text-slate-900 mb-2">
            {title}
          </h3>
          
          <div className="text-center text-slate-500 text-sm mb-6">
            {message}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 font-medium rounded-xl transition ${
                hideDeleteStyle 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cancelText}
            </button>
            
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 text-white font-medium rounded-xl transition disabled:opacity-50 ${
                hideDeleteStyle 
                  ? 'bg-slate-900 hover:bg-slate-800' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}