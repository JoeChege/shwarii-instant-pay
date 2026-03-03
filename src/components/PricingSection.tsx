import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "For small businesses getting started",
    price: "Free",
    sub: "to get started",
    features: ["Up to 100 transactions/month", "Basic dashboard", "Email support", "Single shortcode"],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Growth",
    description: "For scaling businesses",
    price: "Custom",
    sub: "per transaction",
    features: ["Unlimited transactions", "Advanced analytics", "Priority support", "Custom shortcode", "Webhook integrations", "Team access"],
    cta: "Request a Demo",
    featured: true,
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: "Custom",
    sub: "tailored pricing",
    features: ["Volume discounts", "Dedicated account manager", "Custom integrations", "SLA guarantee", "Multi-shortcode support", "White-label options"],
    cta: "Talk to Sales",
    featured: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
            Pricing
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Simple, transparent <span className="text-gradient-primary">pricing</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Start free. Scale as you grow. No hidden fees.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-8 border ${
                plan.featured
                  ? "border-primary/40 bg-gradient-card shadow-glow"
                  : "border-border bg-gradient-card"
              } flex flex-col`}
            >
              {plan.featured && (
                <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1 self-start mb-4">
                  Most Popular
                </span>
              )}
              <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="font-heading text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm ml-2">{plan.sub}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant={plan.featured ? "hero" : "outline"} size="lg" className="w-full">
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
