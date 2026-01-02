// src/app/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react'; // ← Добавлен useRef
import { ErrorMessage } from '../components/ErrorMessage';

export default function Home() {
  const [url, setUrl] = useState('');
  const [parsedText, setParsedText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('light'); // 'light' или 'dark'
  const [currentAction, setCurrentAction] = useState(''); // например: 'parse', 'translate'
  const [error, setError] = useState('');
  const resultRef = useRef(null); // 🔧 Для прокрутки

  // Инициализация темы при загрузке
  useEffect(() => {
    // Проверяем сохраненную тему или системную
    const savedTheme = localStorage.getItem('theme') || 'light';
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

  // Парсинг статьи
  const handleParse = async () => {
    if (!url) {
      setError('Введите URL статьи');
      return;
    }

    // ✅ Валидация URL
    try {
      new URL(url);
    } catch (err) {
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
          data = await res.json(); // Пытаемся распарсить как JSON
        } catch (err) {
          // Если не JSON — читаем как текст
          const text = await res.text();
          console.error('❌ [Frontend] Не JSON:', text);
          setError('Не удалось обработать ответ сервера. Попробуйте позже.');
          return;
        }

        console.error('❌ [Frontend] Ошибка API:', data);

        // Дружелюбные сообщения
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
      setParsedText(data.text);
      setResult(data.text);
    } catch (err) {
      setError('Не удалось подключиться к серверу. Проверьте интернет-соединение.');
    } finally {
      setLoading(false);
      setCurrentAction('');
    }
  };

  // Перевод на русский
  const handleTranslate = async () => {
    if (!parsedText) {
      setResult('Сначала выполните парсинг статьи');
      return;
    }

    setLoading(true);
    setCurrentAction('translate');
    setResult('');
    setError('');

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: parsedText, action: 'translate' }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError('Не удалось перевести текст. Попробуйте позже.');
        return;
      }

      const data = await res.json();
      setResult(data.text);
    } catch (err) {
      setError('Не удалось подключиться к серверу.');
    } finally {
      setLoading(false);
      setCurrentAction('');
    }
  };

  // Общая функция для AI-действий
  const handleAction = async (action) => {
    if (!parsedText) {
      setResult('Сначала выполните парсинг статьи');
      return;
    }

    setLoading(true);
    setCurrentAction(action);
    setResult('');
    setError('');

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: parsedText, action }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error('❌ [Frontend] Ошибка API:', data);

        setError('Не удалось получить ответ от ИИ. Попробуйте позже.');
        return;
      }

      const data = await res.json();

      let resultText = data.text;

      if (action === 'telegram' && url) {
        resultText += `\n\n📄 Источник: ${url}`;
      }

      setResult(resultText);
    } catch (err) {
      setError('Ошибка соединения с сервером. Проверьте интернет.');
    } finally {
      setLoading(false);
      setCurrentAction('');
    }
  };

  return (
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
            onClick={handleTranslate}
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
          {/* Кнопка очистки */}
          <button
            type="button"
            onClick={() => {
              setUrl('');
              setParsedText('');
              setResult('');
              setError('');
              setCurrentAction('');
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
          <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
          >
            {currentAction === 'parse' && '🌐 Загружаю статью…'}
            {currentAction === 'translate' && '🔤 Перевожу на русский…'}
            {currentAction === 'summary' && '📌 Определяю суть статьи…'}
            {currentAction === 'theses' && '🧩 Выделяю ключевые тезисы…'}
            {currentAction === 'telegram' && '✉️ Готовлю пост для Telegram…'}
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
                    () => alert('Скопировано!'),
                    () => alert('Ошибка копирования')
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
      </div>
    </div>
  );
}
