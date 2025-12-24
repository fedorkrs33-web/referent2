// src/app/api/test-token/route.js
const path = require('path');
process.env.NODE_EXTRA_CA_CERTS = path.resolve(__dirname, '../certs/mincyfry_root_ca.cer'
import { NextResponse } from 'next/server';
import { getGigaChatToken } from '../../../lib/auth';

export async function GET() {
  try {
    console.log('🔍 [test-token] Запрос на получение токена...');
    const token = await getGigaChatToken();
    console.log('✅ [test-token] Токен получен (начало):', token.substring(0, 50));

    return NextResponse.json({
      success: true,
      token: token.substring(0, 20) + '...',
    });
  } catch (error) {
    console.error('❌ [test-token] Ошибка получения токена:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
