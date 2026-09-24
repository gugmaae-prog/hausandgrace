import { Footer, InternalHeader, PageIntro } from "@/components/Chrome";
import ProjectCatalogue from "@/components/ProjectCatalogue";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("UAE Property Developments", "Explore every currently indexed UAE development through the HAUS & GRACE investment catalogue.", "/projects");
type Props = { searchParams: Promise<{ q?: string; emirate?: string; developer?: string; type?: string }> };
export default async function ProjectsPage({ searchParams }: Props) { const filters = await searchParams; return <main><InternalHeader /><PageIntro kicker="All seven emirates · Complete project index" title={<>UAE real estate,<br /><em>one investment view.</em></>} copy="Search every currently indexed UAE development by emirate, developer and residence type—then examine its media, purchase structure and investment case." /><ProjectCatalogue initial={{ query: filters.q, emirate: filters.emirate, developer: filters.developer, propertyType: filters.type }} /><Footer /></main>; }
