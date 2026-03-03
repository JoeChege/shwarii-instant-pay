const Footer = () => {
  return (
    <footer className="py-12 border-t border-border bg-card/50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <span className="font-heading text-2xl font-bold text-primary">shwarii</span>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              Kenya's simplest USSD-powered M-PESA payment solution. No apps. No internet. Just dial and pay.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="#security" className="hover:text-foreground transition-colors">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-4">Solutions</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#use-cases" className="hover:text-foreground transition-colors">Churches</a></li>
              <li><a href="#use-cases" className="hover:text-foreground transition-colors">Schools</a></li>
              <li><a href="#use-cases" className="hover:text-foreground transition-colors">Matatu & Transport</a></li>
              <li><a href="#use-cases" className="hover:text-foreground transition-colors">SMEs</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2026 Shwarii. All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs">
            Made in Kenya 🇰🇪
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
