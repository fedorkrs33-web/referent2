// src/app/api/process/route.js
import { NextRequest, NextResponse } from 'next/server';
import { parseArticle } from '../../../lib/parser';
import { callGigaChat } from '../../../lib/aiClient';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('📥 Получен запрос:', body); // ← Лог

    const { url, action, text } = body;

    if (!action) {
      console.log('❌ Нет action'); // ←
      return NextResponse.json({ error: 'Действие обязательно' }, { status: 400 });
    }

    let inputText = '';

    if (url) {
      console.log('🔗 URL получен, парсим...'); // ←
      inputText = await parseArticle(url);
    } else if (text) {
      inputText = text;
    } else {
      console.log('❌ Нет ни url, ни text'); // ←
      return NextResponse.json({ error: 'Нет URL или текста' }, { status: 400 });
    }

    if (action === 'parse') {
      return NextResponse.json({ text: inputText });
    }

    // ... остальная логика GigaChat ...
  } catch (error) {
    console.error('❌ Ошибка в API:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}