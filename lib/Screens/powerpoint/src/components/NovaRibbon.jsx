import React, { useState, useRef } from 'react';
import { Layout, Image, Type, Sparkles, Presentation, Save, Settings, Square, Upload } from 'lucide-react';
import { useStore } from '../context/Store';
import { AIService } from '../services/AIService';
import InputModal from './InputModal';

const TABS = [
    { name: 'Home', icon: Layout },
    { name: 'Insert', icon: Type },
    { name: 'AI Magic', icon: Sparkles },
    // { name: 'Design', icon: Image }, // Hidden for now
    { name: 'View', icon: Presentation },
];

const NovaRibbon = () => {
    const [activeTab, setActiveTab] = useState('Home');
    const [isGenerating, setIsGenerating] = useState(false);
    const { addSlide, addSlideWithContent, activeSlideId, slides, updateSlideElements, setIsPresenting } = useStore();
    const fileInputRef = useRef(null);

    const addText = () => {
        const activeSlide = slides.find(s => s.id === activeSlideId);
        const newElements = [...(activeSlide?.elements || []), {
            id: `text-${Date.now()}`,
            type: 'text',
            text: 'Click to edit',
            left: 100,
            top: 100,
            fontSize: 24,
            fill: '#000000'
        }];
        updateSlideElements(activeSlideId, newElements);
    };

    const addRect = () => {
        const activeSlide = slides.find(s => s.id === activeSlideId);
        const newElements = [...(activeSlide?.elements || []), {
            id: `rect-${Date.now()}`,
            type: 'rect',
            left: 200,
            top: 200,
            width: 100,
            height: 100,
            fill: '#2dd4bf'
        }];
        updateSlideElements(activeSlideId, newElements);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const activeSlide = slides.find(s => s.id === activeSlideId);
            const newElements = [...(activeSlide?.elements || []), {
                id: `img-${Date.now()}`,
                type: 'image',
                src: event.target.result,
                left: 150,
                top: 150,
                width: 300,
                height: 200,
            }];
            updateSlideElements(activeSlideId, newElements);
        };
        reader.readAsDataURL(file);
        // Reset input
        e.target.value = '';
    };

    const triggerImageUpload = () => {
        fileInputRef.current?.click();
    };

    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, title: '', placeholder: '' });

    const openModal = (type, title, placeholder) => {
        setModalConfig({ isOpen: true, type, title, placeholder });
    };

    const handleModalSubmit = async (value) => {
        if (!value) return;

        if (modalConfig.type === 'magic-slide') {
            await generateMagicSlide(value);
        } else if (modalConfig.type === 'image-genie') {
            await generateImageGenie(value);
        }
    };

    const generateMagicSlide = async (topic) => {
        setIsGenerating(true);
        try {
            console.log('Generating AI slide for:', topic);
            const aiData = await AIService.generateSlideFromTopic(topic);

            const elements = [
                { id: `t-${Date.now()}`, type: 'text', text: aiData.title, left: 100, top: 50, fontSize: 40, fill: '#0a0f1e' },
                ...aiData.points.map((p, i) => ({
                    id: `p-${Date.now()}-${i}`,
                    type: 'text',
                    text: `• ${p}`,
                    left: 100,
                    top: 140 + (i * 50),
                    fontSize: 20,
                    fill: '#1e293b'
                }))
            ];

            addSlideWithContent(elements, `AI generated notes for ${topic}`);
            console.log('AI slide added successfully');
        } catch (err) {
            console.error('AI generation failed:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const generateImageGenie = async (promptText) => {
        setIsGenerating(true);
        try {
            console.log('Generating image for:', promptText);
            const imageUrl = await AIService.generateImage(promptText);

            const activeSlide = slides.find(s => s.id === activeSlideId);
            const newElements = [...(activeSlide?.elements || []), {
                id: `img-${Date.now()}`,
                type: 'image',
                src: imageUrl,
                left: 200,
                top: 150,
                width: 400,
                height: 300,
                fill: ''
            }];
            updateSlideElements(activeSlideId, newElements);
            console.log('Image added to slide');
        } catch (err) {
            console.error('Image generation failed:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleMagicSlide = () => {
        openModal('magic-slide', 'Magic Slide Generator', 'Enter a topic (e.g., Space Exploration)');
    };

    const handleImageGenie = () => {
        openModal('image-genie', 'Image Genie', 'Describe the image (e.g., A futuristic city)');
    };

    return (
        <div className="glass-panel" style={{
            height: '140px',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageUpload}
            />

            <InputModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onSubmit={handleModalSubmit}
                title={modalConfig.title}
                placeholder={modalConfig.placeholder}
            />
            <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-glass)' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.name}
                        onClick={() => setActiveTab(tab.name)}
                        className={`btn-ghost ${activeTab === tab.name ? 'neon-border' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem' }}
                    >
                        <tab.icon size={16} color={activeTab === tab.name ? 'var(--accent-teal)' : 'white'} />
                        <span style={{ fontSize: '0.85rem' }}>{tab.name}</span>
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, padding: '1rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                {activeTab === 'Home' && (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                            <button onClick={() => addSlide()} className="btn-primary" style={{ padding: '0.4rem' }}>
                                <Layout size={20} />
                            </button>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>New Slide</span>
                        </div>
                        <div style={{ width: '1px', height: '80%', background: 'var(--border-glass)' }} />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={addText} className="btn-ghost" style={{ padding: '0.5rem' }} title="Add Text"><Type size={18} /></button>
                            <button onClick={addRect} className="btn-ghost" style={{ padding: '0.5rem' }} title="Add Shape"><Square size={18} /></button>
                            <button onClick={triggerImageUpload} className="btn-ghost" style={{ padding: '0.5rem' }} title="Add Image"><Image size={18} /></button>
                        </div>
                    </>
                )}

                {activeTab === 'Insert' && (
                    <>
                        <button onClick={addText} className="btn-ghost" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem' }}>
                            <Type size={20} />
                            <span style={{ fontSize: '0.7rem' }}>Text Box</span>
                        </button>
                        <button onClick={triggerImageUpload} className="btn-ghost" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem' }}>
                            <Upload size={20} />
                            <span style={{ fontSize: '0.7rem' }}>Pictures</span>
                        </button>
                        <button onClick={addRect} className="btn-ghost" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem' }}>
                            <Square size={20} />
                            <span style={{ fontSize: '0.7rem' }}>Shapes</span>
                        </button>
                    </>
                )}

                {activeTab === 'AI Magic' && (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMagicSlide();
                            }}
                            disabled={isGenerating}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Sparkles size={18} />
                            <span>{isGenerating ? 'Generating...' : 'Magic Slide Generator'}</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleImageGenie();
                            }}
                            disabled={isGenerating}
                            className="btn-ghost"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Image size={18} />
                            <span>Image Genie</span>
                        </button>
                    </>
                )}
                {activeTab === 'View' && (
                    <button
                        onClick={() => setIsPresenting(true)}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Presentation size={18} />
                        <span>Start Presentation</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default NovaRibbon;
