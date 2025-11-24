import { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { PartyBuilderOption } from '../../types';
import { Plus, Edit, Trash2, GripVertical, Save, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

export default function AdminPartyBuilder() {
  const [options, setOptions] = useState<PartyBuilderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [optionToDelete, setOptionToDelete] = useState<string | null>(null);
  const [editingOption, setEditingOption] = useState<PartyBuilderOption | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('theme');
  
  const [formData, setFormData] = useState({
    category: 'theme' as 'theme' | 'animation' | 'decoration' | 'cake' | 'goodies',
    name: '',
    description: '',
    price: '',
    max_quantity: '',
    is_active: true,
  });

  const categories = [
    { value: 'theme', label: 'Thèmes', emoji: '🎭' },
    { value: 'animation', label: 'Animations', emoji: '🎪' },
    { value: 'decoration', label: 'Décorations', emoji: '🎈' },
    { value: 'cake', label: 'Gâteaux', emoji: '🎂' },
    { value: 'goodies', label: 'Goodies', emoji: '🎁' },
  ];

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('party_builder_options')
        .select('*')
        .order('category')
        .order('id');

      if (error) throw error;
      setOptions(data || []);
    } catch (error) {
      console.error('Error fetching options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const optionData = {
        category: formData.category,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        max_quantity: formData.max_quantity ? parseInt(formData.max_quantity) : null,
        is_active: formData.is_active,
      };

      if (editingOption) {
        const { error } = await supabase
          .from('party_builder_options')
          .update(optionData)
          .eq('id', editingOption.id);
        
        if (error) throw error;
        toast.success('Option mise à jour!');
      } else {
        const { error } = await supabase
          .from('party_builder_options')
          .insert([optionData]);
        
        if (error) throw error;
        toast.success('Option créée!');
      }

      setIsDialogOpen(false);
      setEditingOption(null);
      resetForm();
      fetchOptions();
    } catch (error: any) {
      console.error('Error saving option:', error);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const openDeleteDialog = (id: string) => {
    setOptionToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!optionToDelete) return;

    try {
      const { error } = await supabase
        .from('party_builder_options')
        .delete()
        .eq('id', optionToDelete);

      if (error) throw error;
      toast.success('Option supprimée');
      fetchOptions();
      setIsDeleteDialogOpen(false);
      setOptionToDelete(null);
    } catch (error) {
      console.error('Error deleting option:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const openEditDialog = (option: PartyBuilderOption) => {
    setEditingOption(option);
    setFormData({
      category: option.category || 'theme',
      name: option.name,
      description: option.description || '',
      price: option.price?.toString() || '',
      max_quantity: option.max_quantity?.toString() || '',
      is_active: option.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      category: 'theme',
      name: '',
      description: '',
      price: '',
      max_quantity: '',
      is_active: true,
    });
  };

  const filteredOptions = options.filter(opt => opt.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Party Builder Options</h1>
            <p className="text-muted-foreground">Gérer les options disponibles pour les fêtes</p>
          </div>
          <Button 
            onClick={() => {
              resetForm();
              setEditingOption(null);
              setIsDialogOpen(true);
            }}
            className="bg-gradient-to-r from-pink-500 to-purple-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle Option
          </Button>
        </div>

        {/* Tabs de catégories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(cat => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat.value)}
              className="whitespace-nowrap"
            >
              <span className="mr-2">{cat.emoji}</span>
              {cat.label}
              <Badge variant="secondary" className="ml-2">
                {options.filter(o => o.category === cat.value).length}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Liste des options */}
        <div className="space-y-4">
          {filteredOptions.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">
                {categories.find(c => c.value === selectedCategory)?.emoji}
              </div>
              <h3 className="text-2xl font-bold mb-2">Aucune option</h3>
              <p className="text-muted-foreground mb-4">
                Créez votre première option pour cette catégorie
              </p>
            </Card>
          ) : (
            filteredOptions.map((option) => (
              <Card 
                key={option.id} 
                className="hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => openEditDialog(option)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                          {option.name}
                        </h3>
                        <Badge variant={option.is_active ? 'default' : 'secondary'}>
                          {option.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      {option.description && (
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="font-bold text-primary">{option.price}€</span>
                        {option.max_quantity && (
                          <span className="text-sm text-muted-foreground">
                            Max: {option.max_quantity}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(option);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(option.id);
                        }}
                        className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog de création/édition */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingOption ? 'Modifier l\'option' : 'Créer une option'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({...formData, category: value as any})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {categories.find(c => c.value === formData.category)?.emoji}{' '}
                      {categories.find(c => c.value === formData.category)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="flex items-center gap-2">
                          <span className="text-xl">{cat.emoji}</span>
                          <span>{cat.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Prix (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="max_quantity">Quantité maximale</Label>
                <Input
                  id="max_quantity"
                  type="number"
                  value={formData.max_quantity}
                  onChange={(e) => setFormData({...formData, max_quantity: e.target.value})}
                  placeholder="Laissez vide pour illimité"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <Label htmlFor="is_active" className="font-semibold">
                    Option active
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Visible pour les clients lors de la configuration
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingOption(null);
                    resetForm();
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-pink-500 to-purple-600">
                  <Save className="w-4 h-4 mr-2" />
                  {editingOption ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* AlertDialog de confirmação de exclusão */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer cette option ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setOptionToDelete(null)}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
