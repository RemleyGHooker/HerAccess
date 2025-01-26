import type { NewFacility, NewLaw } from '@db/schema';

export function getStaticFacilities(state: string): NewFacility[] {
  const facilities: Record<string, NewFacility[]> = {
    'IN': [
      {
        name: "Planned Parenthood - Georgetown Health Center",
        address: "8590 Georgetown Road",
        city: "Indianapolis",
        state: "IN",
        zipCode: "46268",
        latitude: "39.908760",
        longitude: "-86.258360",
        type: "general",
        phone: "(317) 872-5455",
        website: "https://www.plannedparenthood.org/health-center/indiana/indianapolis/46268/georgetown-health-center-2883-91810",
        acceptsInsurance: true,
        isVerified: true,
        services: [
          "Annual Exams",
          "Birth Control",
          "HIV Testing",
          "STD Testing & Treatment",
          "Pregnancy Testing",
          "Emergency Contraception",
          "HPV Vaccination"
        ],
        operatingHours: {
          monday: "9:00 AM - 5:00 PM",
          tuesday: "9:00 AM - 5:00 PM",
          wednesday: "11:00 AM - 7:00 PM",
          thursday: "9:00 AM - 5:00 PM",
          friday: "9:00 AM - 4:00 PM",
          saturday: "Closed",
          sunday: "Closed"
        }
      }
    ],
    'IL': [
      {
        name: "Planned Parenthood - Chicago",
        address: "1200 N LaSalle Dr",
        city: "Chicago",
        state: "IL",
        zipCode: "60610",
        latitude: "41.904530",
        longitude: "-87.631830",
        type: "general",
        phone: "(312) 573-7200",
        website: "https://www.plannedparenthood.org/health-center/illinois/chicago",
        acceptsInsurance: true,
        isVerified: true,
        services: [
          "Birth Control",
          "STD Testing",
          "STD Treatment",
          "Cancer Screenings",
          "Pregnancy Testing",
          "Emergency Contraception",
          "Abortion Services",
          "Well Woman Exams"
        ],
        operatingHours: {
          monday: "9:00 AM - 5:00 PM",
          tuesday: "9:00 AM - 5:00 PM",
          wednesday: "9:00 AM - 5:00 PM",
          thursday: "9:00 AM - 5:00 PM",
          friday: "9:00 AM - 5:00 PM",
          saturday: "8:00 AM - 2:00 PM",
          sunday: "Closed"
        }
      }
    ]
  };

  return facilities[state] || [];
}

export function getDefaultLaws(state: string): NewLaw[] {
  return [
    {
      state,
      title: "Women's Healthcare Rights Overview",
      content: `As of ${new Date().toLocaleDateString()}, women in ${state} have various healthcare rights and protections. The National Women's Law Center (nwlc.org) provides comprehensive information about healthcare rights and protections. For detailed state-specific information, visit your state's health department website.`,
      category: "General",
      source: "National Women's Law Center - nwlc.org/healthcare",
      effectiveDate: new Date(),
      lastUpdated: new Date()
    },
    {
      state,
      title: "Maternal Health Coverage",
      content: `${state} provides various maternal health services and protections. The American College of Obstetricians and Gynecologists (acog.org) provides evidence-based guidelines for maternal care. Kaiser Family Foundation (kff.org) offers detailed state-level analysis of maternal health policies and coverage options.`,
      category: "Maternal Health",
      source: "ACOG - acog.org/clinical/clinical-guidance, KFF - kff.org/womens-health-policy",
      effectiveDate: new Date(),
      lastUpdated: new Date()
    },
    {
      state,
      title: "Preventive Care Access",
      content: `Women in ${state} have access to various preventive care services. The Guttmacher Institute provides comprehensive analysis of state policies affecting reproductive healthcare access. For detailed information about preventive services coverage, visit healthcare.gov/preventive-care-women/.`,
      category: "Preventive Care",
      source: "Guttmacher Institute - guttmacher.org/state-policy",
      effectiveDate: new Date(),
      lastUpdated: new Date()
    },
    {
      state,
      title: "Workplace Rights and Accommodations",
      content: `${state} has specific laws protecting women's rights in the workplace. The National Partnership for Women & Families (nationalpartnership.org) provides detailed resources about workplace rights, including pregnancy accommodations and protection against discrimination.`,
      category: "Workplace Rights",
      source: "National Partnership for Women & Families - nationalpartnership.org/our-work/workplace",
      effectiveDate: new Date(),
      lastUpdated: new Date()
    }
  ];
}