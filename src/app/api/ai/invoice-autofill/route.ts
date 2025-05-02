import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import https from 'https';

// Initialize OpenAI client
console.log('OpenAI Model from env:', process.env.OPENAI_MODEL);
console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);

// Configure fetch options to handle certificate issues
// This is a workaround for the "unable to get local issuer certificate" error
// For a production environment, you should:
// 1. Install proper CA certificates on your server
// 2. Remove this code and the NODE_TLS_REJECT_UNAUTHORIZED=0 setting
// 3. Use a proper HTTPS configuration
const fetchOptions = {
  // Disable SSL certificate validation for development environments
  // Note: This should be removed in production for security reasons
  httpsAgent: new https.Agent({
    rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false
  })
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  fetch: (url, options) => {
    return fetch(url, { ...options, ...fetchOptions });
  }
});

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required for invoice autofill' },
        { status: 400 }
      );
    }

    // Call OpenAI to extract invoice data
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that extracts invoice information from text. 
          Extract the following information in JSON format:
          - customer: name, email, phone, address, city, state, zip, country
          - items: array of products/services with product name, description, quantity, rate
          - notes: any additional notes
          - terms: payment terms
          
          Return ONLY valid JSON with these fields, even if some are empty arrays or null.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    // Extract the JSON response
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from AI service');
    }

    // Parse the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw AI response:', content);
      throw new Error('Failed to parse AI response');
    }

    // Return the extracted data
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Invoice autofill error:', error);
    
    // Check for OpenDNS or other network blocking
    if (error.message?.includes('block.opendns.com') || 
        (error.status === 403 && error.message?.includes('html'))) {
      return NextResponse.json(
        { error: 'Network restriction detected: Your network administrator has blocked access to the AI service. Please contact your IT department or try using a different network connection.' },
        { status: 403 }
      );
    }
    
    // Handle different types of errors
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured properly' },
        { status: 500 }
      );
    } else if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'AI service rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    } else if (error.message?.includes('insufficient_quota')) {
      return NextResponse.json(
        { error: 'OpenAI API quota exceeded. Please check your billing information.' },
        { status: 402 }
      );
    } else if (error.message?.includes('invalid_request_error')) {
      return NextResponse.json(
        { error: 'Invalid request to OpenAI API. Please check your configuration.' },
        { status: 400 }
      );
    } else if (error.status === 403) {
      return NextResponse.json(
        { error: 'Access to the AI service is blocked. This could be due to network restrictions or API key permissions.' },
        { status: 403 }
      );
    } else if (error.response?.status) {
      // Handle OpenAI API specific errors with status codes
      return NextResponse.json(
        { error: `OpenAI API error (${error.response.status}): ${error.message || 'Unknown error'}` },
        { status: error.response.status }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to process invoice text' },
      { status: 500 }
    );
  }
}