export interface TravelPreferences {
  destination: string;
  durationDays: number; // Changed from startDate/endDate
  budget: number; // Reintroduced budget
  interests: string;
  latitude?: number;  // Optional, for Maps grounding
  longitude?: number; // Optional, for Maps grounding
}

// New interfaces for structured itinerary output
export interface ItineraryActivity {
  name: string;
  description?: string;
  openingHours?: string; // e.g., "9 AM - 5 PM" or "Daily 24 hours"
  estimatedCost: string; // e.g., "IDR 50,000", "Rp 50.000"
  priceCheckLinkPlaceholder: string; // e.g., "Check Price"
  actualCost?: number; // New: User-inputted actual cost
}

export interface ItineraryDayContent {
  day: number;
  date: string; // Formatted date for the day, e.g., "2024-07-20"
  activities: ItineraryActivity[];
}

export interface GeneratedItinerary {
  itinerary: ItineraryDayContent[];
  summary?: string; // Optional overall summary of the trip
}

// Updated ItineraryResult to hold the parsed JSON object
export interface ItineraryResult {
  itineraryData: GeneratedItinerary;
  sourceUrls: string[];
}