// src/lib/aiClient.js
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_GIGACHAT_API_URL || 'https://gigachat.devices.sberbank.ru/api/v1';

export async function callGigaChat(messages) {
  try {
    const response = await axios.post(
      `${API_URL}/chat/completions`,
      {
        model: 'GigaChat',
        messages,
        temperature: 0.7,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GIGACHAT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Ошибка GigaChat:', error.response?.data || error.message);
    throw new Error('Не удалось получить ответ от ИИ');
  }
}
