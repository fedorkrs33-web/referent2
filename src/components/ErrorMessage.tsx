// components/ErrorMessage.tsx
'use client';

import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
}

export function ErrorMessage({ title = 'Произошла ошибка', message }: ErrorMessageProps) {
  return (
    <Alert variant="destructive" className="mb-4 animate-in fade-in-50">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
