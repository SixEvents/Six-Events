import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save } from "lucide-react";

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
      <Card key={opt.id || opt.name} className="border">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <Label>Nom</Label>
              <Input value={opt.name} onChange={e => setOptions(prev => prev.map(o => (o.id === opt.id ? { ...o, name: e.target.value } : o)))} />
            </div>
            <div>
              <Label>Prix (€)</Label>
              <Input type="number" value={opt.price} onChange={e => setOptions(prev => prev.map(o => (o.id === opt.id ? { ...o, price: Number(e.target.value) } : o)))} />
            </div>
            <div>
              <Label>Quantité max</Label>
              <Input type="number" placeholder="optionnel" value={opt.max_quantity ?? ""} onChange={e => setOptions(prev => prev.map(o => (o.id === opt.id ? { ...o, max_quantity: e.target.value ? Number(e.target.value) : null } : o)))} />
            </div>
            <div>
              <Label>Catégorie</Label>
              <Select value={opt.category} onValueChange={val => setOptions(prev => prev.map(o => (o.id === opt.id ? { ...o, category: val as OptionRow["category"] } : o)))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="animation">Animation</SelectItem>
                  <SelectItem value="decoration">Décoration</SelectItem>
                  <SelectItem value="cake">Gâteau</SelectItem>
                  <SelectItem value="goodies">Goodies</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleToggleActive(opt)}>
                {opt.is_active ? "Désactiver" : "Activer"}
              </Button>
              <Button onClick={() => handleSaveRow(opt)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="ml-2">Sauvegarder</span>
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteRow(opt.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Input value={opt.description || ""} onChange={e => setOptions(prev => prev.map(o => (o.id === opt.id ? { ...o, description: e.target.value } : o)))} />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Gérer les Options du Party Builder</h1>
      <p className="text-sm text-muted-foreground mb-6">Ajoutez, éditez, activez/désactivez les options visibles dans le Party Builder.</p>

      {/* Create new option */}
      <Card className="mb-8">
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold">Ajouter une option</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <Label>Nom</Label>
              <Input value={newOption.name} onChange={e => setNewOption(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <Label>Prix (€)</Label>
              <Input type="number" value={newOption.price} onChange={e => setNewOption(prev => ({ ...prev, price: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Quantité max</Label>
              <Input type="number" placeholder="optionnel" value={newOption.max_quantity ?? ""} onChange={e => setNewOption(prev => ({ ...prev, max_quantity: e.target.value ? Number(e.target.value) : null }))} />
            </div>
            <div>
              <Label>Catégorie</Label>
              <Select value={newOption.category} onValueChange={val => setNewOption(prev => ({ ...prev, category: val as OptionRow["category"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="animation">Animation</SelectItem>
                  <SelectItem value="decoration">Décoration</SelectItem>
                  <SelectItem value="cake">Gâteau</SelectItem>
                  <SelectItem value="goodies">Goodies</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={async () => {
                if (!newOption.name.trim()) { toast.error("Le nom est requis"); return; }
                setSaving(true);
                try {
                  const { error } = await supabase
                    .from("party_builder_options")
                    .insert({
                      name: newOption.name,
                      price: newOption.price,
                      description: newOption.description || null,
                      category: newOption.category,
                      max_quantity: newOption.max_quantity ?? null,
                      is_active: true,
                    });
                  if (error) throw error;
                  toast.success("Option créée");
                  setNewOption({ ...emptyNew });
                  await loadOptions();
                } catch (err) {
                  console.error(err);
                  toast.error("Erreur lors de la création");
                } finally {
                  setSaving(false);
                }
              }}>
                <Plus className="h-4 w-4" />
                <span className="ml-2">Ajouter</span>
              </Button>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Input value={newOption.description || ""} onChange={e => setNewOption(prev => ({ ...prev, description: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</div>
      ) : (
        <div className="space-y-8">
          {(["animation","decoration","cake","goodies"] as const).map(cat => (
            <div key={cat}>
              <h2 className="text-xl font-semibold mb-2">
                {cat === "animation" && "Animations"}
                {cat === "decoration" && "Décorations"}
                {cat === "cake" && "Gâteaux"}
                {cat === "goodies" && "Goodies & Extras"}
              </h2>
              <Separator className="mb-4" />
              <div className="space-y-3">
                {(grouped[cat] || []).map(renderRow)}
                {!(grouped[cat] || []).length && (
                  <p className="text-sm text-muted-foreground">Aucune option dans cette catégorie.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPartyBuilderOptions;
