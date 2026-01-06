// src/lib/imageGenerators/factory.ts
import type { ImageGenerator, ImageGeneratorType } from './types';
import { PolzaGenerator } from './polzaGenerator';
import { DalleGenerator } from './dalleGenerator';
import { RuGPTGenerator } from './rugptGenerator';

/**
 * Создать генератор изображений на основе переменных окружения
 */
export function createImageGenerator(): ImageGenerator {
  // Получаем тип генератора из переменной окружения
  const generatorType = (process.env.IMAGE_GENERATOR || 'polza').toLowerCase() as ImageGeneratorType;

  console.log(`🎨 Используется генератор изображений: ${generatorType}`);

  switch (generatorType) {
    case 'polza': {
      const apiKey = process.env.POLZA_API_KEY;
      if (!apiKey) {
        throw new Error(
          'IMAGE_GENERATOR=polza установлен, но POLZA_API_KEY не найден в .env.local'
        );
      }
      return new PolzaGenerator(apiKey);
    }

    case 'dalle':
    case 'openai': {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error(
          `IMAGE_GENERATOR=${generatorType} установлен, но OPENAI_API_KEY не найден в .env.local`
        );
      }
      return new DalleGenerator(apiKey);
    }

    case 'rugpt': {
      // ruGPT может использовать RUGPT_API_KEY или OPENAI_API_KEY (если используется ruGPT ключ)
      const apiKey = process.env.RUGPT_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error(
          'IMAGE_GENERATOR=rugpt установлен, но RUGPT_API_KEY или OPENAI_API_KEY не найден в .env.local'
        );
      }
      return new RuGPTGenerator(apiKey);
    }

    default:
      throw new Error(
        `Неизвестный тип генератора: ${generatorType}. ` +
        `Поддерживаемые значения: polza, dalle, openai, rugpt`
      );
  }
}

