// src/components/ThemeToggle.jsx
import { useEffect } from 'react';

export default function ThemeToggle({ theme, toggleTheme }) {
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <button
      onClick={toggleTheme}
      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 dark:bg-yellow-500 dark:text-gray-900 dark:hover:bg-yellow-400 transition"
    >
      {theme === 'dark' ? '☀️ Светлая' : '🌙 Тёмная'} тема
    </button>
  );
}
