import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateWithRetry(model, prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (err) {
      if (err.status === 429 && i < retries - 1) {
        await new Promise((res) => setTimeout(res, 4000));
      } else {
        throw err;
      }
    }
  }
}

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // ✅ ONLY supported model on v1beta
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
    });

    const systemPrompt = `
Return ONLY valid JSON.

{
  "title": "short catchy title",
  "description": "single paragraph, 2-3 sentences, no line breaks",
  "category": "tech | music | sports | art | food | business | health | education | gaming | networking | outdoor | community",
  "suggestedCapacity": 50,
  "suggestedTicketType": "free or paid"
}

Event idea: ${prompt}
`;

    const result = await generateWithRetry(model, systemPrompt);
    const response = await result.response;
    let text = response.text().trim();

    text = text.replace(/```json|```/g, "").trim();

    const eventData = JSON.parse(text);

    return NextResponse.json(eventData);
  } catch (error) {
    console.error("Error generating event:", error);
    return NextResponse.json(
      { error: "Failed to generate event" },
      { status: 500 }
    );
  }
}
