import { motion } from "framer-motion";
import { Church, GraduationCap, Bus, Store, Calendar, Users } from "lucide-react";

const useCases = [
  {
    icon: Church,
    title: "Churches & Ministries",
    description: "Collect tithes, offerings, and building fund contributions during services without disruption.",
  },
  {
    icon: GraduationCap,
    title: "Schools & Institutions",
    description: "Enable parents to pay school fees, exam fees, and activity charges from anywhere.",
  },
  {
    icon: Bus,
    title: "Matatu & Transport",
    description: "Cashless fare collection for matatus and SACCOs — fast boarding, accurate records.",
  },
  {
    icon: Store,
    title: "SMEs & Retail",
    description: "Accept customer payments at your shop or stall without internet or a POS terminal.",
  },
  {
    icon: Calendar,
    title: "Events & Ticketing",
    description: "Sell event tickets and collect gate fees with instant payment verification.",
  },
  {
    icon: Users,
    title: "SACCOs & Chamas",
    description: "Member contributions, loan repayments, and savings deposits made seamless.",
  },
];

const UseCasesSection = () => {
  return (
    <section id="use-cases" className="py-24 bg-card/50">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
            Use Cases
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Built for <span className="text-gradient-gold">every Kenyan business</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From churches to matatus, Shwarii powers payments across Kenya's most important sectors.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((uc, index) => (
            <motion.div
              key={uc.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="bg-gradient-card rounded-xl p-6 border border-border hover:border-primary/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <uc.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold mb-2">{uc.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{uc.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
