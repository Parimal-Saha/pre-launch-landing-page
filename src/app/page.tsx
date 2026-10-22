import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Story } from "@/components/Story";
import { Collection } from "@/components/Collection";
import { Join } from "@/components/Join";
import { Referral } from "@/components/Referral";
import { LaunchBand } from "@/components/LaunchBand";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Marquee />
        <Join />
        <Collection />
        <Story />
        <Referral />
        <LaunchBand />
      </main>
      <Footer />
    </>
  );
}
