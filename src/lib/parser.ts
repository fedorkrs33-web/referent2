// src/lib/parser.ts
import axios from 'axios';
import { load } from 'cheerio';

export async function parseArticle(url: string): Promise<string> {
  try {
    const { data: html } = await axios.get<string>(url, {
      headers: { 'User-Agent': 'ReferentBot/1.0' },
      timeout: 10000,
    });

    const $ = load(html);
    $('script, style, nav, header, footer, aside, .ads').remove();

    return $('body').text().replace(/\s+/g, ' ').trim().slice(0, 8000);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    throw new Error(`Не удалось загрузить статью: ${errorMessage}`);
  }
}

