// src/app/api/generate-image/route.js
import { generateImage } from '../../../lib/generateImage';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Промт не указан' }, { status: 400 });
    }

    const imageUrl = await generateImage(prompt);

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error('❌ [API] Ошибка генерации изображения:', error.message);
    return NextResponse.json(
      { error: 'Не удалось сгенерировать изображение: ' + error.message },
      { status: 500 }
    );
  }
}
