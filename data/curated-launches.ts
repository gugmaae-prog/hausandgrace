export type LaunchUnit = {
  residence: string;
  startingPrice: string;
  eoi?: string;
  size?: string;
};

export type CuratedLaunch = {
  slug: string;
  name: string;
  developer: string;
  developerDisplay: string;
  emirate: string;
  area: string;
  startingPrice: string;
  startingPriceLabel?: string;
  pricePerSqft?: number;
  paymentPlan: string;
  handover: string;
  image: string;
  brochure: string;
  bedrooms: string[];
  propertyTypes: string[];
  lifestyles: string[];
  coordinates: string;
  description: string;
  archived: boolean;
  sourceUpdatedAt: string;
  areaFrom?: string;
  statusLabel: string;
  releaseNote: string;
  unitPricing: LaunchUnit[];
  overview: string[];
  gallery: string[];
  interiors: string[];
  exteriors: string[];
  floorplans: string[];
  amenities: string[];
  investmentPoints: string[];
  travelTimes: { minutes: string; destination: string }[];
  sourceUrl: string;
  sourceLabel: string;
};

const ELLINGTON_MEDIA = "https://szr2.crimsoncapedigital.com/wp-content/uploads/2026/03";
const LINAR_MEDIA = "https://new-projects-media.propertyfinder.com/project/db8e847b-cc0c-4f2d-a981-593df806b2db";
const IMTIAZ_MEDIA = "https://new-projects-media.propertyfinder.com/project/eb66b831-979c-40fd-8021-5b7ba194b367";

export const curatedLaunches: CuratedLaunch[] = [
  {
    slug: "ellington-villa-townhouse-community-al-yalayis-dubai",
    name: "Ellington Villa & Townhouse Community",
    developer: "Ellington Properties",
    developerDisplay: "Ellington Properties",
    emirate: "Dubai",
    area: "Al Yalayis, Dubai",
    startingPrice: "2500000",
    startingPriceLabel: "Approx. AED 2,500,000",
    pricePerSqft: 1600,
    paymentPlan: "70/30",
    handover: "2030–2031",
    image: `${ELLINGTON_MEDIA}/Exterior-1-scaled.jpg`,
    brochure: "",
    bedrooms: ["2 Bedroom", "3 Bedroom", "4 Bedroom", "5 Bedroom"],
    propertyTypes: ["Townhouses", "Twin Villas", "Villas"],
    lifestyles: ["Family living", "Low-density living"],
    coordinates: "",
    description: "Ellington Properties’ first villa-and-townhouse master community brings a low-density collection of townhouses, twin villas and standalone villas to Dubai’s Al Yalayis corridor.",
    archived: false,
    sourceUpdatedAt: "2026-07-27T00:00:00.000Z",
    areaFrom: "1,900–4,800 sq ft",
    statusLabel: "Upcoming release",
    releaseNote: "The approximate AED 2.5 million entry point and AED 1,600 per square foot guidance are indicative pre-launch figures. The development name, inventory and final commercial terms remain subject to the official release.",
    unitPricing: [
      { residence: "2 Bedroom townhouse", startingPrice: "Approx. AED 2,500,000", size: "From approximately 1,900 sq ft" },
      { residence: "3 Bedroom townhouse", startingPrice: "On request", size: "Within the announced residence range" },
      { residence: "4 Bedroom townhouse", startingPrice: "On request", size: "Within the announced residence range" },
      { residence: "4 Bedroom twin villa", startingPrice: "On request", size: "Within the announced residence range" },
      { residence: "4–5 Bedroom standalone villa", startingPrice: "On request", size: "Up to approximately 4,800 sq ft" },
    ],
    overview: [
      "The announced residence mix spans two-, three- and four-bedroom townhouses, four-bedroom twin villas and four- to five-bedroom standalone villas. Indicative internal areas extend from approximately 1,900 to 4,800 square feet.",
      "Current pre-launch guidance indicates an entry point of approximately AED 2.5 million and pricing around AED 1,600 per square foot. The Al Yalayis position places the community near Town Square and Mira Oasis, with road access through Al Qudra Road and Emirates Road.",
    ],
    gallery: [
      `${ELLINGTON_MEDIA}/Exterior-1-scaled.jpg`,
      `${ELLINGTON_MEDIA}/Exterior-2-scaled.jpg`,
      `${ELLINGTON_MEDIA}/Exterior-3-scaled.jpg`,
      `${ELLINGTON_MEDIA}/Exterior-4-scaled.jpg`,
      `${ELLINGTON_MEDIA}/Interior-1-scaled.jpg`,
      `${ELLINGTON_MEDIA}/Interior-2-scaled.jpg`,
      `${ELLINGTON_MEDIA}/Interior-3-scaled.jpg`,
      `${ELLINGTON_MEDIA}/interior-4.jpg`,
    ],
    interiors: [
      `${ELLINGTON_MEDIA}/Interior-1-scaled.jpg`,
      `${ELLINGTON_MEDIA}/Interior-2-scaled.jpg`,
      `${ELLINGTON_MEDIA}/Interior-3-scaled.jpg`,
      `${ELLINGTON_MEDIA}/interior-4.jpg`,
    ],
    exteriors: [
      `${ELLINGTON_MEDIA}/Exterior-1-scaled.jpg`,
      `${ELLINGTON_MEDIA}/Exterior-2-scaled.jpg`,
      `${ELLINGTON_MEDIA}/Exterior-3-scaled.jpg`,
      `${ELLINGTON_MEDIA}/Exterior-4-scaled.jpg`,
    ],
    floorplans: [],
    amenities: ["Low-density master community", "Landscaped open space", "Road access to Al Qudra Road", "Road access to Emirates Road"],
    investmentPoints: [
      "Ellington’s first announced master community built around villas and townhouses.",
      "Indicative pricing around AED 1,600 per square foot creates a useful early benchmark, subject to final unit areas and launch inventory.",
      "A broad low-density residence mix supports both family end-user and long-hold investment briefs.",
      "The 70/30 structure stages most capital before handover; milestone dates require confirmation at launch.",
    ],
    travelTimes: [],
    sourceUrl: "https://szr2.crimsoncapedigital.com/",
    sourceLabel: "Published pre-launch information",
  },
  {
    slug: "linar-towers-d-e-al-mamzar-sharjah",
    name: "Linar Towers D & E",
    developer: "Alef Group",
    developerDisplay: "Alef Group",
    emirate: "Sharjah",
    area: "Al Mamzar, Sharjah",
    startingPrice: "945000",
    paymentPlan: "30/70",
    handover: "Q4 2030",
    image: `${LINAR_MEDIA}/gallery/image/kbP1yNXuC3QJJ4azQvBquoomh_xXTSUVNpj451hdXzc=/original.webp`,
    brochure: `${LINAR_MEDIA}/brochure/application/emaPmdSKpxy59RRvbz9zq-HeGsNgUB8LSJDNolVWWS0=/original.pdf`,
    bedrooms: ["1 Bedroom", "2 Bedroom", "3 Bedroom"],
    propertyTypes: ["Apartments"],
    lifestyles: ["Waterfront living", "Coastal community"],
    coordinates: "",
    description: "The Towers D & E release at Linar introduces one-, two- and three-bedroom waterfront residences in Al Mamzar, Sharjah, with a staged 30/70 payment structure.",
    archived: false,
    sourceUpdatedAt: "2026-07-27T00:00:00.000Z",
    statusLabel: "Upcoming release",
    releaseNote: "Starting prices, EOI acceptance, inventory and payment milestones remain subject to availability and final developer confirmation.",
    unitPricing: [
      { residence: "1 Bedroom", startingPrice: "AED 945,000", eoi: "AED 20,000" },
      { residence: "2 Bedroom", startingPrice: "AED 1,450,000", eoi: "AED 30,000" },
      { residence: "3 Bedroom", startingPrice: "AED 2,450,000", eoi: "AED 40,000" },
    ],
    overview: [
      "Linar is conceived as a high-rise waterfront address within Al Mamzar, with the Towers D & E release extending the project’s one-, two- and three-bedroom residence collection.",
      "The published 30/70 structure comprises a 10% down payment, 20% through quarterly construction instalments and 70% at handover. Each unit’s view, layout, floor, net area and final reservation documents should be compared before an EOI is placed.",
    ],
    gallery: [
      `${LINAR_MEDIA}/gallery/image/kbP1yNXuC3QJJ4azQvBquoomh_xXTSUVNpj451hdXzc=/original.webp`,
      `${LINAR_MEDIA}/gallery/image/iUxBvRNa66O11oElL51xSfiAUeimq93YKyAoU9CAK_U=/original.webp`,
      `${LINAR_MEDIA}/master_plan/image/3NxGTg5_ZZDDgPrmMhjAQsjitXaVct7htuSSRrr2wfI=/original.webp`,
    ],
    interiors: [],
    exteriors: [
      `${LINAR_MEDIA}/gallery/image/kbP1yNXuC3QJJ4azQvBquoomh_xXTSUVNpj451hdXzc=/original.webp`,
      `${LINAR_MEDIA}/gallery/image/iUxBvRNa66O11oElL51xSfiAUeimq93YKyAoU9CAK_U=/original.webp`,
    ],
    floorplans: [
      `${LINAR_MEDIA}/master_plan/image/3NxGTg5_ZZDDgPrmMhjAQsjitXaVct7htuSSRrr2wfI=/original.webp`,
    ],
    amenities: ["Waterfront setting", "Swimming pool", "Fitness facilities", "Landscaped gardens", "Children’s play areas", "Retail and dining"],
    investmentPoints: [
      "Waterfront positioning close to Dubai supports a cross-emirate end-user and investment brief.",
      "The release provides a clear bedroom-by-bedroom entry ladder from AED 945,000.",
      "A 70% handover balance concentrates the majority of capital at completion.",
    ],
    travelTimes: [],
    sourceUrl: "https://www.propertyfinder.ae/en/new-projects/alef-group/linar-by-alef",
    sourceLabel: "Published project information",
  },
  {
    slug: "imtiaz-dlrc-tower",
    name: "Imtiaz DLRC Tower",
    developer: "Imtiaz",
    developerDisplay: "Imtiaz Developments",
    emirate: "Dubai",
    area: "Dubai Land Residence Complex",
    startingPrice: "625000",
    paymentPlan: "20/40/40",
    handover: "Q2 2027",
    image: `${IMTIAZ_MEDIA}/gallery/image/8PVQcj5tKHQvQ0cO8EExp0XXs4pacjz3hTnvq472Tbk=/original.webp`,
    brochure: "",
    bedrooms: [],
    propertyTypes: ["Apartments"],
    lifestyles: ["Urban living", "Investment"],
    coordinates: "",
    description: "Imtiaz DLRC Tower is an upcoming freehold apartment development in Dubai Land Residence Complex, with a published AED 625,000 entry point and 20/40/40 payment plan.",
    archived: false,
    sourceUpdatedAt: "2026-07-27T00:00:00.000Z",
    statusLabel: "New launch",
    releaseNote: "The residence mix, individual unit areas, inventory and final specification are awaiting the complete official release and must be reconfirmed before reservation.",
    unitPricing: [
      { residence: "Apartment collection", startingPrice: "From AED 625,000", eoi: "On request" },
    ],
    overview: [
      "The project is positioned in Dubai Land Residence Complex as a freehold high-rise apartment address with landscaped surroundings and access to the district’s established schools, healthcare, retail and road connections.",
      "Published project information records a 20% down payment, 40% during construction and 40% at handover, with expected completion in June 2027. Unit configurations and size schedules remain to be released.",
    ],
    gallery: [
      `${IMTIAZ_MEDIA}/gallery/image/8PVQcj5tKHQvQ0cO8EExp0XXs4pacjz3hTnvq472Tbk=/original.webp`,
      `${IMTIAZ_MEDIA}/gallery/image/sbvHMIv-yBHPvz4-MHN2QkFiyChtxmgGMDbZCoJIr0g=/original.webp`,
    ],
    interiors: [],
    exteriors: [
      `${IMTIAZ_MEDIA}/gallery/image/8PVQcj5tKHQvQ0cO8EExp0XXs4pacjz3hTnvq472Tbk=/original.webp`,
      `${IMTIAZ_MEDIA}/gallery/image/sbvHMIv-yBHPvz4-MHN2QkFiyChtxmgGMDbZCoJIr0g=/original.webp`,
    ],
    floorplans: [],
    amenities: ["Community hall", "Gymnasium", "Landscaped parks", "Barbecue area", "Children’s play area", "Restaurants"],
    investmentPoints: [
      "A published AED 625,000 entry point places the launch within DLRC’s accessible apartment segment.",
      "The 20/40/40 schedule retains 40% of the purchase price for handover.",
      "DLRC combines freehold ownership with a growing residential inventory and access to Dubai’s arterial road network.",
    ],
    travelTimes: [],
    sourceUrl: "https://www.propertyfinder.ae/en/new-projects/imtiaz-developments/imtiaz-dlrc-tower",
    sourceLabel: "Published project information",
  },
];
