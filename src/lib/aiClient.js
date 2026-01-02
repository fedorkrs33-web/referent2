// src/lib/aiClient.js
import axios from 'axios';
import https from 'https';
import fs from 'fs';
import path from 'path';

import { getGigaChatToken } from './auth';

// 🔐 Загружаем сертификат Минцифры
const certPath = path.resolve(process.cwd(), 'certs', 'mincyfry_root_ca.pem');
const ca = fs.existsSync(certPath) ? fs.readFileSync(certPath) : null;

const httpsAgent = new https.Agent({
  ca: ca || undefined,
  rejectUnauthorized: ca ? true : false, // если сертификат есть — строгая проверка
});

export async function callGigaChat(messages, model = 'GigaChat') {
  try {
    console.log('🔧 [aiClient] Вызов GigaChat');
    console.log('📨 Модель:', model);
    console.log('📨 Сообщения:', messages);

    const token = await getGigaChatToken();
    console.log('✅ [aiClient] Токен получен');

    const response = await axios.post(
      'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
      {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        httpsAgent, // ✅ Передаём агент с сертификатом
        timeout: 30000,
      }
    );

    console.log('🟢 [aiClient] Успешный ответ:', JSON.stringify(response.data, null, 2));

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      console.error('❌ [aiClient] Пустой ответ:', response.data);
      throw new Error('Пустой ответ от ИИ');
    }

    return content;
  } catch (error) {
    console.error('❌ [aiClient] ПОЛНАЯ ОШИБКА:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      headers: {
        auth: !!error.config?.headers?.Authorization,
      },
    });

    throw new Error('Не удалось получить ответ от ИИ');
  }
}

