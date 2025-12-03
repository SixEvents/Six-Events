import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, Cake, Sparkles, Gift, Palette } from "lucide-react";

interface OptionRow {
  id?: string;
  name: string;
  price: number;
  description?: string;
  category: "animation" | "decoration" | "cake" | "goodies";
  max_quantity?: number | null;
  is_active: boolean;
}

const emptyNew: OptionRow = {
  name: "",
  price: 0,
  description: "",
  category: "animation",
  max_quantity: null,
  is_active: true,
};

const AdminPartyBuilderOptions = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [activeTab, setActiveTab] = useState<string>("animation");
  const [newOption, setNewOption] = useState<OptionRow>({ ...emptyNew });

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("party_builder_options")
        .select("id,name,price,description,category,max_quantity,is_active")
        .order("category")
        .order("name");
      if (error) throw error;
      setOptions((data || []) as OptionRow[]);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des options");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (opt: OptionRow) => {
    try {
      const { error } = await supabase
        .from("party_builder_options")
        .update({ is_active: !opt.is_active })
        .eq("id", opt.id);
      if (error) throw error;
      toast.success("Statut mis à jour");
      setOptions(prev => prev.map(o => (o.id === opt.id ? { ...o, is_active: !o.is_active } : o)));
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleSaveRow = async (opt: OptionRow) => {
    setSaving(true);
    try {
      if (!opt.name.trim()) {
        toast.error("Le nom est requis");
        return;
      }
      if (opt.id) {
        const { error } = await supabase
          .from("party_builder_options")
          .update({
            name: opt.name,
            price: opt.price,
            description: opt.description || null,
            category: opt.category,
            max_quantity: opt.max_quantity ?? null,
            is_active: opt.is_active,
          })
          .eq("id", opt.id);
        if (error) throw error;
        toast.success("Option mise à jour");
      } else {
        const { error } = await supabase
          .from("party_builder_options")
          .insert({
            name: opt.name,
            price: opt.price,
            description: opt.description || null,
            category: opt.category,
            max_quantity: opt.max_quantity ?? null,
            is_active: opt.is_active,
          });
        if (error) throw error;
        toast.success("Option créée");
      }
      await loadOptions();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRow = async (id?: string) => {
    if (!id) return;
    if (!confirm("Confirmer la suppression de cette option ?")) return;
    try {
      const { error } = await supabase
        .from("party_builder_options")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Option supprimée");
      setOptions(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression");
    }
  };

  const grouped = options.reduce<Record<string, OptionRow[]>>((acc, o) => {
    acc[o.category] = acc[o.category] || [];
    acc[o.category].push(o);
    return acc;
  }, {});

  const renderRow = (opt: OptionRow) => {
    return (
      <Card key={opt.id || opt.name} className="border-2 hover:border-purple-300 transition-colors">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Nom</Label>
                  <Input 
                    value={opt.name} 
                    onChange={e => setOptions(prev => prev.map(o => (o.id === opt.id ? { ...o, name: e.target.value } : o)))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Prix (€)</Label>
                  <Input 
                    type="number" 
                    value={opt.price} 
                    onChange={e => setOptions(prev => prev.map(o => (o.id === opt.id ? { ...o, price: Number(e.target.value) } : o)))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Quantité max</Label>
                  <Input 
                    type="number" 
                    placeholder="Illimité" 
                    value={opt.max_quantity ?? ""} 
                    onChange={e => setOptions(prev => prev.map(o => (o.id === opt.id ? { ...o, max_quantity: e.target.value ? Number(e.target.value) : null } : o)))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={opt.is_active ? "default" : "secondary"} className="whitespace-nowrap">
                  {opt.is_active ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Input 
                value={opt.description || ""} 
                onChange={e => setOptions(prev => prev.map(o => (o.id === opt.id ? { ...o, description: e.target.value } : o)))}
                placeholder="Description optionnelle..."
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleToggleActive(opt)}
              >
                {opt.is_active ? "Désactiver" : "Activer"}
              </Button>
              <Button 
                size="sm"
                onClick={() => handleSaveRow(opt)} 
                disabled={saving} 
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="ml-2">Sauvegarder</span>
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleDeleteRow(opt.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case "animation": return <Sparkles className="h-5 w-5" />;
      case "decoration": return <Palette className="h-5 w-5" />;
      case "cake": return <Cake className="h-5 w-5" />;
      case "goodies": return <Gift className="h-5 w-5" />;
      default: return null;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch(cat) {
      case "animation": return "Animations";
      case "decoration": return "Décorations";
      case "cake": return "Gâteaux";
      case "goodies": return "Goodies & Extras";
      default: return cat;
    }
  };

  const renderCategoryContent = (category: string) => {
    const categoryOptions = options.filter(o => o.category === category);
    
    return (
      <div className="space-y-6">
        {/* Add new option card */}
        <Card className="border-2 border-dashed border-purple-300 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Ajouter une nouvelle option
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Nom *</Label>
                <Input 
                  value={activeTab === category ? newOption.name : ""} 
                  onChange={e => setNewOption(prev => ({ ...prev, name: e.target.value, category: category as any }))}
                  placeholder="Ex: Clown Animateur"
                />
              </div>
              <div>
                <Label>Prix (€) *</Label>
                <Input 
                  type="number" 
                  value={activeTab === category ? newOption.price : 0} 
                  onChange={e => setNewOption(prev => ({ ...prev, price: Number(e.target.value), category: category as any }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Quantité max</Label>
                <Input 
                  type="number" 
                  placeholder="Illimité" 
                  value={activeTab === category ? (newOption.max_quantity ?? "") : ""} 
                  onChange={e => setNewOption(prev => ({ ...prev, max_quantity: e.target.value ? Number(e.target.value) : null, category: category as any }))}
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input 
                value={activeTab === category ? (newOption.description || "") : ""} 
                onChange={e => setNewOption(prev => ({ ...prev, description: e.target.value, category: category as any }))}
                placeholder="Description optionnelle..."
              />
            </div>
            <div className="flex justify-end">
              <Button 
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700" 
                onClick={async () => {
                  if (!newOption.name.trim()) { 
                    toast.error("Le nom est requis"); 
                    return; 
                  }
                  setSaving(true);
                  try {
                    const { error } = await supabase
                      .from("party_builder_options")
                      .insert({
                        name: newOption.name,
                        price: newOption.price,
                        description: newOption.description || null,
                        category: category,
                        max_quantity: newOption.max_quantity ?? null,
                        is_active: true,
                      });
                    if (error) throw error;
                    toast.success("Option créée avec succès!");
                    setNewOption({ ...emptyNew });
                    await loadOptions();
                  } catch (err) {
                    console.error(err);
                    toast.error("Erreur lors de la création");
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Ajouter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing options */}
        <div className="space-y-4">
          {categoryOptions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Aucune option dans cette catégorie.</p>
                <p className="text-sm text-muted-foreground mt-2">Utilisez le formulaire ci-dessus pour en ajouter une.</p>
              </CardContent>
            </Card>
          ) : (
            categoryOptions.map(renderRow)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Gérer les Options du Party Builder</h1>
          <p className="text-muted-foreground">
            Ajoutez, éditez et activez/désactivez les options visibles dans le Party Builder.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="animation" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Animations</span>
              </TabsTrigger>
              <TabsTrigger value="decoration" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Décorations</span>
              </TabsTrigger>
              <TabsTrigger value="cake" className="flex items-center gap-2">
                <Cake className="h-4 w-4" />
                <span className="hidden sm:inline">Gâteaux</span>
              </TabsTrigger>
              <TabsTrigger value="goodies" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                <span className="hidden sm:inline">Goodies</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="animation">
              {renderCategoryContent("animation")}
            </TabsContent>
            <TabsContent value="decoration">
              {renderCategoryContent("decoration")}
            </TabsContent>
            <TabsContent value="cake">
              {renderCategoryContent("cake")}
            </TabsContent>
            <TabsContent value="goodies">
              {renderCategoryContent("goodies")}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default AdminPartyBuilderOptions;
