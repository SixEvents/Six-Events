import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  PartyPopper,
  ArrowRight,
  QrCode
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalReservations: 0,
    totalRevenue: 0,
    activeEvents: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentReservations, setRecentReservations] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch events count
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Fetch active events count
      const { count: activeEventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('is_visible', true)
        .gte('date', new Date().toISOString());

      // Fetch reservations
      const { data: reservations, count: reservationsCount } = await supabase
        .from('reservations')
        .select('*, event:events(title)', { count: 'exact' })
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(5);

      // Calculate revenue
      const { data: confirmedReservations } = await supabase
        .from('reservations')
        .select('total_price')
        .eq('status', 'confirmed');

      const revenue = (confirmedReservations as any[])?.reduce((acc, r) => acc + (r.total_price || 0), 0) || 0;

      setStats({
        totalEvents: eventsCount || 0,
        totalReservations: reservationsCount || 0,
        totalRevenue: revenue,
        activeEvents: activeEventsCount || 0
      });

      setRecentReservations(reservations || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Événements Actifs',
      value: stats.activeEvents,
      icon: Calendar,
      color: 'from-pink-500 to-purple-600',
      link: '/admin/events'
    },
    {
      title: 'Réservations',
      value: stats.totalReservations,
      icon: Users,
      color: 'from-purple-500 to-blue-600',
      link: '/admin/reservations'
    },
    {
      title: 'Revenus',
      value: `${stats.totalRevenue.toFixed(0)}€`,
      icon: DollarSign,
      color: 'from-blue-500 to-cyan-600',
      link: '/admin/reservations'
    },
    {
      title: 'Total Événements',
      value: stats.totalEvents,
      icon: PartyPopper,
      color: 'from-cyan-500 to-teal-600',
      link: '/admin/events'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard Admin 👑</h1>
              <p className="text-gray-600">Vue d'ensemble de votre plateforme</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" asChild>
                <Link to="/admin/events">
                  <Calendar className="w-4 h-4 mr-2" />
                  Gérer les événements
                </Link>
              </Button>
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white" asChild>
                <Link to="/admin/events">
                  <Calendar className="w-4 h-4 mr-2" />
                  Créer un événement
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={stat.link}>
                    <Card className="p-6 hover:shadow-xl transition-all cursor-pointer group">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="text-3xl font-bold mb-1 gradient-text">{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.title}</div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Recent Reservations */}
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Réservations Récentes</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/reservations">
                    Voir tout
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
              {recentReservations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucune réservation récente</p>
              ) : (
                <div className="space-y-4">
                  {recentReservations.map((reservation) => (
                    <div key={reservation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-semibold">{reservation.event?.title}</div>
                        <div className="text-sm text-gray-600">{reservation.user_name || 'Client'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-pink-600">{reservation.total_price}€</div>
                        <div className="text-xs text-gray-500">{reservation.number_of_places} places</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Actions Rapides</h2>
              <div className="space-y-3">
                <Link to="/admin/qr-scanner">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-14 border-2 border-primary/20 hover:border-primary hover:bg-primary/5"
                  >
                    <QrCode className="w-5 h-5 mr-3 text-primary" />
                    <div className="text-left">
                      <div className="font-semibold">📱 Scanner QR Codes</div>
                      <div className="text-xs text-gray-500">Valider les entrées des participants</div>
                    </div>
                  </Button>
                </Link>
                <Link to="/admin/events">
                  <Button variant="outline" className="w-full justify-start h-14">
                    <Calendar className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">Gérer les événements</div>
                      <div className="text-xs text-gray-500">Créer, modifier, supprimer</div>
                    </div>
                  </Button>
                </Link>
                <Link to="/admin/reservations">
                  <Button variant="outline" className="w-full justify-start h-14">
                    <Users className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">Voir les réservations</div>
                      <div className="text-xs text-gray-500">Gérer les inscriptions</div>
                    </div>
                  </Button>
                </Link>
                <Link to="/admin/party-builder">
                  <Button variant="outline" className="w-full justify-start h-14">
                    <PartyPopper className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">Party Builder Options</div>
                      <div className="text-xs text-gray-500">Gérer les options disponibles</div>
                    </div>
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
