import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import ResourceMap from "@/components/ResourceMap";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Facility } from "@db/schema";

export default function Map() {
  const [selectedState, setSelectedState] = useState<string>("IN");
  const [selectedService, setSelectedService] = useState<string>("all");
  const [radius, setRadius] = useState<number>(25);
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(true);
  const [filters, setFilters] = useState({
    acceptsInsurance: false,
    wheelchairAccessible: false,
    publicTransit: false,
    emergencyServices: false,
    telehealth: false,
    slidingScale: false,
    languageSpanish: false,
    abortionServices: false,
  });
  const { toast } = useToast();

  const { data: facilities, isLoading, refetch } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/facilities/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: selectedState }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate facilities");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully generated facility data",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate facility data",
        variant: "destructive",
      });
    },
  });

  const states = [
    { code: "IN", name: "Indiana" },
    { code: "IL", name: "Illinois" },
  ];

  const serviceOptions = [
    { value: "all", label: "All Services" },
    { value: "Birth Control", label: "Birth Control" },
    { value: "STI Testing", label: "STI Testing" },
    { value: "Cancer Screenings", label: "Cancer Screenings" },
    { value: "Pregnancy Testing", label: "Pregnancy Testing" },
    { value: "Abortion Services", label: "Abortion Services" },
    { value: "Family Planning", label: "Family Planning" },
    { value: "Gynecology", label: "Gynecology" },
    { value: "Obstetrics", label: "Obstetrics" },
    { value: "Reproductive Health", label: "Reproductive Health" },
    { value: "Mental Health Services", label: "Mental Health Services" },
  ];

  const filteredFacilities = facilities?.filter((facility) => {
    if (selectedService !== "all") {
      const facilityServices = Array.isArray(facility.services) ? facility.services : [];
      if (!facilityServices.includes(selectedService)) {
        return false;
      }
    }

    if (filters.acceptsInsurance && !facility.acceptsInsurance) return false;
    if (filters.wheelchairAccessible &&
        (!facility.amenities || !Array.isArray(facility.amenities) ||
         !facility.amenities.includes("Wheelchair Accessible"))) return false;
    if (filters.publicTransit &&
        (!facility.amenities || !Array.isArray(facility.amenities) ||
         !facility.amenities.includes("Public Transit Access"))) return false;
    if (filters.emergencyServices && !facility.emergencyServices) return false;
    if (filters.telehealth && !facility.telehealth) return false;
    if (filters.slidingScale &&
        (!facility.financialAssistance || !Array.isArray(facility.financialAssistance) ||
         !facility.financialAssistance.includes("Sliding Scale"))) return false;
    if (filters.languageSpanish &&
        (!facility.languages || !Array.isArray(facility.languages) ||
         !facility.languages.includes("Spanish"))) return false;
    if (filters.abortionServices &&
        (!facility.services || !Array.isArray(facility.services) ||
         !facility.services.includes("Abortion Services"))) return false;

    return true;
  }) || [];

  const getStateCenter = (stateCode: string) => {
    switch (stateCode) {
      case "IN":
        return { lat: 40.4237, lng: -86.9212 }; // Centered on Purdue (47907)
      case "IL":
        return { lat: 40.6331, lng: -89.3985 };
      default:
        return { lat: 40.4237, lng: -86.9212 }; // Default to Purdue
    }
  };

  return (
    <div className="px-4 md:px-6 bg-pink-50 min-h-screen">
      <div className="relative flex h-[calc(100vh-3rem)]">
        <div
          className={`absolute md:relative h-full bg-background border-r transition-all duration-300 z-10 ${
            isFiltersPanelOpen ? "w-[350px] translate-x-0" : "w-0 -translate-x-full md:translate-x-0 md:w-16"
          }`}
        >
          <button
            onClick={() => setIsFiltersPanelOpen(!isFiltersPanelOpen)}
            className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 bg-pink-600 text-white p-2 rounded-r-md"
          >
            {isFiltersPanelOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          <div className={`h-full overflow-y-auto ${isFiltersPanelOpen ? "p-4" : "hidden"}`}>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Find Healthcare Resources</h2>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select value={selectedState} onValueChange={setSelectedState}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Service</Label>
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Distance (miles): {radius}</Label>
                    <Slider
                      value={[radius]}
                      onValueChange={(value) => setRadius(value[0])}
                      min={5}
                      max={100}
                      step={5}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                  >
                    {generateMutation.isPending ? "Generating..." : "Generate Facilities"}
                  </Button>

                  <Accordion type="single" collapsible>
                    <AccordionItem value="filters">
                      <AccordionTrigger>Additional Filters</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="insurance"
                              checked={filters.acceptsInsurance}
                              onCheckedChange={(checked: boolean) =>
                                setFilters({ ...filters, acceptsInsurance: checked })
                              }
                            />
                            <label htmlFor="insurance">Accepts Insurance</label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="wheelchair"
                              checked={filters.wheelchairAccessible}
                              onCheckedChange={(checked: boolean) =>
                                setFilters({ ...filters, wheelchairAccessible: checked })
                              }
                            />
                            <label htmlFor="wheelchair">Wheelchair Accessible</label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="transit"
                              checked={filters.publicTransit}
                              onCheckedChange={(checked: boolean) =>
                                setFilters({ ...filters, publicTransit: checked })
                              }
                            />
                            <label htmlFor="transit">Public Transit Access</label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="emergency"
                              checked={filters.emergencyServices}
                              onCheckedChange={(checked: boolean) =>
                                setFilters({ ...filters, emergencyServices: checked })
                              }
                            />
                            <label htmlFor="emergency">Emergency Services</label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="telehealth"
                              checked={filters.telehealth}
                              onCheckedChange={(checked: boolean) =>
                                setFilters({ ...filters, telehealth: checked })
                              }
                            />
                            <label htmlFor="telehealth">Telehealth Available</label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="sliding-scale"
                              checked={filters.slidingScale}
                              onCheckedChange={(checked: boolean) =>
                                setFilters({ ...filters, slidingScale: checked })
                              }
                            />
                            <label htmlFor="sliding-scale">Sliding Scale Fees</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="spanish"
                              checked={filters.languageSpanish}
                              onCheckedChange={(checked: boolean) =>
                                setFilters({ ...filters, languageSpanish: checked })
                              }
                            />
                            <label htmlFor="spanish">Speaks Spanish</label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="abortion"
                              checked={filters.abortionServices}
                              onCheckedChange={(checked: boolean) =>
                                setFilters({ ...filters, abortionServices: checked })
                              }
                            />
                            <label htmlFor="abortion">Provides Abortion Services</label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              {filteredFacilities.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">
                    Found Facilities ({filteredFacilities.length})
                  </h3>
                  {filteredFacilities.map((facility) => (
                    <Card key={facility.id} className="p-4">
                      <h4 className="font-semibold">{facility.name}</h4>
                      <p className="text-sm text-gray-600">{facility.address}</p>
                      {Array.isArray(facility.services) && facility.services.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {facility.services.map((service, idx) => (
                            <Badge key={idx} className="text-xs bg-pink-100 hover:bg-pink-200 text-pink-900 border-pink-200">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 h-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center bg-background/50">
              <div className="animate-pulse">
                <div className="w-32 h-2 bg-muted rounded"></div>
              </div>
            </div>
          ) : (
            <ResourceMap
              facilities={filteredFacilities}
              radius={radius}
              center={getStateCenter(selectedState)}
            />
          )}
        </div>
      </div>
    </div>
  );
}