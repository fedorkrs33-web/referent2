// src/components/ResultBox.tsx
interface ResultBoxProps {
  result: string;
  loading: boolean;
}

export default function ResultBox({ result, loading }: ResultBoxProps) {
  return (
    <div className="mt-6 p-4 rounded-lg text-sm bg-blue-50 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
      <h3 className="text-lg font-semibold mb-3 dark:text-gray-200">Результат:</h3>
      {loading ? (
        <div className="flex items-center text-blue-500">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Обработка...
        </div>
      ) : result ? (
        <div className="whitespace-pre-wrap leading-relaxed font-sans">{result}</div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">Нажмите кнопку, чтобы получить результат.</p>
      )}
    </div>
  );
}

