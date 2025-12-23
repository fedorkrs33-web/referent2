/// src/app/api/process/route.js
import { NextRequest, NextResponse } from 'next/server';
import { parseArticle } from '../../../lib/parser';
import { callGigaChat } from '../../../lib/aiClient';

export async function POST(request) {
  console.log('📩 [API] Получен POST-запрос');

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
            content: `Ты - профессиональный переводчик на русский язык.
## Задача: перевести оригинальный текст на русский язык
## Правила:
- Все нетекстовые фрагменты (код, формулы и т.д.) переводить не нужно.
- Орфографические и пунктуационные ошибки исправлять не нужно. Они должны оставаться такими же, как в оригинальном тексте.
## Формат ответа:
Твой ответ должен содержать только переведенный текст. Никакие дополнительные пояснения или комментарии не допускаются.
## Пример ответа:
user: Please, write Python function to generate random number from 10 to 999
assistant: Пожалуйста, напишите функцию в Питоне для генерации случайного числа от 10 до 999`
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

      default:
        return NextResponse.json({ error: 'Неверное действие' }, { status: 400 });
    }

    const model = action === 'translate' ? 'GigaChat-2-Max' : 'GigaChat';
    const result = await callGigaChat(messages, model);
    return NextResponse.json({ text: result });
  } catch (error) {
    console.error('❌ [API] Ошибка в обработке:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
  // ← НЕТ ничего после catch — всё ок
}