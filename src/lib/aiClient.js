// src/lib/aiClient.js
import axios from 'axios';
import { getGigaChatToken } from './auth';

const API_URL = 'https://gigachat.devices.sberbank.ru/api/v1';

export async function callGigaChat(messages, model = 'GigaChat') {
  try {
    console.log('🔧 [aiClient] Вызов GigaChat');
    console.log('📨 Модель:', model);
    console.log('📨 Сообщения:', messages);

    const token = await getGigaChatToken();
    if (!token) {
      throw new Error('Токен не получен');
    }
    console.log('✅ [aiClient] Токен получен');

    const response = await axios.post(
      `${API_URL}/chat/completions`,
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
      responseStatus: error.response?.status,
      responseError: error.response?.data,
      requestURL: error.config?.url,
      requestData: error.config?.data,
      requestHeaders: {
        authorization: !!error.config?.headers?.Authorization,
      },
      stack: error.stack,
    });

    throw new Error('Не удалось получить ответ от ИИ');
  }
}