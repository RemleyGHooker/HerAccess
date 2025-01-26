import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen px-8 md:px-16 lg:px-24 py-8">
      {/* Hero Section */}
      <section className="h-screen flex items-center justify-center">
        <div className="container max-w-[1200px] mx-auto flex items-center justify-center">
          <img
            src="/Untitled design (3).png"
            alt="Empowering women in Purdue and UIUC communities"
            className="max-h-[99vh] w-auto object-contain"
          />
        </div>
      </section>

      {/* Hide other sections initially */}
      <section className="hidden md:grid md:grid-cols-2 gap-6 max-w-[1200px] mx-auto">
        <Card className="bg-background/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <img
              src="/medical-care.png"
              alt="Medical professional with stethoscope"
              className="w-full h-96 object-cover object-center rounded-lg shadow-md mb-4"
            />
            <h2 className="text-xl font-semibold mb-2 text-pink-700">
              Find Care Providers
            </h2>
            <p className="text-gray-800">
              Locate verified healthcare providers in your area using our
              interactive map.
            </p>
            <Link
              href="/map"
              className="inline-block mt-4 text-pink-400 hover:text-pink-300"
            >
              Find Care Near You →
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <img
              src="/laws-banner.png"
              alt="Legal resources and law books"
              className="w-full h-96 object-cover object-center rounded-lg shadow-md mb-4"
            />
            <h2 className="text-xl font-semibold mb-2 text-pink-700">
              Learn About Your Rights
            </h2>
            <p className="text-gray-800">
              Stay informed about reproductive healthcare laws and updates in
              your state.
            </p>
            <Link
              href="/laws"
              className="inline-block mt-4 text-pink-400 hover:text-pink-300"
            >
              Learn More →
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}