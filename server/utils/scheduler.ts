import { scrapeFacilities, scrapeLaws } from './scraper';
import { scrapeNewsUpdates } from './news-scraper';
import { db } from '@db';
import { facilities, laws, newsUpdates } from '@db/schema';
import { eq, lt, and } from 'drizzle-orm';

const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;
const STATES = ['IN', 'IL'];

export async function startAutomaticScraping() {
  // Initial scrape on server start
  await scrapeAllStatesData();

  // Set up periodic scraping every 6 hours
  setInterval(scrapeAllStatesData, SIX_HOURS_IN_MS);
}

async function scrapeAllStatesData() {
  console.log('Starting automated scraping for all states:', new Date().toISOString());

  for (const state of STATES) {
    try {
      // Scrape facilities
      console.log(`Scraping facilities for ${state}`);
      const scrapedFacilities = await scrapeFacilities(state);
      console.log(`Found ${scrapedFacilities.length} facilities for ${state}`);

      if (scrapedFacilities.length > 0) {
        await db.transaction(async (tx) => {
          await tx.delete(facilities).where(eq(facilities.state, state));
          for (const facility of scrapedFacilities) {
            await tx.insert(facilities).values(facility);
          }
        });
        console.log(`Successfully updated facilities for ${state}`);
      }

      // Wait between facility and law scraping
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Scrape laws
      console.log(`Scraping laws for ${state}`);
      const scrapedLaws = await scrapeLaws(state);
      console.log(`Found ${scrapedLaws.length} laws for ${state}`);

      if (scrapedLaws.length > 0) {
        await db.transaction(async (tx) => {
          await tx.delete(laws).where(eq(laws.state, state));
          for (const law of scrapedLaws) {
            await tx.insert(laws).values(law);
          }
        });
        console.log(`Successfully updated laws for ${state}`);
      }

      // Scrape news updates
      console.log(`Scraping news updates for ${state}`);
      const scrapedNews = await scrapeNewsUpdates(state);
      console.log(`Found ${scrapedNews.length} news updates for ${state}`);

      if (scrapedNews.length > 0) {
        // Keep last 30 days of news
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        await db.transaction(async (tx) => {
          // Delete old news for this state
          await tx.delete(newsUpdates)
            .where(
              and(
                eq(newsUpdates.state, state),
                lt(newsUpdates.publishedAt, thirtyDaysAgo)
              )
            );

          // Insert new updates
          for (const update of scrapedNews) {
            await tx.insert(newsUpdates).values(update);
          }
        });
        console.log(`Successfully updated news for ${state}`);
      }

      // Wait between states
      await new Promise(resolve => setTimeout(resolve, 10000));

    } catch (error) {
      console.error(`Error scraping data for ${state}:`, error);
      // Continue with next state even if one fails
      continue;
    }
  }

  console.log('Completed automated scraping for all states:', new Date().toISOString());
}