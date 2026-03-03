import { motion } from "framer-motion";
import { Zap, Globe, BarChart3, Bell, RefreshCw, Settings } from "lucide-react";

const features = [
  { icon: Zap, title: "Instant STK Push", description: "M-PESA payment prompt delivered in under 2 seconds after dialing." },
  { icon: Globe, title: "No Internet Required", description: "USSD works on any GSM network — 2G, 3G, or 4G. Zero data needed." },
  { icon: BarChart3, title: "Real-Time Dashboard", description: "Track every transaction, view analytics, and export reports from one panel." },
  { icon: Bell, title: "Webhook Notifications", description: "Instant automated callbacks confirm every successful payment." },
  { icon: RefreshCw, title: "High Concurrency", description: "Handle thousands of simultaneous payments during peak events." },
  { icon: Settings, title: "Easy Integration", description: "Get your shortcode and start collecting payments within 24 hours." },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
            Features
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Everything you need to <span className="text-gradient-primary">collect payments</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="p-6 rounded-xl border border-border hover:border-primary/20 transition-all"
            >
              <f.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-heading text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
