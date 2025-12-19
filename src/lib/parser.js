// src/lib/parser.js
import axios from 'axios';
import { load } from 'cheerio';

export async function parseArticle(url) {
  try {
    // Загружаем HTML страницы
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ReferentBot/1.0)'
      },
      timeout: 10000 // 10 секунд
    });

    // Загружаем в Cheerio
    const $ = load(html);

    // Удаляем ненужные элементы
    $('script, style, nav, header, footer, aside, .sidebar, .ads').remove();

    // Извлекаем текст
    const text = $('body')
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    // Ограничиваем длину (GigaChat имеет лимиты)
    return text.slice(0, 8000); // максимум 8000 символов
  } catch (error) {
    console.error('Ошибка парсинга статьи:', error.message);
    throw new Error(`Не удалось загрузить статью: ${error.message}`);
  }
}
