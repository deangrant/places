import type { CategoryDefinition } from "@/types/places.types";

/**
 * Curated NAICS-inspired categories mapped to common OSM amenity/shop tags.
 */
export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: "coffee-shops",
    subCategory: "Coffee Shops",
    tags: [
      { key: "amenity", value: "cafe" },
      { key: "amenity", value: "coffee_shop" },
    ],
    topCategory: "Food Services",
  },
  {
    id: "full-service-restaurants",
    subCategory: "Full-Service Restaurants",
    tags: [{ key: "amenity", value: "restaurant" }],
    topCategory: "Food Services",
  },
  {
    id: "limited-service-restaurants",
    subCategory: "Limited-Service Restaurants",
    tags: [
      { key: "amenity", value: "fast_food" },
      { key: "amenity", value: "food_court" },
    ],
    topCategory: "Food Services",
  },
  {
    id: "bars-and-pubs",
    subCategory: "Bars and Pubs",
    tags: [
      { key: "amenity", value: "bar" },
      { key: "amenity", value: "pub" },
      { key: "amenity", value: "biergarten" },
    ],
    topCategory: "Food Services",
  },
  {
    id: "grocery-stores",
    subCategory: "Grocery Stores",
    tags: [
      { key: "shop", value: "supermarket" },
      { key: "shop", value: "convenience" },
      { key: "shop", value: "greengrocer" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "pharmacies",
    subCategory: "Pharmacies and Drug Stores",
    tags: [
      { key: "amenity", value: "pharmacy" },
      { key: "shop", value: "chemist" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "clothing-stores",
    subCategory: "Clothing Stores",
    tags: [
      { key: "shop", value: "clothes" },
      { key: "shop", value: "fashion" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "electronics-stores",
    subCategory: "Electronics and Appliance Stores",
    tags: [
      { key: "shop", value: "electronics" },
      { key: "shop", value: "computer" },
      { key: "shop", value: "mobile_phone" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "gasoline-stations",
    subCategory: "Gasoline Stations",
    tags: [{ key: "amenity", value: "fuel" }],
    topCategory: "Retail Trade",
  },
  {
    id: "hotels",
    subCategory: "Hotels and Motels",
    tags: [
      { key: "tourism", value: "hotel" },
      { key: "tourism", value: "motel" },
      { key: "tourism", value: "guest_house" },
    ],
    topCategory: "Accommodation",
  },
  {
    id: "banks",
    subCategory: "Commercial Banking",
    tags: [
      { key: "amenity", value: "bank" },
      { key: "amenity", value: "atm" },
    ],
    topCategory: "Finance",
  },
  {
    id: "hospitals",
    subCategory: "Hospitals",
    tags: [
      { key: "amenity", value: "hospital" },
      { key: "amenity", value: "clinic" },
    ],
    topCategory: "Health Care",
  },
  {
    id: "dentists",
    subCategory: "Offices of Dentists",
    tags: [{ key: "amenity", value: "dentist" }],
    topCategory: "Health Care",
  },
  {
    id: "fitness",
    subCategory: "Fitness and Recreational Sports Centers",
    tags: [
      { key: "leisure", value: "fitness_centre" },
      { key: "leisure", value: "sports_centre" },
    ],
    topCategory: "Arts and Recreation",
  },
  {
    id: "museums",
    subCategory: "Museums",
    tags: [{ key: "tourism", value: "museum" }],
    topCategory: "Arts and Recreation",
  },
  {
    id: "libraries",
    subCategory: "Libraries",
    tags: [{ key: "amenity", value: "library" }],
    topCategory: "Educational Services",
  },
  {
    id: "schools",
    subCategory: "Elementary and Secondary Schools",
    tags: [
      { key: "amenity", value: "school" },
      { key: "amenity", value: "kindergarten" },
    ],
    topCategory: "Educational Services",
  },
  {
    id: "universities",
    subCategory: "Colleges and Universities",
    tags: [
      { key: "amenity", value: "university" },
      { key: "amenity", value: "college" },
    ],
    topCategory: "Educational Services",
  },
  {
    id: "parking",
    subCategory: "Parking Lots and Garages",
    tags: [{ key: "amenity", value: "parking" }],
    topCategory: "Transportation",
  },
  {
    id: "transit-stations",
    subCategory: "Transit Stations",
    tags: [
      { key: "railway", value: "station" },
      { key: "public_transport", value: "station" },
      { key: "highway", value: "bus_stop" },
    ],
    topCategory: "Transportation",
  },
  {
    id: "airports",
    subCategory: "Airports",
    tags: [
      { key: "aeroway", value: "aerodrome" },
      { key: "aeroway", value: "terminal" },
    ],
    topCategory: "Transportation",
  },
  {
    id: "parks",
    subCategory: "Parks",
    tags: [
      { key: "leisure", value: "park" },
      { key: "leisure", value: "garden" },
    ],
    topCategory: "Arts and Recreation",
  },
  {
    id: "places-of-worship",
    subCategory: "Religious Organizations",
    tags: [{ key: "amenity", value: "place_of_worship" }],
    topCategory: "Other Services",
  },
  {
    id: "post-offices",
    subCategory: "Postal Service",
    tags: [{ key: "amenity", value: "post_office" }],
    topCategory: "Other Services",
  },
  {
    id: "hair-salons",
    subCategory: "Hair Care Services",
    tags: [
      { key: "shop", value: "hairdresser" },
      { key: "shop", value: "beauty" },
    ],
    topCategory: "Other Services",
  },
];

/** ISO 3166-1 alpha-2 countries commonly used in Places filters. */
export const COUNTRY_OPTIONS: { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "AU", name: "Australia" },
  { code: "NL", name: "Netherlands" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "IN", name: "India" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "PL", name: "Poland" },
  { code: "IE", name: "Ireland" },
  { code: "NZ", name: "New Zealand" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
];
