import { forwardRef } from 'react';

import styles from './Button.module.css';

export type ButtonVariant = 'default' | 'primary';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    /**
     * Visual variant. Keep it small and explicit to prevent style sprawl.
     */
    variant?: ButtonVariant;
};

function cx(...parts: Array<string | undefined | false | null>): string {
    return parts.filter(Boolean).join(' ');
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant = 'default', className, type = 'button', ...props },
    ref,
) {
    return (
        <button
            ref={ref}
            type={type}
            className={cx(
                styles.button,
                variant === 'primary' && styles.primary,
                className,
            )}
            {...props}
        />
    );
});

export default Button;

