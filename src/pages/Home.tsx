import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Calendar, 
  PartyPopper, 
  Heart, 
  Star,
  ArrowRight,
  Cake,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Users,
  Shield,
  Zap,
  Clock,
  MapPin as Location
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchFeaturedEvents();
  }, []);

  const fetchFeaturedEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(2);

      if (error) throw error;
      setFeaturedEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const features = [
    {
      icon: Calendar,
      title: 'Événements Variés',
      description: 'Ateliers créatifs, spectacles, fêtes thématiques et bien plus',
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      icon: PartyPopper,
      title: 'Party Builder',
      description: 'Personnalisez chaque détail de la fête de vos enfants',
      gradient: 'from-purple-500 to-blue-600'
    },
    {
      icon: Shield,
      title: 'Sécurité Garantie',
      description: 'Paiements sécurisés et événements vérifiés',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Zap,
      title: 'Réservation Instantanée',
      description: 'Confirmez en quelques clics avec vos tickets digitaux',
      gradient: 'from-cyan-500 to-teal-600'
    }
  ];

  const testimonials = [
    {
      name: 'Sophie Martin',
      avatar: '👩',
      rating: 5,
      text: "Six Events a transformé l'anniversaire de ma fille en un moment magique ! Le Party Builder est génial.",
      event: 'Anniversaire Princesse'
    },
    {
      name: 'Thomas Dubois',
      avatar: '👨',
      rating: 5,
      text: "Organisation parfaite, animateurs incroyables. Mon fils n'arrête pas d'en parler !",
      event: 'Atelier Magie'
    },
    {
      name: 'Marie Lefebvre',
      avatar: '👩',
      rating: 5,
      text: "Interface super facile, réservation en 2 minutes. Je recommande à 100% !",
      event: 'Spectacle Clown'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-12 md:py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icGluayIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-7xl">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center px-3 md:px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-pink-600 font-semibold mb-4 md:mb-6 shadow-lg text-xs md:text-sm">
                <span>La plateforme #1 pour les événements enfants</span>
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight"
            >
              <span className="inline-block">
                <span className="gradient-text animate-gradient-x">Créons l'impossible</span>
                <span className="gradient-text animate-gradient-x">, </span>
                <span className="gradient-text-secondary animate-pulse">vivons l'inoubliable!</span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto"
            >
              Réservez des événements inoubliables ou personnalisez entièrement la fête d'anniversaire de votre enfant
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all"
                asChild
              >
                <Link to="/events">
                  Découvrir les événements
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2 border-pink-500 text-pink-600 hover:bg-pink-50"
                asChild
              >
                <Link to="/party-builder">
                  <PartyPopper className="mr-2 w-5 h-5" />
                  Créer ma fête
                </Link>
              </Button>
            </motion.div>

            {/* Subtle Particles */}
            <motion.div
              animate={{ 
                y: [0, -100, -200],
                opacity: [0, 1, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
              className="absolute bottom-20 left-20 hidden lg:block"
            >
              <div className="w-2 h-2 rounded-full bg-pink-400"></div>
            </motion.div>
            <motion.div
              animate={{ 
                y: [0, -120, -240],
                opacity: [0, 1, 0]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeOut", delay: 1 }}
              className="absolute bottom-32 left-1/3 hidden lg:block"
            >
              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
            </motion.div>
            <motion.div
              animate={{ 
                y: [0, -90, -180],
                opacity: [0, 1, 0]
              }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              className="absolute bottom-28 right-1/4 hidden lg:block"
            >
              <div className="w-2 h-2 rounded-full bg-pink-300"></div>
            </motion.div>
            <motion.div
              animate={{ 
                y: [0, -110, -220],
                opacity: [0, 1, 0]
              }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeOut", delay: 2 }}
              className="absolute bottom-24 right-20 hidden lg:block"
            >
              <div className="w-2 h-2 rounded-full bg-purple-300"></div>
            </motion.div>
            <motion.div
              animate={{ 
                y: [0, -95, -190],
                opacity: [0, 1, 0]
              }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeOut", delay: 1.5 }}
              className="absolute bottom-36 left-1/2 hidden lg:block"
            >
              <div className="w-2 h-2 rounded-full bg-pink-500"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-20 bg-gradient-to-b from-white to-pink-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Événements <span className="gradient-text">en Vedette</span> 🌟
            </h2>
            <p className="text-xl text-gray-600">Découvrez nos dernières créations</p>
          </motion.div>

          {featuredEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {featuredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <Link to={`/events/${event.id}`}>
                    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 group border-2 border-transparent hover:border-pink-200">
                      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-pink-400 to-purple-600">
                        {event.images && event.images[0] ? (
                          <img
                            src={event.images[0]}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-8xl">
                            🎉
                          </div>
                        )}
                        <div className="absolute top-4 right-4 bg-pink-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                          {event.price}€
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-2xl font-bold mb-3 group-hover:text-pink-600 transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1.5 text-pink-600" />
                            {new Date(event.date).toLocaleDateString('fr-FR', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1.5 text-pink-600" />
                            {event.time}
                          </div>
                          <div className="flex items-center">
                            <Location className="w-4 h-4 mr-1.5 text-pink-600" />
                            {event.location}
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-sm font-medium text-pink-600 bg-pink-50 px-3 py-1 rounded-full">
                            {event.category}
                          </span>
                          <span className="text-sm text-gray-500">
                            {event.spots_available} places disponibles
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-gray-500">Aucun événement disponible pour le moment</p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-12"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-lg px-8 py-6 shadow-xl"
              asChild
            >
              <Link to="/events">
                Voir tous les événements
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-white to-pink-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Pourquoi choisir <span className="gradient-text">Six Events</span> ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une plateforme complète pour organiser les meilleurs moments de vos enfants
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-pink-200">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600">En 3 étapes simples</p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '1', title: 'Explorez', desc: 'Parcourez nos événements ou utilisez le Party Builder', icon: '🔍' },
                { step: '2', title: 'Personnalisez', desc: 'Choisissez les options qui correspondent à vos envies', icon: '✨' },
                { step: '3', title: 'Réservez', desc: 'Confirmez en ligne et recevez votre ticket instantanément', icon: '🎟️' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600 mb-4">{item.desc}</p>
                  <div className="text-4xl">{item.icon}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-b from-pink-50 to-purple-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 
              className="text-4xl md:text-6xl font-bold mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="gradient-text">À propos de nous</span>
            </motion.h2>
            
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl p-8 md:p-12 mb-12 shadow-xl border border-pink-100"
              >
                <p className="text-2xl md:text-3xl text-gray-800 mb-6 leading-relaxed font-medium">
                  <span className="gradient-text font-bold text-3xl md:text-4xl">Six Events</span> est une mini-entreprise passionnée par la création d'événements magiques pour les enfants. 
                  Nous croyons que chaque anniversaire mérite d'être <span className="text-pink-600 font-semibold">inoubliable</span> ! ✨
                </p>
                <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                  Notre mission est simple : <span className="font-semibold text-purple-600">transformer vos rêves en réalité</span>. Que ce soit une fête princesse féerique, 
                  un anniversaire super-héros épique ou une célébration sur mesure, nous mettons tout notre cœur pour créer 
                  des moments magiques qui resteront gravés dans les mémoires. 💫
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="group"
                >
                  <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-pink-200 transform hover:-translate-y-2">
                    <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">🎉</div>
                    <h3 className="font-bold text-2xl mb-3 gradient-text">Notre Vision</h3>
                    <p className="text-gray-600 text-base leading-relaxed">Créer l'impossible et vivre l'inoubliable à chaque événement</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="group"
                >
                  <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-pink-200 transform hover:-translate-y-2">
                    <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">❤️</div>
                    <h3 className="font-bold text-2xl mb-3 gradient-text">Notre Passion</h3>
                    <p className="text-gray-600 text-base leading-relaxed">Faire briller les yeux des enfants et créer des souvenirs précieux</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="group"
                >
                  <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-pink-200 transform hover:-translate-y-2">
                    <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">⭐</div>
                    <h3 className="font-bold text-2xl mb-3 gradient-text">Notre Engagement</h3>
                    <p className="text-gray-600 text-base leading-relaxed">Des milliers de familles satisfaites et des événements réussis</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-gradient-to-br from-pink-500 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Contactez-nous ! 💬
            </h2>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-95">
              Une question ? Un projet d'événement ? Notre équipe est là pour vous aider !
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center mb-8">
                  <Heart className="w-8 h-8 mr-3" />
                  <h3 className="text-3xl font-bold">Informations de contact</h3>
                </div>
                <a 
                  href="mailto:6events.mjt@gmail.com" 
                  className="flex items-center space-x-4 bg-white/15 backdrop-blur-md rounded-2xl p-8 hover:bg-white/25 transition-all duration-300 group border border-white/20 shadow-xl"
                >
                  <div className="bg-white/20 p-4 rounded-xl group-hover:scale-110 transition-transform">
                    <Mail className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg mb-1 opacity-90">Email</p>
                    <p className="text-white text-2xl font-medium">6events.mjt@gmail.com</p>
                  </div>
                </a>
              </motion.div>

              {/* Social Media */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center mb-8">
                  <Sparkles className="w-8 h-8 mr-3" />
                  <h3 className="text-3xl font-bold">Suivez-nous</h3>
                </div>
                <div className="grid gap-4">
                  <a 
                    href="https://www.instagram.com/_6.events_" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-4 bg-white/15 backdrop-blur-md rounded-xl p-5 hover:bg-white/25 transition-all duration-300 group border border-white/20 shadow-lg"
                  >
                    <div className="bg-white/20 p-3 rounded-lg group-hover:scale-110 transition-transform">
                      <Instagram className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-semibold text-base mb-0.5">Instagram</p>
                      <p className="text-white/95 text-lg font-medium">@_6.events_</p>
                    </div>
                  </a>

                  <a 
                    href="https://www.tiktok.com/@sixevents" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-4 bg-white/15 backdrop-blur-md rounded-xl p-5 hover:bg-white/25 transition-all duration-300 group border border-white/20 shadow-lg"
                  >
                    <div className="bg-white/20 p-3 rounded-lg group-hover:scale-110 transition-transform">
                      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-base mb-0.5">TikTok</p>
                      <p className="text-white/95 text-lg font-medium">@six'events</p>
                    </div>
                  </a>

                  <a 
                    href="https://www.facebook.com/sixevents" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-4 bg-white/15 backdrop-blur-md rounded-xl p-5 hover:bg-white/25 transition-all duration-300 group border border-white/20 shadow-lg"
                  >
                    <div className="bg-white/20 p-3 rounded-lg group-hover:scale-110 transition-transform">
                      <Facebook className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-semibold text-base mb-0.5">Facebook</p>
                      <p className="text-white/95 text-lg font-medium">Six'events</p>
                    </div>
                  </a>
                </div>
              </motion.div>
            </div>
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-20"
          >
            <Button
              size="lg"
              className="bg-white text-pink-600 hover:bg-gray-50 text-xl px-12 py-8 shadow-2xl transform hover:scale-105 transition-all font-semibold rounded-2xl"
              asChild
            >
              <Link to="/signup">
                Créer mon compte gratuitement
                <ArrowRight className="ml-3 w-6 h-6" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
