import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GeneratedItinerary, ItineraryDayContent, ItineraryActivity } from '../types';

interface ItineraryDisplayProps {
  itineraryData: GeneratedItinerary;
  sourceUrls: string[];
  userBudget: number; // New prop for total budget from user input
}

// Helper function to parse estimated cost strings into numbers
const parseCostToNumber = (costString: string): number => {
  // Remove currency symbols, commas, periods (if used as thousand separators), and then parse
  const numericString = costString.replace(/[^0-9,-]+/g, '')
                                 .replace(/\./g, '') // Remove dots (thousand separators)
                                 .replace(/,/g, ''); // Remove commas (decimal or thousand separators, if any remaining)
  const parsed = parseFloat(numericString);
  return isNaN(parsed) ? 0 : parsed;
};


const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ itineraryData, sourceUrls, userBudget }) => {
  // State to store user-entered actual costs
  const [activityActualCosts, setActivityActualCosts] = useState<Record<string, number | undefined>>(() => {
    const initialCosts: Record<string, number | undefined> = {};
    itineraryData.itinerary.forEach((day, dayIndex) => {
      day.activities.forEach((activity, activityIndex) => {
        initialCosts[`day-${dayIndex}-activity-${activityIndex}`] = activity.actualCost;
      });
    });
    return initialCosts;
  });

  // Effect to reinitialize actual costs if itineraryData changes (e.g., new itinerary generated)
  useEffect(() => {
    const newCosts: Record<string, number | undefined> = {};
    itineraryData.itinerary.forEach((day, dayIndex) => {
      day.activities.forEach((activity, activityIndex) => {
        const key = `day-${dayIndex}-activity-${activityIndex}`;
        newCosts[key] = activityActualCosts[key] || activity.actualCost; // Preserve existing input if key matches
      });
    });
    setActivityActualCosts(newCosts);
  }, [itineraryData]); // eslint-disable-line react-hooks/exhaustive-deps


  const handleActualCostChange = useCallback((
    dayIndex: number,
    activityIndex: number,
    value: string,
  ) => {
    const cost = value === '' ? undefined : parseFloat(value);
    setActivityActualCosts(prev => ({
      ...prev,
      [`day-${dayIndex}-activity-${activityIndex}`]: isNaN(cost as number) ? undefined : cost,
    }));
  }, []);

  // Calculate totals and budget summary
  const totalEstimatedCost = useMemo(() => {
    return itineraryData.itinerary.reduce((sum, day) => {
      return sum + day.activities.reduce((daySum, activity) => {
        return daySum + parseCostToNumber(activity.estimatedCost);
      }, 0);
    }, 0);
  }, [itineraryData]);

  const totalActualCost = useMemo(() => {
    // Fix: Explicitly type the reduce callback parameters to resolve 'unknown' type error.
    return Object.values(activityActualCosts).reduce((sum: number, cost: number | undefined) => {
      return sum + (cost || 0);
    }, 0);
  }, [activityActualCosts]);

  const durationDays = itineraryData.itinerary.length;
  const averageDailyBudget = userBudget / durationDays;
  const remainingBudget = userBudget - totalActualCost;
  const remainingAverageDailyBudget = remainingBudget / durationDays;

  // Format numbers to local currency (assuming IDR for now, can be dynamic)
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!itineraryData || !itineraryData.itinerary || itineraryData.itinerary.length === 0) {
    return (
      <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-600">
        <p>Tidak ada itinerary tersedia. Silakan coba buat satu.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Itinerary Perjalanan Anda</h2>

      {itineraryData.summary && (
        <div className="mb-8 p-4 bg-indigo-50 rounded-lg shadow-sm text-indigo-800 text-lg italic">
          <p>{itineraryData.summary}</p>
        </div>
      )}

      <div className="space-y-8">
        {itineraryData.itinerary.map((dayContent: ItineraryDayContent, dayIndex: number) => (
          <div key={dayContent.day} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-2xl font-bold text-indigo-700 mb-4">
              Hari {dayContent.day} - {dayContent.date}
            </h3>
            <div className="space-y-6">
              {dayContent.activities.map((activity: ItineraryActivity, activityIndex: number) => (
                <div key={`${dayIndex}-${activityIndex}`} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 text-sm font-semibold">
                      {activityIndex + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                      {activity.name}
                      {/* Globe Icon for real-time verification */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-label="Informasi diverifikasi real-time">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h2.5M21 11H9.5M17.5 4a2.5 2.5 0 00-2.5 2.5v10.5M4 7V4a2 2 0 012-2h4a2 2 0 012 2v3m0 0a2 2 0 002 2h7a2 2 0 002-2V7a2 2 0 00-2-2h-4a2 2 0 00-2 2z" />
                      </svg>
                    </h4>
                    {activity.description && (
                      <p className="text-gray-600 mt-1">{activity.description}</p>
                    )}
                    {activity.openingHours && (
                      <p className="text-gray-500 text-sm mt-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {activity.openingHours}
                      </p>
                    )}
                    <p className="text-gray-700 font-medium mt-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Est. Biaya: {activity.estimatedCost}
                    </p>
                    <div className="mt-2 flex items-center space-x-2">
                      <label htmlFor={`actualCost-${dayIndex}-${activityIndex}`} className="text-gray-700 text-sm">
                        Biaya Aktual:
                      </label>
                      <input
                        type="number"
                        id={`actualCost-${dayIndex}-${activityIndex}`}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        value={activityActualCosts[`day-${dayIndex}-activity-${activityIndex}`] || ''}
                        onChange={(e) => handleActualCostChange(dayIndex, activityIndex, e.target.value)}
                        min="0"
                        aria-label={`Biaya aktual untuk ${activity.name}`}
                      />
                    </div>
                    {activity.priceCheckLinkPlaceholder && (
                      <button
                        className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => alert('Ini adalah placeholder untuk cek harga.')}
                      >
                        {activity.priceCheckLinkPlaceholder}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Budget Summary Section */}
      <div className="mt-12 p-6 bg-blue-50 rounded-lg shadow-md border border-blue-200">
        <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Ringkasan Anggaran
        </h3>
        <div className="space-y-2 text-gray-700">
          <p className="flex justify-between items-center">
            <span className="font-medium">Anggaran Total Anda:</span>
            <span className="text-blue-700 font-semibold">{formatCurrency(userBudget)}</span>
          </p>
          <p className="flex justify-between items-center">
            <span className="font-medium">Total Estimasi Biaya Seluruh Perjalanan (Subtotal):</span>
            <span className="text-blue-700 font-semibold">{formatCurrency(totalEstimatedCost)}</span>
          </p>
          <p className="flex justify-between items-center">
            <span className="font-medium">Total Biaya Aktual (saat ini):</span>
            <span className="text-green-700 font-semibold">{formatCurrency(totalActualCost)}</span>
          </p>
          <p className="flex justify-between items-center border-t pt-2 mt-2 border-blue-100">
            <span className="font-medium">Anggaran Harian Rata-rata yang Direkomendasikan:</span>
            <span className="text-blue-600">{formatCurrency(averageDailyBudget)}</span>
          </p>
          <p className="flex justify-between items-center">
            <span className="font-medium">Sisa Anggaran Total:</span>
            <span className={remainingBudget >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
              {formatCurrency(remainingBudget)}
            </span>
          </p>
          <p className="flex justify-between items-center">
            <span className="font-medium">Sisa Anggaran Harian Rata-rata:</span>
            <span className={remainingAverageDailyBudget >= 0 ? "text-green-600" : "text-red-600"}>
              {formatCurrency(remainingAverageDailyBudget)}
            </span>
          </p>
        </div>
      </div>

      {sourceUrls.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Sumber Informasi:</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
            {sourceUrls.map((url, index) => (
              <li key={index}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export { ItineraryDisplay };