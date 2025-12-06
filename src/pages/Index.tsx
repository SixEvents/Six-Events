import Navbar from "@/components/Navbar";
import EventCard from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Sparkles, Star, Heart, Zap } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import eventPrincess from "@/assets/event-princess.jpg";
import eventSuperhero from "@/assets/event-superhero.jpg";
import eventUnicorn from "@/assets/event-unicorn.jpg";

const Index = () => {
  const featuredEvents = [
    {
      title: "Anniversaire Princesse Magique",
      image: eventPrincess,
      date: "15 Décembre 2025",
      location: "Paris 16ème",
      price: "45",
      spotsLeft: 8,
      theme: "Princesse"
    },
    {
      title: "Super-Héros Academy",
      image: eventSuperhero,
      date: "22 Décembre 2025",
      location: "Neuilly-sur-Seine",
      price: "50",
      spotsLeft: 5,
      theme: "Super-Héros"
    },
    {
      title: "Monde des Licornes",
      image: eventUnicorn,
      date: "28 Décembre 2025",
      location: "Versailles",
      price: "48",
      spotsLeft: 12,
      theme: "Licorne"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-scale-in">
            <div className="inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-full">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                La magie des fêtes inoubliables
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
              Créez la fête d'anniversaire
              <span className="gradient-text"> parfaite</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Réservez des événements uniques ou personnalisez entièrement la fête de vos rêves avec notre Party Builder magique
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button variant="hero" size="lg" className="gap-2">
                <Sparkles className="h-5 w-5" />
                Party Builder
              </Button>
              <Button variant="outline" size="lg">
                Voir les événements
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 p-6 rounded-2xl bg-card hover-lift border border-border">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Événements Uniques</h3>
              <p className="text-muted-foreground">
                Des thèmes magiques et des animations professionnelles pour chaque fête
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-2xl bg-card hover-lift border border-border">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">100% Personnalisable</h3>
              <p className="text-muted-foreground">
                Créez votre fête sur-mesure avec notre Party Builder intuitif
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-2xl bg-card hover-lift border border-border">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Réservation Facile</h3>
              <p className="text-muted-foreground">
                Réservez en 3 clics et recevez votre confirmation instantanée
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Événements à venir
            </h2>
            <p className="text-xl text-muted-foreground">
              Découvrez nos prochaines fêtes magiques
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredEvents.map((event, index) => (
              <EventCard key={index} {...event} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Voir tous les événements
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Prêt à créer la fête parfaite ?
            </h2>
            <p className="text-xl text-white/90">
              Utilisez notre Party Builder pour personnaliser chaque détail de votre événement
            </p>
            <Button 
              variant="outline" 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 border-white mt-4"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Commencer maintenant
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-2xl font-bold">Six Events</span>
          </div>
          <p className="text-background/70">
            © 2025 Six Events. La magie des fêtes inoubliables.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
