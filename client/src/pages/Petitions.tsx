import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Petition } from "@db/schema";

export default function Petitions() {
  const { data: petitions, isLoading } = useQuery<Petition[]>({
    queryKey: ["/api/petitions"],
  });

  const categories = ["All", "Legislation", "Healthcare Access", "Education", "Rights"];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPetitions = petitions?.filter((petition) =>
    selectedCategory === "All" ? true : petition.category === selectedCategory
  );

  return (
    <div className="px-8 md:px-16 lg:px-24 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Take Action</h1>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading petitions...</div>
        ) : (
          <div className="grid gap-6">
            {filteredPetitions?.map((petition) => (
              <Card key={petition.id}>
                <CardHeader>
                  <CardTitle>{petition.title}</CardTitle>
                  <CardDescription>{petition.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{petition.description}</p>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {petition.deadline && (
                      <p>Deadline: {new Date(petition.deadline).toLocaleDateString()}</p>
                    )}
                  </div>
                  <Button asChild>
                    <a
                      href={petition.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Sign Petition
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}