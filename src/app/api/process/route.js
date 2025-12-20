// src/app/api/process/route.js
import { NextRequest, NextResponse } from 'next/server';
import { parseArticle } from '@/lib/parser';
import { callGigaChat } from '@/lib/aiClient';

export async function POST(request) {
  try {
    const { url, action } = await request.json();

    if (!url || !action) {
      return NextResponse.json(
        { error: 'URL и действие обязательны' },
        { status: 400 }
      );
    }

    // 1. Парсим статью
    const text = await parseArticle(url);

    // 2. Формируем промпт
    let prompt = '';
    switch (action) {
      case 'summary':
        prompt = `Кратко опиши, о чём статья: ${text}`;
        break;
      case 'theses':
        prompt = `Выдели 3–5 ключевых тезисов: ${text}`;
        break;
      case 'telegram':
        prompt = `Напиши короткий, яркий пост для Telegram. Эмоционально: ${text}`;
        break;
      default:
        return NextResponse.json({ error: 'Неверное действие' }, { status: 400 });
    }

    // 3. Запрос к GigaChat
    const result = await callGigaChat([{ role: 'user', content: prompt }]);

    // 4. Ответ
    return NextResponse.json({ text: result });
  } catch (error) {
    console.error('Ошибка в API:', error);
    return NextResponse.json(
      { error: 'Не удалось обработать запрос' },
      { status: 500 }
    );
  }
}
