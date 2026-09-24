import { Footer, InternalHeader, PageIntro } from "@/components/Chrome";
import ProjectCatalogue from "@/components/ProjectCatalogue";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("UAE Properties", "Explore the complete HAUS & GRACE UAE development catalogue with project media, developer profiles and investment context.", "/properties");
type Props = { searchParams: Promise<{ q?: string; emirate?: string; developer?: string; type?: string }> };

export default async function PropertiesPage({ searchParams }: Props) {
  const filters = await searchParams;
  return <main><InternalHeader /><PageIntro kicker="UAE project catalogue" title={<>Every project,<br /><em>one investment index.</em></>} copy="Search the same complete UAE development catalogue used across the site, with project-specific details, media and purchase structure." /><ProjectCatalogue initial={{ query: filters.q, emirate: filters.emirate, developer: filters.developer, propertyType: filters.type }} /><Footer /></main>;
}
