// File: src/components/SecureInput.jsx
import React, { forwardRef, useId } from 'react';

/**
 * @module SecureInput
 * @description WCAG AA/AAA compliant bemeneti egység.
 * Explicit fókusz/blur/hibás/terhelés állapotok, aria-invalid és role="alert" szigorú betartása.
 * Nem tartalmaz üzleti logikát; kizárólag a szerződést (props) és az akadálymentességet teljesíti.
 */

const SecureInput = forwardRef(function SecureInput({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  isLoading = false,
  placeholder,
  disabled = false,
  ariaDescribedBy,
  ...rest
}, ref) {
  const id = useId();

  // Állapotgép vezérelt stílusok és attribútumok
  const isInvalid = !!error;
  const inputClasses = [
    'w-full px-3 py-2.5 border rounded-lg text-sm transition-all duration-150 outline-none',
    'focus:ring-2 focus:ring-offset-1',
    isInvalid ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200',
    disabled || isLoading ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
  ].join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label 
          htmlFor={id} 
          className="text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      
      <input
        ref={ref}
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled || isLoading}
        placeholder={placeholder}
        aria-invalid={isInvalid}
        aria-describedby={error ? `${id}-error` : ariaDescribedBy}
        role="textbox"
        className={inputClasses}
        {...rest}
      />

      {/* Hibajelzés: csak akkor jelenik meg, ha az állapotgép 'error' branch-et futtat */}
      {isInvalid && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600 font-medium mt-1">
          {error}
        </p>
      )}

      {/* Terhelés indikátor: vizuális feedback a szinkronizáció állapotáról */}
      {isLoading && (
        <div className="absolute right-3 top-2.5" aria-hidden="true">
          <svg className="animate-spin h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
    </div>
  );
});

export default SecureInput;