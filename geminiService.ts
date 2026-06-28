
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ScriptArchetype } from "./types";

export const getNicheTrends = async (niche: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `What are 5 trending topics or news items today for creators in the ${niche} niche? Keep them short (under 10 words each).`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });
    
    const text = response.text || "";
    const trends = text.split('\n').filter(t => t.trim().length > 3).map(t => t.replace(/^\d+\.\s*/, '').trim()).slice(0, 5);
    if (trends.length > 0) return trends;
  } catch (e) {
    console.warn("Trend fetching failed, using fallback:", e);
  }
  
  // Fallback trends
  const fallbacks: Record<string, string[]> = {
    'AI': ['Generative Video Breakthroughs', 'AI Agents for Productivity', 'New LLM Benchmarks', 'Ethical AI Regulations', 'AI in Creative Arts'],
    'Finance': ['Market Volatility Strategies', 'Passive Income Ideas 2024', 'Crypto Regulation News', 'Real Estate Investing Trends', 'Personal Budgeting Hacks'],
    'Fitness': ['Hybrid Training Methods', 'Biohacking for Longevity', 'Mindful Movement Trends', 'High-Protein Meal Prep', 'Recovery Tech Innovation']
  };
  return fallbacks[niche] || ['Viral Hook Strategies', 'Short-form SEO Tips', 'Engagement Growth Hacks', 'Content Batching Systems', 'Algorithm Update News'];
};

export const generateHooksWithSearch = async (topic: string, niche: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Based on current trends, generate 3 viral short-form video hooks for: "${topic}" in the ${niche} niche. 
                 Format the output as a list where each item has:
                 - Hook text
                 - Type (e.g., Narrative, Visual, Curiosity)
                 - Virality Score (0-100)
                 
                 Provide the data clearly.`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });
    
    const text = response.text || "";
    const lines = text.split('\n').filter(l => l.trim().length > 5);
    const results = [
      { text: lines[0] || `The secret to ${topic} revealed`, type: "Curiosity", viralityScore: 92 },
      { text: lines[1] || `Why most creators fail at ${topic}`, type: "Narrative", viralityScore: 88 },
      { text: lines[2] || `3 steps to master ${topic} today`, type: "Tutorial", viralityScore: 85 }
    ];
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { results, sources };
  } catch (e) {
    console.error("Hook generation failed:", e);
    return {
      results: [
        { text: `The secret to ${topic} revealed`, type: "Curiosity", viralityScore: 85 },
        { text: `Why most creators fail at ${topic}`, type: "Narrative", viralityScore: 82 },
        { text: `3 steps to master ${topic} today`, type: "Tutorial", viralityScore: 80 }
      ],
      sources: []
    };
  }
};

const cleanTextOutput = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .replace(/[*_#]/g, '')
    .trim();
};

export const generateScript = async (title: string, hook: string, archetype: ScriptArchetype = 'Storyteller') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const archetypeInstructions: Record<ScriptArchetype, string> = {
    'Storyteller': "Focus on emotional stakes, a clear protagonist, and a 'lesson learned' resolution.",
    'Tutorial': "Clear step-by-step instructions. Quick pacing. Focus on 'the result'.",
    'Myth-Buster': "Identify a common misconception immediately and provide surprising counter-evidence.",
    'Listicle': "Fast-paced delivery of 3-5 punchy points. Use numbers to keep attention.",
    'POV': "Immersive 'Day in the life' or scenario-based perspective. High relatability."
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: `Write a high-retention short-form video script for a ${archetype} style video.
               Title: "${title}"
               Starting Hook: "${hook}"
               
               Archetype Guidelines: ${archetypeInstructions[archetype]}
               
               Structure:
               1. Hook (0-5s)
               2. Core Value/Story (5-50s)
               3. Strong Call to Action (50-60s)
               
               Include visual cues in brackets like [Visual: Quick cut to...]`,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      systemInstruction: "You are a world-class viral video scriptwriter specializing in TikTok, Reels, and Shorts. Your scripts are punchy, engaging, and optimized for high retention. Write entirely in plain, clean, and professional text. Do NOT use any markdown characters like asterisks (*), hashtags (#), or underscores (_)."
    }
  });
  return cleanTextOutput(response.text);
};

export const generateProImage = async (prompt: string, aspectRatio: string, size: string) => {
  const proAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await proAi.models.generateContent({
    model: 'gemini-3-pro-image',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: size as any
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const editImageWithFlash = async (base64Image: string, prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const complexCoachAdvice = async (history: string[], question: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: `Performance History: ${history.join('. ')}\nQuestion: ${question}`,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      systemInstruction: "You are a top-tier viral growth consultant. Use deep reasoning to provide strategy. Write entirely in plain, clean, and professional text. Do NOT use any markdown characters like asterisks (*), hashtags (#), or underscores (_)."
    }
  });
  return cleanTextOutput(response.text);
};

export const analyzeMedia = async (base64Media: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Media.split(',')[1], mimeType } },
        { text: "Analyze this content for its viral potential. What works? What doesn't? Be specific about lighting, hook, and pacing. Write entirely in plain, clean, and professional text. Do NOT use any markdown characters like asterisks (*), hashtags (#), or underscores (_)." }
      ]
    }
  });
  return cleanTextOutput(response.text);
};
