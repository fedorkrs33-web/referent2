// src/lib/generateImage.ts
import { createImageGenerator } from './imageGenerators';

// Кэшируем генератор для повторного использования
let cachedGenerator: ReturnType<typeof createImageGenerator> | null = null;

function getGenerator() {
  if (!cachedGenerator) {
    cachedGenerator = createImageGenerator();
  }
  return cachedGenerator;
}

/**
 * Получить изображение по requestId (только для Polza)
 */
export async function getImageByRequestId(requestId: string): Promise<string> {
  const generator = getGenerator();
  
  if (!generator.getByRequestId) {
    throw new Error('Получение изображения по requestId поддерживается только для Polza генератора');
  }
  
  return generator.getByRequestId(requestId);
}

/**
 * Сгенерировать изображение по промпту
 */
export async function generateImage(imagePrompt: string): Promise<string> {
  const generator = getGenerator();
  return generator.generate(imagePrompt);
}
