"use client";

import { spiritualCategories, type Category } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CategorySelectionProps {
  selectedCategories: Category[];
  onSelectionChange: (category: Category) => void;
}

export function CategorySelection({ selectedCategories, onSelectionChange }: CategorySelectionProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {spiritualCategories.map((category) => (
        <Label
          key={category}
          htmlFor={`category-${category}`}
          className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer [&:has([data-state=checked])]:bg-accent [&:has([data-state=checked])]:text-accent-foreground"
        >
          <Checkbox
            id={`category-${category}`}
            checked={selectedCategories.includes(category)}
            onCheckedChange={() => onSelectionChange(category)}
          />
          <span className="font-medium">
            {category}
          </span>
        </Label>
      ))}
    </div>
  );
}
