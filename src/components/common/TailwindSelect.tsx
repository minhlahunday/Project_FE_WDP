import React from 'react';

interface TailwindSelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface TailwindSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  options: TailwindSelectOption[];
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const TailwindSelect: React.FC<TailwindSelectProps> = ({
  value,
  onChange,
  placeholder = "Chọn...",
  options,
  className = "",
  disabled = false,
  required = false
}) => {
  const baseClasses = "w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium transition-all duration-200 hover:border-gray-300 appearance-none cursor-pointer";
  const disabledClasses = "opacity-50 cursor-not-allowed bg-gray-100";
  const finalClasses = `${baseClasses} ${disabled ? disabledClasses : ''} ${className}`;

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={finalClasses}
        disabled={disabled}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.icon && `${option.icon} `}{option.label}
          </option>
        ))}
      </select>
      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default TailwindSelect;
