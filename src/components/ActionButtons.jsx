// src/components/ActionButtons.jsx
import Button from './Button';
export default function ActionButtons({ onAction, disabled }) {
  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <Button onClick={() => onAction('translate')} disabled={disabled} variant="secondary">
        🌐 Перевод на русский
      </Button>
      <Button onClick={() => onAction('summary')} disabled={disabled} variant="primary">
        О чём статья?
      </Button>
      <Button onClick={() => onAction('theses')} disabled={disabled} variant="success">
        Тезисы
      </Button>
      <Button onClick={() => onAction('telegram')} disabled={disabled} variant="warning">
        Пост для Telegram
      </Button>
    </div>
  );
}
