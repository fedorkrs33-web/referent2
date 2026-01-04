// src/lib/generateImage.js
import axios from 'axios';

const POLLING_INTERVAL = 6000;
const MAX_RETRIES = 30; // ~150 секунд максимум

export async function generateImage(imagePrompt) {
  const API_KEY = process.env.POLZA_API_KEY;

  if (!API_KEY) {
    throw new Error('POLZA_API_KEY не установлен в .env.local');
  }

  // ✅ Исправлено: используем imagePrompt, а не prompt
  const cleanedPrompt = imagePrompt.slice(0, 500).replace(/[<>{}|\\^~\[\]`]/g, '').trim();
  if (!cleanedPrompt) throw new Error('Промт пуст после очистки');

  const createUrl = 'https://api.polza.ai/api/v1/images/generations'; //api.polza.ai/api/v1
  const statusUrl = 'https://api.polza.ai/v1/images/results';

  let requestId;

  try {
    // 🚀 Этап 1: Отправка запроса
    const createRes = await axios.post(
      createUrl,
      {
        prompt: cleanedPrompt,
        size: '1:1',
        n: 1,
        model: 'seedream-v4',
      },
      {
        headers: { 'Authorization': `Bearer ${API_KEY}` },
        timeout: 10000,
      }
    );

    console.log('✅ Запрос отправлен, requestId:', createRes.data);
    requestId = createRes.data.requestId;

    if (!requestId) {
      throw new Error('Не получен requestId');
    }

    // 🔄 Этап 2: Опрос статуса
    for (let i = 0; i < MAX_RETRIES; i++) {
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));

      try {
        const statusRes = await axios.get(`${statusUrl}/${requestId}`, {
          headers: { 'Authorization': `Bearer ${API_KEY}` },
        });
        
        console.log('🔍 Полный ответ:', JSON.stringify(statusRes.data, null, 2));
        console.log('🔍 [Polza] Ответ статуса:', JSON.stringify(statusRes.data, null, 2));
        console.log('✅ createRes.data:', createRes.data);

        if (statusRes.data.status === 'ready') {
          const url = 
            statusRes.data.data?.[0]?.url ||
            statusRes.data.url ||
            statusRes.data.image ||
            statusRes.data.images?.[0]?.url;

          if (url) return url;

          throw new Error('Изображение готово, но URL не найден в ответе');
        }

        if (statusRes.data.status === 'error') {
          throw new Error(statusRes.data.message || 'Ошибка генерации на стороне сервера');
        }

        if (statusRes.data.status === 'rejected') {
          throw new Error('Промт был отклонён модерацией');
        }

        // Продолжаем, если статус "в процессе"
        if (!['pending', 'processing', 'in_progress'].includes(statusRes.data.status)) {
          console.warn('⚠ Неожиданный статус:', statusRes.data.status);
        }
      } catch (pollError) {
        if (pollError.response?.status === 404) {
          console.log(`📌 [${i + 1}/${MAX_RETRIES}] Результат не готов (404) — пробуем снова...`);
          continue;
        }

        if (pollError.response?.status === 429) {
          throw new Error('Слишком много запросов. Попробуйте позже.');
        }

        console.error('❌ Ошибка при опросе:', pollError.response?.data || pollError.message);
      }
    }

    // Если не получили результат за MAX_RETRIES
    throw new Error('Превышено время ожидания. Изображение не сгенерировано.');

  } catch (error) {
    console.error('❌ [generateImage] Ошибка:', error.message, { requestId });

    if (error.response) {
      const { status, data } = error.response;
      const msg = data?.message || data?.error?.message || data?.error || 'Неизвестная ошибка';
      throw new Error(`Polza.ai: ${status} — ${msg}`);
    } else if (error.request) {
      throw new Error('Нет ответа от Polza.ai. Проверьте интернет');
    } else {
      throw new Error(`Ошибка: ${error.message}`);
    }
  }
}


