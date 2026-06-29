import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

type Props = {
  message: string;
  onDismiss: () => void;
};

export default function Toast({ message, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 2500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="toast">
      <CheckCircle2 size={16} strokeWidth={2} />
      <span>{message}</span>
    </div>
  );
}
