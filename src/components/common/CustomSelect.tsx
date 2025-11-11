import React, { useState, useRef, useEffect } from 'react';

// SVG Icons
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface SelectOption {
  label: string;
  value: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  loading?: boolean;
  showSearch?: boolean;
  listHeight?: number;
  popupMatchSelectWidth?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Chọn...',
  allowClear = false,
  disabled = false,
  loading = false,
  showSearch = false,
  listHeight = 288,
  popupMatchSelectWidth = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = showSearch && searchQuery
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Select Input */}
      <div
        className={`
          flex items-center justify-between
          px-4 py-3
          bg-white border-2 rounded-xl
          cursor-pointer transition-all
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-100 shadow-md' : 'border-gray-300 hover:border-blue-400'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
        `}
        style={{ minHeight: '48px' }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`flex-1 ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`} style={{ fontSize: '15px' }}>
          {loading ? 'Đang tải...' : (selectedOption?.label || placeholder)}
        </span>
        
        <div className="flex items-center gap-1">
          {allowClear && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-gray-500" />
            </button>
          )}
          
          <ChevronDownIcon 
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div 
          className="absolute z-[10050] mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden"
          style={{ 
            width: popupMatchSelectWidth ? '100%' : 'auto',
            minWidth: popupMatchSelectWidth ? undefined : '100%',
            maxHeight: `${listHeight}px`
          }}
        >
          {/* Search Input */}
          {showSearch && (
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <input
                type="text"
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{ fontSize: '15px' }}
              />
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto" style={{ maxHeight: `${listHeight - (showSearch ? 72 : 0)}px` }}>
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500" style={{ fontSize: '15px' }}>
                Không có kết quả
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`
                    px-4 py-3 cursor-pointer transition-all
                    ${option.value === value 
                      ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-500' 
                      : 'text-gray-800 hover:bg-gray-50 hover:translate-x-1'
                    }
                  `}
                  style={{ fontSize: '15px' }}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
