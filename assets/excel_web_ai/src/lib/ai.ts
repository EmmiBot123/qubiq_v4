export async function generateExcelData(prompt: string, apiKey: string): Promise<any[]> {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `You are an expert data assistant. Generate structured JSON data for the following request. 
Return ONLY a raw JSON array of objects representing rows in an Excel table. 
Respond using JSON.
Each object should have keys corresponding to columns and values directly.

User Request: ${prompt}`
                }]
            }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
        throw new Error('No content returned from Gemini');
    }

    try {
        return JSON.parse(textContent);
    } catch (e) {
        throw new Error('Failed to parse the Gemini response into JSON: ' + textContent);
    }
}
