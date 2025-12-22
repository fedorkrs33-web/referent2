'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Единственная правильная версия handleAction
  const handleAction = async (action) => {
    if (!url) {
      setResult('Введите URL статьи');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Неизвестная ошибка');
      }

      setResult(data.text);
    } catch (err) {
      setResult(`❌ Ошибка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Возвращаем JSX
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          📄 Referent — AI для статей
        </h1>
        <p className="text-gray-600 mb-6">
          Введите URL англоязычной статьи, и ИИ поможет понять её суть.
        </p>

        {/* Поле ввода */}
        <div className="mb-6">
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            URL англоязычной статьи
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Кнопки */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!url || loading}
            onClick={() => handleAction('summary')}
            className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            О чём статья?
          </button>
          <button
            type="button"
            disabled={!url || loading}
            onClick={() => handleAction('theses')}
            className="px-5 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Тезисы
          </button>
          <button
            type="button"
            disabled={!url || loading}
            onClick={() => handleAction('telegram')}
            className="px-5 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Пост для Telegram
          </button>
        </div>

        {/* Результат */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Результат:</h3>
          {loading ? (
            <div className="p-4 bg-gray-100 rounded-lg text-gray-600 flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Обработка...
            </div>
          ) : result ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {result}
            </div>
          ) : (
            <p className="text-gray-500">Нажмите кнопку, чтобы получить результат.</p>
          )}
        </div>
      </div>
    </div>
  );
}

