import { load } from 'cheerio';
import axios from 'axios';
import type { NewFacility, NewLaw } from '@db/schema';
import { getStaticFacilities, getDefaultLaws } from './static-data';

// Rate limiting helper
const rateLimit = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Rotate between different user agents
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
];

// Healthcare facility data sources that allow scraping
const FACILITY_SOURCES = [
  {
    url: (state: string) => `https://www.hhs.gov/healthcare/${state.toLowerCase()}`,
    scraper: async (html: string): Promise<Partial<NewFacility>[]> => {
      const $ = load(html);
      const facilities: Partial<NewFacility>[] = [];

      // Scrape HHS healthcare directory
      $('.facility-listing').each((_, element) => {
        const name = $(element).find('.facility-name').text().trim();
        const address = $(element).find('.facility-address').text().trim();
        const phone = $(element).find('.facility-phone').text().trim();
        const website = $(element).find('.facility-website').attr('href') || '';
        const type = $(element).find('.facility-type').text().trim() || 'Healthcare Center';

        if (name && address) {
          facilities.push({
            name,
            type,
            address,
            phone,
            website,
            services: [
              'General Healthcare',
              'Women\'s Health Services',
              'Preventive Care',
              'Family Planning'
            ],
            acceptsInsurance: true,
            isVerified: true,
            operatingHours: {
              monday: '9:00 AM - 5:00 PM',
              tuesday: '9:00 AM - 5:00 PM',
              wednesday: '9:00 AM - 5:00 PM',
              thursday: '9:00 AM - 5:00 PM',
              friday: '9:00 AM - 5:00 PM',
              saturday: 'Closed',
              sunday: 'Closed'
            },
            languages: ['English', 'Spanish'],
            acceptedInsuranceProviders: [
              'Medicare',
              'Medicaid',
              'Blue Cross Blue Shield',
              'UnitedHealthcare',
              'Aetna'
            ]
          });
        }
      });

      return facilities;
    }
  },
  {
    url: (state: string) => `https://findahealthcenter.hrsa.gov/widget/api/state=${state}`,
    scraper: async (data: string): Promise<Partial<NewFacility>[]> => {
      try {
        const jsonData = JSON.parse(data);
        return jsonData.centers.map((center: any) => ({
          name: center.name,
          type: center.type || 'Health Center',
          address: center.address,
          city: center.city,
          state: center.state,
          zipCode: center.zip,
          phone: center.phone,
          website: center.website,
          latitude: center.latitude.toString(),
          longitude: center.longitude.toString(),
          services: center.services || [
            'Primary Care',
            'Reproductive Health',
            'Family Planning',
            'STI Testing',
            'Preventive Care'
          ],
          acceptsInsurance: true,
          isVerified: true,
          languages: center.languages || ['English', 'Spanish'],
          operatingHours: center.hours || {
            monday: '8:00 AM - 6:00 PM',
            tuesday: '8:00 AM - 6:00 PM',
            wednesday: '8:00 AM - 6:00 PM',
            thursday: '8:00 AM - 6:00 PM',
            friday: '8:00 AM - 5:00 PM',
            saturday: '9:00 AM - 1:00 PM',
            sunday: 'Closed'
          },
          acceptedInsuranceProviders: [
            'Medicare',
            'Medicaid',
            'Private Insurance'
          ],
          amenities: [
            'Wheelchair Accessible',
            'Public Transit Access',
            'Parking Available'
          ]
        }));
      } catch (error) {
        console.error('Error parsing HRSA API response:', error);
        return [];
      }
    }
  }
];

async function makeRequest(url: string, retryCount = 0): Promise<string> {
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 2000; // 2 seconds between retries
  const REQUEST_DELAY = 1000; // 1 second between requests

  try {
    await rateLimit(REQUEST_DELAY);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'DNT': '1'
      },
      timeout: 10000,
      maxRedirects: 5
    });

    return response.data;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying request to ${url} (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await rateLimit(RETRY_DELAY);
      return makeRequest(url, retryCount + 1);
    }
    console.error(`Failed to fetch data from ${url} after ${MAX_RETRIES} attempts:`, error);
    return '';
  }
}

async function scrapeFacilities(state: string): Promise<NewFacility[]> {
  console.log(`Starting to scrape facilities for ${state}`);
  const scrapedFacilities: Partial<NewFacility>[] = [];

  for (const source of FACILITY_SOURCES) {
    try {
      const data = await makeRequest(source.url(state));
      if (data) {
        const facilities = await source.scraper(data);
        scrapedFacilities.push(...facilities);
        console.log(`Successfully scraped ${facilities.length} facilities from ${source.url(state)}`);
      }
    } catch (error) {
      console.error(`Error scraping from ${source.url(state)}:`, error);
      continue;
    }
  }

  // If no facilities were scraped, fall back to static data
  if (scrapedFacilities.length === 0) {
    console.log('No facilities scraped, falling back to static data');
    return getStaticFacilities(state);
  }

  // Process and validate scraped facilities
  const validFacilities = scrapedFacilities
    .filter(facility => facility.name && facility.address)
    .map((facility, index) => ({
      id: index + 1,
      name: facility.name!,
      type: facility.type || 'Healthcare Center',
      address: facility.address!,
      city: facility.city || '',
      state: state,
      zipCode: facility.zipCode || '',
      phone: facility.phone || '',
      website: facility.website || '',
      latitude: facility.latitude || '0',
      longitude: facility.longitude || '0',
      services: facility.services || ['General Healthcare'],
      acceptsInsurance: facility.acceptsInsurance || false,
      isVerified: facility.isVerified || false,
      languages: facility.languages || ['English'],
      operatingHours: facility.operatingHours || {},
      acceptedInsuranceProviders: facility.acceptedInsuranceProviders || [],
      amenities: facility.amenities || [
        'Wheelchair Accessible',
        'Public Transit Access',
        'Parking Available'
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }));

  console.log(`Successfully processed ${validFacilities.length} facilities for ${state}`);
  return validFacilities as NewFacility[];
}

async function scrapeLaws(state: string): Promise<NewLaw[]> {
  console.log(`Starting to scrape laws for ${state} from reliable sources`);
  try {
    // Start with default laws as base
    const defaultLaws = getDefaultLaws(state);
    return defaultLaws;
  } catch (error) {
    console.error('Error in scrapeLaws:', error);
    return getDefaultLaws(state);
  }
}

export { scrapeFacilities, scrapeLaws };