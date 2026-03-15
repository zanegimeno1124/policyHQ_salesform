import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Info, Check } from 'lucide-react';

interface Option { id: string; name: string; }
interface SearchableDropdownProps {
  options: Option[]; value: string; onChange: (option: Option) => void;
  placeholder: string; label?: string; tooltipText?: string; loading?: boolean;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({ 
  options, value, onChange, placeholder, label, tooltipText, loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropUp, setDropUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const safeOptions = Array.isArray(options) ? options : [];
  const selectedOption = safeOptions.find(opt => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 250px below, open upwards
      setDropUp(spaceBelow < 250);
    }
  }, [isOpen]);

  const filteredOptions = safeOptions.filter(opt => 
    opt?.name?.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200">{label}</label>
          {tooltipText && (
            <div className="relative">
              <Info 
                className="w-3 h-3 text-gray-400 hover:text-yellow-500 cursor-pointer"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              />
              {showTooltip && (
                <div className="absolute left-5 top-1/2 -translate-y-1/2 w-48 bg-gray-900 text-white text-[10px] p-2 rounded-lg shadow-xl z-[110] leading-snug border border-gray-700">
                  {tooltipText}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div 
        onClick={() => !loading && setIsOpen(!isOpen)}
        className={`flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg cursor-pointer transition-all text-sm
        ${loading ? 'opacity-70 cursor-wait' : ''}
        ${isOpen ? 'border-yellow-400 ring-1 ring-yellow-400 bg-white dark:bg-gray-800' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
      >
        <span className={`${selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400'} font-medium truncate`}>
          {selectedOption ? selectedOption.name : (loading ? 'Loading...' : placeholder)}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className={`absolute z-[50] w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200
          ${dropUp ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'}`}>
          <div className="p-2 border-b border-gray-50 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-2 py-1.5 rounded-lg">
              <Search className="w-3 h-3 text-gray-400" />
              <input 
                type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..." className="bg-transparent w-full text-xs outline-none text-gray-700 dark:text-white"
                autoFocus onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? filteredOptions.map((opt) => (
              <div
                key={opt.id}
                onClick={() => { onChange(opt); setIsOpen(false); setSearchTerm(''); }}
                className={`px-3 py-2.5 text-xs cursor-pointer hover:bg-yellow-50 dark:hover:bg-gray-700 flex items-center justify-between
                  ${value === opt.id ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}
              >
                {opt.name}
                {value === opt.id && <Check className="w-3 h-3 text-yellow-500" />}
              </div>
            )) : <div className="px-4 py-6 text-center text-xs text-gray-400">No results</div>}
          </div>
        </div>
      )}
    </div>
  );
};