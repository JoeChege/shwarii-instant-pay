import { motion } from "framer-motion";
import { Zap, Smartphone, Shield } from "lucide-react";

const SolutionSection = () => {
  return (
    <section className="py-24 bg-card/50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
              The Shwarii Solution
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
              One USSD code. <br />
              <span className="text-gradient-primary">Instant M-PESA payment.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Shwarii bridges the gap between USSD accessibility and modern payment processing. 
              Your customers dial a simple shortcode, and our system instantly triggers an M-PESA STK push — 
              no app downloads, no internet connection, no manual paybill entry needed.
            </p>
            <div className="space-y-4">
              {[
                { icon: Smartphone, text: "Works on any phone — smartphone or feature phone" },
                { icon: Zap, text: "Payment completes in under 5 seconds" },
                { icon: Shield, text: "End-to-end encrypted, fully verified transactions" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* USSD simulation card */}
            <div className="bg-gradient-card rounded-2xl border border-border p-8 shadow-card max-w-sm mx-auto">
              <div className="bg-secondary rounded-xl p-6 mb-6 font-mono text-center">
                <p className="text-primary text-2xl font-bold mb-1">*566*2673#</p>
                <p className="text-muted-foreground text-xs">Dial to pay</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">1</div>
                  <span className="text-sm">Customer dials USSD code</span>
                </div>
                <div className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">2</div>
                  <span className="text-sm">M-PESA STK push sent instantly</span>
                </div>
                <div className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">3</div>
                  <span className="text-sm">Enter PIN → Payment confirmed ✓</span>
                </div>
              </div>
            </div>
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
