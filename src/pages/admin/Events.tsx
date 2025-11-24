import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Event } from '../../types';
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, MapPin, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ImageUpload from '../../components/ImageUpload';

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    price: '',
    max_places: '',
    available_places: '',
    category: 'fete',
    age_range: '3-5',
    is_visible: true,
    image_url: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        date: new Date(formData.date).toISOString(),
        location: formData.location,
        price: parseFloat(formData.price),
        max_places: parseInt(formData.max_places),
        available_places: parseInt(formData.available_places),
        category: formData.category,
        age_range: formData.age_range,
        is_visible: formData.is_visible,
        images: formData.image_url ? [formData.image_url] : null
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editingEvent.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('events')
          .insert([eventData]);
        
        if (error) throw error;
      }

      setIsDialogOpen(false);
      setEditingEvent(null);
      resetForm();
      fetchEvents();
    } catch (error: any) {
      console.error('Error saving event:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  const openDeleteDialog = (id: string) => {
    setEventToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventToDelete);

      if (error) throw error;
      fetchEvents();
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const toggleVisibility = async (event: Event) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_visible: !event.is_visible })
        .eq('id', event.id);

      if (error) throw error;
      fetchEvents();
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      date: format(new Date(event.date), "yyyy-MM-dd'T'HH:mm"),
      location: event.location || '',
      price: event.price?.toString() || '',
      max_places: event.max_places?.toString() || '',
      available_places: event.available_places?.toString() || '',
      category: event.category || 'fete',
      age_range: event.age_range || '3-5',
      is_visible: event.is_visible ?? true,
      image_url: event.images?.[0] || ''
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      location: '',
      price: '',
      max_places: '',
      available_places: '',
      category: 'fete',
      age_range: '3-5',
      is_visible: true,
      image_url: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 dark:text-white">Gestion des Événements</h1>
            <p className="text-gray-600 dark:text-gray-400">Créer et gérer les événements Six Events</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingEvent(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                <Plus className="w-5 h-5 mr-2" />
                Nouvel Événement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEvent ? 'Modifier l\'événement' : 'Créer un événement'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <ImageUpload
                  currentImage={formData.image_url}
                  onImageUploaded={(url) => setFormData({...formData, image_url: url})}
                  onImageRemoved={() => setFormData({...formData, image_url: ''})}
                />

                <div>
                  <Label htmlFor="title">Titre de l'événement *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date et heure *</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Lieu</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price">Prix (€)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_places">Places max</Label>
                    <Input
                      id="max_places"
                      type="number"
                      value={formData.max_places}
                      onChange={(e) => setFormData({...formData, max_places: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="available_places">Places disponibles</Label>
                    <Input
                      id="available_places"
                      type="number"
                      value={formData.available_places}
                      onChange={(e) => setFormData({...formData, available_places: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Catégorie</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="atelier">Atelier</option>
                      <option value="spectacle">Spectacle</option>
                      <option value="fete">Fête thématique</option>
                      <option value="sport">Sport</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="age_range">Tranche d'âge</Label>
                    <select
                      id="age_range"
                      value={formData.age_range}
                      onChange={(e) => setFormData({...formData, age_range: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="3-5">3-5 ans</option>
                      <option value="6-8">6-8 ans</option>
                      <option value="9-12">9-12 ans</option>
                      <option value="13+">13+ ans</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_visible"
                    checked={formData.is_visible}
                    onChange={(e) => setFormData({...formData, is_visible: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="is_visible">Événement visible publiquement</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-pink-500 to-purple-600">
                    {editingEvent ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🎪</div>
            <h3 className="text-2xl font-bold mb-2 dark:text-white">Aucun événement</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Créez votre premier événement pour commencer</p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 hover:shadow-xl transition-shadow dark:bg-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-2xl font-bold dark:text-white">{event.title}</h3>
                        <Badge variant={event.is_visible ? "default" : "secondary"}>
                          {event.is_visible ? 'Visible' : 'Masqué'}
                        </Badge>
                        <Badge>{event.category}</Badge>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-4">{event.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                          <Calendar className="w-4 h-4 mr-2 text-pink-500" />
                          {format(new Date(event.date), 'dd MMM yyyy', { locale: fr })}
                        </div>
                        {event.location && (
                          <div className="flex items-center text-gray-700 dark:text-gray-300">
                            <MapPin className="w-4 h-4 mr-2 text-pink-500" />
                            {event.location}
                          </div>
                        )}
                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                          <Users className="w-4 h-4 mr-2 text-pink-500" />
                          {event.available_places || 0} places
                        </div>
                        <div className="text-2xl font-bold gradient-text">
                          {event.price ? `${event.price}€` : 'Gratuit'}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleVisibility(event)}
                      >
                        {event.is_visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(event)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDeleteDialog(event.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* AlertDialog de confirmação de exclusão */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible et toutes les réservations associées seront également supprimées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setEventToDelete(null)}>
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
