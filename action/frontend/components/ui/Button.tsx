"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

// 按钮变体类型
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      "inline-flex items-center justify-center rounded-md font-medium transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
    ];

    const variantClasses = {
      primary: [
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "shadow-sm",
      ],
      secondary: [
        "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        "shadow-sm",
      ],
      outline: [
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        "shadow-sm",
      ],
      ghost: [
        "hover:bg-accent hover:text-accent-foreground",
      ],
      destructive: [
        "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        "shadow-sm",
      ],
    };

    const sizeClasses = {
      sm: "h-9 px-3 text-sm",
      md: "h-10 px-4 py-2",
      lg: "h-11 px-8 text-lg",
    };

    const classes = clsx(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    return (
      <button
        className={classes}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {isLoading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, type ButtonProps };

