// src/app/api/process/route.js
import { NextResponse } from 'next/server';
import { parseArticle } from '../../../lib/parser';
import { callGigaChat } from '../../../lib/aiClient';
import { generateImage } from '../../../lib/generateImage';

export async function POST(request) {

  try {
    const data = await request.json();
    console.log('📥 [API] Данные получены:', data);

    const { url, action, text } = data;

    if (!action) {
      console.log('❌ [API] Нет действия');
      return NextResponse.json({ error: 'Действие обязательно' }, { status: 400 });
    }

    let inputText = '';

    if (url) {
      inputText = await parseArticle(url);
    } else if (text) {
      inputText = text;
    } else {
      console.log('❌ [API] Нет текста или URL');
      return NextResponse.json({ error: 'Нет URL или текста' }, { status: 400 });
    }

    if (action === 'parse') {
      return NextResponse.json({ text: inputText });
    }

    let messages = [];

    switch (action) {
      case 'translate':
        messages = [
          {
            role: 'system',
            content: 'Переведи следующий текст с английского на русский. Сохрани стиль, термины и структуру Не добавляй пояснений.'
          },
          {
            role: 'user',
            content: inputText
          }
        ];
        break;

      case 'summary':
        messages = [
          { role: 'user', content: `Кратко опиши, о чём статья: ${inputText}` }
        ];
        break;

      case 'theses':
        messages = [
          { role: 'user', content: `Выдели 3–5 ключевых тезисов из статьи: ${inputText}` }
        ];
        break;

      case 'telegram':
        messages = [
          { role: 'user', content: `Напиши короткий, яркий пост для Telegram на основе статьи: ${inputText}` }
        ];
        break;

      case 'illustrate':
        messages = [
          { role: 'user', content: `Напиши короткий промт для генерации изображения на основе статьи: ${inputText}, в ответе используй только текст` }
        ];
        break;
      default:
        return NextResponse.json({ error: 'Неверное действие' }, { status: 400 });
    }

    const model = 'GigaChat'; // временно, проверим
    const result = await callGigaChat(messages, model);
    return NextResponse.json({ text: result });
  } catch (error) {
    console.error('❌ [API] Ошибка:', error.message);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
