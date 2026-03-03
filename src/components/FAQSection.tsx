import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Does it work on feature phones?",
    a: "Yes! Shwarii uses USSD which works on every phone — from basic feature phones to the latest smartphones. No app or internet connection is needed.",
  },
  {
    q: "Is it compatible with Safaricom M-PESA?",
    a: "Absolutely. Shwarii is built specifically for Safaricom's M-PESA STK Push. Your customers pay directly from their M-PESA wallet.",
  },
  {
    q: "How fast are transactions processed?",
    a: "From the moment a customer dials the USSD code to payment confirmation, the entire process takes under 10 seconds.",
  },
  {
    q: "What does it cost to use Shwarii?",
    a: "We offer a free starter tier for small businesses. Growth and Enterprise plans are priced per transaction with volume discounts. Contact us for a custom quote.",
  },
  {
    q: "How do I get my own USSD shortcode?",
    a: "Once you sign up, our team will provision a dedicated USSD shortcode for your business within 24 hours. We handle all the technical setup.",
  },
  {
    q: "Can I track payments in real-time?",
    a: "Yes. Every payment is confirmed via webhook and visible instantly on your Shwarii dashboard with full transaction details.",
  },
  {
    q: "Is my customer data secure?",
    a: "All payment data is encrypted end-to-end. We never store M-PESA PINs, and every webhook callback is cryptographically verified.",
  },
  {
    q: "Can multiple users pay at the same time?",
    a: "Yes. Our high-performance backend is designed for high concurrency — handling thousands of simultaneous payments during peak events like church services or concerts.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 bg-card/50">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
            FAQ
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Frequently asked <span className="text-gradient-primary">questions</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-gradient-card border border-border rounded-xl px-6 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="font-heading font-semibold text-left hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
