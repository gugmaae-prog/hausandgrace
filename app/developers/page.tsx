import { Footer, InternalHeader, PageIntro } from "@/components/Chrome";
import { DeveloperDirectory } from "@/components/DeveloperDirectory";
import { pageMetadata } from "@/lib/seo";
import { getDeveloperDirectory } from "@/lib/taxonomy";

export const metadata = pageMetadata("UAE Property Developers", "Explore structured UAE developer profiles and their indexed project pipelines.", "/developers");

export default function DevelopersPage() {
  const developers = getDeveloperDirectory();
  const directoryItems = developers.map(({ slug, name, image, activeProjects, emirates, communities, projects }) => ({ slug, name, image, activeProjects, emirates, communities, indexedProjects: projects.length }));
  return <main><InternalHeader /><PageIntro kicker="Developer intelligence" title={<>The people behind<br /><em>the pipeline.</em></>} copy={`Review ${developers.length} structured developer profiles across the UAE. Compare active projects, emirates, communities and residence types from one consistent source index.`} /><DeveloperDirectory developers={directoryItems} /><Footer /></main>;
}
