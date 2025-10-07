import { NavbarDemo } from "@/components/landing/header"
import { Hero } from "@/components/landing/hero"
import { ProblemSection } from "@/components/landing/problem-section"
// import { SolutionSection } from "@/components/landing/solution-section"
import { AgentsSection } from "@/components/landing/agents-section"
import { FeatureGridSection } from "@/components/landing/solution-section"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <NavbarDemo />
      <Hero />
      <ProblemSection />
      {/* <SolutionSection /> */}
      <FeatureGridSection />
      <AgentsSection />
      <Footer />
    </main>
  )
}
