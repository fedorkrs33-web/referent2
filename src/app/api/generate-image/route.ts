// src/app/api/generate-image/route.ts
import { generateImage } from '../../../lib/generateImage';
import { NextRequest, NextResponse } from 'next/server';

interface RequestBody {
  prompt: string;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt }: RequestBody = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Промт не указан' }, { status: 400 });
    }

    const imageUrl = await generateImage(prompt);

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    console.error('❌ [API] Ошибка генерации изображения:', errorMessage);
    return NextResponse.json(
      { error: 'Не удалось сгенерировать изображение: ' + errorMessage },
      { status: 500 }
    );
  }
}

