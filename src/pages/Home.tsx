import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Calendar, 
  PartyPopper, 
  Heart, 
  Star,
  ArrowRight,
  Cake,
  Users,
  Shield,
  Zap
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export default function Home() {
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

  const stats = [
    { value: '10,000+', label: 'Enfants Heureux', icon: '😊' },
    { value: '5,000+', label: 'Événements', icon: '🎉' },
    { value: '2,000+', label: 'Fêtes Organisées', icon: '🎂' },
    { value: '98%', label: 'Parents Satisfaits', icon: '⭐' }
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

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-10 text-6xl hidden lg:block"
            >
              🎈
            </motion.div>
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-40 right-20 text-6xl hidden lg:block"
            >
              🎂
            </motion.div>
            <motion.div
              animate={{ y: [0, -25, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-20 left-1/4 text-6xl hidden lg:block"
            >
              🎁
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-5xl mb-3">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
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

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-2xl mr-3">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="flex items-center text-yellow-500">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3 italic">"{testimonial.text}"</p>
                  <div className="text-sm text-pink-600 font-medium">📍 {testimonial.event}</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-pink-500 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Prêt à créer des souvenirs inoubliables ? 🎊
            </h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
              Rejoignez des milliers de parents qui font confiance à Six Events pour les moments spéciaux de leurs enfants
            </p>
            <Button
              size="lg"
              className="bg-white text-pink-600 hover:bg-gray-100 text-lg px-8 py-6 shadow-xl"
              asChild
            >
              <Link to="/signup">
                Créer mon compte gratuitement
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
