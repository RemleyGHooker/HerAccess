import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Info, AlertCircle, Link as LinkIcon } from "lucide-react";
import type { Law, NewsUpdate } from "@db/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Laws() {
  const [selectedState, setSelectedState] = useState("IN");

  const { data: laws, isLoading: lawsLoading, error: lawsError } = useQuery<Law[]>({
    queryKey: ["/api/laws", selectedState],
    queryFn: async () => {
      const response = await fetch(`/api/laws/${selectedState}`);
      if (!response.ok) {
        throw new Error("Failed to fetch laws");
      }
      return response.json();
    }
  });

  const { data: newsUpdates, isLoading: newsLoading, error: newsError } = useQuery<NewsUpdate[]>({
    queryKey: ["/api/news", selectedState],
    queryFn: async () => {
      const response = await fetch(`/api/news/${selectedState}`);
      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }
      return response.json();
    }
  });

  const states = [
    { code: "IN", name: "Indiana" },
    { code: "IL", name: "Illinois" },
  ];

  const groupedLaws = laws?.reduce((acc, law) => {
    if (!acc[law.category]) {
      acc[law.category] = [];
    }
    acc[law.category].push(law);
    return acc;
  }, {} as Record<string, Law[]>);

  const error = lawsError || newsError;

  if (error) {
    return (
      <div className="mt-16 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load information. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-8 md:px-16 lg:px-24 py-8">
      <div className="container mx-auto space-y-6 max-w-[1200px]">
        <div>
          <h1 className="text-4xl font-bold text-pink-700">Legal Information & Updates</h1>
          <p className="text-lg text-gray-600 mt-2">
            Stay informed about reproductive healthcare laws and regulations in your state
          </p>
        </div>

        <Card className="bg-background/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Select Your State</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Tabs defaultValue="laws" className="space-y-4">
          <TabsList className="bg-background/60 backdrop-blur-sm">
            <TabsTrigger value="laws">Laws & Regulations</TabsTrigger>
            <TabsTrigger value="news">Recent Updates</TabsTrigger>
          </TabsList>

          <TabsContent value="laws">
            {lawsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <Card key={n}>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="h-4 bg-muted rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-4">
                {groupedLaws &&
                  Object.entries(groupedLaws).map(([category, categoryLaws]) => (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger className="text-lg px-6 py-4 bg-card hover:bg-accent rounded-lg">
                        <div className="flex items-center gap-2">
                          <span>{category}</span>
                          <Badge variant="secondary" className="ml-2">
                            {categoryLaws.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 p-4">
                          {categoryLaws.map((law) => (
                            <Card key={law.id} className="overflow-hidden">
                              <CardContent className="p-6">
                                <h3 className="text-xl font-semibold mb-3">
                                  {law.title}
                                </h3>
                                <div className="prose prose-sm max-w-none mb-4">
                                  <p className="text-gray-600">{law.content}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                  {law.effectiveDate && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      <span>
                                        Effective:{" "}
                                        {new Date(law.effectiveDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                  <Badge>{law.source}</Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>
            )}
          </TabsContent>

          <TabsContent value="news">
            {newsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <Card key={n}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-3" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-5/6" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : newsUpdates?.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Info className="h-4 w-4" />
                    <p>No recent updates available for this state.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {newsUpdates?.map((update) => (
                  <Card key={update.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">{update.title}</h3>
                          <p className="text-gray-600 mb-4">{update.content}</p>
                        </div>
                        <Badge variant="outline">{update.category}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span>{update.sourceName}</span>
                          <span>•</span>
                          <span>{new Date(update.publishedAt).toLocaleDateString()}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-2" asChild>
                          <a
                            href={update.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <LinkIcon className="h-4 w-4" />
                            Source
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="text-sm text-gray-500 italic mt-8">
          Note: This information is for reference only. Please consult with legal professionals for specific advice.
        </div>
      </div>
    </div>
  );
}