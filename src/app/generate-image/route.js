// src/app/api/generate-image/route.js
import { NextResponse } from 'next/server';
import { ChatGiga } from '@sberdevices/gigachat';

const gigachat = new ChatGiga({
  credentials: process.env.GIGACHAT_CLIENT_ID,
  secret: process.env.GIGACHAT_SECRET,
});

// Функция для генерации промпта через GigaChat
async function generatePrompt(text) {
  const prompt = `
    Ты — генератор промптов для изображений.
    Опиши одну сцену, иллюстрирующую суть статьи, в одном кратком английском предложении.
    Не добавляй пояснения. Только описание сцены.
    
    Статья: ${text.slice(0, 6000)}
  `;

  const messages = [{ role: 'user', content: prompt }];

  try {
    const response = await gigachat.sendMessage(messages);
    return response.content.trim();
  } catch (err) {
    console.error('❌ GigaChat error:', err);
    throw new Error('Не удалось сгенерировать промпт');
  }
}

// Функция для генерации изображения через Hugging Face
async function generateImage(prompt) {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/stability-ai/stable-diffusion-xl-base-1.0',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Hugging Face error: ${error.error}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob); // ⚠️ Для браузера, но не для API
  // Лучше вернуть Buffer или base64
}

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Текст не передан' }, { status: 400 });
    }

    // Шаг 1: Генерируем промпт
    const prompt = await generatePrompt(text);
    console.log('✅ Промпт:', prompt);

    // Шаг 2: Генерируем изображение
    const imageUrl = await generateImage(prompt);

    return NextResponse.json({ imageUrl, prompt });
  } catch (error) {
    console.error('❌ Ошибка генерации изображения:', error);
    return NextResponse.json(
      { error: 'Не удалось сгенерировать изображение' },
      { status: 500 }
    );
  }
}
