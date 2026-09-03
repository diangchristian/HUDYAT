
import {type LucideIcon } from "lucide-react";

type ElevatedButtonProps = {
  text: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
};

const ElevatedButton = ({text, variant = 'primary', size = 'md', className = '', onClick, disabled = false, icon: Icon, iconPosition = 'left'}: ElevatedButtonProps) => {

    let defaulStyle = "rounded-lg font-extrabold tracking-wide transition-transform active:translate-y-1 cursor-pointer font-body disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"

    // Size styles
    const sizeStyles = {
      sm: "px-4 py-1 text-xs",
      md: "px-6 py-2 text-sm",
      lg: "px-8 py-3 text-base"
    }
    defaulStyle += " " + sizeStyles[size]

    // Variant styles
    if(variant === 'primary'){
        defaulStyle += " bg-hudyat-gold text-white shadow-[var(--shadow-button)] active:shadow-[0_1px_0_#887041]"
    }else if(variant === 'secondary'){
        defaulStyle += " bg-white border-2 text-gray-900 shadow-[var(--shadow-button-secondary)] active:shadow-[0_1px_0_#e7e2d9]"
    }

  return (
    <button type="button" className={`${defaulStyle} ${className}`} onClick={onClick} disabled={disabled}>
      <span className="flex items-center justify-center gap-2">
        {Icon && iconPosition === 'left' && <Icon className="h-4 w-4" />}
        {text}
        {Icon && iconPosition === 'right' && <Icon className="h-4 w-4" />}
      </span>
    </button>
  )
}

export default ElevatedButton