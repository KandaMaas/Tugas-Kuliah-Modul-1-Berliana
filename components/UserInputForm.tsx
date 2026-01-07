import React, { useState, useEffect } from 'react';
import { TravelPreferences } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface UserInputFormProps {
  onSubmit: (preferences: TravelPreferences) => void;
  isLoading: boolean;
  onGeolocationRequest: (enabled: boolean) => void;
  geolocationStatus: {
    latitude: number | null;
    longitude: number | null;
    isGettingLocation: boolean;
    error: string | null;
  };
}

const UserInputForm: React.FC<UserInputFormProps> = ({
  onSubmit,
  isLoading,
  onGeolocationRequest,
  geolocationStatus,
}) => {
  const [destination, setDestination] = useState<string>('');
  const [durationDays, setDurationDays] = useState<number>(5); // New: Duration in days
  const [budget, setBudget] = useState<number>(1000000); // Reintroduced: Total budget
  const [interests, setInterests] = useState<string>('');
  const [useGeolocation, setUseGeolocation] = useState<boolean>(false);

  useEffect(() => {
    onGeolocationRequest(useGeolocation);
  }, [useGeolocation, onGeolocationRequest]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || durationDays <= 0 || budget <= 0 || !interests) {
      alert('Mohon isi semua field dan pastikan durasi serta anggaran positif.');
      return;
    }

    const preferences: TravelPreferences = {
      destination,
      durationDays,
      budget,
      interests,
    };

    if (useGeolocation && geolocationStatus.latitude && geolocationStatus.longitude) {
      preferences.latitude = geolocationStatus.latitude;
      preferences.longitude = geolocationStatus.longitude;
    }

    onSubmit(preferences);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
          TUJUAN WISATA
        </label>
        <input
          type="text"
          id="destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Contoh: Kyoto, Jepang"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="durationDays" className="block text-sm font-medium text-gray-700 mb-1">
          DURASI (HARI)
        </label>
        <input
          type="number"
          id="durationDays"
          value={durationDays}
          onChange={(e) => setDurationDays(Number(e.target.value))}
          min="1"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
          ANGGARAN TOTAL (Contoh: 1.000.000 untuk 1 juta IDR)
        </label>
        <input
          type="number"
          id="budget"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          min="1"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-1">
          MINAT KHUSUS (Contoh: Kuliner dan Sejarah)
        </label>
        <textarea
          id="interests"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          rows={3}
          placeholder="Sebutkan minat Anda, misalnya: museum, pantai, makanan, olahraga petualangan, dll."
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-y"
        ></textarea>
      </div>

      <div className="flex items-center">
        <input
          id="useGeolocation"
          name="useGeolocation"
          type="checkbox"
          checked={useGeolocation}
          onChange={(e) => setUseGeolocation(e.target.checked)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="useGeolocation" className="ml-2 block text-sm text-gray-900">
          Gunakan lokasi saat ini untuk saran yang relevan
        </label>
      </div>
      {useGeolocation && (
        <div className="mt-2 text-sm">
          {geolocationStatus.isGettingLocation && (
            <p className="text-blue-500 flex items-center">
              <LoadingSpinner />
              <span className="ml-2">Mendapatkan lokasi Anda...</span>
            </p>
          )}
          {geolocationStatus.error && (
            <p className="text-red-500">Error: {geolocationStatus.error}</p>
          )}
          {!geolocationStatus.isGettingLocation && !geolocationStatus.error && geolocationStatus.latitude !== null && (
            <p className="text-green-600">Lokasi berhasil ditemukan!</p>
          )}
          {!geolocationStatus.isGettingLocation && !geolocationStatus.error && geolocationStatus.latitude === null && (
            <p className="text-gray-500">Menunggu akses lokasi Anda...</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || (useGeolocation && geolocationStatus.isGettingLocation)}
        className="w-full inline-flex justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center">
            <LoadingSpinner />
            <span className="ml-2">Merencanakan perjalanan Anda...</span>
          </span>
        ) : (
          'Buat Rencana Perjalanan'
        )}
      </button>
    </form>
  );
};

export { UserInputForm };