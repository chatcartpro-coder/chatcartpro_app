export const VERTICALS = [
  "restaurant",
  "salon",
  "real_estate",
  "gym",
  "dental_clinic",
  "pharmacy",
  "auto_repair",
  "event_venue",
  "courier_logistics",
  "grocery_store",
  "laundry",
  "car_rental",
  "hospital_clinic",
  "other",
] as const;

export type Vertical = (typeof VERTICALS)[number];
