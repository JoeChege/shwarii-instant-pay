import { motion } from "framer-motion";
import { Phone, ArrowRight, CheckCircle2 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Phone,
    title: "Dial the Code",
    description: "Customer dials *566*2673# on any mobile phone — feature phone or smartphone. No internet or app required.",
  },
  {
    number: "02",
    icon: ArrowRight,
    title: "Instant M-PESA Prompt",
    description: "Within seconds, an M-PESA STK push appears on their phone with the exact payment amount pre-filled.",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Confirm & Done",
    description: "Customer enters their M-PESA PIN to confirm. Payment is processed and verified in real-time.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
            How It Works
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Three steps. <span className="text-gradient-primary">Zero friction.</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From dial to done in under 10 seconds — the fastest way to collect M-PESA payments in Kenya.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative text-center"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-card border border-border mb-6 shadow-card">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              <div className="text-accent font-heading text-sm font-bold mb-2">{step.number}</div>
              <h3 className="font-heading text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>

              {/* Connector line */}
              {index < 2 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t border-dashed border-border" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
