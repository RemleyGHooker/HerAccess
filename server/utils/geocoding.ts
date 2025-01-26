import axios from 'axios';
import type { NewFacility } from '@db/schema';

// Rate limiting helper with exponential backoff
const rateLimit = async (ms: number, retryCount = 0): Promise<void> => {
  const backoffTime = ms * Math.pow(2, retryCount);
  await new Promise(resolve => setTimeout(resolve, backoffTime));
};

interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

const geocodeCache = new Map<string, { lat: string; lon: string }>();

export async function geocodeAddress(address: string, city: string, state: string, retryCount = 0): Promise<{ lat: string; lon: string }> {
  const MAX_RETRIES = 3;
  const cacheKey = `${address}, ${city}, ${state}`;

  // Check cache first
  const cached = geocodeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Rate limit with exponential backoff
    await rateLimit(1000, retryCount);

    const searchQuery = encodeURIComponent(`${address}, ${city}, ${state}`);
    const response = await axios.get<GeocodingResult[]>(
      `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=1`,
      {
        headers: {
          'User-Agent': 'HealthcareFinder/1.0'
        }
      }
    );

    if (response.data && response.data.length > 0) {
      const result = {
        lat: response.data[0].lat,
        lon: response.data[0].lon
      };

      // Cache the result
      geocodeCache.set(cacheKey, result);

      return result;
    }

    // If no results and we haven't exceeded retries, try again
    if (retryCount < MAX_RETRIES) {
      console.log(`No results found for ${cacheKey}, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
      return geocodeAddress(address, city, state, retryCount + 1);
    }

    // Fallback coordinates (center of the state)
    const stateCoordinates: { [key: string]: { lat: string; lon: string } } = {
      'IN': { lat: '39.7684', lon: '-86.1581' }, // Indianapolis
      'IL': { lat: '39.7817', lon: '-89.6501' }, // Springfield
      'MI': { lat: '42.7325', lon: '-84.5555' }, // Lansing
      'OH': { lat: '39.9612', lon: '-82.9988' }, // Columbus
      'KY': { lat: '38.1867', lon: '-84.8753' }, // Frankfort
      'WI': { lat: '43.0731', lon: '-89.4012' }  // Madison
    };

    console.warn(`Geocoding failed for ${cacheKey}, using state center coordinates`);
    return stateCoordinates[state] || { lat: '0', lon: '0' };

  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`Geocoding error for ${cacheKey}, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
      return geocodeAddress(address, city, state, retryCount + 1);
    }

    console.error('Geocoding error:', error);
    throw new Error(`Failed to geocode address after ${MAX_RETRIES} retries: ${error}`);
  }
}

export async function enrichFacilityWithCoordinates(facility: Partial<NewFacility>): Promise<Partial<NewFacility>> {
  if (!facility.address || !facility.city || !facility.state) {
    throw new Error('Facility missing required address fields');
  }

  try {
    const { lat, lon } = await geocodeAddress(
      facility.address,
      facility.city,
      facility.state
    );

    return {
      ...facility,
      latitude: lat,
      longitude: lon
    };
  } catch (error) {
    console.error(`Failed to geocode facility at ${facility.address}, ${facility.city}, ${facility.state}:`, error);
    throw error;
  }
}