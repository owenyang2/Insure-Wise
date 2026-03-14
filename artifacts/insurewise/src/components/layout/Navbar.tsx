import { Link, useLocation } from "wouter";
import { Shield, User, Sparkles } from "lucide-react";
import { useStore } from "@/store/use-store";

export function Navbar() {
  const [location] = useLocation();
  const userProfileId = useStore((state) => state.userProfileId);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            Insure<span className="text-primary">Wise</span>
          </span>
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link
            href="/compare"
            className={`text-sm font-medium transition-colors hover:text-primary ${location === '/compare' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            Compare Policies
          </Link>

          <Link
            href="/optimizer"
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${location === '/optimizer' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Sparkles size={15} />
            Optimizer
          </Link>
          
          {userProfileId ? (
            <Link 
              href="/profile" 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </Link>
          ) : (
            <Link 
              href="/onboard" 
              className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-medium shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
            >
              Get Started
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
