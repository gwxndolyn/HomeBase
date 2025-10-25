import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useTheme } from '../contexts/ThemeContext';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface DateRange {
  start: string;
  end: string;
  status: string;
}

interface DateTimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unavailableDates?: DateRange[];
  minDate?: Date;
  required?: boolean;
  otherDateTime?: string; // For start date, this is end date; for end date, this is start date
  isStartDate?: boolean; // Whether this picker is for start date
}

export default function DateTimePicker({
  label,
  value,
  onChange,
  unavailableDates = [],
  minDate,
  required = false,
  otherDateTime,
  isStartDate = true
}: DateTimePickerProps) {
  const { theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showConflictWarning, setShowConflictWarning] = useState(false);

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    }
  }, [value]);

  const isDateUnavailable = (date: Date): boolean => {
    if (!unavailableDates || unavailableDates.length === 0) return false;

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return unavailableDates.some(range => {
      const rangeStart = new Date(range.start);
      const rangeEnd = new Date(range.end);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd.setHours(23, 59, 59, 999);

      return checkDate >= rangeStart && checkDate <= rangeEnd;
    });
  };

  const isTimeUnavailable = (time: Date): boolean => {
    if (!unavailableDates || unavailableDates.length === 0) return false;

    return unavailableDates.some(range => {
      const rangeStart = new Date(`${range.start}T00:00:00`);
      const rangeEnd = new Date(`${range.end}T23:59:59`);

      // If the selected date falls within a blocked range
      const timeDate = new Date(time);
      const selectedDateOnly = new Date(timeDate);
      selectedDateOnly.setHours(0, 0, 0, 0);

      const rangeStartDateOnly = new Date(rangeStart);
      rangeStartDateOnly.setHours(0, 0, 0, 0);

      const rangeEndDateOnly = new Date(rangeEnd);
      rangeEndDateOnly.setHours(0, 0, 0, 0);

      // Check if the date is within the blocked range
      if (selectedDateOnly >= rangeStartDateOnly && selectedDateOnly <= rangeEndDateOnly) {
        return true;
      }

      return false;
    });
  };

  const handleDateTimeChange = (date: Date | null) => {
    if (!date) {
      onChange('');
      setSelectedDate(null);
      setShowConflictWarning(false);
      return;
    }

    // Check if the selected date is unavailable
    if (isDateUnavailable(date)) {
      setShowConflictWarning(true);
      return;
    }

    setShowConflictWarning(false);
    setSelectedDate(date);

    // Format to datetime-local format (YYYY-MM-DDTHH:MM)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    onChange(formattedDateTime);
  };

  const filterTime = (time: Date): boolean => {
    // Don't filter times for available dates
    if (!isDateUnavailable(time)) {
      return true;
    }
    return false;
  };

  const highlightDates = unavailableDates.map(range => ({
    start: new Date(range.start),
    end: new Date(range.end)
  }));

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateTimeChange}
          showTimeSelect
          timeFormat="h:mm aa"
          timeIntervals={30}
          dateFormat="MMMM d, yyyy h:mm aa"
          minDate={minDate || new Date()}
          filterDate={(date) => !isDateUnavailable(date)}
          filterTime={filterTime}
          placeholderText="Select date and time"
          className={`w-full px-4 py-3 rounded-lg border ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-gray-50 border-gray-300 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-purple-500`}
          calendarClassName={theme === 'dark' ? 'dark-theme-calendar' : ''}
          wrapperClassName="w-full"
          highlightDates={highlightDates.map(range => ({
            'react-datepicker__day--highlighted-custom': [range.start, range.end]
          }))}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {showConflictWarning && (
        <div className={`flex items-start space-x-2 p-3 rounded-lg ${
          theme === 'dark' ? 'bg-red-900/20 border border-red-700/30' : 'bg-red-50 border border-red-200'
        }`}>
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-600 dark:text-red-400">
            <p className="font-semibold">Date Unavailable</p>
            <p>This date is already booked. Please select another date.</p>
          </div>
        </div>
      )}

      {unavailableDates.length > 0 && (
        <div className={`p-3 rounded-lg text-xs ${
          theme === 'dark' ? 'bg-gray-700/50' : 'bg-blue-50'
        }`}>
          <p className={`font-medium mb-1 flex items-center gap-1 ${
            theme === 'dark' ? 'text-blue-400' : 'text-blue-700'
          }`}>
            <Clock className="w-4 h-4" />
            Unavailable Periods:
          </p>
          <ul className={`space-y-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {unavailableDates.slice(0, 3).map((range, idx) => (
              <li key={idx}>
                • {new Date(range.start).toLocaleDateString()} - {new Date(range.end).toLocaleDateString()}
              </li>
            ))}
            {unavailableDates.length > 3 && (
              <li className="font-medium">
                + {unavailableDates.length - 3} more blocked period(s)
              </li>
            )}
          </ul>
        </div>
      )}

      <style>{`
        .react-datepicker {
          font-family: inherit;
          border: none;
          border-radius: 1rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          ${theme === 'dark' ? 'background-color: rgb(31 41 55); color: white;' : ''}
        }

        .dark-theme-calendar {
          background-color: rgb(31 41 55);
          color: white;
        }

        .dark-theme-calendar .react-datepicker__header {
          background-color: rgb(55 65 81);
          border-bottom-color: rgb(75 85 99);
        }

        .dark-theme-calendar .react-datepicker__current-month,
        .dark-theme-calendar .react-datepicker__day-name {
          color: white;
        }

        .dark-theme-calendar .react-datepicker__day {
          color: rgb(209 213 219);
        }

        .dark-theme-calendar .react-datepicker__day:hover {
          background-color: rgb(75 85 99);
          color: white;
        }

        .dark-theme-calendar .react-datepicker__day--selected {
          background-color: rgb(147 51 234);
          color: white;
        }

        .dark-theme-calendar .react-datepicker__day--keyboard-selected {
          background-color: rgb(126 34 206);
          color: white;
        }

        .dark-theme-calendar .react-datepicker__day--disabled {
          color: rgb(107 114 128);
          cursor: not-allowed;
        }

        .dark-theme-calendar .react-datepicker__time-container {
          border-left-color: rgb(75 85 99);
        }

        .dark-theme-calendar .react-datepicker__time-box {
          background-color: rgb(31 41 55);
        }

        .dark-theme-calendar .react-datepicker__time-list-item {
          color: rgb(209 213 219);
        }

        .dark-theme-calendar .react-datepicker__time-list-item:hover {
          background-color: rgb(75 85 99);
        }

        .dark-theme-calendar .react-datepicker__time-list-item--selected {
          background-color: rgb(147 51 234) !important;
          color: white !important;
        }

        .react-datepicker__header {
          border-radius: 1rem 1rem 0 0;
          padding: 1rem;
          ${theme === 'dark' ? 'background-color: rgb(55 65 81); border-bottom-color: rgb(75 85 99);' : 'background-color: rgb(243 244 246);'}
        }

        .react-datepicker__current-month {
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }

        .react-datepicker__day-name {
          font-weight: 600;
          font-size: 0.875rem;
          margin: 0.25rem;
        }

        .react-datepicker__day {
          margin: 0.25rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          width: 2rem;
          line-height: 2rem;
        }

        .react-datepicker__day:hover {
          border-radius: 0.5rem;
          background-color: rgb(243 244 246);
        }

        .react-datepicker__day--selected {
          background-color: rgb(147 51 234);
          border-radius: 0.5rem;
          color: white;
          font-weight: 600;
        }

        .react-datepicker__day--keyboard-selected {
          background-color: rgb(126 34 206);
          border-radius: 0.5rem;
          color: white;
        }

        .react-datepicker__day--disabled {
          color: rgb(209 213 219);
          text-decoration: line-through;
          cursor: not-allowed;
          background-color: ${theme === 'dark' ? 'rgb(55 65 81)' : 'rgb(249 250 251)'};
        }

        .react-datepicker__day--disabled:hover {
          background-color: ${theme === 'dark' ? 'rgb(55 65 81)' : 'rgb(249 250 251)'};
        }

        .react-datepicker__day--highlighted-custom {
          background-color: ${theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'};
          border-radius: 0.5rem;
          color: ${theme === 'dark' ? 'rgb(248 113 113)' : 'rgb(220 38 38)'};
        }

        .react-datepicker__time-container {
          border-left: 1px solid ${theme === 'dark' ? 'rgb(75 85 99)' : 'rgb(229 231 235)'};
          width: 100px;
        }

        .react-datepicker__time {
          background-color: ${theme === 'dark' ? 'rgb(31 41 55)' : 'white'};
          border-radius: 0 1rem 1rem 0;
        }

        .react-datepicker__time-box {
          border-radius: 0 1rem 1rem 0;
        }

        .react-datepicker__time-list-item {
          padding: 0.5rem;
          font-size: 0.875rem;
          ${theme === 'dark' ? 'color: rgb(209 213 219);' : ''}
        }

        .react-datepicker__time-list-item:hover {
          background-color: ${theme === 'dark' ? 'rgb(75 85 99)' : 'rgb(243 244 246)'};
        }

        .react-datepicker__time-list-item--selected {
          background-color: rgb(147 51 234) !important;
          color: white !important;
          font-weight: 600;
        }

        .react-datepicker__time-list-item--disabled {
          color: rgb(156 163 175);
          text-decoration: line-through;
        }

        .react-datepicker__time-list-item--disabled:hover {
          background-color: transparent;
          cursor: not-allowed;
        }

        .react-datepicker-popper {
          z-index: 9999;
        }

        .react-datepicker__triangle {
          display: none;
        }
      `}</style>
    </div>
  );
}

