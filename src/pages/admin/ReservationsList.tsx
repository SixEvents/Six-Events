import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Reservation } from '../../types';
import { Search, Download, Calendar, MapPin, User, Mail, Phone, Eye } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function ReservationsList() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    totalRevenue: 0,
    totalPlaces: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch events para o filtro
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title')
        .order('title');
      
      setEvents(eventsData || []);

      // Fetch reservations
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          event:events(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setReservations(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Reservation[]) => {
    const stats = {
      total: data.length,
      confirmed: data.filter(r => r.status === 'confirmed').length,
      totalRevenue: data
        .filter(r => r.status === 'confirmed')
        .reduce((sum, r) => sum + (r.total_price || 0), 0),
      totalPlaces: data
        .filter(r => r.status === 'confirmed')
        .reduce((sum, r) => sum + (r.number_of_places || 0), 0)
    };
    setStats(stats);
  };

  const exportToCSV = () => {
    const csv = [
      ['ID', 'Client', 'Email', 'Téléphone', 'Événement', 'Places', 'Prix Total', 'Statut', 'Date Réservation'].join(','),
      ...filteredReservations.map(r => [
        r.id,
        r.buyer_name || '',
        r.buyer_email || '',
        r.buyer_phone || '',
        r.event?.title || '',
        r.number_of_places || '',
        r.total_price || '',
        r.status || '',
        r.created_at ? format(new Date(r.created_at), 'dd/MM/yyyy HH:mm') : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservations_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export réussi!');
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.buyer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.event?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEvent = 
      eventFilter === 'all' || reservation.event_id === eventFilter;
    
    return matchesSearch && matchesEvent;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { variant: 'default' as const, label: 'Confirmée' },
      pending: { variant: 'secondary' as const, label: 'En attente' },
      cancelled: { variant: 'destructive' as const, label: 'Annulée' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      variant: 'secondary' as const, 
      label: status 
    };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 transition-colors duration-200">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 dark:text-white transition-colors">
              📋 Visualisation des Réservations
            </h1>
            <p className="text-muted-foreground">Consulter toutes les réservations (lecture seule)</p>
          </div>
          <Button onClick={exportToCSV} variant="outline" className="transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="transition-all duration-200 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Total Réservations</div>
              <div className="text-3xl font-bold dark:text-white">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card className="transition-all duration-200 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Confirmées</div>
              <div className="text-3xl font-bold text-green-600">{stats.confirmed}</div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Places Réservées</div>
              <div className="text-3xl font-bold text-blue-600">{stats.totalPlaces}</div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Revenus</div>
              <div className="text-3xl font-bold text-purple-600">{stats.totalRevenue.toFixed(0)}€</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Rechercher par nom, email, événement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par événement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les événements</SelectItem>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              <strong>{filteredReservations.length}</strong> réservation{filteredReservations.length > 1 ? 's' : ''} trouvée{filteredReservations.length > 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>

        {/* Reservations List */}
        {filteredReservations.length === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <Eye className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold mb-2 dark:text-white">Aucune réservation trouvée</h3>
              <p className="text-muted-foreground">Essayez de modifier vos filtres de recherche</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReservations.map((reservation, index) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="transition-all duration-200 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Info principale */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold dark:text-white mb-1">
                              {reservation.event?.title || 'Événement'}
                            </h3>
                            {getStatusBadge(reservation.status || 'pending')}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <User className="w-4 h-4 mr-2 text-pink-500" />
                            <span className="dark:text-gray-300">{reservation.buyer_name}</span>
                          </div>
                          
                          <div className="flex items-center text-muted-foreground">
                            <Mail className="w-4 h-4 mr-2 text-pink-500" />
                            <span className="dark:text-gray-300">{reservation.buyer_email}</span>
                          </div>
                          
                          <div className="flex items-center text-muted-foreground">
                            <Phone className="w-4 h-4 mr-2 text-pink-500" />
                            <span className="dark:text-gray-300">{reservation.buyer_phone}</span>
                          </div>

                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-2 text-pink-500" />
                            <span className="dark:text-gray-300">
                              {reservation.created_at 
                                ? format(new Date(reservation.created_at), 'dd MMM yyyy HH:mm', { locale: fr })
                                : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {reservation.event?.location && (
                          <div className="flex items-center text-muted-foreground text-sm mt-2">
                            <MapPin className="w-4 h-4 mr-2 text-pink-500" />
                            <span className="dark:text-gray-300">{reservation.event.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Stats à droite */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Places</div>
                          <div className="text-2xl font-bold dark:text-white">
                            {reservation.number_of_places}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Total</div>
                          <div className="text-2xl font-bold text-primary">
                            {reservation.total_price?.toFixed(2)}€
                          </div>
                        </div>
                        {reservation.payment_method && (
                          <Badge variant="outline" className="mt-2">
                            {reservation.payment_method === 'card' ? '💳 Carte' : 
                             reservation.payment_method === 'cash' ? '💵 Cash' : 
                             reservation.payment_method}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
