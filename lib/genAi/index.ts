import { GoogleGenerativeAI } from '@google/generative-ai';
import type { NextApiRequest, NextApiResponse } from 'next';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function generateUrlFriendlyTitle(productDescription: string): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY environment variable is not set.');
    return null;
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });

  try {
    const chat = model.startChat({
      history: [],
      systemInstruction: `You are a helpful assistant. You will be given a description of a product, and you will generate a URL-friendly title for it.
The title should be lowercase, with spaces replaced by hyphens, and should focus on the key identifying features of the product. Avoid including extra words or promotional language.

For example 
user input : iPhone 16 128 GB: 5G Mobile Phone with Camera Control, A18 Chip and a Big Boost in Battery Life. Works with AirPods; Black 

output : iphone-16-128gb-5g-black

user input : Apple MacBook Air Laptop: Apple M1 chip, 13.3-inch/33.74 cm Retina Display, 8GB RAM, 256GB SSD Storage, Backlit Keyboard, FaceTime HD Camera, Touch ID. Works with iPhone/iPad; Space Grey

output : iphone-16-128gb-5g-black
`,
    });

    const result = await chat.sendMessage(
      `Generate a URL-friendly title for the following product description: ${productDescription}`
    );
    const response = await result.response;
    console.log('Response:', response);
    return response.text().trim(); // Trim any leading/trailing whitespace
  } catch (error) {
    console.error('Error generating URL-friendly title:', error);
    return null;
  }
}