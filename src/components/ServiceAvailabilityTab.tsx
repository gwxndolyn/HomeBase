import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useListings } from '../contexts/ListingsContext';
import RentalCalendar from './RentalCalendar';
import { Calendar, AlertCircle } from 'lucide-react';

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
}

export default function ServiceAvailabilityTab() {
  const { theme } = useTheme();
  const { userListings } = useListings();

  // Get all service listings (not products)
  const serviceListings = userListings.filter(listing => listing.type === 'service');

  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    serviceListings.length > 0 ? serviceListings[0].id : ''
  );
  const [availabilitySlots, setAvailabilitySlots] = useState<TimeSlot[]>([]);
  const [showInfo, setShowInfo] = useState(true);

  const handleAvailabilityChange = (slots: TimeSlot[]) => {
    setAvailabilitySlots(slots);
    // Here you would typically save to Firebase
    console.log('Availability updated:', slots);
  };

  if (serviceListings.length === 0) {
    return (
      <div className={`rounded-xl p-8 text-center ${
        theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80'
      }`}>
        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">No Services Listed</h3>
        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
          You haven't listed any services yet. Create a service listing to manage availability.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      {showInfo && (
        <div className={`rounded-xl p-4 border-l-4 ${
          theme === 'dark'
            ? 'bg-blue-500/10 border-blue-500 text-blue-200'
            : 'bg-blue-50 border-blue-500 text-blue-800'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Service Availability Management</p>
              <p className="text-sm mt-1 opacity-90">
                Click on a date in the calendar to add available time slots for your services.
                Customers can then book within these available slots.
              </p>
            </div>
            <button
              onClick={() => setShowInfo(false)}
              className="text-lg opacity-50 hover:opacity-75"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Service Selection */}
      <div className={`rounded-xl p-6 ${
        theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80'
      }`}>
        <h3 className="text-lg font-semibold mb-4">Select Service</h3>
        <select
          value={selectedServiceId}
          onChange={(e) => setSelectedServiceId(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border transition-colors ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          {serviceListings.map(service => (
            <option key={service.id} value={service.id}>
              {service.name} - ${service.price}/{service.period}
            </option>
          ))}
        </select>
        <p className={`text-sm mt-2 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Selected: {serviceListings.find(s => s.id === selectedServiceId)?.name}
        </p>
      </div>

      {/* Calendar */}
      <RentalCalendar
        viewMode="availability"
        serviceId={selectedServiceId}
        onAvailabilityChange={handleAvailabilityChange}
      />

      {/* Summary */}
      {availabilitySlots.length > 0 && (
        <div className={`rounded-xl p-6 ${
          theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/80'
        }`}>
          <h3 className="text-lg font-semibold mb-4">Availability Summary</h3>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            You have {availabilitySlots.length} time slot{availabilitySlots.length !== 1 ? 's' : ''} scheduled.
            Customers can book during these times.
          </p>
        </div>
      )}
    </div>
  );
}
