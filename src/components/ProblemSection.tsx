import { motion } from "framer-motion";
import { AlertTriangle, Clock, XCircle } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Slow Paybill Entry",
    description: "Customers fumble with long paybill numbers and account references, causing delays and frustration at the point of sale.",
  },
  {
    icon: XCircle,
    title: "Payment Errors",
    description: "Wrong paybill numbers, typos in account fields, and failed transactions cost businesses time and revenue every day.",
  },
  {
    icon: AlertTriangle,
    title: "No Internet? No Payment.",
    description: "App-based solutions leave out millions of Kenyans in areas with poor connectivity or those using feature phones.",
  },
];

const ProblemSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Collecting payments shouldn't be <span className="text-gradient-gold">this hard</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Kenyan businesses lose thousands daily to failed transactions, manual errors, and payment friction.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-card rounded-xl p-8 border border-border hover:border-destructive/30 transition-colors"
            >
              <problem.icon className="w-10 h-10 text-destructive mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-3">{problem.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{problem.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
