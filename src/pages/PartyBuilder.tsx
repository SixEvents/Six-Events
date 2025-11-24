import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { Check, Sparkles, Plus, Minus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
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
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  
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
        // Separar por categoria
        setThemes(data.filter(o => o.category === 'theme'));
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
    
    if (selectedTheme) {
      const theme = themes.find(t => t.id === selectedTheme);
      if (theme) total += theme.price;
    }
    
    [...animations, ...decorations, ...cakes, ...extras].forEach(option => {
      const quantity = selectedOptions[option.id] || 0;
      if (quantity > 0) {
        total += option.price * quantity;
      }
    });
    
    return total;
  };

  const handleAddToCart = () => {
    if (!selectedTheme) {
      toast.error("Veuillez sélectionner un thème d'abord");
      return;
    }
    
    const total = calculateTotal();
    const theme = themes.find(t => t.id === selectedTheme);
    
    addItem({
      id: `party-builder-${Date.now()}`,
      type: 'party_builder',
      name: `Party Builder - ${theme?.name}`,
      price: total,
      quantity: 1,
      details: {
        theme: theme?.name,
        options: selectedOptions
      }
    });
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
            {/* Themes */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                1. Choisissez votre thème *
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {themes.map(theme => (
                  <Card
                    key={theme.id}
                    className={`cursor-pointer transition-all duration-200 hover-lift ${
                      selectedTheme === theme.id
                        ? "border-2 border-primary shadow-md"
                        : "border-2 border-border"
                    }`}
                    onClick={() => setSelectedTheme(theme.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-foreground">{theme.name}</h3>
                          <p className="text-sm text-muted-foreground">{theme.description}</p>
                        </div>
                        {selectedTheme === theme.id && (
                          <div className="flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-2xl font-bold text-primary">{theme.price}€</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Animations */}
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

            {/* Decorations */}
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

            {/* Cakes */}
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

            {/* Extras */}
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
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-2 border-primary shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold text-foreground mb-4">Récapitulatif</h3>
                
                <div className="space-y-3 mb-4">
                  {selectedTheme && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        Thème: {themes.find(t => t.id === selectedTheme)?.name}
                      </span>
                      <span className="font-semibold">
                        {themes.find(t => t.id === selectedTheme)?.price}€
                      </span>
                    </div>
                  )}
                  
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
                  <span>Total</span>
                  <span className="text-2xl text-primary">{calculateTotal()}€</span>
                </div>

                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={handleAddToCart}
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Ajouter au panier
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Prix TTC. Paiement sécurisé.
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
