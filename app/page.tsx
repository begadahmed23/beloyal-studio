import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import FAQ from "@/components/landing/FAQ";
import Contact from "@/components/landing/Contact";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <FAQ />
      <Contact />
      <Footer />
    </main>
  );
}