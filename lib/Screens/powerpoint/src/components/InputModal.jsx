import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

const InputModal = ({ isOpen, onClose, onSubmit, title, placeholder, initialValue = '' }) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        if (isOpen) {
            setValue(initialValue);
        }
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(value);
        onClose();
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
        }} onClick={handleOverlayClick}>
            <div style={{
                background: '#1e293b',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                padding: '2rem',
                width: '400px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer'
                    }}
                >
                    <X size={20} />
                </button>

                <h2 style={{ color: '#fff', marginBottom: '1.5rem', marginTop: 0 }}>{title}</h2>

                <form onSubmit={handleSubmit}>
                    <input
                        autoFocus
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        style={{
                            width: '90%', // padding 
                            padding: '0.8rem 1rem',
                            background: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '1rem',
                            marginBottom: '1.5rem',
                            outline: 'none'
                        }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-ghost"
                            style={{ color: '#94a3b8' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={!value.trim()}
                        >
                            Generate
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default InputModal;
