import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Heart, Shield, Star } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero */}
      <section className="bg-gradient-to-b from-secondary/30 to-background py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Qui sommes-nous ?</span>
          </div>
          
          <h1 className="text-5xl font-bold text-foreground mb-6">
            À propos de Six Events
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Nous créons des moments magiques et inoubliables pour les enfants depuis 2020
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-foreground mb-8 text-center">
              Notre mission
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12">
              Chez Six Events, nous croyons que chaque enfant mérite une fête d'anniversaire exceptionnelle. 
              Notre mission est de transformer vos rêves en réalité en créant des événements personnalisés, 
              magiques et sécurisés qui laissent des souvenirs impérissables.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-2 border-border hover-lift">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Heart className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Passion</h3>
                  <p className="text-muted-foreground">
                    Chaque événement est créé avec amour et attention aux détails
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-border hover-lift">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Sécurité</h3>
                  <p className="text-muted-foreground">
                    La sécurité et le bien-être des enfants sont nos priorités absolues
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-border hover-lift">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Star className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Excellence</h3>
                  <p className="text-muted-foreground">
                    Nous visons l'excellence dans chaque prestation et service
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-5xl font-bold mb-2">500+</div>
              <div className="text-lg text-white/80">Fêtes organisées</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">98%</div>
              <div className="text-lg text-white/80">Parents satisfaits</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">15+</div>
              <div className="text-lg text-white/80">Thèmes disponibles</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">5</div>
              <div className="text-lg text-white/80">Ans d'expérience</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Prêt à créer des souvenirs magiques ?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Contactez-nous dès aujourd'hui pour discuter de votre projet
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg">
              Réserver un événement
            </Button>
            <Button variant="outline" size="lg">
              Nous contacter
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
