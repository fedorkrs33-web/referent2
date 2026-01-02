// src/components/InputGroup.jsx
import Button from './Button';
export default function InputGroup({ value, onChange, onParse, disabled }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <input
        type="url"
        value={value}
        onChange={onChange}
        placeholder="https://example.com/article"
        className="flex-1 min-w-48 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
      <Button onClick={onParse} disabled={disabled} variant="primary">
        🧩 Парсинг
      </Button>
    </div>
  );
}
