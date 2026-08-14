import type { CategoryDefinition } from "@/types/places.types";

/**
 * Strong v1 curated NAICS-inspired categories mapped to high-frequency OSM tags.
 * Each key=value predicate appears in at most one category; search uses exact OR match.
 */
export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  // Food Services
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
    tags: [{ key: "amenity", value: "fast_food" }],
    topCategory: "Food Services",
  },
  {
    id: "food-courts",
    subCategory: "Food Courts",
    tags: [{ key: "amenity", value: "food_court" }],
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
    id: "bakeries",
    subCategory: "Bakeries",
    tags: [{ key: "shop", value: "bakery" }],
    topCategory: "Food Services",
  },
  {
    id: "ice-cream",
    subCategory: "Ice Cream and Frozen Desserts",
    tags: [
      { key: "amenity", value: "ice_cream" },
      { key: "shop", value: "ice_cream" },
    ],
    topCategory: "Food Services",
  },
  {
    id: "juice-bars",
    subCategory: "Juice Bars and Smoothies",
    tags: [{ key: "amenity", value: "juice_bar" }],
    topCategory: "Food Services",
  },
  {
    id: "wineries-breweries",
    subCategory: "Wineries and Breweries",
    tags: [
      { key: "craft", value: "winery" },
      { key: "craft", value: "brewery" },
      { key: "craft", value: "distillery" },
    ],
    topCategory: "Food Services",
  },

  // Retail Trade
  {
    id: "grocery-stores",
    subCategory: "Grocery Stores",
    tags: [
      { key: "shop", value: "supermarket" },
      { key: "shop", value: "greengrocer" },
      { key: "shop", value: "grocery" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "convenience-stores",
    subCategory: "Convenience Stores",
    tags: [{ key: "shop", value: "convenience" }],
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
      { key: "shop", value: "boutique" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "shoe-stores",
    subCategory: "Shoe Stores",
    tags: [{ key: "shop", value: "shoes" }],
    topCategory: "Retail Trade",
  },
  {
    id: "electronics-stores",
    subCategory: "Electronics and Appliance Stores",
    tags: [
      { key: "shop", value: "electronics" },
      { key: "shop", value: "computer" },
      { key: "shop", value: "mobile_phone" },
      { key: "shop", value: "appliance" },
      { key: "shop", value: "hifi" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "bookstores",
    subCategory: "Book Stores",
    tags: [
      { key: "shop", value: "books" },
      { key: "shop", value: "stationery" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "hardware-stores",
    subCategory: "Hardware Stores",
    tags: [
      { key: "shop", value: "doityourself" },
      { key: "shop", value: "hardware" },
      { key: "shop", value: "paint" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "furniture-stores",
    subCategory: "Furniture Stores",
    tags: [
      { key: "shop", value: "furniture" },
      { key: "shop", value: "bed" },
      { key: "shop", value: "kitchen" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "alcohol-stores",
    subCategory: "Beer Wine and Liquor Stores",
    tags: [
      { key: "shop", value: "alcohol" },
      { key: "shop", value: "wine" },
      { key: "shop", value: "beverages" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "sporting-goods",
    subCategory: "Sporting Goods Stores",
    tags: [
      { key: "shop", value: "sports" },
      { key: "shop", value: "outdoor" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "jewelry-stores",
    subCategory: "Jewelry Stores",
    tags: [
      { key: "shop", value: "jewelry" },
      { key: "shop", value: "watches" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "florists",
    subCategory: "Florists",
    tags: [{ key: "shop", value: "florist" }],
    topCategory: "Retail Trade",
  },
  {
    id: "pet-stores",
    subCategory: "Pet and Pet Supplies Stores",
    tags: [
      { key: "shop", value: "pet" },
      { key: "shop", value: "pet_grooming" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "car-dealers",
    subCategory: "Automobile Dealers",
    tags: [
      { key: "shop", value: "car" },
      { key: "shop", value: "motorcycle" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "bicycle-shops",
    subCategory: "Bicycle Shops",
    tags: [{ key: "shop", value: "bicycle" }],
    topCategory: "Retail Trade",
  },
  {
    id: "department-stores",
    subCategory: "Department Stores",
    tags: [
      { key: "shop", value: "department_store" },
      { key: "shop", value: "mall" },
      { key: "shop", value: "variety_store" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "gift-shops",
    subCategory: "Gift Novelty and Souvenir Stores",
    tags: [
      { key: "shop", value: "gift" },
      { key: "shop", value: "souvenir" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "opticians",
    subCategory: "Optical Goods Stores",
    tags: [
      { key: "shop", value: "optician" },
      { key: "amenity", value: "optometrist" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "tobacco-shops",
    subCategory: "Tobacco Stores",
    tags: [
      { key: "shop", value: "tobacco" },
      { key: "shop", value: "e-cigarette" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "butchers",
    subCategory: "Meat Markets",
    tags: [
      { key: "shop", value: "butcher" },
      { key: "shop", value: "seafood" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "delis",
    subCategory: "Specialty Food Stores",
    tags: [
      { key: "shop", value: "deli" },
      { key: "shop", value: "cheese" },
      { key: "shop", value: "chocolate" },
      { key: "shop", value: "confectionery" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "second-hand",
    subCategory: "Used Merchandise Stores",
    tags: [
      { key: "shop", value: "second_hand" },
      { key: "shop", value: "charity" },
      { key: "shop", value: "antique" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "cosmetics-stores",
    subCategory: "Cosmetics Beauty Supply Stores",
    tags: [
      { key: "shop", value: "cosmetics" },
      { key: "shop", value: "perfume" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "toys-games",
    subCategory: "Hobby Toy and Game Stores",
    tags: [
      { key: "shop", value: "toys" },
      { key: "shop", value: "games" },
      { key: "shop", value: "video_games" },
      { key: "shop", value: "model" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "music-stores",
    subCategory: "Musical Instrument and Music Stores",
    tags: [
      { key: "shop", value: "music" },
      { key: "shop", value: "musical_instrument" },
      { key: "shop", value: "video" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "garden-centers",
    subCategory: "Nursery Garden and Farm Supply",
    tags: [
      { key: "shop", value: "garden_centre" },
      { key: "shop", value: "agrarian" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "newsagents",
    subCategory: "News Dealers and Newsstands",
    tags: [
      { key: "shop", value: "newsagent" },
      { key: "shop", value: "kiosk" },
      { key: "shop", value: "lottery" },
    ],
    topCategory: "Retail Trade",
  },
  {
    id: "marketplaces",
    subCategory: "Farmers Markets and Marketplaces",
    tags: [
      { key: "amenity", value: "marketplace" },
      { key: "amenity", value: "market" },
    ],
    topCategory: "Retail Trade",
  },

  // Accommodation
  {
    id: "hotels",
    subCategory: "Hotels and Motels",
    tags: [
      { key: "tourism", value: "hotel" },
      { key: "tourism", value: "motel" },
    ],
    topCategory: "Accommodation",
  },
  {
    id: "guest-houses",
    subCategory: "Guest Houses and B and Bs",
    tags: [
      { key: "tourism", value: "guest_house" },
      { key: "tourism", value: "chalet" },
    ],
    topCategory: "Accommodation",
  },
  {
    id: "hostels",
    subCategory: "Hostels",
    tags: [{ key: "tourism", value: "hostel" }],
    topCategory: "Accommodation",
  },
  {
    id: "vacation-rentals",
    subCategory: "Vacation Rentals and Apartments",
    tags: [
      { key: "tourism", value: "apartment" },
      { key: "tourism", value: "holiday_apartment" },
    ],
    topCategory: "Accommodation",
  },
  {
    id: "camping",
    subCategory: "RV Parks and Recreational Camps",
    tags: [
      { key: "tourism", value: "camp_site" },
      { key: "tourism", value: "caravan_site" },
    ],
    topCategory: "Accommodation",
  },

  // Finance
  {
    id: "banks",
    subCategory: "Commercial Banking",
    tags: [{ key: "amenity", value: "bank" }],
    topCategory: "Finance",
  },
  {
    id: "atms",
    subCategory: "Automated Teller Machines",
    tags: [{ key: "amenity", value: "atm" }],
    topCategory: "Finance",
  },
  {
    id: "currency-exchange",
    subCategory: "Currency Exchange",
    tags: [
      { key: "amenity", value: "bureau_de_change" },
      { key: "office", value: "financial" },
    ],
    topCategory: "Finance",
  },

  // Health Care
  {
    id: "hospitals",
    subCategory: "Hospitals",
    tags: [{ key: "amenity", value: "hospital" }],
    topCategory: "Health Care",
  },
  {
    id: "clinics",
    subCategory: "Medical Clinics and Doctors Offices",
    tags: [
      { key: "amenity", value: "clinic" },
      { key: "amenity", value: "doctors" },
      { key: "healthcare", value: "doctor" },
      { key: "healthcare", value: "clinic" },
    ],
    topCategory: "Health Care",
  },
  {
    id: "dentists",
    subCategory: "Offices of Dentists",
    tags: [
      { key: "amenity", value: "dentist" },
      { key: "healthcare", value: "dentist" },
    ],
    topCategory: "Health Care",
  },
  {
    id: "veterinarians",
    subCategory: "Veterinary Services",
    tags: [
      { key: "amenity", value: "veterinary" },
      { key: "healthcare", value: "veterinary" },
    ],
    topCategory: "Health Care",
  },
  {
    id: "physiotherapy",
    subCategory: "Physical Therapy and Rehabilitation",
    tags: [
      { key: "healthcare", value: "physiotherapist" },
      { key: "amenity", value: "physiotherapist" },
    ],
    topCategory: "Health Care",
  },
  {
    id: "alternative-medicine",
    subCategory: "Alternative Medicine Practitioners",
    tags: [
      { key: "healthcare", value: "alternative" },
      { key: "shop", value: "herbalist" },
    ],
    topCategory: "Health Care",
  },
  {
    id: "opticians-health",
    subCategory: "Optometrists and Hearing Aid Centers",
    tags: [
      { key: "healthcare", value: "optometrist" },
      { key: "healthcare", value: "audiologist" },
      { key: "healthcare", value: "podiatrist" },
    ],
    topCategory: "Health Care",
  },

  // Arts and Recreation
  {
    id: "parks",
    subCategory: "Parks",
    tags: [
      { key: "leisure", value: "park" },
      { key: "leisure", value: "garden" },
      { key: "leisure", value: "nature_reserve" },
    ],
    topCategory: "Arts and Recreation",
  },
  {
    id: "playgrounds",
    subCategory: "Playgrounds",
    tags: [{ key: "leisure", value: "playground" }],
    topCategory: "Arts and Recreation",
  },
  {
    id: "museums",
    subCategory: "Museums",
    tags: [
      { key: "tourism", value: "museum" },
      { key: "tourism", value: "gallery" },
    ],
    topCategory: "Arts and Recreation",
  },
  {
    id: "fitness",
    subCategory: "Fitness and Recreational Sports Centers",
    tags: [
      { key: "leisure", value: "fitness_centre" },
      { key: "leisure", value: "sports_centre" },
      { key: "leisure", value: "fitness_station" },
    ],
    topCategory: "Arts and Recreation",
  },
  {
    id: "cinemas",
    subCategory: "Motion Picture Theaters",
    tags: [{ key: "amenity", value: "cinema" }],
    topCategory: "Arts and Recreation",
  },
  {
    id: "theatres",
    subCategory: "Performing Arts Companies",
    tags: [
      { key: "amenity", value: "theatre" },
      { key: "amenity", value: "arts_centre" },
    ],
    topCategory: "Arts and Recreation",
  },
  {
    id: "stadiums",
    subCategory: "Sports Stadiums and Arenas",
    tags: [
      { key: "leisure", value: "stadium" },
      { key: "leisure", value: "pitch" },
      { key: "leisure", value: "track" },
    ],
    topCategory: "Arts and Recreation",
  },
  {
    id: "swimming",
    subCategory: "Swimming Pools",
    tags: [
      { key: "leisure", value: "swimming_pool" },
      { key: "leisure", value: "water_park" },
    ],
    topCategory: "Arts and Recreation",
  },
  {
    id: "nightlife",
    subCategory: "Nightclubs and Dance Halls",
    tags: [
      { key: "amenity", value: "nightclub" },
      { key: "leisure", value: "dance" },
    ],
    topCategory: "Arts and Recreation",
  },
  {
    id: "casinos",
    subCategory: "Casinos",
    tags: [
      { key: "amenity", value: "casino" },
      { key: "leisure", value: "bowling_alley" },
      { key: "amenity", value: "gambling" },
    ],
    topCategory: "Arts and Recreation",
  },

  // Educational Services
  {
    id: "schools",
    subCategory: "Elementary and Secondary Schools",
    tags: [{ key: "amenity", value: "school" }],
    topCategory: "Educational Services",
  },
  {
    id: "kindergartens",
    subCategory: "Child Day Care Services",
    tags: [
      { key: "amenity", value: "kindergarten" },
      { key: "amenity", value: "childcare" },
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
    id: "libraries",
    subCategory: "Libraries",
    tags: [{ key: "amenity", value: "library" }],
    topCategory: "Educational Services",
  },
  {
    id: "language-schools",
    subCategory: "Language and Exam Prep Schools",
    tags: [
      { key: "amenity", value: "language_school" },
      { key: "office", value: "educational_institution" },
    ],
    topCategory: "Educational Services",
  },
  {
    id: "music-schools",
    subCategory: "Fine Arts Schools",
    tags: [
      { key: "amenity", value: "music_school" },
      { key: "amenity", value: "dancing_school" },
    ],
    topCategory: "Educational Services",
  },

  // Transportation
  {
    id: "parking",
    subCategory: "Parking Lots and Garages",
    tags: [
      { key: "amenity", value: "parking" },
      { key: "amenity", value: "parking_entrance" },
    ],
    topCategory: "Transportation",
  },
  {
    id: "gasoline-stations",
    subCategory: "Gasoline Stations",
    tags: [{ key: "amenity", value: "fuel" }],
    topCategory: "Transportation",
  },
  {
    id: "charging-stations",
    subCategory: "Electric Vehicle Charging",
    tags: [{ key: "amenity", value: "charging_station" }],
    topCategory: "Transportation",
  },
  {
    id: "bus-stops",
    subCategory: "Bus Stops",
    tags: [
      { key: "highway", value: "bus_stop" },
      { key: "amenity", value: "bus_station" },
    ],
    topCategory: "Transportation",
  },
  {
    id: "transit-stations",
    subCategory: "Transit Stations",
    tags: [
      { key: "railway", value: "station" },
      { key: "railway", value: "halt" },
      { key: "public_transport", value: "station" },
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
    id: "bicycle-parking",
    subCategory: "Bicycle Parking and Sharing",
    tags: [
      { key: "amenity", value: "bicycle_parking" },
      { key: "amenity", value: "bicycle_rental" },
    ],
    topCategory: "Transportation",
  },
  {
    id: "taxi",
    subCategory: "Taxi Stands",
    tags: [{ key: "amenity", value: "taxi" }],
    topCategory: "Transportation",
  },
  {
    id: "ferry-terminals",
    subCategory: "Ferry Terminals",
    tags: [
      { key: "amenity", value: "ferry_terminal" },
      { key: "amenity", value: "boat_rental" },
    ],
    topCategory: "Transportation",
  },
  {
    id: "car-rental",
    subCategory: "Passenger Car Rental",
    tags: [
      { key: "amenity", value: "car_rental" },
      { key: "amenity", value: "car_sharing" },
    ],
    topCategory: "Transportation",
  },

  // Other Services
  {
    id: "places-of-worship",
    subCategory: "Religious Organizations",
    tags: [{ key: "amenity", value: "place_of_worship" }],
    topCategory: "Other Services",
  },
  {
    id: "post-offices",
    subCategory: "Postal Service",
    tags: [
      { key: "amenity", value: "post_office" },
      { key: "amenity", value: "post_box" },
    ],
    topCategory: "Other Services",
  },
  {
    id: "hair-salons",
    subCategory: "Hair Care Services",
    tags: [
      { key: "shop", value: "hairdresser" },
      { key: "shop", value: "beauty" },
      { key: "shop", value: "massage" },
    ],
    topCategory: "Other Services",
  },
  {
    id: "laundry",
    subCategory: "Drycleaning and Laundry Services",
    tags: [
      { key: "shop", value: "laundry" },
      { key: "shop", value: "dry_cleaning" },
      { key: "amenity", value: "washing_machine" },
    ],
    topCategory: "Other Services",
  },
  {
    id: "car-repair",
    subCategory: "Automotive Repair and Maintenance",
    tags: [
      { key: "shop", value: "car_repair" },
      { key: "shop", value: "car_parts" },
      { key: "amenity", value: "car_wash" },
      { key: "shop", value: "tyres" },
    ],
    topCategory: "Other Services",
  },
  {
    id: "funeral-services",
    subCategory: "Funeral Homes and Funeral Services",
    tags: [
      { key: "shop", value: "funeral_directors" },
      { key: "amenity", value: "crematorium" },
      { key: "landuse", value: "cemetery" },
    ],
    topCategory: "Other Services",
  },
  {
    id: "storage",
    subCategory: "Self-Storage Mini Warehouses",
    tags: [
      { key: "shop", value: "storage_rental" },
      { key: "amenity", value: "storage" },
    ],
    topCategory: "Other Services",
  },
  {
    id: "locksmiths",
    subCategory: "Locksmiths",
    tags: [
      { key: "craft", value: "locksmith" },
      { key: "shop", value: "locksmith" },
    ],
    topCategory: "Other Services",
  },
  {
    id: "photographers",
    subCategory: "Photographic Services",
    tags: [
      { key: "shop", value: "photo" },
      { key: "craft", value: "photographer" },
      { key: "office", value: "photographer" },
    ],
    topCategory: "Other Services",
  },
  {
    id: "tailors",
    subCategory: "Clothing Alterations and Tailors",
    tags: [
      { key: "craft", value: "tailor" },
      { key: "shop", value: "tailor" },
      { key: "craft", value: "dressmaker" },
    ],
    topCategory: "Other Services",
  },
  {
    id: "home-trades",
    subCategory: "Plumbing Electrical and Home Trades",
    tags: [
      { key: "craft", value: "plumber" },
      { key: "craft", value: "electrician" },
      { key: "craft", value: "carpenter" },
      { key: "craft", value: "painter" },
      { key: "shop", value: "trade" },
    ],
    topCategory: "Other Services",
  },
  {
    id: "toilets",
    subCategory: "Public Restrooms",
    tags: [{ key: "amenity", value: "toilets" }],
    topCategory: "Other Services",
  },
  {
    id: "recycling",
    subCategory: "Recycling and Waste Facilities",
    tags: [
      { key: "amenity", value: "recycling" },
      { key: "amenity", value: "waste_disposal" },
      { key: "amenity", value: "waste_basket" },
    ],
    topCategory: "Other Services",
  },
  {
    id: "baths-saunas",
    subCategory: "Bath Houses and Saunas",
    tags: [
      { key: "amenity", value: "public_bath" },
      { key: "leisure", value: "sauna" },
      { key: "amenity", value: "sauna" },
    ],
    topCategory: "Other Services",
  },

  // Professional Services
  {
    id: "lawyers",
    subCategory: "Offices of Lawyers",
    tags: [
      { key: "office", value: "lawyer" },
      { key: "office", value: "notary" },
    ],
    topCategory: "Professional Services",
  },
  {
    id: "accountants",
    subCategory: "Offices of Certified Public Accountants",
    tags: [
      { key: "office", value: "accountant" },
      { key: "office", value: "tax_advisor" },
    ],
    topCategory: "Professional Services",
  },
  {
    id: "estate-agents",
    subCategory: "Offices of Real Estate Agents",
    tags: [
      { key: "office", value: "estate_agent" },
      { key: "office", value: "property_management" },
    ],
    topCategory: "Professional Services",
  },
  {
    id: "insurance-agents",
    subCategory: "Insurance Agencies and Brokerages",
    tags: [
      { key: "office", value: "insurance" },
      { key: "shop", value: "insurance" },
    ],
    topCategory: "Professional Services",
  },
  {
    id: "consulting",
    subCategory: "Management Consulting Services",
    tags: [
      { key: "office", value: "consulting" },
      { key: "office", value: "company" },
      { key: "office", value: "it" },
    ],
    topCategory: "Professional Services",
  },
  {
    id: "architects",
    subCategory: "Architectural Services",
    tags: [
      { key: "office", value: "architect" },
      { key: "office", value: "engineer" },
    ],
    topCategory: "Professional Services",
  },
  {
    id: "advertising",
    subCategory: "Advertising Agencies",
    tags: [
      { key: "office", value: "advertising_agency" },
      { key: "office", value: "graphic_design" },
    ],
    topCategory: "Professional Services",
  },
  {
    id: "coworking",
    subCategory: "Coworking and Shared Offices",
    tags: [
      { key: "office", value: "coworking" },
      { key: "amenity", value: "coworking_space" },
    ],
    topCategory: "Professional Services",
  },
  {
    id: "travel-agencies",
    subCategory: "Travel Agencies",
    tags: [
      { key: "shop", value: "travel_agency" },
      { key: "office", value: "travel_agent" },
    ],
    topCategory: "Professional Services",
  },

  // Public Service
  {
    id: "police",
    subCategory: "Police Protection",
    tags: [{ key: "amenity", value: "police" }],
    topCategory: "Public Service",
  },
  {
    id: "fire-stations",
    subCategory: "Fire Protection",
    tags: [{ key: "amenity", value: "fire_station" }],
    topCategory: "Public Service",
  },
  {
    id: "townhalls",
    subCategory: "Executive Offices and Town Halls",
    tags: [
      { key: "amenity", value: "townhall" },
      { key: "office", value: "government" },
      { key: "office", value: "administrative" },
    ],
    topCategory: "Public Service",
  },
  {
    id: "courthouses",
    subCategory: "Courts of Law",
    tags: [{ key: "amenity", value: "courthouse" }],
    topCategory: "Public Service",
  },
  {
    id: "embassies",
    subCategory: "Embassies and Consulates",
    tags: [
      { key: "amenity", value: "embassy" },
      { key: "office", value: "diplomatic" },
    ],
    topCategory: "Public Service",
  },
  {
    id: "community-centres",
    subCategory: "Community Centers",
    tags: [
      { key: "amenity", value: "community_centre" },
      { key: "amenity", value: "social_facility" },
      { key: "amenity", value: "social_centre" },
    ],
    topCategory: "Public Service",
  },

  // Tourism
  {
    id: "tourist-attractions",
    subCategory: "Tourist Attractions",
    tags: [
      { key: "tourism", value: "attraction" },
      { key: "tourism", value: "yes" },
    ],
    topCategory: "Tourism",
  },
  {
    id: "viewpoints",
    subCategory: "Scenic and Sightseeing Viewpoints",
    tags: [{ key: "tourism", value: "viewpoint" }],
    topCategory: "Tourism",
  },
  {
    id: "zoos",
    subCategory: "Zoos and Botanical Gardens",
    tags: [
      { key: "tourism", value: "zoo" },
      { key: "tourism", value: "aquarium" },
    ],
    topCategory: "Tourism",
  },
  {
    id: "theme-parks",
    subCategory: "Amusement and Theme Parks",
    tags: [
      { key: "tourism", value: "theme_park" },
      { key: "leisure", value: "amusement_arcade" },
      { key: "leisure", value: "escape_game" },
    ],
    topCategory: "Tourism",
  },
  {
    id: "tourist-information",
    subCategory: "Tourist Information Centers",
    tags: [
      { key: "tourism", value: "information" },
      { key: "amenity", value: "tourist_info" },
    ],
    topCategory: "Tourism",
  },
  {
    id: "monuments",
    subCategory: "Historical Sites and Monuments",
    tags: [
      { key: "historic", value: "monument" },
      { key: "historic", value: "memorial" },
      { key: "historic", value: "castle" },
      { key: "tourism", value: "artwork" },
    ],
    topCategory: "Tourism",
  },
  {
    id: "beaches",
    subCategory: "Beaches",
    tags: [
      { key: "natural", value: "beach" },
      { key: "leisure", value: "beach_resort" },
    ],
    topCategory: "Tourism",
  },
];

/** Curated ISO 3166-1 alpha-2 countries for the Places country filter UI (not a full ISO set). */
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
