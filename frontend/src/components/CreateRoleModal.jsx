import { useState } from 'react';
import { X, Check, Plus, Minus } from 'lucide-react';

const AVAILABLE_PERMISSIONS = [
  {
    category: 'Communications & Chat',
    items: [
      { key: 'staff_can_send_emails', label: 'Send email to client', description: 'Allow staff to send emails to clients.' },
    ]
  },
  {
    category: 'Booking management',
    items: [
      { key: 'staff_can_manage_bookings', label: 'Manage bookings', description: 'Allow staff to view and change booking status.' },
      { key: 'staff_can_view_bookings', label: 'View bookings', description: 'Allow staff to only see bookings' },
    ]
  },
  {
    category: 'Clients',
    items: [
      { key: 'staff_can_manage_customers', label: 'Manage clients', description: 'Allow staff to add and change clients.' },
    ]
  },
  {
    category: 'Finances',
    items: [
      { key: 'staff_can_manage_invoices', label: 'Manage invoices', description: ' Allow staff to create and view invoices.' },
    ]
  }
];

export default function CreateRoleModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const togglePermission = (key) => {
    setSelectedPermissions(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({ ...prev, [categoryName]: !prev[categoryName] }));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return alert('Role name is required');
    setIsSubmitting(true);
    try {
      await onCreate(name, description, selectedPermissions);
      setName('');
      setDescription('');
      setSelectedPermissions([]);
      onClose();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPermissions = AVAILABLE_PERMISSIONS.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.label.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Create Role</h2>
            <p className="text-sm text-slate-500 mt-1">Create role and choose what staff can do.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Role Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter role name"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of what this role can do"
                rows={2}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Permissions</h3>
            <div className="relative mb-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search permissions"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 outline-none"
              />
              <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="space-y-2">
              {filteredPermissions.map(category => {
                const isExpanded = expandedCategories[category.category];
                return (
                  <div key={category.category} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category.category)}
                      className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={category.items.every(i => selectedPermissions.includes(i.key))}
                          onChange={() => {
                            const allKeys = category.items.map(i => i.key);
                            const allSelected = allKeys.every(k => selectedPermissions.includes(k));
                            if (allSelected) {
                              setSelectedPermissions(prev => prev.filter(k => !allKeys.includes(k)));
                            } else {
                              setSelectedPermissions(prev => [...new Set([...prev, ...allKeys])]);
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="font-medium text-slate-900">{category.category}</span>
                      </div>
                      {isExpanded ? <Minus className="w-4 h-4 text-slate-400" /> : <Plus className="w-4 h-4 text-slate-400" />}
                    </button>
                    
                    {isExpanded && (
                      <div className="bg-slate-50 p-2 border-t border-slate-200">
                        {category.items.map(item => (
                          <label key={item.key} className="flex items-start gap-3 p-3 hover:bg-white rounded-lg cursor-pointer transition">
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(item.key)}
                              onChange={() => togglePermission(item.key)}
                              className="w-4 h-4 mt-0.5 text-indigo-600 rounded"
                            />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{item.label}</p>
                              <p className="text-xs text-slate-500">{item.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-white transition">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Creating...' : <><Check className="w-5 h-5" /> Create Role</>}
          </button>
        </div>
      </div>
    </div>
  );
}