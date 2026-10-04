// Corrections verified against the existing project descriptions during the public audit.
export const correctedDevelopers: Record<string, string> = {
  "eden-house-by-hh-development-in-jumeirah-dubai": "H&H Development",
  "399-hills-park-apartments-for-sale-in-dubai-by-national-bonds": "National Properties",
  "al-barari-chorisia-villas-for-sale-in-dubai": "Al Barari",
  "al-barari-ixora-villas-for-sale-in-dubai": "Al Barari",
  "al-barari-lunaria-villas-for-sale-in-dubai": "Al Barari",
  "al-barari-seventh-heaven-for-sale-in-dubai": "Al Barari",
  "al-ghadeer-gardens-new-release-aldar-seih-sedeirah-abu-dhabi": "Aldar",
  "the-st-regis-residences-financial-center-road-dubai-for-sale": "Developer to confirm",
  "district-one-buildings-for-sale-in-dubai": "Meydan & Sobha",
  "district-one-d1-residences-for-sale-mbr-city-dubai": "Sobha",
  "g-co-elie-saab-a-vie-townhouses-for-sale-in-meydan-dubai": "G&CO",
  "g-co-elie-saab-townhouses-in-meydan-mbr-city-dubai": "G&CO",
  "g-co-senses-townhouses-at-the-fields-mbr-city-meydan-dubai": "G&CO",
  "new-project-on-al-maryah-island-abu-dhabi": "Developer to confirm",
  "one-zabeel-apartments-for-sale-by-ithra-dubai": "Ithra Dubai",
  "dubai-properties-serena-townhouses": "Dubai Properties",
  "so-uptown-residences-dubai-for-sale-by-accor-hotels-and-dmcc": "DMCC",
  "the-gateway-porto-al-zorah-ajman-uae": "Al Zorah",
  "the-habitat-jvc-townhouses-for-sale-in-jumeirah-village-circle-dubai": "Radiant Star Developer",
  "the-paragon-by-igo-business-bay-dubai-apartments-for-sale": "Invest Group Overseas",
  "al-barari-the-reserve-villas-for-sale-in-dubai": "Al Barari",
  "the-ritz-carlton-residences-in-dubai-creekside-for-sale-by-mag": "MAG of Life",
  "w-residences-dubai": "Al Sharq Investment",
  "22-carat-villas-palm-jumeirah": "Forum Group"
};
export const unavailableBrochureSlugs = new Set([
  "damac-cavalli-tower-apartments-for-sale-in-dubai-marina",
  "azizi-aura-downtown-jebel-ali-apartments-for-sale-in-dubai",
  "binghatti-platinum-in-dubai-silicon-oasis-apartments-for-sale",
  "emaar-anya-2-townhouses-in-arabian-ranches-3-dubai",
  "emaar-anya-townhouses-in-arabian-ranches-3-dubai-for-sale",
  "emaar-dubai-hills-views-villas-and-plots",
  "emaar-golf-grand-apartments-in-dubai-hills-estate-for-sale",
  "granada-villas-mina-by-rak-properties-ras-al-khaimah-uae",
  "nshama-noor-townhouses-for-sale-in-town-square-dubai",
  "oceano-al-marjan-island-in-ras-al-khaimah-uae-for-sale",
  "rak-properties-flamingo-villas-in-mina-for-sale-ras-al-khaimah-uae",
  "villa-plots-for-sale-in-sobha-hartland-dubai"
]);
export function correctImportedProject<T extends { slug: string; developer: string; brochure: string }>(project: T): T {
  return { ...project, developer: correctedDevelopers[project.slug] || project.developer,
    brochure: unavailableBrochureSlugs.has(project.slug) ? "" : project.brochure };
}
