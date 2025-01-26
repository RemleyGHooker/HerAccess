import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { facilities, laws, petitions, newsUpdates } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { enrichFacilityWithCoordinates } from "./utils/geocoding";
import type { NewFacility } from "@db/schema";
import { sql } from 'drizzle-orm';
import { Groq } from 'groq-sdk';

export function registerRoutes(app: Express): Server {
  // Facilities endpoints
  app.get("/api/facilities", async (_req, res) => {
    try {
      const result = await db.select().from(facilities);
      res.json(result);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ error: "Failed to fetch facilities" });
    }
  });

  app.get("/api/facilities/state/:state", async (req, res) => {
    try {
      const result = await db
        .select()
        .from(facilities)
        .where(eq(facilities.state, req.params.state));
      res.json(result);
    } catch (error) {
      console.error("Error fetching facilities for state:", error);
      res.status(500).json({ error: "Failed to fetch facilities for state" });
    }
  });

  app.post("/api/facilities/generate", async (req, res) => {
    try {
      if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY environment variable is not set");
      }

      const { state } = req.body;
      if (!state) {
        return res.status(400).json({ error: "State is required" });
      }

      console.log(`Starting facility generation for ${state}...`);

      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
      });

      // Enhanced prompt for more realistic facility data
      const prompt = `Generate a detailed JSON array of 40 women's health facilities in ${state} with realistic information. Include major cities and suburban areas. Each facility should have:

1. Real addresses in ${state} (use actual street names and cities)
2. Realistic phone numbers with correct area codes for ${state}
3. Diverse types of facilities:
   - Women's Health Centers
   - OB/GYN Clinics
   - Family Planning Centers
   - Reproductive Health Clinics
   - Community Health Centers

Each facility should follow this exact format:
{
  "name": "Facility Name",
  "facilityType": "Type",
  "address": "Full street address",
  "city": "City name",
  "state": "${state}",
  "zipCode": "ZIP code",
  "phone": "Phone number",
  "website": "Website URL",
  "services": ["List of services"],
  "acceptsInsurance": true/false,
  "isVerified": true/false,
  "operatingHours": {
    "monday": "Hours",
    "tuesday": "Hours",
    "wednesday": "Hours",
    "thursday": "Hours",
    "friday": "Hours",
    "saturday": "Hours",
    "sunday": "Hours"
  },
  "languages": ["Languages offered"],
  "acceptedInsuranceProviders": ["Insurance providers"],
  "amenities": ["Available amenities"],
  "waitTime": "Typical wait time",
  "emergencyServices": true/false,
  "telehealth": true/false,
  "financialAssistance": ["Financial assistance options"]
}`;

      console.log(`Sending request to Groq API for ${state} facilities...`);

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a JSON generator for healthcare facility data. Return only valid JSON arrays with realistic, diverse facility information. Use real addresses and locations. No additional text or comments."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "mixtral-8x7b-32768",
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from Groq API");
      }

      console.log("Parsing Groq response...");
      let facilitiesData;
      try {
        facilitiesData = JSON.parse(response.trim());
        if (!Array.isArray(facilitiesData)) {
          // If the response is an object with a 'facilities' key, use that
          facilitiesData = facilitiesData.facilities || [facilitiesData];
        }
        if (!Array.isArray(facilitiesData)) {
          throw new Error("Response is not an array");
        }
      } catch (error: any) {
        console.error("Failed to parse Groq response:", error);
        throw new Error(`Invalid JSON response: ${error.message}`);
      }

      console.log(`Successfully parsed ${facilitiesData.length} facilities`);

      // Transform and geocode the facilities
      const transformedFacilities: NewFacility[] = await Promise.all(
        facilitiesData.map(async (facility: any, index: number) => {
          try {
            // Add delay between geocoding requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, index * 1000));

            console.log(`Geocoding facility ${index + 1}/${facilitiesData.length}: ${facility.name} at ${facility.address}, ${facility.city}, ${facility.state}`);

            const enriched = await enrichFacilityWithCoordinates({
              name: facility.name,
              facilityType: facility.facilityType,
              address: facility.address,
              city: facility.city,
              state: facility.state,
              zipCode: facility.zipCode,
              phone: facility.phone,
              website: facility.website,
              services: facility.services || [],
              acceptsInsurance: facility.acceptsInsurance || false,
              isVerified: facility.isVerified || false,
              operatingHours: facility.operatingHours || {},
              languages: facility.languages || [],
              acceptedInsuranceProviders: facility.acceptedInsuranceProviders || [],
              amenities: facility.amenities || [],
              waitTime: facility.waitTime || "",
              emergencyServices: facility.emergencyServices || false,
              telehealth: facility.telehealth || false,
              financialAssistance: facility.financialAssistance || []
            });

            return {
              ...enriched,
              createdAt: new Date(),
              updatedAt: new Date()
            } as NewFacility;
          } catch (error) {
            console.error(`Failed to geocode facility ${facility.name}:`, error);
            throw error;
          }
        })
      );

      // Store in database - using bulk insert
      await db.transaction(async (tx) => {
        // Delete existing facilities for the state
        await tx.delete(facilities).where(eq(facilities.state, state));

        // Insert all facilities at once
        await tx.insert(facilities).values(transformedFacilities);
      });

      res.json({
        message: `Successfully generated and stored ${transformedFacilities.length} facilities for ${state}`,
        count: transformedFacilities.length
      });

    } catch (error: any) {
      console.error("Error generating facilities:", error);
      res.status(500).json({
        error: "Failed to generate facilities",
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });


  app.get("/api/facilities/:id", async (req, res) => {
    try {
      const result = await db
        .select()
        .from(facilities)
        .where(eq(facilities.id, parseInt(req.params.id)));

      if (result.length === 0) {
        return res.status(404).json({ error: "Facility not found" });
      }

      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch facility" });
    }
  });

  // Laws endpoints
  app.get("/api/laws", async (_req, res) => {
    try {
      const result = await db.select().from(laws);
      res.json(result);    } catch (error) {
      res.status(500).json({ error: "Failed to fetch laws" });
    }
  });

  app.get("/api/laws/:state", async (req, res) => {
    try {
      const result = await db
        .select()
        .from(laws)
        .where(eq(laws.state, req.params.state));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch state laws" });
    }
  });

  // Petitions endpoints
  app.get("/api/petitions", async (_req, res) => {
    try {
      const result = await db
        .select()
        .from(petitions)
        .orderBy(desc(petitions.createdAt));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch petitions" });
    }
  });

  // News endpoints
  app.get("/api/news/:state", async (req, res) => {
    try {
      const result = await db
        .select()
        .from(newsUpdates)
        .where(eq(newsUpdates.state, req.params.state))
        .orderBy(desc(newsUpdates.publishedAt))
        .limit(20);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news updates" });
    }
  });

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY environment variable is not set");
      }

      const { message, previousMessages } = req.body;

      // Get nearby facilities for context
      const nearbyFacilities = await db.select().from(facilities);
      const facilityContext = nearbyFacilities
        .map(f =>
          `${f.name} in ${f.city}, ${f.state} - Services: ${Array.isArray(f.services) ? f.services.join(', ') : 'Services not specified'}`
        )
        .join('\n');

      // Get relevant laws for context
      const stateLaws = await db.select().from(laws).where(eq(laws.state, 'IN')).limit(3);
      const lawContext = stateLaws
        .map(l => `${l.title}: ${l.content}`)
        .join('\n');

      const chatContext = `You are a helpful assistant specializing in reproductive healthcare information for Indiana. Provide accurate, factual information about healthcare resources, legal rights, and support services. Always remain professional, empathetic, and informative.

Key points to remember:
- Focus on providing accurate information about reproductive healthcare access
- Include state-specific information when relevant
- Provide references to verified resources when possible
- Maintain a supportive and non-judgmental tone
- If unsure about specific medical advice, recommend consulting healthcare professionals

Available Healthcare Facilities:
${facilityContext}

Relevant Legal Information:
${lawContext}`;

      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
      });

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: chatContext
          },
          ...(previousMessages?.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          })) || []),
          {
            role: "user",
            content: message
          }
        ],
        model: "mixtral-8x7b-32768",
        temperature: 0.5,
        max_tokens: 1024,
      });

      res.json({ response: completion.choices[0]?.message?.content || "I apologize, but I couldn't process that request." });
    } catch (error) {
      console.error('Groq API Error:', error);
      res.status(500).json({ error: "Failed to get response from AI", details: error });
    }
  });

  app.post("/api/facilities/add-remaining-locations", async (_req, res) => {
    try {
      // Additional locations from the text file
      const additionalLocations = [
        {
          name: "Franciscan Health Women's Clinic",
          address: "3920 St Francis Way Suites 100 & 110",
          city: "Lafayette",
          state: "IN",
          zipCode: "47905",
          latitude: "40.3935",
          longitude: "-86.8350",
          type: "Women's Health Center",
          phone: "(765) 555-0400",
          website: "https://www.franciscanhealth.org",
          acceptsInsurance: true,
          isVerified: true,
          services: [
            "Women's Health",
            "Obstetrics",
            "Gynecology",
            "Prenatal Care",
            "Family Planning",
            "Reproductive Health"
          ],
          operatingHours: {
            monday: "8:00 AM - 5:00 PM",
            tuesday: "8:00 AM - 5:00 PM",
            wednesday: "8:00 AM - 5:00 PM",
            thursday: "8:00 AM - 5:00 PM",
            friday: "8:00 AM - 5:00 PM",
            saturday: "Closed",
            sunday: "Closed"
          },
          languages: ["English", "Spanish"],
          amenities: [
            "Wheelchair Accessible",
            "Free Parking",
            "On-site Lab Services"
          ],
          facilityType: "Women's Health Center",
          waitTime: "1-2 weeks",
          emergencyServices: true,
          telehealth: true,
          financialAssistance: ["Insurance", "Financial Assistance Program"],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Cass County Health Department",
          address: "1025 Michigan Ave #115",
          city: "Logansport",
          state: "IN",
          zipCode: "46947",
          latitude: "40.7545",
          longitude: "-86.3640",
          type: "Public Health Department",
          phone: "(574) 555-0500",
          website: "https://www.co.cass.in.us/health",
          acceptsInsurance: true,
          isVerified: true,
          services: [
            "STI Testing",
            "Family Planning",
            "Health Education",
            "Immunizations",
            "Pregnancy Testing"
          ],
          operatingHours: {
            monday: "8:00 AM - 4:30 PM",
            tuesday: "8:00 AM - 4:30 PM",
            wednesday: "8:00 AM - 4:30 PM",
            thursday: "8:00 AM - 4:30 PM",
            friday: "8:00 AM - 4:30 PM",
            saturday: "Closed",
            sunday: "Closed"
          },
          languages: ["English", "Spanish"],
          amenities: ["Wheelchair Accessible", "Public Transit Access"],
          facilityType: "Public Health",
          waitTime: "Walk-ins welcome",
          emergencyServices: false,
          telehealth: false,
          financialAssistance: ["Sliding Scale"],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Montgomery County Health Department",
          address: "407 E Market St #106",
          city: "Crawfordsville",
          state: "IN",
          zipCode: "47933",
          latitude: "40.0412",
          longitude: "-86.8995",
          type: "Public Health Department",
          phone: "(765) 555-0600",
          website: "https://www.montgomeryco.net/health",
          acceptsInsurance: true,
          isVerified: true,
          services: [
            "STI Testing",
            "Family Planning",
            "Health Education",
            "Reproductive Health Services",
            "Pregnancy Testing"
          ],
          operatingHours: {
            monday: "8:30 AM - 4:30 PM",
            tuesday: "8:30 AM - 4:30 PM",
            wednesday: "8:30 AM - 4:30 PM",
            thursday: "8:30 AM - 4:30 PM",
            friday: "8:30 AM - 4:30 PM",
            saturday: "Closed",
            sunday: "Closed"
          },
          languages: ["English"],
          amenities: ["Wheelchair Accessible"],
          facilityType: "Public Health",
          waitTime: "Walk-ins welcome",
          emergencyServices: false,
          telehealth: false,
          financialAssistance: ["Sliding Scale"],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Planned Parenthood - Crawfordsville",
          address: "1901 Lafayette Rd",
          city: "Crawfordsville",
          state: "IN",
          zipCode: "47933",
          latitude: "40.0280",
          longitude: "-86.8910",
          type: "Health Center",
          phone: "(765) 555-0700",
          website: "https://www.plannedparenthood.org",
          acceptsInsurance: true,
          isVerified: true,
          services: [
            "Birth Control",
            "STI Testing",
            "Cancer Screenings",
            "Pregnancy Testing",
            "Abortion Services",
            "Family Planning"
          ],
          operatingHours: {
            monday: "9:00 AM - 5:00 PM",
            tuesday: "9:00 AM - 5:00 PM",
            wednesday: "9:00 AM - 5:00 PM",
            thursday: "9:00 AM - 5:00 PM",
            friday: "9:00 AM - 5:00 PM",
            saturday: "Closed",
            sunday: "Closed"
          },
          languages: ["English", "Spanish"],
          amenities: ["Wheelchair Accessible", "Private Consultation Rooms"],
          facilityType: "Health Center",
          waitTime: "1-2 days",
          emergencyServices: false,
          telehealth: true,
          financialAssistance: ["Sliding Scale", "Financial Assistance Available"],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Purdue University Student Health Center",
          address: "601 Stadium Mall Dr",
          city: "West Lafayette",
          state: "IN",
          zipCode: "47907",
          latitude: "40.4274",
          longitude: "-86.9160",
          type: "Student Health Center",
          phone: "(765) 555-2000",
          website: "https://www.purdue.edu/push",
          acceptsInsurance: true,
          isVerified: true,
          services: [
            "Women's Health",
            "Sexual Health",
            "Birth Control",
            "STI Testing",
            "Health Education",
            "Mental Health Services",
            "Pregnancy Testing"
          ],
          operatingHours: {
            monday: "8:00 AM - 5:00 PM",
            tuesday: "8:00 AM - 5:00 PM",
            wednesday: "8:00 AM - 5:00 PM",
            thursday: "8:00 AM - 5:00 PM",
            friday: "8:00 AM - 5:00 PM",
            saturday: "Closed",
            sunday: "Closed"
          },
          languages: ["English", "Spanish", "Mandarin"],
          amenities: [
            "Wheelchair Accessible", 
            "Public Transit Access",
            "Student-Focused Care",
            "On-site Laboratory"
          ],
          facilityType: "Student Health Center",
          waitTime: "Same day appointments available",
          emergencyServices: true,
          telehealth: true,
          financialAssistance: ["Student Insurance", "Financial Assistance Available"],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await db.insert(facilities).values(additionalLocations);

      res.json({
        message: `Successfully added ${additionalLocations.length} additional facilities`,
        count: additionalLocations.length
      });
    } catch (error: any) {
      console.error("Error adding additional facilities:", error);
      res.status(500).json({
        error: "Failed to add additional facilities",
        details: error.message
      });
    }
  });

  app.post("/api/facilities/add-illinois-locations", async (_req, res) => {
    try {
      const illinoisLocations = [
        {
          name: "Planned Parenthood - Champaign Health Center",
          address: "302 E Stoughton St Suite #2",
          city: "Champaign",
          state: "IL",
          zipCode: "61820",
          latitude: "40.1164",
          longitude: "-88.2350",
          type: "Health Center",
          phone: "(217) 555-0100",
          website: "https://www.plannedparenthood.org",
          acceptsInsurance: true,
          isVerified: true,
          services: [
            "Birth Control",
            "STI Testing",
            "Cancer Screenings",
            "Pregnancy Testing",
            "Abortion Services",
            "Family Planning",
            "Reproductive Health"
          ],
          operatingHours: {
            monday: "9:00 AM - 5:00 PM",
            tuesday: "9:00 AM - 5:00 PM",
            wednesday: "9:00 AM - 5:00 PM",
            thursday: "9:00 AM - 5:00 PM",
            friday: "9:00 AM - 5:00 PM",
            saturday: "9:00 AM - 2:00 PM",
            sunday: "Closed"
          },
          languages: ["English", "Spanish"],
          amenities: [
            "Wheelchair Accessible",
            "Public Transit Access",
            "Private Consultation Rooms"
          ],
          facilityType: "Health Center",
          waitTime: "1-2 days",
          emergencyServices: true,
          telehealth: true,
          financialAssistance: ["Sliding Scale", "Financial Assistance Available"],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "McKinley Health Center",
          address: "1109 S Lincoln Ave 2nd Floor",
          city: "Urbana",
          state: "IL",
          zipCode: "61801",
          latitude: "40.1036",
          longitude: "-88.2194",
          type: "Student Health Center",
          phone: "(217) 555-0200",
          website: "https://www.mckinley.illinois.edu",
          acceptsInsurance: true,
          isVerified: true,
          services: [
            "Women's Health",
            "Sexual Health",
            "Birth Control",
            "STI Testing",
            "Health Education",
            "Mental Health Services",
            "Pregnancy Testing"
          ],
          operatingHours: {
            monday: "8:00 AM - 5:00 PM",
            tuesday: "8:00 AM - 5:00 PM",
            wednesday: "8:00 AM - 5:00 PM",
            thursday: "8:00 AM - 5:00 PM",
            friday: "8:00 AM - 5:00 PM",
            saturday: "Closed",
            sunday: "Closed"
          },
          languages: ["English", "Spanish", "Mandarin"],
          amenities: [
            "Wheelchair Accessible",
            "Public Transit Access",
            "Student-Focused Care",
            "On-site Laboratory"
          ],
          facilityType: "Student Health Center",
          waitTime: "Same day appointments available",
          emergencyServices: true,
          telehealth: true,
          financialAssistance: ["Student Insurance", "Financial Assistance Available"],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Carle Foundation Hospital Women's Health Institute",
          address: "1405 W Park St #302",
          city: "Urbana",
          state: "IL",
          zipCode: "61801",
          latitude: "40.1100",
          longitude: "-88.2200",
          type: "Women's Health Center",
          phone: "(217) 555-0300",
          website: "https://www.carle.org",
          acceptsInsurance: true,
          isVerified: true,
          services: [
            "Obstetrics",
            "Gynecology",
            "Prenatal Care",
            "Family Planning",
            "Reproductive Health",
            "Cancer Screenings",
            "Menopause Management"
          ],
          operatingHours: {
            monday: "8:00 AM - 5:00 PM",
            tuesday: "8:00 AM - 5:00 PM",
            wednesday: "8:00 AM - 5:00 PM",
            thursday: "8:00 AM - 5:00 PM",
            friday: "8:00 AM - 5:00 PM",
            saturday: "Closed",
            sunday: "Closed"
          },
          languages: ["English", "Spanish"],
          amenities: [
            "Wheelchair Accessible",
            "Free Parking",
            "On-site Lab Services",
            "Advanced Imaging Center"
          ],
          facilityType: "Women's Health Center",
          waitTime: "1-2 weeks for non-urgent appointments",
          emergencyServices: false,
          telehealth: true,
          financialAssistance: ["Insurance", "Financial Assistance Program"],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Promise Healthcare Women's Health",
          address: "819 Bloomington Rd",
          city: "Champaign",
          state: "IL",
          zipCode: "61820",
          latitude: "40.1260",
          longitude: "-88.2450",
          type: "Community Health Center",
          phone: "(217) 555-0400",
          website: "https://www.promisehealth.org",
          acceptsInsurance: true,
          isVerified: true,
          services: [
            "Women's Health",
            "Family Planning",
            "Pregnancy Care",
            "STI Testing",
            "Birth Control",
            "Health Education"
          ],
          operatingHours: {
            monday: "8:00 AM - 5:00 PM",
            tuesday: "8:00 AM - 5:00 PM",
            wednesday: "8:00 AM - 7:00 PM",
            thursday: "8:00 AM - 5:00 PM",
            friday: "8:00 AM - 5:00 PM",
            saturday: "9:00 AM - 1:00 PM",
            sunday: "Closed"
          },
          languages: ["English", "Spanish", "French"],
          amenities: [
            "Wheelchair Accessible",
            "Public Transit Access",
            "Free Parking"
          ],
          facilityType: "Community Health Center",
          waitTime: "1-3 days",
          emergencyServices: false,
          telehealth: true,
          financialAssistance: ["Sliding Scale", "No one turned away for inability to pay"],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Women's Health Practice",
          address: "2111 W Park Ct",
          city: "Champaign",
          state: "IL",
          zipCode: "61821",
          latitude: "40.1160",
          longitude: "-88.2690",
          type: "OB/GYN Center",
          phone: "(217) 555-0500",
          website: "https://www.womenshealthpractice.com",
          acceptsInsurance: true,
          isVerified: true,
          services: [
            "Obstetrics",
            "Gynecology",
            "Fertility Services",
            "Family Planning",
            "Reproductive Health",
            "Menopause Care"
          ],
          operatingHours: {
            monday: "8:30 AM - 4:30 PM",
            tuesday: "8:30 AM - 4:30 PM",
            wednesday: "8:30 AM - 4:30 PM",
            thursday: "8:30 AM - 4:30 PM",
            friday: "8:30 AM - 3:30 PM",
            saturday: "Closed",
            sunday: "Closed"
          },
          languages: ["English", "Spanish"],
          amenities: [
            "Wheelchair Accessible",
            "Free Parking",
            "Private Consultation Rooms"
          ],
          facilityType: "OB/GYN Center",
          waitTime: "1-2 weeks",
          emergencyServices: false,
          telehealth: true,
          financialAssistance: ["Insurance", "Payment Plans"],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await db.insert(facilities).values(illinoisLocations);

      res.json({
        message: `Successfully added ${illinoisLocations.length} Illinois facilities`,
        count: illinoisLocations.length
      });
    } catch (error: any) {
      console.error("Error adding Illinois facilities:", error);
      res.status(500).json({
        error: "Failed to add Illinois facilities",
        details: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}