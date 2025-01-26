import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

const actionLinks = [
  {
    title: "Change.org - Abortion Rights",
    url: "https://www.change.org/t/abortion-rights",
    description: "Sign and support petitions focused on abortion rights"
  },
  {
    title: "Change.org - Women's Healthcare",
    url: "https://www.change.org/t/womens-healthcare-en-us",
    description: "Support petitions for women's healthcare initiatives"
  },
  {
    title: "Women's Health.gov",
    url: "https://womenshealth.gov/about-us/what-we-do/programs-and-activities",
    description: "Learn about federal women's health programs and activities"
  },
  {
    title: "Center for Reproductive Rights",
    url: "https://reproductiverights.org/get-involved/",
    description: "Get involved in reproductive rights advocacy"
  },
  {
    title: "Bravely Women's Health",
    url: "https://www.bravelywomenshealth.org/volunteer",
    description: "Volunteer opportunities with Bravely"
  },
  {
    title: "Women's Reproductive Rights Assistance Project",
    url: "https://wrrap.org/get-involved/volunteer/",
    description: "Support WRRAP through volunteering"
  },
  {
    title: "Planned Parenthood",
    url: "https://www.plannedparenthood.org/get-involved/jobs-and-volunteering/volunteer",
    description: "Volunteer with Planned Parenthood"
  },
  {
    title: "ACLU Reproductive Rights",
    url: "https://action.aclu.org/reproductive-rights",
    description: "Take action with ACLU for reproductive rights"
  }
];

export default function TakeAction() {
  return (
    <div className="px-8 md:px-16 lg:px-24 py-8">
      <div className="container mx-auto max-w-[1200px]">
        <h1 className="text-4xl font-bold mb-8 text-pink-700">Take Action</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {actionLinks.map((link) => (
            <Card key={link.url} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-pink-700">
                  {link.title}
                  <ExternalLink className="h-4 w-4" />
                </CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-800 hover:text-pink-900 hover:underline"
                >
                  Visit Website
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}