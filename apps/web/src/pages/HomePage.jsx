
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Clock, Globe, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';

const HomePageContent = () => {
  const { language, t } = useLanguage();
  const { isAuthenticated, isStaff, isAdmin, currentUser } = useAuth();
  const isRtl = language === 'ar';

  return (
    <div className="min-h-screen flex flex-col bg-background/50">
      <Helmet><title>{`${t.home.title} - AMIC`}</title></Helmet>
      
      <main className="flex-1 flex flex-col px-4 pt-16 pb-24 max-w-7xl mx-auto w-full">
        
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center py-16 md:py-24 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="space-y-8 max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm mb-4 shadow-sm border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              AMIC System Online
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-[1.1] tracking-tight">
              {t.home.title}
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t.home.subtitle}
            </p>
            
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/create-ticket">
                <Button size="lg" className="rounded-2xl px-10 h-16 text-lg shadow-lg shadow-primary/30 w-full sm:w-auto interactive-element">
                  {t.common.createTicket}
                  <ArrowRight className={`w-5 h-5 ${isRtl ? 'mr-3 rotate-180' : 'ml-3'}`} />
                </Button>
              </Link>
              
              {isAuthenticated && currentUser ? (
                <Link to={isAdmin || isStaff ? "/dashboard" : "/create-ticket"}>
                  <Button variant="outline" size="lg" className="rounded-2xl px-10 h-16 text-lg border-border/80 w-full sm:w-auto interactive-element bg-background gap-3">
                    <LayoutDashboard className="w-5 h-5" />
                    {t.common.dashboard}
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button variant="outline" size="lg" className="rounded-2xl px-10 h-16 text-lg border-border/80 w-full sm:w-auto interactive-element bg-background">
                    {t.home.staffAccess}
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </section>

        {/* Features Bento Grid */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-12 w-full max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{t.home.features}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="card-primary p-10 md:col-span-8 bg-card flex flex-col justify-center">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">{t.home.feature1Title}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
                {t.home.feature1Desc}
              </p>
            </div>
            
            <div className="card-primary p-10 md:col-span-4 bg-secondary text-secondary-foreground flex flex-col justify-center">
              <div className="w-14 h-14 bg-background/50 rounded-2xl flex items-center justify-center mb-6 text-primary">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{t.home.feature2Title}</h3>
              <p className="text-secondary-foreground/80 leading-relaxed">
                {t.home.feature2Desc}
              </p>
            </div>

            <div className="card-primary p-10 md:col-span-12 bg-muted flex flex-col md:flex-row items-center gap-8 justify-between">
              <div className="max-w-2xl">
                <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center mb-6 shadow-sm text-foreground">
                  <Globe className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">{t.home.feature3Title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {t.home.feature3Desc}
                </p>
              </div>
              <div className="flex gap-4 shrink-0 font-bold text-2xl bg-background px-8 py-4 rounded-3xl shadow-sm border border-border/40">
                <span className="text-primary">EN</span>
                <span className="text-border">/</span>
                <span className="text-primary font-cairo">عربي</span>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      <footer className="py-8 text-center text-muted-foreground border-t border-border/50 bg-card/30">
        <p className="font-medium">{t.home.footer}</p>
      </footer>
    </div>
  );
};

const HomePage = () => (
  <ErrorBoundary>
    <HomePageContent />
  </ErrorBoundary>
);

export default HomePage;
