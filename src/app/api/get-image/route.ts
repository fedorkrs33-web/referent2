// src/app/api/get-image/route.ts
import { getImageByRequestId } from '../../../lib/generateImage';
import { NextRequest, NextResponse } from 'next/server';

interface RequestBody {
  requestId: string;
}

export async function POST(request: NextRequest) {
  try {
    const { requestId }: RequestBody = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: 'requestId не указан' }, { status: 400 });
    }

    console.log('🔍 Запрос изображения по requestId:', requestId);
    const imageUrl = await getImageByRequestId(requestId);

    return NextResponse.json({ url: imageUrl, requestId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    console.error('❌ [API] Ошибка получения изображения по requestId:', errorMessage);
    return NextResponse.json(
      { error: 'Не удалось получить изображение: ' + errorMessage },
      { status: 500 }
    );
  }
}

