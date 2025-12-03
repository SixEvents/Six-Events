import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Check, Sparkles, Plus, Minus, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface BuilderOption {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  image_url?: string;
  maxQuantity?: number;
  max_quantity?: number;
  category?: string;
  is_active?: boolean;
}

const PartyBuilder = () => {
  const [customTheme, setCustomTheme] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Dados do cliente
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientMessage, setClientMessage] = useState("");
  
  // Estados para options do banco
  const [themes, setThemes] = useState<BuilderOption[]>([]);
  const [animations, setAnimations] = useState<BuilderOption[]>([]);
  const [decorations, setDecorations] = useState<BuilderOption[]>([]);
  const [cakes, setCakes] = useState<BuilderOption[]>([]);
  const [extras, setExtras] = useState<BuilderOption[]>([]);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('party_builder_options')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('name');

      if (error) throw error;

      if (data) {
        // Separar por categoria (não incluir themes, pois agora é customizado)
        setAnimations(data.filter(o => o.category === 'animation'));
        setDecorations(data.filter(o => o.category === 'decoration'));
        setCakes(data.filter(o => o.category === 'cake'));
        setExtras(data.filter(o => o.category === 'goodies'));
      }
    } catch (error) {
      console.error('Error fetching options:', error);
      toast.error('Erreur lors du chargement des options');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionToggle = (id: string, maxQuantity?: number) => {
    setSelectedOptions(prev => {
      const current = prev[id] || 0;
      if (current === 0) {
        return { ...prev, [id]: 1 };
      } else if (maxQuantity && current >= maxQuantity) {
        const { [id]: _, ...rest } = prev;
        return rest;
      } else {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
    });
  };

  const handleQuantityChange = (id: string, delta: number, maxQuantity?: number) => {
    setSelectedOptions(prev => {
      const current = prev[id] || 0;
      const newQuantity = current + delta;
      
      if (newQuantity <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      
      if (maxQuantity && newQuantity > maxQuantity) {
        return prev;
      }
      
      return { ...prev, [id]: newQuantity };
    });
  };

  const calculateTotal = () => {
    let total = 0;
    
    // Não incluir preço de theme pois é customizado (preço será definido pelo staff)
    
    [...animations, ...decorations, ...cakes, ...extras].forEach(option => {
      const quantity = selectedOptions[option.id] || 0;
      if (quantity > 0) {
        total += option.price * quantity;
      }
    });
    
    return total;
  };

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
      const total = calculateTotal();
      
      // Construir lista de opções selecionadas
      const selectedOptionsList = [...animations, ...decorations, ...cakes, ...extras]
        .filter(option => selectedOptions[option.id] > 0)
        .map(option => ({
          name: option.name,
          quantity: selectedOptions[option.id],
          price: option.price,
          total: option.price * selectedOptions[option.id]
        }));
      
      const requestData = {
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        client_message: clientMessage,
        custom_theme: customTheme,
        selected_options: selectedOptionsList,
        estimated_price: total,
        status: 'pending'
      };

      const { data: savedRequest, error: requestError } = await supabase
        .from('party_builder_requests')
        .insert(requestData)
        .select()
        .single();

      if (requestError) throw requestError;

      // Enviar email para staff via email_queue
      const emailData = {
        clientName,
        clientEmail,
        clientPhone,
        clientMessage,
        customTheme,
        options: selectedOptionsList,
        estimatedPrice: total,
        requestDate: new Date().toISOString(),
        requestId: savedRequest.id
      };
      
      // Email para equipe (staff)
      const { error: emailError } = await supabase
        .from('email_queue')
        .insert({
          type: 'party_builder_request',
          recipient_email: '6events.mjt@gmail.com',
          data: JSON.stringify(emailData),
          status: 'pending',
        });
      
      if (emailError) console.error('Email queue error:', emailError);

      // Email de confirmação para o cliente
      const { error: clientEmailError } = await supabase
        .from('email_queue')
        .insert({
          type: 'party_builder_client_confirmation',
          recipient_email: clientEmail,
          data: JSON.stringify(emailData),
          status: 'pending',
        });
      
      if (clientEmailError) console.error('Client email queue error:', clientEmailError);

      // Trigger processamento imediato da fila de emails
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-email-queue`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        console.error('Erreur lors du déclenchement du traitement des emails:', err);
        // Não bloqueia o sucesso, os emails serão processados eventualmente
      }
      
      toast.success("Votre demande a été envoyée avec succès! Notre équipe vous contactera bientôt.");
      
      // Reset do formulário
      setCustomTheme("");
      setSelectedOptions({});
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

  const OptionCard = ({ option, category }: { option: BuilderOption; category: string }) => {
    const quantity = selectedOptions[option.id] || 0;
    const isSelected = quantity > 0;
    const maxQty = option.max_quantity || option.maxQuantity;

    return (
      <Card 
        className={`cursor-pointer transition-all duration-200 hover-lift ${
          isSelected ? "border-2 border-primary shadow-md" : "border-2 border-border"
        }`}
        onClick={() => handleOptionToggle(option.id, maxQty)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-bold text-foreground">{option.name}</h4>
              {option.description && (
                <p className="text-sm text-muted-foreground">{option.description}</p>
              )}
            </div>
            {isSelected && (
              <div className="flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary">{option.price}€</span>
            
            {isSelected && !maxQty && (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleQuantityChange(option.id, -1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="font-semibold w-8 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleQuantityChange(option.id, 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary to-accent py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-semibold">Personnalisez votre fête</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">Party Builder</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Créez la fête d'anniversaire parfaite en quelques clics
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Builder Options */}
          <div className="lg:col-span-2 space-y-8">
            {/* Thème Personnalisé */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                1. Décrivez votre thème personnalisé *
              </h2>
              <Card className="border-2 border-primary/20">
                <CardContent className="p-6">
                  <Label htmlFor="customTheme" className="text-base mb-2 block">
                    Décrivez le thème de votre fête et vos envies
                  </Label>
                  <Textarea
                    id="customTheme"
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    placeholder="Exemple : Thème princesse avec des ballons roses et dorés, château gonflable, table décorée style royal..."
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Soyez aussi précis que possible : couleurs, éléments décoratifs souhaités, ambiance générale...
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Animations */}
            {animations.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  2. Ajoutez des animations
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {animations.map(animation => (
                    <OptionCard key={animation.id} option={animation} category="animation" />
                  ))}
                </div>
              </div>
            )}

            {/* Decorations */}
            {decorations.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  3. Décorations supplémentaires
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {decorations.map(decoration => (
                    <OptionCard key={decoration.id} option={decoration} category="decoration" />
                  ))}
                </div>
              </div>
            )}

            {/* Cakes */}
            {cakes.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  4. Choisissez votre gâteau
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {cakes.map(cake => (
                    <OptionCard key={cake.id} option={cake} category="cake" />
                  ))}
                </div>
              </div>
            )}

            {/* Extras */}
            {extras.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  5. Extras & Goodies
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {extras.map(extra => (
                    <OptionCard key={extra.id} option={extra} category="extra" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-2 border-primary shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold text-foreground mb-4">Récapitulatif</h3>
                
                <div className="space-y-3 mb-4">
                  {/* Thème totalmente personnalisé (prix à définir par le staff) */}
                  <div className="flex justify-between items-start">
                    <span className="text-sm max-w-[60%]">
                      Thème personnalisé: {customTheme ? customTheme.substring(0, 80) + (customTheme.length > 80 ? '…' : '') : '—'}
                    </span>
                    <span className="text-xs text-muted-foreground text-right">
                      Prix sur devis
                    </span>
                  </div>

                  {[...animations, ...decorations, ...cakes, ...extras].map(option => {
                    const quantity = selectedOptions[option.id];
                    if (!quantity) return null;
                    
                    return (
                      <div key={option.id} className="flex justify-between items-center text-sm">
                        <span>
                          {option.name} {quantity > 1 && `(x${quantity})`}
                        </span>
                        <span className="font-semibold">
                          {option.price * quantity}€
                        </span>
                      </div>
                    );
                  })}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center text-lg font-bold mb-6">
                  <span>Total estimé</span>
                  <span className="text-2xl text-primary">{calculateTotal()}€</span>
                </div>

                <Separator className="my-4" />

                {/* Formulário de contato */}
                <div className="space-y-4 mb-6">
                  <h4 className="font-semibold text-foreground">Vos coordonnées</h4>
                  
                  <div>
                    <Label htmlFor="clientName">Nom complet *</Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Votre nom"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="clientEmail">Email *</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="clientPhone">Téléphone *</Label>
                    <Input
                      id="clientPhone"
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="clientMessage">Message (optionnel)</Label>
                    <Textarea
                      id="clientMessage"
                      value={clientMessage}
                      onChange={(e) => setClientMessage(e.target.value)}
                      placeholder="Détails supplémentaires, date souhaitée..."
                      rows={3}
                    />
                  </div>
                </div>

                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
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
                      Envoyer la demande
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Notre équipe vous contactera sous 24h pour finaliser votre réservation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartyBuilder;
