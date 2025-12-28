// src/app/page.jsx
'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [parsedText, setParsedText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('light'); // 'light' или 'dark'

  // Применяем тему к body
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark' : '';
  }, [theme]);

  // Переключение темы
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Парсинг статьи
  const handleParse = async () => {
    if (!url) {
      setResult('Введите URL статьи');
      return;
    }

    setLoading(true);
    setResult('');
    setParsedText('');

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, action: 'parse' }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setParsedText(data.text);
      setResult(data.text);
    } catch (err) {
      setResult(`❌ Ошибка парсинга: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Перевод на русский
  const handleTranslate = async () => {
    if (!parsedText) {
      setResult('Сначала выполните парсинг статьи');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: parsedText,
          action: 'translate',
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setResult(data.text);
    } catch (err) {
      setResult(`❌ Ошибка перевода: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Общая функция для AI-действий
  const handleAction = async (action) => {
    if (!parsedText) {
      setResult('Сначала выполните парсинг статьи');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: parsedText, action }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setResult(data.text);
    } catch (err) {
      setResult(`❌ Ошибка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 bg-gray-50 text-gray-900">
      <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
          {/* Заголовок */}
        <h1 className="text-2xl font-bold">📄 Referent — AI для статей</h1>   
        <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Введите URL англоязычной статьи. Приложение выполнит парсинг и, по нажатию кнопки, обработает текст с помощью ИИ.
        </p>
        {/* Поле ввода URL */}
        <div className="mb-6">
          <label htmlFor="url" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
            URL англоязычной статьи
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:outline-none transition
              ${theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
              }`}
          />
        </div>

        {/* Кнопки действий */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!url || loading}
            onClick={handleParse}
            className="px-5 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            🧩 Парсинг
          </button>
          <button
            type="button"
            disabled={!parsedText || loading}
            onClick={handleTranslate}
            className="px-5 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            🌐 Перевод на русский
          </button>
          <button
            type="button"
            disabled={!parsedText || loading}
            onClick={() => handleAction('summary')}
            className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            О чём статья?
          </button>
          <button
            type="button"
            disabled={!parsedText || loading}
            onClick={() => handleAction('theses')}
            className="px-5 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Тезисы
          </button>
          <button
            type="button"
            disabled={!parsedText || loading}
            onClick={() => handleAction('telegram')}
            className="px-5 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Пост для Telegram
          </button>
        </div>

        {/* Блок результата */}
        <div className={`mt-6 p-4 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-100' : 'bg-blue-50 text-gray-800'}`}>
          <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Результат:</h3>
          {loading ? (
            <div className="flex items-center text-blue-500">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Обработка...
            </div>
          ) : result ? (
            <div className="whitespace-pre-wrap leading-relaxed font-sans">
              {result}
            </div>
          ) : (
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              Нажмите кнопку, чтобы получить результат.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
