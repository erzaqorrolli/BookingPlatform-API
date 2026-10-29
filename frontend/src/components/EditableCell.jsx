import { useState, useEffect } from 'react';

export default function EditableCell({ value, onSave, placeholder = '+ Add', type = 'text' }) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value || '');

    useEffect(() => {
        setTempValue(value || '');
    }, [value]);

    const handleSave = () => {
        onSave(tempValue); 
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <input
                type={type}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
                className="w-full px-2 py-1 border border-indigo-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
        );
    }

    return (
        <button
            onClick={() => setIsEditing(true)}
            className={`w-full text-left px-2 py-1.5 rounded text-sm transition ${
                value ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-400 italic border border-dashed border-slate-300 hover:border-indigo-400 hover:text-indigo-500'
            }`}
        >
            {value || placeholder}
        </button>
    );
}