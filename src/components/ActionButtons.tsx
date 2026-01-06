// src/components/ActionButtons.tsx
import Button from './Button';

interface ActionButtonsProps {
  onAction: (action: 'translate' | 'summary' | 'theses' | 'telegram' | 'illustrate') => void;
  disabled?: boolean;
}

export default function ActionButtons({ onAction, disabled }: ActionButtonsProps) {
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
      <Button onClick={() => onAction('illustrate')} disabled={disabled} variant="info">
        🎨 Иллюстрация
      </Button>
    </div>
  );
}

