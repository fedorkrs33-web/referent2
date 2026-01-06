// src/lib/imageGenerators/types.ts

/**
 * Интерфейс для генераторов изображений
 */
export interface ImageGenerator {
  /**
   * Сгенерировать изображение по промпту
   * @param prompt Текст промпта для генерации
   * @returns URL сгенерированного изображения
   */
  generate(prompt: string): Promise<string>;

  /**
   * Получить изображение по идентификатору запроса (если поддерживается)
   * @param requestId Идентификатор запроса
   * @returns URL изображения
   */
  getByRequestId?(requestId: string): Promise<string>;
}

/**
 * Типы поддерживаемых генераторов
 */
export type ImageGeneratorType = 'polza' | 'dalle' | 'openai' | 'rugpt';

