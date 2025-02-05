"use client";

import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CustomDatePickerProps {
  fieldTitle: string;
  nameInSchema: string;
  className?: string;
}

export function CustomDatePicker({
  fieldTitle,
  nameInSchema,
  className,
}: CustomDatePickerProps) {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name={nameInSchema}
      render={({ field }) => (
        <FormItem className={cn("flex flex-col", className)}>
          <FormLabel>{fieldTitle}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full max-w-xl h-12 justify-start text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? (
                    format(field.value, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                initialFocus
                captionLayout="dropdown"
                fromYear={new Date().getFullYear()}
                toYear={new Date().getFullYear() + 5}
                classNames={{
                  day_hidden: "invisible",
                  dropdown:
                    "px-2 py-1.5 rounded-md bg-popover text-popover-foreground text-sm focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-none ring-offset-background",
                  caption_dropdowns: "flex gap-3",
                  vhidden: "hidden",
                  caption_label: "hidden",
                }}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
