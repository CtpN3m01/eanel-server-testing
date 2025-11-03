import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint simple para probar la conexión
 * GET /api/mql5/test
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'API MQL5 is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    url: request.url,
  });
}

/**
 * POST /api/mql5/test
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'API MQL5 POST is working!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      receivedData: body,
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: 'Invalid JSON',
      timestamp: new Date().toISOString(),
    }, { status: 400 });
  }
}
