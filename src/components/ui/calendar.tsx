import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Custom caption component with year and month dropdowns
function CustomCaption({ displayMonth, onMonthChange }: { displayMonth: Date; onMonthChange?: (month: Date) => void }) {
  const currentYear = new Date().getFullYear();
  // Include 10 years into the future so users can schedule upcoming dates (e.g., campaigns, events).
  // DOB-style pickers should pass a `disabled` prop to block future selection.
  const years = Array.from({ length: 111 }, (_, i) => currentYear + 10 - i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="flex justify-center gap-2 mb-2">
      <Select
        value={displayMonth.getMonth().toString()}
        onValueChange={(value) => {
          const newDate = new Date(displayMonth);
          newDate.setMonth(parseInt(value));
          onMonthChange?.(newDate);
        }}
      >
        <SelectTrigger className="w-[130px] h-8">
          <SelectValue>{months[displayMonth.getMonth()]}</SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {months.map((month, index) => (
            <SelectItem key={month} value={index.toString()}>
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={displayMonth.getFullYear().toString()}
        onValueChange={(value) => {
          const newDate = new Date(displayMonth);
          newDate.setFullYear(parseInt(value));
          onMonthChange?.(newDate);
        }}
      >
        <SelectTrigger className="w-[100px] h-8">
          <SelectValue>{displayMonth.getFullYear()}</SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(props.month || new Date());

  React.useEffect(() => {
    if (props.month) {
      setMonth(props.month);
    }
  }, [props.month]);

  const handleMonthChange = (newMonth: Date) => {
    setMonth(newMonth);
    props.onMonthChange?.(newMonth);
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      month={month}
      onMonthChange={handleMonthChange}
      className={cn("p-3 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "hidden",
        nav: "hidden",
        nav_button: "hidden",
        nav_button_previous: "hidden",
        nav_button_next: "hidden",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        Caption: ({ displayMonth }) => (
          <CustomCaption displayMonth={displayMonth} onMonthChange={handleMonthChange} />
        ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
