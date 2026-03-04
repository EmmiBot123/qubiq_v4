import React from 'react';
import { useStore } from '../context/Store';
import { Trash2 } from 'lucide-react';

const Sidebar = () => {
    const { slides, activeSlideId, setActiveSlideId, deleteSlide } = useStore();

    return (
        <div className="glass-panel" style={{
            width: '260px',
            height: '100%',
            borderRight: '1px solid var(--border-glass)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1rem',
            gap: '1rem',
            overflowY: 'auto'
        }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Slides
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        onClick={() => setActiveSlideId(slide.id)}
                        style={{
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{
                            width: '100%',
                            aspectRatio: '16/9',
                            background: '#1e293b',
                            borderRadius: '8px',
                            border: `2px solid ${activeSlideId === slide.id ? 'var(--accent-teal)' : 'transparent'}`,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)'
                        }}>
                            Slide {index + 1}
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteSlide(slide.id);
                            }}
                            style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                opacity: 0.8
                            }}
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
