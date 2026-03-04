export const AIService = {
    generateSlideFromTopic: async (topic) => {
        // Simulated AI call
        await new Promise(r => setTimeout(r, 1500));

        return {
            title: `The Future of ${topic}`,
            points: [
                `Innovative applications of ${topic} in modern industry.`,
                `Analyzing the impact of ${topic} on global productivity.`,
                `Sustainable development goals through ${topic} integration.`
            ],
            imagePrompt: ` futuristic digital illustration representing ${topic}, neon teal and midnight blue color scheme, cinematic lighting`
        };
    },

    generateImage: async (prompt) => {
        // Simulated AI image generation delay
        await new Promise(r => setTimeout(r, 1000));
        // Use Pollinations.ai for dynamic image generation based on prompt
        const encodedPrompt = encodeURIComponent(prompt);
        // Add random seed to ensure new image on same prompt
        const randomSeed = Math.floor(Math.random() * 1000);
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${randomSeed}&width=800&height=600&nologo=true`;
    }
};
