'use client';

import { forwardRef, useRef, useState, type ButtonHTMLAttributes } from 'react';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

const LogoutButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function LogoutButton({ onClick, disabled, ...props }, ref) {
    const [pending, setPending] = useState(false);
    const submitting = useRef(false);

    async function signOut() {
      if (submitting.current) return;
      submitting.current = true;
      setPending(true);
      try {
        const response = await fetch('/auth/sign-out', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!response.ok || (await response.json()).success !== true) throw new Error('Sign out failed');
        // A full navigation discards the authenticated React/router state.
        window.location.replace('/login');
      } catch {
        toast.error('No se pudo cerrar la sesión. Inténtalo de nuevo.');
        submitting.current = false;
        setPending(false);
      }
    }

    return (
      <button
        {...props}
        ref={ref}
        type="button"
        disabled={disabled || pending}
        aria-busy={pending}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) void signOut();
        }}
      >
        <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
        {pending ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </button>
    );
  },
);

export default LogoutButton;
