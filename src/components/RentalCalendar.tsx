import { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useTheme } from '../contexts/ThemeContext';
import { useRentals } from '../contexts/RentalsContext';
import { Calendar as CalendarIcon, X, Clock, MapPin, DollarSign, User, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RentalCalendarProps {
  viewMode: 'customer' | 'owner' | 'availability';
  serviceId?: string;
  onAvailabilityChange?: (availability: Array<{ date: string; startTime: string; endTime: string }>) => void;
}

const CALENDAR_COLORS = {
  pending: '#f59e0b',
  approved: '#10b981',
  completed: '#6b7280',
  declined: '#ef4444',
  cancelled: '#9ca3af',
  available: '#8b5cf6',
  booked: '#3b82f6',
};

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
}

export default function RentalCalendar({ viewMode, onAvailabilityChange }: RentalCalendarProps) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { userRentalRequests, receivedRentalRequests } = useRentals();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Availability management state
  const [availabilitySlots, setAvailabilitySlots] = useState<TimeSlot[]>([]);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slotStartTime, setSlotStartTime] = useState<string>('09:00');
  const [slotEndTime, setSlotEndTime] = useState<string>('17:00');

  // Convert rental requests to calendar events
  const events = useMemo(() => {
    // For availability mode, show available and booked slots
    if (viewMode === 'availability') {
      return availabilitySlots.map((slot, idx) => ({
        id: `slot-${idx}`,
        title: 'Available',
        start: new Date(`${slot.date}T${slot.startTime}`),
        end: new Date(`${slot.date}T${slot.endTime}`),
        backgroundColor: CALENDAR_COLORS.available,
        borderColor: CALENDAR_COLORS.available,
        extendedProps: {
          ...slot,
          displayTitle: `⏰ Available: ${slot.startTime} - ${slot.endTime}`,
          isAvailability: true,
        }
      }));
    }

    const rentals = viewMode === 'customer' ? userRentalRequests : receivedRentalRequests;

    // Filter out cancelled and declined bookings
    const activeRentals = rentals.filter(
      rental => rental.status !== 'cancelled' && rental.status !== 'declined'
    );

    return activeRentals.map((rental) => {
      const startDateTime = new Date(`${rental.startDate}T${rental.startTime}`);
      const endDateTime = new Date(`${rental.endDate}T${rental.endTime}`);

      return {
        id: rental.id,
        title: rental.toolName,
        start: startDateTime,
        end: endDateTime,
        backgroundColor: CALENDAR_COLORS[rental.status as keyof typeof CALENDAR_COLORS] || '#6b7280',
        borderColor: CALENDAR_COLORS[rental.status as keyof typeof CALENDAR_COLORS] || '#6b7280',
        extendedProps: {
          ...rental,
          displayTitle: viewMode === 'customer'
            ? `🛠️ ${rental.toolName}`
            : `🛠️ ${rental.toolName}`,
        }
      };
    });
  }, [userRentalRequests, receivedRentalRequests, viewMode, availabilitySlots]);

  const handleEventClick = (info: any) => {
    if (viewMode === 'availability' && info.event.extendedProps.isAvailability) {
      setSelectedEvent(info.event);
      setShowEventModal(true);
    } else if (viewMode !== 'availability') {
      setSelectedEvent(info.event);
      setShowEventModal(true);
    }
  };

  const handleDateClick = (info: any) => {
    if (viewMode === 'availability') {
      const dateStr = info.dateStr;
      setSelectedDate(dateStr);
      setShowSlotModal(true);
    }
  };

  const addTimeSlot = () => {
    if (!selectedDate || !slotStartTime || !slotEndTime) {
      alert('Please fill in all fields');
      return;
    }

    if (slotStartTime >= slotEndTime) {
      alert('End time must be after start time');
      return;
    }

    const newSlot: TimeSlot = {
      date: selectedDate,
      startTime: slotStartTime,
      endTime: slotEndTime,
    };

    const updatedSlots = [...availabilitySlots, newSlot];
    setAvailabilitySlots(updatedSlots);

    if (onAvailabilityChange) {
      onAvailabilityChange(updatedSlots);
    }

    // Reset form
    setShowSlotModal(false);
    setSelectedDate('');
    setSlotStartTime('09:00');
    setSlotEndTime('17:00');
  };

  const removeTimeSlot = (index: number) => {
    const updatedSlots = availabilitySlots.filter((_, i) => i !== index);
    setAvailabilitySlots(updatedSlots);

    if (onAvailabilityChange) {
      onAvailabilityChange(updatedSlots);
    }
  };

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateTime = new Date(`${date}T${time}`);
      return dateTime.toLocaleString('en-SG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return `${date} ${time}`;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'completed':
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
      case 'declined':
      case 'cancelled':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-2xl p-6 ${theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'} border-0 shadow-sm`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {viewMode === 'customer' ? 'My Rental Calendar' : viewMode === 'availability' ? 'Service Availability' : 'Owner Rental Calendar'}
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {viewMode === 'availability'
                  ? `${availabilitySlots.length} time slot${availabilitySlots.length !== 1 ? 's' : ''} available`
                  : `${events.length} rental${events.length !== 1 ? 's' : ''} scheduled`}
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-3">
          {viewMode === 'availability' ? (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: CALENDAR_COLORS.available }}></div>
                <span className="text-sm">Available</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: CALENDAR_COLORS.pending }}></div>
                <span className="text-sm">Pending</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: CALENDAR_COLORS.approved }}></div>
                <span className="text-sm">Approved</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: CALENDAR_COLORS.completed }}></div>
                <span className="text-sm">Completed</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className={`rounded-2xl p-6 ${theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'} border-0 shadow-sm calendar-container`}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          eventClick={handleEventClick}
          dateClick={viewMode === 'availability' ? handleDateClick : undefined}
          height="auto"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }}
          eventContent={(arg) => {
            return (
              <div className="fc-event-main-frame px-1">
                <div className="fc-event-time text-xs">{arg.timeText}</div>
                <div className="fc-event-title-container">
                  <div className="fc-event-title fc-sticky text-xs font-medium truncate">{arg.event.extendedProps.displayTitle}</div>
                </div>
              </div>
            );
          }}
        />
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 max-w-2xl w-full shadow-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">
                {selectedEvent.extendedProps.isAvailability ? '⏰ Available Time Slot' : selectedEvent.extendedProps.toolName}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {selectedEvent.extendedProps.isAvailability ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 mt-0.5 text-purple-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-400">Date</p>
                        <p className="font-semibold">{selectedEvent.extendedProps.date}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 mt-0.5 text-purple-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-400">Time</p>
                        <p className="font-semibold">{selectedEvent.extendedProps.startTime} - {selectedEvent.extendedProps.endTime}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Status Badge */}
                  <div>
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold border ${getStatusBadgeColor(selectedEvent.extendedProps.status)}`}>
                      {selectedEvent.extendedProps.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Rental Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-400">Start</p>
                        <p className="font-semibold">{formatDateTime(selectedEvent.extendedProps.startDate, selectedEvent.extendedProps.startTime)}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-400">End</p>
                        <p className="font-semibold">{formatDateTime(selectedEvent.extendedProps.endDate, selectedEvent.extendedProps.endTime)}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-400">{viewMode === 'customer' ? 'Owner' : 'Renter'}</p>
                        <p className="font-semibold">{viewMode === 'customer' ? selectedEvent.extendedProps.ownerName : selectedEvent.extendedProps.renterName}</p>
                        <p className="text-sm text-gray-400">{viewMode === 'customer' ? selectedEvent.extendedProps.ownerEmail : selectedEvent.extendedProps.renterEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <DollarSign className="w-5 h-5 mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-400">Total Cost</p>
                        <p className="font-semibold text-purple-500 text-xl">${selectedEvent.extendedProps.totalCost}</p>
                      </div>
                    </div>

                    {selectedEvent.extendedProps.location && (
                      <div className="flex items-start space-x-3 md:col-span-2">
                        <MapPin className="w-5 h-5 mt-0.5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-400">Location</p>
                          <p className="font-semibold">{selectedEvent.extendedProps.location}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  {selectedEvent.extendedProps.message && (
                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                      <p className="text-sm font-medium text-gray-400 mb-1">Message</p>
                      <p className="text-sm">{selectedEvent.extendedProps.message}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {!selectedEvent.extendedProps.isAvailability && (
                <button
                  onClick={() => {
                    navigate(`/listing/${selectedEvent.extendedProps.toolId}`);
                    setShowEventModal(false);
                  }}
                  className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Package className="w-4 h-4" />
                  <span>View Listing</span>
                </button>
              )}

              <button
                onClick={() => setShowEventModal(false)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Time Slot Modal - Availability Mode */}
      {showSlotModal && viewMode === 'availability' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 max-w-md w-full shadow-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Add Time Slot</h3>
              <button
                onClick={() => setShowSlotModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="text"
                  value={selectedDate}
                  disabled
                  className={`w-full px-4 py-2 rounded-lg border opacity-50 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-gray-100 border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <input
                  type="time"
                  value={slotStartTime}
                  onChange={(e) => setSlotStartTime(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <input
                  type="time"
                  value={slotEndTime}
                  onChange={(e) => setSlotEndTime(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={addTimeSlot}
                className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
              >
                Add Slot
              </button>
              <button
                onClick={() => setShowSlotModal(false)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Availability Slots List - Availability Mode */}
      {viewMode === 'availability' && availabilitySlots.length > 0 && (
        <div className={`rounded-2xl p-6 ${theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80 backdrop-blur-sm'} border-0 shadow-sm`}>
          <h3 className="text-lg font-bold mb-4">Scheduled Availability</h3>
          <div className="space-y-3">
            {availabilitySlots.map((slot, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium">{slot.date}</p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {slot.startTime} - {slot.endTime}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeTimeSlot(idx)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .calendar-container .fc {
          font-family: inherit;
        }

        .calendar-container .fc .fc-toolbar {
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .calendar-container .fc .fc-toolbar-title {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .calendar-container .fc .fc-button {
          background-color: rgb(147 51 234);
          border-color: rgb(147 51 234);
          text-transform: capitalize;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .calendar-container .fc .fc-button:hover {
          background-color: rgb(126 34 206);
          border-color: rgb(126 34 206);
        }

        .calendar-container .fc .fc-button:focus {
          box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.3);
        }

        .calendar-container .fc .fc-button-active {
          background-color: rgb(126 34 206);
          border-color: rgb(126 34 206);
        }

        .calendar-container .fc .fc-col-header-cell {
          background-color: ${theme === 'dark' ? 'rgba(147, 51, 234, 0.2)' : 'rgba(147, 51, 234, 0.1)'};
          font-weight: 600;
          padding: 0.75rem 0.5rem;
          border: none;
          color: ${theme === 'dark' ? 'white' : 'inherit'};
        }

        .calendar-container .fc .fc-daygrid-day {
          background-color: transparent;
          transition: background-color 0.2s;
        }

        .calendar-container .fc .fc-daygrid-day:hover {
          background-color: ${theme === 'dark' ? 'rgba(147, 51, 234, 0.1)' : 'rgba(147, 51, 234, 0.05)'};
        }

        .calendar-container .fc .fc-daygrid-day-number {
          padding: 0.5rem;
          font-weight: 500;
          color: ${theme === 'dark' ? 'white' : 'inherit'};
        }

        .calendar-container .fc .fc-day-today {
          background-color: ${theme === 'dark' ? 'rgba(147, 51, 234, 0.15)' : 'rgba(147, 51, 234, 0.1)'} !important;
        }

        .calendar-container .fc .fc-day-today .fc-daygrid-day-number {
          background-color: rgb(147 51 234);
          color: white;
          border-radius: 50%;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0.25rem;
        }

        .calendar-container .fc-event {
          border-radius: 0.375rem;
          padding: 0.125rem 0.25rem;
          margin-bottom: 0.125rem;
          cursor: pointer;
          border: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .calendar-container .fc-event:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .calendar-container .fc .fc-event-main {
          color: white;
        }

        .calendar-container .fc td,
        .calendar-container .fc th {
          border-color: ${theme === 'dark' ? 'rgba(75, 85, 99, 0.5)' : 'rgba(156, 163, 175, 0.2)'};
        }

        .calendar-container .fc {
          color: ${theme === 'dark' ? 'white' : 'inherit'};
        }

        @media (max-width: 768px) {
          .calendar-container .fc .fc-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .calendar-container .fc .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
            margin-bottom: 0.5rem;
          }

          .calendar-container .fc .fc-toolbar-title {
            font-size: 1.25rem;
          }

          .calendar-container .fc .fc-button {
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
}
