import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import SolutionSection from "@/components/SolutionSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import UseCasesSection from "@/components/UseCasesSection";
import FeaturesSection from "@/components/FeaturesSection";
import SecuritySection from "@/components/SecuritySection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <UseCasesSection />
      <FeaturesSection />
      <SecuritySection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
