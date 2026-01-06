// src/lib/imageGenerators/dalleGenerator.ts
import OpenAI from 'openai';
import type { ImageGenerator } from './types';

/**
 * Генератор изображений OpenAI DALL-E 3
 */
export class DalleGenerator implements ImageGenerator {
  private client: OpenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY не установлен в .env.local');
    }
    
    // baseURL можно указать через переменную окружения OPENAI_BASE_URL
    // По умолчанию используется https://api.openai.com/v1
    const baseURL = process.env.OPENAI_BASE_URL;
    
    const config: { apiKey: string; baseURL?: string } = { 
      apiKey,
      ...(baseURL && { baseURL })
    };
    
    this.client = new OpenAI(config);
    
    // Логируем используемый URL для диагностики
    console.log(`🔗 [DALL-E] Используется URL: ${baseURL || 'https://api.openai.com/v1 (по умолчанию)'}`);
  }

  async generate(prompt: string): Promise<string> {
    try {
      console.log('✅ [DALL-E] Запрос на генерацию изображения');
      
      const response = await this.client.images.generate({
        model: 'dall-e-3',
        prompt: prompt.slice(0, 4000), // DALL-E 3 принимает до 4000 символов
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });

      const imageUrl = response.data?.[0]?.url;
      
      if (!imageUrl) {
        throw new Error('DALL-E не вернул URL изображения');
      }

      console.log('✅ [DALL-E] Изображение сгенерировано');
      return imageUrl;
    } catch (error) {
      console.error('❌ [DALL-E] Ошибка:', error instanceof Error ? error.message : 'Неизвестная ошибка');
      
      // Детальная информация об ошибке для диагностики
      if (error instanceof Error) {
        console.error('❌ [DALL-E] Детали ошибки:', {
          message: error.message,
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 3).join('\n')
        });
      }
      
      if (error instanceof OpenAI.APIError) {
        console.error('❌ [DALL-E] API Error:', {
          status: error.status,
          code: error.code,
          type: error.type,
          message: error.message
        });
        throw new Error(`DALL-E API ошибка: ${error.message}`);
      }
      
      // Специальная обработка ошибок подключения
      if (error instanceof Error && (
        error.message.includes('Connection') || 
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ENOTFOUND')
      )) {
        const helpMessage = 
          'Проблема с подключением к OpenAI API. Возможные причины:\n' +
          '1. Отсутствует доступ к api.openai.com (может быть заблокирован)\n' +
          '2. Проблемы с интернет-соединением\n' +
          '3. Необходим прокси (установите OPENAI_BASE_URL в .env.local)\n' +
          '4. Неправильный API ключ (проверьте OPENAI_API_KEY)';
        console.error(`❌ [DALL-E] ${helpMessage}`);
        throw new Error(`Ошибка подключения: ${error.message}. ${helpMessage}`);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      throw new Error(`Ошибка генерации DALL-E: ${errorMessage}`);
    }
  }
}

