"use client";

import { spiritualCategories, type Category } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CategorySelectionProps {
  selectedCategories: Category[];
  onSelectionChange: (category: Category) => void;
}

export function CategorySelection({ selectedCategories, onSelectionChange }: CategorySelectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Seleção da Gira</CardTitle>
        <CardDescription>Marque as linhas de trabalho que estarão ativas hoje.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {spiritualCategories.map((category) => (
          <div key={category} className="flex items-center space-x-2">
            <Checkbox
              id={`category-${category}`}
              checked={selectedCategories.includes(category)}
              onCheckedChange={() => onSelectionChange(category)}
            />
            <Label htmlFor={`category-${category}`} className="font-normal cursor-pointer text-sm">
              {category}
            </Label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
