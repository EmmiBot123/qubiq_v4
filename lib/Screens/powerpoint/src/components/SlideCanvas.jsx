import React, { useEffect, useRef } from 'react';
import { Canvas, IText, Rect, FabricImage } from 'fabric';
import { useStore } from '../context/Store';

const SlideCanvas = () => {
    const canvasRef = useRef(null);
    const fabricCanvas = useRef(null);
    const isInternalUpdate = useRef(false);
    const { slides, activeSlideId, updateSlideElements } = useStore();

    useEffect(() => {
        if (!canvasRef.current) return;

        try {
            fabricCanvas.current = new Canvas(canvasRef.current, {
                width: 800,
                height: 450,
                backgroundColor: '#ffffff',
            });

            const handleModified = () => {
                if (isInternalUpdate.current) return;

                const objects = fabricCanvas.current.getObjects();
                const elements = objects.map(obj => ({
                    id: obj.id || `e-${Date.now()}-${Math.random()}`,
                    type: obj.type,
                    text: obj.text || '',
                    left: obj.left,
                    top: obj.top,
                    width: obj.getScaledWidth(),
                    height: obj.getScaledHeight(),
                    fontSize: obj.fontSize,
                    fill: obj.fill,
                    scaleX: obj.scaleX,
                    scaleY: obj.scaleY,
                    src: obj._element?.src || obj.src || '', // Capture source
                }));
                updateSlideElements(activeSlideId, elements);
            };

            fabricCanvas.current.on('object:modified', handleModified);
            fabricCanvas.current.on('object:added', handleModified);
            fabricCanvas.current.on('object:removed', handleModified);
        } catch (err) {
            console.error('Error initializing Fabric:', err);
        }

        const handleKeyDown = (e) => {
            if (!fabricCanvas.current) return;

            // Delete key (46) or Backspace (8)
            if (e.key === 'Delete' || e.key === 'Backspace') {
                // Don't delete if editing text
                const activeObj = fabricCanvas.current.getActiveObject();
                if (activeObj && !activeObj.isEditing) {
                    fabricCanvas.current.remove(activeObj);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (fabricCanvas.current) {
                fabricCanvas.current.dispose();
            }
        };
    }, []);

    useEffect(() => {
        if (!fabricCanvas.current) return;

        const activeSlide = slides.find(s => s.id === activeSlideId);
        if (!activeSlide) return;

        isInternalUpdate.current = true;

        try {
            fabricCanvas.current.clear();
            fabricCanvas.current.set({ backgroundColor: '#ffffff' });

            activeSlide.elements.forEach(el => {
                let obj;
                if (el.type === 'text' || el.type === 'i-text') {
                    obj = new IText(el.text, {
                        left: el.left,
                        top: el.top,
                        fontSize: el.fontSize,
                        fill: el.fill,
                    });
                    obj.id = el.id;
                    fabricCanvas.current.add(obj);
                } else if (el.type === 'rect') {
                    obj = new Rect({
                        left: el.left,
                        top: el.top,
                        width: el.width,
                        height: el.height,
                        fill: el.fill,
                    });
                    obj.id = el.id;
                    fabricCanvas.current.add(obj);
                } else if (el.type === 'image') {
                    console.log('SlideCanvas: Loading image...', el.src);

                    if (!el.src) {
                        console.error('SlideCanvas: Image source is missing!', el);
                        return;
                    }

                    // Async image loading
                    FabricImage.fromURL(el.src, { crossOrigin: 'anonymous' }).then(img => {
                        console.log('SlideCanvas: Image loaded successfully', img);

                        if (!img) {
                            console.error('SlideCanvas: Image object is null/undefined');
                            return;
                        }

                        console.log(`SlideCanvas: Image dims: ${img.width}x${img.height}`);

                        if (img.width === 0 || img.height === 0) {
                            console.warn('SlideCanvas: Image has 0 dimension. Attempting to reload or force render.');
                        }

                        // Calculate scale to fit target dimensions if provided
                        let scaleX = 1;
                        let scaleY = 1;

                        if (el.width && el.height && img.width && img.height) {
                            scaleX = el.width / img.width;
                            scaleY = el.height / img.height;
                        } else if (el.scaleX && el.scaleY) {
                            scaleX = el.scaleX;
                            scaleY = el.scaleY;
                        }

                        if (!fabricCanvas.current) return;

                        img.set({
                            left: el.left,
                            top: el.top,
                            scaleX: scaleX,
                            scaleY: scaleY,
                        });
                        img.setCoords();

                        img.id = el.id;

                        // Critical Fix: Prevent circular update loop
                        isInternalUpdate.current = true;
                        fabricCanvas.current.add(img);
                        fabricCanvas.current.renderAll();
                        isInternalUpdate.current = false;

                        console.log('SlideCanvas: Image added to fabric canvas');
                    }).catch(err => console.error('SlideCanvas: Error loading image', err));
                }
            });

            fabricCanvas.current.renderAll();
        } catch (err) {
            console.error('Error rendering slide:', err);
        } finally {
            // We set timeout to false, but async images might load later.
            // That's why we guard the add() call above independently.
            setTimeout(() => {
                isInternalUpdate.current = false;
            }, 100);
        }
    }, [activeSlideId, slides]);

    return (
        <div style={{ position: 'relative', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
            <canvas ref={canvasRef} />
        </div>
    );
};

export default SlideCanvas;
