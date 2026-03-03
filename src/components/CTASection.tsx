import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6">
            Ready to simplify your <span className="text-gradient-primary">payments?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join hundreds of Kenyan businesses already collecting M-PESA payments the easy way. Get started in under 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl">
              Request a Demo
            </Button>
            <Button variant="heroOutline" size="xl">
              Talk to Sales
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
