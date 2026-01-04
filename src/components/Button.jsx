// src/components/Button.jsx
export default function Button({ children, onClick, disabled, variant = "primary", className = "" }) {
  const base = "px-5 py-2 font-medium rounded-lg transition flex items-center gap-2";
  const variants = {
    info: "bg-blue-600 hover:bg-blue-700 text-white",
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-orange-600 hover:bg-orange-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    warning: "bg-purple-600 hover:bg-purple-700 text-white",
    outline: "bg-transparent border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
}
