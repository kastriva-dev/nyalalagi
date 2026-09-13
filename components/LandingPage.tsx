import Hero from "@/components/Hero";
import Work from "@/components/Work";
import Services from "@/components/Services";
import Testimonials from "@/components/Testimonials";
import Stats from "@/components/Stats";
import Contact from "@/components/Contact";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Services />
      <Work />
      <Stats />
      <Testimonials />
      <Contact />
    </>
  );
}