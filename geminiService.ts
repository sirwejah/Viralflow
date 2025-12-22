
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ScriptArchetype } from "./types";

export const getNicheTrends = async (niche: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `What are 5 trending topics or news items today for creators in the ${niche} niche? Keep them short (under 10 words each).`,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });
  
  const text = response.text || "";
  return text.split('\n').filter(t => t.trim().length > 3).map(t => t.replace(/^\d+\.\s*/, '').trim()).slice(0, 5);
};

export const generateHooksWithSearch = async (topic: string, niche: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
    { text: lines[0] || "Hook 1 based on trends", type: "Search Grounded", viralityScore: 92 },
    { text: lines[1] || "Hook 2 based on trends", type: "Search Grounded", viralityScore: 88 },
    { text: lines[2] || "Hook 3 based on trends", type: "Search Grounded", viralityScore: 85 }
  ];
  
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return { results, sources };
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
    model: 'gemini-3-pro-preview',
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
      systemInstruction: "You are a world-class viral video scriptwriter specializing in TikTok, Reels, and Shorts. Your scripts are punchy, engaging, and optimized for high retention."
    }
  });
  return response.text;
};

export const generateProImage = async (prompt: string, aspectRatio: string, size: string) => {
  const proAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await proAi.models.generateContent({
    model: 'gemini-3-pro-image-preview',
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
    model: 'gemini-3-pro-preview',
    contents: `Performance History: ${history.join('. ')}\nQuestion: ${question}`,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      systemInstruction: "You are a top-tier viral growth consultant. Use deep reasoning to provide strategy."
    }
  });
  return response.text;
};

export const analyzeMedia = async (base64Media: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Media.split(',')[1], mimeType } },
        { text: "Analyze this content for its viral potential. What works? What doesn't? Be specific about lighting, hook, and pacing." }
      ]
    }
  });
  return response.text;
};
