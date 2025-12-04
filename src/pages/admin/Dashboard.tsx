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
  QrCode,
  Mail,
  Image as ImageIcon,
  Palette
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRevenue: 0,
    activeEvents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch events count
      const { count: eventsCount, error: eventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      if (eventsError) {
        console.error('Error fetching events count:', eventsError);
      }

      // Fetch active events count
      const today = new Date();
      const { count: activeEventsCount, error: activeError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('is_visible', true)
        .gte('date', today.toISOString());

      if (activeError) {
        console.error('Error fetching active events:', activeError);
      }

      // Calculate revenue
      const { data: confirmedReservations, error: revenueError } = await supabase
        .from('reservations')
        .select('total_price')
        .eq('status', 'confirmed');

      if (revenueError) {
        console.error('Error fetching revenue:', revenueError);
      }

      const revenue = (confirmedReservations as any[])?.reduce((acc, r) => acc + (r.total_price || 0), 0) || 0;

      setStats({
        totalEvents: eventsCount || 0,
        totalRevenue: revenue,
        activeEvents: activeEventsCount || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values on error
      setStats({
        totalEvents: 0,
        totalRevenue: 0,
        activeEvents: 0
      });
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Événements Actifs',
      value: stats.activeEvents || 0,
      icon: Calendar,
      color: 'from-pink-500 to-purple-600',
      link: '/admin/events'
    },
    {
      title: 'Revenus',
      value: `${(stats.totalRevenue || 0).toFixed(0)}€`,
      icon: DollarSign,
      color: 'from-blue-500 to-cyan-600',
      link: '/admin/events'
    },
    {
      title: 'Total Événements',
      value: stats.totalEvents || 0,
      icon: PartyPopper,
      color: 'from-cyan-500 to-teal-600',
      link: '/admin/events'
    }
  ];

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
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white" asChild>
              <Link to="/admin/events">
                <Calendar className="w-4 h-4 mr-2" />
                Gérer les événements
              </Link>
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {statCards && statCards.length > 0 && statCards.map((stat, index) => {
              const Icon = stat?.icon;
              if (!Icon) return null;
              
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

          {/* Actions Rapides */}
          <Card className="p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Actions Rapides</h2>
            <div className="space-y-3">
              <Link to="/admin/select-event-scan">
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
                    <div className="font-semibold">📋 Voir les réservations</div>
                    <div className="text-xs text-gray-500">Consultation uniquement</div>
                  </div>
                </Button>
              </Link>
              <Link to="/admin/party-builder-requests">
                <Button variant="outline" className="w-full justify-start h-14 border-2 border-pink-500/20 hover:border-pink-500 hover:bg-pink-50">
                  <Mail className="w-5 h-5 mr-3 text-pink-600" />
                  <div className="text-left">
                    <div className="font-semibold">📨 Demandes Party Builder</div>
                    <div className="text-xs text-gray-500">Fêtes personnalisées</div>
                  </div>
                </Button>
              </Link>
              <Link to="/admin/party-builder-options">
                <Button variant="outline" className="w-full justify-start h-14 border-2 border-purple-500/20 hover:border-purple-500 hover:bg-purple-50">
                  <PartyPopper className="w-5 h-5 mr-3 text-purple-600" />
                  <div className="text-left">
                    <div className="font-semibold">🎛️ Options Party Builder</div>
                    <div className="text-xs text-gray-500">Ajouter/éditer/activer des options</div>
                  </div>
                </Button>
              </Link>
              <Link to="/admin/gallery">
                <Button variant="outline" className="w-full justify-start h-14 border-2 border-blue-500/20 hover:border-blue-500 hover:bg-blue-50">
                  <ImageIcon className="w-5 h-5 mr-3 text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold">📸 Gérer la Galerie</div>
                    <div className="text-xs text-gray-500">Ajouter/modifier des photos d'événements</div>
                  </div>
                </Button>
              </Link>
              <Link to="/admin/users">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-14 border-2 border-amber-500/20 hover:border-amber-500 hover:bg-amber-50"
                >
                  <Users className="w-5 h-5 mr-3 text-amber-600" />
                  <div className="text-left">
                    <div className="font-semibold">🔐 Gérer les Permissions</div>
                    <div className="text-xs text-gray-500">Gérer l'accès des utilisateurs</div>
                  </div>
                </Button>
              </Link>
              <Link to="/admin/branding">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-14 border-2 border-rose-500/20 hover:border-rose-500 hover:bg-rose-50"
                >
                  <Palette className="w-5 h-5 mr-3 text-rose-600" />
                  <div className="text-left">
                    <div className="font-semibold">🎨 Configurações de Branding</div>
                    <div className="text-xs text-gray-500">Logo, nome do site, aparência</div>
                  </div>
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
