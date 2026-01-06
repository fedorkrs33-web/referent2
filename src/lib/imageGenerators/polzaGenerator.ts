// src/lib/imageGenerators/polzaGenerator.ts
import axios from 'axios';
import type { ImageGenerator } from './types';

const POLLING_INTERVAL = 3000;
const MAX_RETRIES = 30; // ~90 секунд максимум

interface CreateImageResponse {
  requestId: string;
}

interface StatusResponse {
  status: string; // ✅ Позволяем любые значения: "ready", "COMPLETED", "completed"
  data?: Array<{ url: string }>;
  url?: string;
  image?: string;
  images?: Array<{ url: string }>;
  message?: string;
  id?: string;
}

/**
 * Генератор изображений Polza.ai
 */
export class PolzaGenerator implements ImageGenerator {
  private apiKey: string;
  private createUrl = 'https://api.polza.ai/v1/images/generations';
  private statusUrl = 'https://api.polza.ai/v1/images';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('POLZA_API_KEY не установлен в .env.local');
    }
    this.apiKey = apiKey;
  }

  async getByRequestId(requestId: string): Promise<string> {
    // Проверяем статус сразу
    for (let i = 0; i < MAX_RETRIES; i++) {
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      }

      try {
        const statusRes = await axios.get<StatusResponse>(`${this.statusUrl}/${requestId}`, {
          headers: { 'Authorization': `Bearer ${this.apiKey}` },
        });
        
        console.log(`🔍 [${i + 1}/${MAX_RETRIES}] Статус запроса ${requestId}:`, statusRes.data.status);

        if (statusRes.data.status === 'ready') {
          const url = 
            statusRes.data.data?.[0]?.url ||
            statusRes.data.url ||
            statusRes.data.image ||
            statusRes.data.images?.[0]?.url;

          if (url) {
            console.log('✅ Изображение найдено по requestId:', requestId);
            return url;
          }

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
        if (axios.isAxiosError(pollError) && pollError.response?.status === 404) {
          console.log(`📌 [${i + 1}/${MAX_RETRIES}] Результат не готов (404) — пробуем снова...`);
          continue;
        }

        if (axios.isAxiosError(pollError) && pollError.response?.status === 429) {
          throw new Error('Слишком много запросов. Попробуйте позже.');
        }

        // Если это не 404 и не 429, но статус не ready - продолжаем
        if (axios.isAxiosError(pollError) && pollError.response?.status !== 404) {
          console.error('❌ Ошибка при опросе:', pollError.response?.data || pollError.message);
        }
      }
    }

    throw new Error(`Превышено время ожидания. Изображение с requestId ${requestId} не готово.`);
  }

  async generate(imagePrompt: string): Promise<string> {
    // Очистка промпта
    const cleanedPrompt = imagePrompt.slice(0, 500).replace(/[<>{}|\\^~\[\]`]/g, '').trim();
    if (!cleanedPrompt) throw new Error('Промт пуст после очистки');

    let requestId: string;

    try {
      // 🚀 Этап 1: Отправка запроса
      const createRes = await axios.post<CreateImageResponse>(
        this.createUrl,
        {
          prompt: cleanedPrompt,
          size: '1:1',
          n: 1,
          model: 'nano-banana',
        },
        {
          headers: { 'Authorization': `Bearer ${this.apiKey}` },
          timeout: 10000,
        }
      );

      console.log('✅ [Polza] Ответ от /generations:', createRes.data);
      requestId = createRes.data.requestId;
      console.log('✅ Используем для опроса requestId:', requestId);
      if (!requestId) {
        throw new Error('Не получен requestId');
      }

      // 🔄 Этап 2: Опрос статуса
      for (let i = 0; i < MAX_RETRIES; i++) {
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        console.log('🔍 [Polza] Опрашиваю статус с ключом:', `Bearer ${'•'.repeat(this.apiKey.length)}`);
        try {
          console.log(`🔍 [${i + 1}/${MAX_RETRIES}] ${new Date().toISOString()} — Опрос статуса...`)
          console.log(`🔁 Попытка ${i + 1}: GET ${this.statusUrl}/${requestId}`);

          const statusRes = await axios.get<StatusResponse>(`${this.statusUrl}/${requestId}`, {
            headers: { 'Authorization': `Bearer ${this.apiKey}` },
          });
          
          console.log('🔍 [Polza] Ответ статуса:', JSON.stringify(statusRes.data, null, 2));
          const status = statusRes.data.status.toLowerCase();

          if (status === 'ready' || status === 'completed') {
            console.log("🔍 Полный ответ API:", JSON.stringify(statusRes.data, null,2)); // Выведет ВСЮ структуру
            const url = 
              statusRes.data.data?.[0]?.url ||
              statusRes.data.url ||
              statusRes.data.image ||
              statusRes.data.images?.[0]?.url;

            if (url) {
              console.log('✅ Изображение готово:', url);
              return url;
            }

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
            console.warn('⚠ [Polza] Неожиданный статус:', statusRes.data.status);
          }
        } catch (pollError) {
          if (axios.isAxiosError(pollError) && pollError.response?.status === 404) {
            console.log(`📌 [Polza] [${i + 1}/${MAX_RETRIES}] Результат не готов (404) — пробуем снова...`);
            continue;
          }

          if (axios.isAxiosError(pollError) && pollError.response?.status === 429) {
            throw new Error('Слишком много запросов. Попробуйте позже.');
          }

          const errorMessage = axios.isAxiosError(pollError)
            ? pollError.response?.data || pollError.message
            : pollError instanceof Error
            ? pollError.message
            : 'Неизвестная ошибка';
          console.error('❌ [Polza] Ошибка при опросе:', errorMessage);
        }
      }

      // Если не получили результат за MAX_RETRIES
      throw new Error('Превышено время ожидания. Изображение не сгенерировано.');

    } catch (error) {
      console.error('❌ [Polza] Ошибка:', error instanceof Error ? error.message : 'Неизвестная ошибка', { requestId });

      if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response;
        interface ErrorData {
          message?: string;
          error?: string | { message?: string };
        }
        const errorData = data as ErrorData;
        const msg = errorData?.message || 
         (typeof errorData?.error === 'string' ? errorData.error : errorData?.error?.message) || 'Неизвестная ошибка';
        throw new Error(`Polza.ai: ${status} — ${msg}`);
      } else if (axios.isAxiosError(error) && error.request) {
        throw new Error('Нет ответа от Polza.ai. Проверьте интернет');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        throw new Error(`Ошибка: ${errorMessage}`);
      }
    }
  }
}

