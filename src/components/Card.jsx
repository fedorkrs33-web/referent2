// src/components/Card.jsx
export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 shadow-sm transition-colors duration-200 ${className}`}>
      {children}
    </div>
  );
}
