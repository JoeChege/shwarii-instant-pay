import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-image.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-gradient-hero">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Shwarii USSD payment technology"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-background/60" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
              USSD-Powered M-PESA Payments
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-heading text-5xl md:text-7xl font-bold leading-tight mb-6"
          >
            Dial. Confirm.{" "}
            <span className="text-gradient-primary">Done.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed"
          >
            Kenya's simplest way to collect M-PESA payments via USSD — no apps, no internet, no manual paybill entry. Just dial <span className="text-primary font-semibold">*566*2673#</span> and pay instantly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button variant="hero" size="xl">
              Request a Demo
            </Button>
            <Button variant="heroOutline" size="xl">
              Talk to Sales
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-12 flex items-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
              99.9% Uptime
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
              Works on any phone
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
              Instant confirmation
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
