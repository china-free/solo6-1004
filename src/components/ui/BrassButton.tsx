import { cn } from '@/lib/utils';

type BrassButtonVariant = 'default' | 'small' | 'icon';

interface BrassButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  children?: React.ReactNode;
  variant?: BrassButtonVariant;
  className?: string;
}

export default function BrassButton({
  onClick,
  disabled = false,
  active = false,
  children,
  variant = 'default',
  className,
}: BrassButtonProps) {
  const variantClasses: Record<BrassButtonVariant, string> = {
    default: 'px-5 py-2 text-sm',
    small: 'px-3 py-1 text-xs',
    icon: 'w-10 h-10 flex items-center justify-center p-0',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'brass-button',
        variantClasses[variant],
        active && 'active',
        className
      )}
    >
      {children}
    </button>
  );
}
