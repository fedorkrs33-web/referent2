// src/lib/imageGenerators/rugptGenerator.ts
import OpenAI from 'openai';
import type { ImageGenerator } from './types';

/**
 * Генератор изображений ruGPT
 * Использует OpenAI-совместимый API от ruGPT
 */
export class RuGPTGenerator implements ImageGenerator {
  private client: OpenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('RUGPT_API_KEY не установлен в .env.local');
    }
    
    // baseURL для ruGPT можно указать через переменную окружения RUGPT_BASE_URL
    // По умолчанию используется URL из OPENAI_BASE_URL (если указан для ruGPT) или стандартный ruGPT endpoint
    // Пример: RUGPT_BASE_URL=https://api.rugpt.io/v1 или OPENAI_BASE_URL=https://ваш-ruGPT-endpoint/v1
    const baseURL = process.env.RUGPT_BASE_URL || process.env.OPENAI_BASE_URL;
    
    if (!baseURL) {
      throw new Error('Для ruGPT необходимо указать RUGPT_BASE_URL или OPENAI_BASE_URL в .env.local');
    }
    
    // Валидация URL - проверяем, что URL корректный
    try {
      const url = new URL(baseURL);
      if (!url.hostname || url.hostname === 'api' || url.hostname.includes('/')) {
        throw new Error(`Неправильный формат URL в RUGPT_BASE_URL или OPENAI_BASE_URL: ${baseURL}. 
Укажите полный URL с доменом, например: https://api.rugpt.io/v1`);
      }
    } catch (urlError) {
      if (urlError instanceof TypeError) {
        throw new Error(`Неправильный формат URL в RUGPT_BASE_URL или OPENAI_BASE_URL: ${baseURL}. 
URL должен начинаться с http:// или https:// и содержать домен. 
Пример: https://api.rugpt.io/v1`);
      }
      throw urlError;
    }
    
    const config: { apiKey: string; baseURL: string } = { 
      apiKey,
      baseURL
    };
    
    this.client = new OpenAI(config);
    
    // Логируем используемый URL для диагностики
    console.log(`🔗 [ruGPT] Используется URL: ${baseURL}`);
  }

  async generate(prompt: string): Promise<string> {
    try {
      console.log('✅ [ruGPT] Запрос на генерацию изображения');
      
      const response = await this.client.images.generate({
        model: 'dall-e-3', // или другой модель ruGPT
        prompt: prompt.slice(0, 4000), // ruGPT принимает до 4000 символов
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });

      const imageUrl = response.data?.[0]?.url;
      
      if (!imageUrl) {
        throw new Error('ruGPT не вернул URL изображения');
      }

      console.log('✅ [ruGPT] Изображение сгенерировано');
      return imageUrl;
    } catch (error) {
      console.error('❌ [ruGPT] Ошибка:', error instanceof Error ? error.message : 'Неизвестная ошибка');
      
      // Детальная информация об ошибке для диагностики
      if (error instanceof Error) {
        console.error('❌ [ruGPT] Детали ошибки:', {
          message: error.message,
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 3).join('\n')
        });
      }
      
      if (error instanceof OpenAI.APIError) {
        console.error('❌ [ruGPT] API Error:', {
          status: error.status,
          code: error.code,
          type: error.type,
          message: error.message
        });
        throw new Error(`ruGPT API ошибка: ${error.message}`);
      }
      
      // Специальная обработка ошибок подключения
      if (error instanceof Error && (
        error.message.includes('Connection') || 
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ENOTFOUND')
      )) {
        const helpMessage = 
          'Проблема с подключением к ruGPT API. Возможные причины:\n' +
          '1. Отсутствует доступ к API endpoint\n' +
          '2. Проблемы с интернет-соединением\n' +
          '3. Неправильный API ключ (проверьте RUGPT_API_KEY)\n' +
          '4. Неправильный baseURL (проверьте RUGPT_BASE_URL)';
        console.error(`❌ [ruGPT] ${helpMessage}`);
        throw new Error(`Ошибка подключения: ${error.message}. ${helpMessage}`);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      throw new Error(`Ошибка генерации ruGPT: ${errorMessage}`);
    }
  }
}

