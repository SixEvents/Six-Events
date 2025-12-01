import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Sparkles, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const PartyBuilder = () => {
  const [customTheme, setCustomTheme] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  
  // Données du client
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientMessage, setClientMessage] = useState("");

  const handleAddToCart = async () => {
    if (!customTheme.trim()) {
      toast.error("Le thème personnalisé est obligatoire");
      return;
    }

    if (!clientName || !clientEmail || !clientPhone) {
      toast.error("Veuillez remplir vos coordonnées");
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Sauvegarder dans la table party_builder_requests
      const requestData = {
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        client_message: clientMessage,
        custom_theme: customTheme,
        selected_options: [],
        estimated_price: null,
        status: 'pending'
      };

      const { data: savedRequest, error: requestError } = await supabase
        .from('party_builder_requests')
        .insert(requestData)
        .select()
        .single();

      if (requestError) throw requestError;

      // Envoyer email à l'équipe via email_queue
      const emailData = {
        clientName,
        clientEmail,
        clientPhone,
        clientMessage,
        customTheme,
        options: [],
        estimatedPrice: null,
        requestDate: new Date().toISOString(),
        requestId: savedRequest.id
      };
      
      const { error: emailError } = await supabase
        .from('email_queue')
        .insert({
          type: 'party_builder_request',
          recipient_email: '6events.mjt@gmail.com',
          data: JSON.stringify(emailData),
          status: 'pending',
        });
      
      if (emailError) console.error('Email queue error:', emailError);
      
      toast.success("Votre demande a été envoyée avec succès! Notre équipe vous contactera bientôt.");
      
      // Reset du formulaire
      setCustomTheme("");
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setClientMessage("");
      
    } catch (error) {
      console.error('Error submitting party builder request:', error);
      toast.error("Erreur lors de l'envoi de votre demande");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary to-accent py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-semibold">Votre thème totalement personnalisé</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">Party Builder</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Décrivez votre fête idéale : thème, décoration, animations, gâteau... Notre équipe vous contactera avec un devis personnalisé !
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Formulaire personnalisé */}
          <Card className="border-2 border-primary/20">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-primary" />
                Décrivez votre fête personnalisée
              </h2>
              
              <div className="space-y-6">
                {/* Thème personnalisé */}
                <div>
                  <Label htmlFor="customTheme" className="text-lg font-semibold mb-2 block">
                    Décrivez votre thème et vos envies *
                  </Label>
                  <Textarea
                    id="customTheme"
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    placeholder="Exemple : Thème princesse avec des ballons roses et dorés, château gonflable, décoration style royal, gâteau personnalisé avec couronne, animations pour enfants de 5-8 ans..."
                    rows={8}
                    className="resize-none text-base"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Plus vous êtes précis, mieux nous pourrons répondre à vos attentes !
                  </p>
                </div>

                <Separator />

                {/* Coordonnées du client */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Vos coordonnées</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientName">Nom complet *</Label>
                      <Input 
                        id="clientName" 
                        value={clientName} 
                        onChange={e => setClientName(e.target.value)} 
                        placeholder="Votre nom et prénom" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientPhone">Téléphone *</Label>
                      <Input 
                        id="clientPhone" 
                        value={clientPhone} 
                        onChange={e => setClientPhone(e.target.value)} 
                        placeholder="+32..." 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="clientEmail">Email *</Label>
                      <Input 
                        id="clientEmail" 
                        type="email" 
                        value={clientEmail} 
                        onChange={e => setClientEmail(e.target.value)} 
                        placeholder="email@exemple.com" 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="clientMessage">Informations complémentaires (optionnel)</Label>
                      <Textarea 
                        id="clientMessage" 
                        value={clientMessage} 
                        onChange={e => setClientMessage(e.target.value)} 
                        placeholder="Date souhaitée, nombre d'invités, budget approximatif, contraintes particulières..." 
                        rows={4} 
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Bouton d'envoi */}
                <div className="pt-4">
                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="w-full text-lg h-14"
                    onClick={handleAddToCart}
                    disabled={submitting || !customTheme.trim()}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Envoyer ma demande
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Notre équipe vous contactera sous 24-48h avec un devis personnalisé pour votre fête !
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PartyBuilder;
