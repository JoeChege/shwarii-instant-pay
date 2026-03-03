import { motion } from "framer-motion";
import { ShieldCheck, Lock, Eye, Server } from "lucide-react";

const items = [
  { icon: ShieldCheck, title: "End-to-End Encryption", desc: "All USSD sessions and payment data are encrypted in transit and at rest." },
  { icon: Lock, title: "M-PESA PIN Security", desc: "Payments are authorized exclusively through M-PESA's secure PIN verification." },
  { icon: Eye, title: "Webhook Verification", desc: "Every transaction callback is cryptographically verified to prevent fraud." },
  { icon: Server, title: "99.9% Uptime SLA", desc: "High-availability infrastructure ensures your payments never miss a beat." },
];

const SecuritySection = () => {
  return (
    <section id="security" className="py-24 bg-card/50">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
            Security & Compliance
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Your payments are <span className="text-gradient-primary">fully secure</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Built with enterprise-grade security from the ground up. Every transaction is verified, encrypted, and auditable.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-4 p-6 rounded-xl bg-gradient-card border border-border"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold mb-1">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
