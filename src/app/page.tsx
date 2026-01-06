// src/app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { ErrorMessage } from '../components/ErrorMessage';
import { Toaster, toast } from 'sonner';

type ActionType = 'translate' | 'summary' | 'theses' | 'telegram' | 'illustrate' | 'parse' | '';
type ThemeType = 'light' | 'dark';

export default function Home() {
  const [url, setUrl] = useState<string>('');
  const [parsedText, setParsedText] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [illustrationUrl, setIllustrationUrl] = useState<string>('');
  const [illustrationPrompt, setIllustrationPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [theme, setTheme] = useState<ThemeType>('light');
  const [currentAction, setCurrentAction] = useState<ActionType>('');
  const [error, setError] = useState<string>('');
  const resultRef = useRef<HTMLDivElement>(null);

  // Инициализация темы при загрузке
  useEffect(() => {
    // Проверяем сохраненную тему или системную
    const savedTheme = (localStorage.getItem('theme') || 'light') as ThemeType;
    setTheme(savedTheme);
    
    // Применяем тему сразу
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Прокрутка к результату
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);

  // Применяем тему к html элементу
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Определяем, русский ли текст
  const isRussian = (text: string): boolean => {
    if (!text) return false;
    const russianChars = text.match(/[а-яА-ЯёЁ]/g);
    const englishChars = text.match(/[a-zA-Z]/g);
  
    if (!russianChars) return false;
    if (!englishChars) return true;

    // Если русских букв больше 30% от всех латинских + кириллических — считаем русским
    const total = russianChars.length + englishChars.length;
    return russianChars.length / total > 0.3;
  };

  // Удаляем эмодзи из текста
  const removeEmoji = (text: string): string => {
    // Удаляем эмодзи и другие нестандартные символы Unicode
    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
      .replace(/🔥/g, '')                      // Специально убираем эмодзи огня
      .replace(/\s+/g, ' ')                    // Множественные пробелы заменяем на один
      .trim();
  };

  // Парсинг статьи
  const handleParse = async () => {
    if (!url) {
      setError('Введите URL статьи');
      return;
    }

    // ✅ Валидация URL
    try {
      new URL(url);
    } catch {
      setError('Введите корректный URL. Пример: https://example.com/article');
      return;
    }

    setLoading(true);
    setCurrentAction('parse');
    setResult('');
    setError('');
    setParsedText('');

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, action: 'parse' }),
      });

      if (!res.ok) {
        let data;
        try {
          data = await res.json();
        } catch {
          const text = await res.text();
          console.error('❌ [Frontend] Не JSON:', text);
          setError('Не удалось обработать ответ сервера. Попробуйте позже.');
          return;
        }

        console.error('❌ [Frontend] Ошибка API:', data);

        if (data.error?.includes('ENOTFOUND') || data.error?.includes('getaddrinfo')) {
          setError('Не удалось найти сайт. Возможно, опечатка в ссылке.');
        } else if (data.error?.includes('404')) {
          setError('Статья не найдена — ошибка 404.');
        } else if (data.error?.includes('Invalid URL')) {
          setError('Ссылка некорректна. Убедитесь, что она начинается с http:// или https://');
        } else if (data.error?.includes('timeout')) {
          setError('Сайт не отвечает. Проверьте ссылку или интернет.');
        } else {
          setError('Не удалось загрузить статью. Попробуйте снова.');
        }
        return;
      }

      const data = await res.json();
      const text = data.text;

      setParsedText(text);
      setResult(text);

      // ✅ Определяем язык
      const isRu = isRussian(text);

      // ✅ Если НЕ русский — покажем, что нужно перевести
      if (!isRu) {
        setResult('✅ Статья на английском. Нажмите «Перевод на русский», чтобы продолжить.');
      } else {
        setResult('✅ Статья на русском. Можно использовать кнопки ниже.');
      }

    } catch {
      setError('Не удалось подключиться к серверу. Проверьте интернет-соединение.');
    } finally {
      setLoading(false);
      setCurrentAction('');
    }
  };

  // Общая функция для AI-действий
  const handleAction = async (action: ActionType) => {
    if (!parsedText) {
      setResult('Сначала выполните парсинг статьи');
      return;
    }

    const isRu = isRussian(parsedText);

    // ✅ Блокируем действия, если не русский и не перевод
    if (!isRu && action !== 'translate') {
      setResult('⚠ Сначала переведите статью на русский язык.');
      toast.info('Сначала нажмите «Перевод на русский»');
      return;
    }

    setCurrentAction(action);
    setResult('');
    setError('');

    try {
      switch (action) {
        case 'translate': {
          try {
            const res = await fetch('/api/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: parsedText, action: 'translate' }),
            });

            if (!res.ok) throw new Error('Не удалось перевести');

            const data = await res.json();
            setParsedText(data.text);
            setResult(data.text);
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
            setError(`Ошибка перевода: ${errorMessage}`);
            setResult(`❌ Не удалось перевести: ${errorMessage}`);
          }  
          break;
        }

        case 'illustrate': {
          setLoading(true);
          setCurrentAction('illustrate');
          setError('');
          setIllustrationPrompt('');
          setIllustrationUrl('');

          let fullPrompt: string = '';
          let imagePrompt: string = '';

          try {
            setLoading(true);
            const res = await fetch('/api/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: parsedText, action: 'illustrate' }),
            });

            if (!res.ok) throw new Error('Не удалось получить промт');

            const data = await res.json();
            fullPrompt = data.text || data.prompt;

            if (!fullPrompt) throw new Error('API не вернул промт');

            setResult(fullPrompt);
            setLoading(false);

            const promptMatch = fullPrompt.match(/🔥 "?«([\s\S]+?)»"?/) || fullPrompt.match(/"([\s\S]+?)"/);
            imagePrompt = promptMatch ? promptMatch[1] : fullPrompt.trim();

            if (!imagePrompt) throw new Error('Не удалось извлечь промт');

            // Удаляем эмодзи из промпта перед отправкой на генерацию
            imagePrompt = removeEmoji(imagePrompt);

            if (!imagePrompt) throw new Error('Промт пуст после удаления эмодзи');

            setIllustrationPrompt(imagePrompt);

            const imageRes = await fetch('/api/generate-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: imagePrompt }),
            });

            if (!imageRes.ok) {
              const errData = await imageRes.json();
              throw new Error(errData.error || 'Ошибка генерации');
            }

            const imageJson = await imageRes.json();
            setIllustrationUrl(imageJson.url);
            setResult(`${fullPrompt}\n\n✅ Изображение сгенерировано`);
          } catch (err) {
            console.error('❌ Ошибка генерации:', err);
            const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
            setError(`Ошибка: ${errorMessage}`);
            if (fullPrompt) {
              setResult(`${fullPrompt}\n\n❌ Не удалось сгенерировать: ${errorMessage}`);
            }
          } finally {
            setLoading(false);
          }
          break;
        }

        default: {
          const res = await fetch('/api/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: parsedText, action }),
          });

          if (!res.ok) throw new Error('Ошибка API');

          const data = await res.json();
          let resultText = data.text;

          if (action === 'telegram' && url) {
            resultText += `\n\n📄 Источник: ${url}`;
          }

          setResult(resultText);
          break;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(`Ошибка: ${errorMessage}`);
    } finally {
      setLoading(false);
      setCurrentAction('');
    }
  };

  return (
    <>
      <Toaster />
      <div className="min-h-screen py-10 px-4 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <div className="p-6 max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          {/* Заголовок с переключателем темы */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              📄 Referent — AI для статей
            </h1>
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Переключить на тёмную тему' : 'Переключить на светлую тему'}
              className="px-3 py-2 rounded-lg font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-yellow-400 dark:hover:bg-gray-600"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Введите URL англоязычной статьи. Приложение выполнит парсинг и, по нажатию кнопки, обработает текст с помощью ИИ.
          </p>
          {/* Поле ввода URL */}
          <div className="mb-6">
            <label htmlFor="url" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
              URL англоязычной статьи
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Введите URL статьи, например: https://example.com/article"
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:outline-none transition bg-white border-gray-300 text-gray-900 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500"
            />
          </div>

          {/* Кнопки действий */}
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!url || loading}
              onClick={handleParse}
              title="Загрузить текст статьи по ссылке"
              className="px-5 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              🧩 Парсинг
            </button>
            <button
              type="button"
              disabled={!parsedText || loading}
              onClick={() => handleAction('translate')}
              title="Перевести текст статьи на русский язык"
              className="px-5 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              🌐 Перевод на русский
            </button>
            <button
              type="button"
              disabled={!parsedText || loading}
              onClick={() => handleAction('summary')}
              title="Кратко описать, о чём статья"
              className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              О чём статья?
            </button>
            <button
              type="button"
              disabled={!parsedText || loading}
              onClick={() => handleAction('theses')}
              title="Выделить 3–5 ключевых тезисов из статьи" 
              className="px-5 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Тезисы
            </button>
            <button
              type="button"
              disabled={!parsedText || loading}
              onClick={() => handleAction('telegram')}
              title="Создать готовый пост для Telegram с эмодзи и хештегами"
              className="px-5 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Пост для Telegram
            </button>
            {/* Кнопка иллюстрации */}
            <button
              type="button"
              disabled={!parsedText || loading}
              onClick={() => handleAction('illustrate')}
              title="Создать иллюстрацию к статье"
              className="px-5 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Иллюстрация
            </button>
            {/* Кнопка очистки */}
            <button
              type="button"
              onClick={() => {
                setUrl('');
                setParsedText('');
                setResult('');
                setError('');
                setCurrentAction('');
                setIllustrationUrl('');
                setIllustrationPrompt('');
              }}
              title="Очистить все поля и результаты"
              className="px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded-lg hover:bg-gray-500 transition"
            >
              🗑 Очистить
            </button>
          </div>

          {/* 🔴 Блок ошибки */}
          {error && <ErrorMessage message={error} />}
          
          {/* Блок текущего процесса */}
          {currentAction && (
            <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
              {currentAction === 'parse' && '🌐 Загружаю статью…'}
              {currentAction === 'translate' && '🔤 Перевожу на русский…'}
              {currentAction === 'summary' && '📌 Определяю суть статьи…'}
              {currentAction === 'theses' && '🧩 Выделяю ключевые тезисы…'}
              {currentAction === 'telegram' && '✉️ Готовлю пост для Telegram…'}
              {currentAction === 'illustrate' && '🖼 Создаю промт для генерации иллюстрации'}
            </div>
          )}

          {/* Блок результата */}
          <div ref={resultRef} className="mt-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
              Результат:
            </h3>
             
            <div className="p-4 rounded-lg text-sm relative bg-blue-50 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
              {loading ? (
                <div className="flex items-center text-blue-500">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75" 
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Обработка...
                </div>
              ) : result ? (
                <div className="whitespace-pre-wrap leading-relaxed font-sans">{result}</div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  Нажмите кнопку, чтобы получить результат.
                </p>
              )}
            
              {/* Кнопка копирования */}
              {result && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(result).then(
                      () => toast.success('Скопировано!'),
                      () => toast.error('Ошибка копирования')
                    );
                  }}
                  title="Скопировать результат"
                  className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-100 rounded border transition"
                >
                  📋 Копировать
                </button> 
              )}
            </div>
          </div>
          {/* 🔥 Блок: Иллюстрация */}
          {(illustrationPrompt || illustrationUrl) && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                🎨 Иллюстрация по статье
              </h3>

              {/* Показываем промт, пока изображение не готово */}
              {illustrationPrompt && !illustrationUrl && (
                <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
                  <p className="text-sm italic">🔄 Генерация изображения...</p>
                  <p className="mt-2 text-sm font-mono leading-relaxed">
                    {illustrationPrompt}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Ожидание изображения...
                  </div>
                </div>
              )}

              {/* Готовое изображение */}
              {illustrationUrl && (
                <div className="flex justify-center">
                  <img
                    src={illustrationUrl}
                    alt="Иллюстрация к статье"
                    className="max-w-full h-auto rounded-lg shadow-lg border transition-transform hover:scale-[1.02]"
                    style={{ maxHeight: '600px', objectFit: 'contain' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/fallback-image.png';
                    }}
                  />
                </div>
              )}

              {/* Кнопка скачать */}
              {illustrationUrl && (
                <div className="text-center mt-3">
                  <a
                    href={illustrationUrl}
                    download="illustration.jpg"
                    className="text-sm px-4 py-1.5 rounded inline-flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white transition"
                  >
                    📥 Скачать изображение
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

