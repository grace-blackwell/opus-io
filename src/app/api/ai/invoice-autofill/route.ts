import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    // Call OpenAI API to extract invoice information
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that extracts invoice information from text. 
          Extract the following information in JSON format:
          - Customer information (name, email, phone, address, city, state, zip)
          - Invoice items (product name, description, quantity, rate)
          - Any additional notes or terms
          
          Format the response as a valid JSON object with the following structure:
          {
            "customer": {
              "name": "",
              "email": "",
              "phone": "",
              "address": "",
              "city": "",
              "state": "",
              "zip": "",
              "country": ""
            },
            "items": [
              {
                "product": "",
                "description": "",
                "quantity": "",
                "rate": ""
              }
            ],
            "notes": "",
            "terms": ""
          }
          
          If any field is not found in the text, leave it as an empty string. For items, include as many as you can identify.`
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }
    });

    // Extract the JSON response
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json(
        { error: 'Failed to extract invoice information' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    try {
      const parsedContent = JSON.parse(content);
      return NextResponse.json(parsedContent);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return NextResponse.json(
        { error: 'Failed to parse invoice information' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing invoice text:', error);
    return NextResponse.json(
      { error: 'Failed to process invoice text' },
      { status: 500 }
    );
  }
}