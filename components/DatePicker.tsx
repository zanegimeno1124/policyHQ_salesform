import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  selectedDate: string;
  onChange: (date: string) => void;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const getLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const dateObj = getLocalDate(selectedDate);
  const [viewDate, setViewDate] = useState(new Date(dateObj));

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
      setDropUp(spaceBelow < 300); // Datepicker is taller, needs ~300px
    }
  }, [isOpen]);

  useEffect(() => { setViewDate(getLocalDate(selectedDate)); }, [selectedDate]);

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const handleDateClick = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const changeMonth = (offset: number) => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-6"></div>);

    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = dateObj.getDate() === i && dateObj.getMonth() === month && dateObj.getFullYear() === year;
      days.push(
        <button
          key={i} onClick={(e) => { e.stopPropagation(); handleDateClick(i); }}
          className={`h-6 w-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all
            ${isSelected ? 'bg-yellow-400 text-black shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 border rounded-lg cursor-pointer text-sm transition-all 
        ${isOpen ? 'border-yellow-400 ring-1 ring-yellow-400' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
      >
        <span className="text-gray-900 dark:text-white font-medium text-xs">
          {selectedDate ? dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Select Date'}
        </span>
        <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
      </div>

      {isOpen && (
        <div className={`absolute z-[50] w-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-100 dark:border-gray-700 p-2 animate-in fade-in zoom-in-95 duration-200
          ${dropUp ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'}`}>
          <div className="flex items-center justify-between mb-2">
            <button onClick={(e) => { e.stopPropagation(); changeMonth(-1); }} className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold text-gray-900 dark:text-white">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button onClick={(e) => { e.stopPropagation(); changeMonth(1); }} className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-0.5">
            {DAYS.map(day => <div key={day} className="text-center text-[9px] font-bold text-gray-400 uppercase">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">{renderCalendar()}</div>
        </div>
      )}
    </div>
  );
};