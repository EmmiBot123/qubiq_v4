import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/Store';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { Canvas, IText, Rect, FabricImage } from 'fabric';

const PresentationMode = () => {
    const { slides, isPresenting, setIsPresenting } = useStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const canvasRef = useRef(null);
    const fabricCanvas = useRef(null);

    // Keyboard navigation
    useEffect(() => {
        if (!isPresenting) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsPresenting(false);
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, isPresenting, slides.length]);

    const nextSlide = () => {
        if (currentIndex < slides.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const prevSlide = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    // Render loop
    useEffect(() => {
        if (!isPresenting) return;

        // Small timeout to ensure DOM is ready if transitioning
        const timeoutId = setTimeout(() => {
            if (!canvasRef.current) return;

            if (!fabricCanvas.current) {
                console.log('PresentationMode: Initializing canvas');
                fabricCanvas.current = new Canvas(canvasRef.current, {
                    width: window.innerWidth,
                    height: window.innerHeight,
                    backgroundColor: '#000000',
                    selection: false,
                    renderOnAddRemove: false
                });
            } else {
                // Resize if needed
                fabricCanvas.current.setDimensions({
                    width: window.innerWidth,
                    height: window.innerHeight
                });
            }

            renderSlide();
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [currentIndex, slides, isPresenting]);

    const renderSlide = () => {
        if (!fabricCanvas.current) return;

        const currentSlide = slides[currentIndex];
        console.log('PresentationMode: Rendering slide', currentIndex, currentSlide);

        try {
            fabricCanvas.current.clear();
            fabricCanvas.current.set({ backgroundColor: '#050505' }); // Deep dark background for presentation

            // Calculate scale to fit screen while maintaining aspect ratio (16:9 base)
            const baseWidth = 800;
            const baseHeight = 450;
            const scaleX = window.innerWidth / baseWidth;
            const scaleY = window.innerHeight / baseHeight;
            const scale = Math.min(scaleX, scaleY) * 0.9; // 90% fit

            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            const slideWidth = baseWidth * scale;
            const slideHeight = baseHeight * scale;
            const originX = centerX - slideWidth / 2;
            const originY = centerY - slideHeight / 2;

            // Draw slide background rect
            const bgRect = new Rect({
                left: originX,
                top: originY,
                width: slideWidth,
                height: slideHeight,
                fill: '#ffffff',
                selectable: false,
                evented: false,
                shadow: '0 0 50px rgba(0,0,0,0.7)'
            });
            fabricCanvas.current.add(bgRect);

            if (!currentSlide || !currentSlide.elements) return;

            // Render elements
            currentSlide.elements.forEach(el => {
                const elementOptions = {
                    left: originX + (el.left * scale),
                    top: originY + (el.top * scale),
                    fill: el.fill,
                    selectable: false,
                    evented: false
                };

                let obj;
                if (el.type === 'text' || el.type === 'i-text') {
                    obj = new IText(el.text, {
                        ...elementOptions,
                        fontSize: el.fontSize * scale,
                    });
                    fabricCanvas.current.add(obj);
                } else if (el.type === 'rect') {
                    obj = new Rect({
                        ...elementOptions,
                        width: el.width * scale,
                        height: el.height * scale,
                    });
                    fabricCanvas.current.add(obj);
                } else if (el.type === 'image') {
                    if (!el.src) return;

                    // Robust image loading with CORS
                    FabricImage.fromURL(el.src, { crossOrigin: 'anonymous' }).then(img => {
                        if (!img || !fabricCanvas.current) return;

                        let imgScaleX = 1;
                        let imgScaleY = 1;

                        if (el.width && el.height && img.width && img.height) {
                            imgScaleX = el.width / img.width;
                            imgScaleY = el.height / img.height;
                        } else if (el.scaleX && el.scaleY) {
                            imgScaleX = el.scaleX;
                            imgScaleY = el.scaleY;
                        }

                        img.set({
                            ...elementOptions,
                            scaleX: imgScaleX * scale,
                            scaleY: imgScaleY * scale
                        });

                        fabricCanvas.current.add(img);
                        fabricCanvas.current.renderAll();
                    }).catch(err => console.error('PresentationMode: Error loading image', err));
                }
            });

            fabricCanvas.current.renderAll();
        } catch (err) {
            console.error('Error rendering presentation slide:', err);
        }
    };

    // Cleanup on unmount or stop presenting
    useEffect(() => {
        if (!isPresenting && fabricCanvas.current) {
            fabricCanvas.current.dispose();
            fabricCanvas.current = null;
        }
    }, [isPresenting]);

    if (!isPresenting) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#000',
            zIndex: 20000, // Higher than everything
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <canvas ref={canvasRef} />

            <div style={{
                position: 'fixed',
                bottom: '30px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '1.5rem',
                padding: '0.8rem 1.5rem',
                background: 'rgba(30, 41, 59, 0.8)',
                backdropFilter: 'blur(12px)',
                borderRadius: 'full',
                border: '1px solid rgba(255,255,255,0.1)',
                zIndex: 20001,
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
                <button
                    onClick={prevSlide}
                    className="btn-ghost"
                    disabled={currentIndex === 0}
                    style={{ color: currentIndex === 0 ? '#64748b' : 'white', padding: '0.5rem' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        Slide {currentIndex + 1}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                        of {slides.length}
                    </span>
                </div>
                <button
                    onClick={nextSlide}
                    className="btn-ghost"
                    disabled={currentIndex === slides.length - 1}
                    style={{ color: currentIndex === slides.length - 1 ? '#64748b' : 'white', padding: '0.5rem' }}
                >
                    <ArrowRight size={24} />
                </button>

                <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 0.5rem' }} />

                <button
                    onClick={() => setIsPresenting(false)}
                    className="btn-ghost"
                    style={{ color: '#ef4444', padding: '0.5rem' }}
                    title="Exit Presentation (Esc)"
                >
                    <X size={24} />
                </button>
            </div>
        </div>
    );
};

export default PresentationMode;
