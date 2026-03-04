import React, { createContext, useContext, useState, useCallback } from 'react';

const SlideStoreContext = createContext();

export const SlideProvider = ({ children }) => {
  const [slides, setSlides] = useState([
    {
      id: 'slide-1',
      elements: [
        { id: 'e1', type: 'text', text: 'Welcome to Nova', x: 100, y: 100, fontSize: 40, color: '#f8fafc' },
        { id: 'e2', type: 'text', text: 'The AI-Powered Presentation Suite', x: 100, y: 160, fontSize: 20, color: '#94a3b8' }
      ],
      notes: 'Initial slide notes...'
    }
  ]);

  const [activeSlideId, setActiveSlideId] = useState('slide-1');

  const addSlide = useCallback(() => {
    const newSlide = {
      id: `slide-${Date.now()}`,
      elements: [],
      notes: ''
    };
    setSlides(prev => [...prev, newSlide]);
    setActiveSlideId(newSlide.id);
  }, []);

  const addSlideWithContent = useCallback((elements, notes = '') => {
    const newSlide = {
      id: `slide-${Date.now()}`,
      elements: elements,
      notes: notes
    };
    setSlides(prev => [...prev, newSlide]);
    setActiveSlideId(newSlide.id);
  }, []);

  const deleteSlide = useCallback((id) => {
    setSlides(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (activeSlideId === id && filtered.length > 0) {
        setActiveSlideId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeSlideId]);

  const updateSlideElements = useCallback((slideId, newElements) => {
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, elements: newElements } : s));
  }, []);

  const [isPresenting, setIsPresenting] = useState(false);

  return (
    <SlideStoreContext.Provider value={{
      slides,
      activeSlideId,
      setActiveSlideId,
      addSlide,
      addSlideWithContent,
      deleteSlide,
      updateSlideElements,
      isPresenting,
      setIsPresenting
    }}>
      {children}
    </SlideStoreContext.Provider>
  );
};

export const useStore = () => useContext(SlideStoreContext);
