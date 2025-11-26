import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Reservation } from '../../types';
import { Search, Filter, Download, Calendar, MapPin, User, Mail, Phone } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
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
      console.error('Error fetching reservations:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Reservation[]) => {
    const stats = {
      total: data.length,
      confirmed: data.filter(r => r.status === 'confirmed').length,
      pending: data.filter(r => r.status === 'pending').length,
      cancelled: data.filter(r => r.status === 'cancelled').length,
      totalRevenue: data
        .filter(r => r.status === 'confirmed')
        .reduce((sum, r) => sum + (r.total_price || 0), 0)
    };
    setStats(stats);
  };

  const exportToCSV = () => {
    const csv = [
      ['ID', 'Client', 'Email', 'Téléphone', 'Événement', 'Places', 'Prix Total', 'Statut', 'Date Réservation'].join(','),
      ...filteredReservations.map(r => [
        r.id,
        r.user_name || '',
        r.user_email || '',
        r.user_phone || '',
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
      reservation.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.event?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || reservation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
            <h1 className="text-4xl font-bold mb-2 dark:text-white transition-colors">Gestion des Réservations</h1>
            <p className="text-muted-foreground">Gérer toutes les réservations d'événements</p>
          </div>
          <Button onClick={exportToCSV} variant="outline" className="transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="transition-all duration-200 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Total</div>
              <div className="text-3xl font-bold dark:text-white">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-200 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="text-sm text-green-600 dark:text-green-400 mb-1">Confirmées</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.confirmed}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-200 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">En attente</div>
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-200 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="text-sm text-red-600 dark:text-red-400 mb-1">Annulées</div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.cancelled}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-200 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Revenu</div>
              <div className="text-3xl font-bold text-primary">{stats.totalRevenue.toFixed(2)}€</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Rechercher par nom, email ou événement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              className="transition-colors"
            >
              Toutes
            </Button>
            <Button
              variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('confirmed')}
              className="transition-colors"
            >
              Confirmées
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('pending')}
              className="transition-colors"
            >
              En attente
            </Button>
            <Button
              variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('cancelled')}
              className="transition-colors"
            >
              Annulées
            </Button>
          </div>
        </div>

        {/* Reservations List */}
        {filteredReservations.length === 0 ? (
          <Card className="p-12 text-center dark:bg-gray-800 dark:border-gray-700">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-2xl font-bold mb-2 dark:text-white">Aucune réservation</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Aucun résultat pour ces filtres' 
                : 'Les réservations apparaîtront ici'}
            </p>
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
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold dark:text-white transition-colors">
                            {reservation.event?.title || 'Événement supprimé'}
                          </h3>
                          <Badge
                            variant={
                              reservation.status === 'confirmed' ? 'default' :
                              reservation.status === 'pending' ? 'secondary' :
                              'destructive'
                            }
                            className="transition-colors"
                          >
                            {reservation.status === 'confirmed' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {reservation.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {reservation.status === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                            {reservation.status === 'confirmed' ? 'Confirmée' :
                             reservation.status === 'pending' ? 'En attente' : 'Annulée'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <User className="w-4 h-4 mr-2 text-pink-500" />
                            <span className="dark:text-gray-300">{reservation.user_name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Mail className="w-4 h-4 mr-2 text-pink-500" />
                            <span className="dark:text-gray-300">{reservation.user_email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Phone className="w-4 h-4 mr-2 text-pink-500" />
                            <span className="dark:text-gray-300">{reservation.user_phone || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 mt-3 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-2 text-pink-500" />
                            <span className="dark:text-gray-300">
                              {reservation.created_at 
                                ? format(new Date(reservation.created_at), 'dd MMM yyyy', { locale: fr })
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="font-semibold dark:text-white">
                            {reservation.number_of_places} place{(reservation.number_of_places || 0) > 1 ? 's' : ''}
                          </div>
                          <div className="text-2xl font-bold text-primary">
                            {reservation.total_price?.toFixed(2)}€
                          </div>
                        </div>
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
