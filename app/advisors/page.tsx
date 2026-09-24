import Link from "@/components/SiteLink";
import { Footer, InternalHeader, PageIntro } from "@/components/Chrome";
import { propertyImages } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Our Advisors", "Connect with the right HAUS & GRACE property desk for UAE acquisition, investment and ownership advice.", "/advisors");

export default function AdvisorsPage() {
  const desks = [["Private Clients","Buying and selling considered homes","English · Arabic · Hindi",propertyImages.interior],["Off-Plan Advisory","Projects, payment plans and investment context","English · Arabic · Hindi",propertyImages.skyline],["Leasing & Landlords","Residential leasing and owner representation","English · Hindi · Urdu",propertyImages.home]];
  return <main><InternalHeader /><PageIntro kicker="Our advisors" title={<>Expertise,<br /><em>made personal.</em></>} copy="The live team directory will connect each verified advisor, language and BRN to their active listings." /><section className="advisor-grid section-pad">{desks.map(([name,role,languages,image]) => <article key={name}><img src={image} alt="" /><p className="eyebrow">{role}</p><h2>{name}</h2><p>{languages}</p><Link href="/contact" className="underlined">Speak to this desk</Link></article>)}</section><Footer /></main>;
}
