import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  PartyPopper, 
  User, 
  LogOut, 
  Settings,
  Menu,
  X,
  LayoutDashboard,
  QrCode,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from './ui/button';

interface BrandingSettings {
  logo_url: string;
  show_name: boolean;
  site_name: string;
}

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setProfileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Accueil', icon: Calendar },
    { path: '/events', label: 'Événements', icon: Calendar },
    { path: '/party-builder', label: 'Party Builder', icon: PartyPopper },
    { path: '/gallery', label: 'Galerie', icon: ImageIcon },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src="/logo/logo.png"
              alt="Six Events"
              className="h-20 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo/logobarra/logobarra.png';
              }}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="relative px-4 py-2 rounded-lg transition-all duration-200 group"
                >
                  <div className={`flex items-center space-x-2 ${
                    isActive(link.path) 
                      ? 'text-pink-600 font-semibold' 
                      : 'text-gray-700 hover:text-pink-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </div>
                  {isActive(link.path) && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-pink-50 rounded-lg -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Side - Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {profile?.full_name?.[0] || user.email?.[0].toUpperCase()}
                  </div>
                  <span className="text-gray-700 font-medium">{profile?.full_name || 'Mon compte'}</span>
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {isAdmin && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      
                      {isAdmin && (
                        <>
                          <Link
                            to="/admin"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Dashboard Admin</span>
                          </Link>
                          <Link
                            to="/admin/select-event-scan"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-primary/10 text-primary transition-colors font-medium"
                          >
                            <QrCode className="w-4 h-4" />
                            <span>📱 Scanner QR Codes</span>
                          </Link>
                        </>
                      )}
                      
                      <Link
                        to="/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Mon profil</span>
                      </Link>
                      
                      <Link
                        to="/profile/reservations"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Mes réservations</span>
                      </Link>
                      
                      <Link
                        to="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Paramètres</span>
                      </Link>
                      
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-red-50 text-red-600 transition-colors w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Se déconnecter</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="text-gray-700 hover:text-pink-600"
                >
                  Connexion
                </Button>
                <Button
                  onClick={() => navigate('/signup')}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                >
                  Créer un compte
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-100 py-4"
            >
              <div className="space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                        isActive(link.path)
                          ? 'bg-pink-50 text-pink-600 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
                
                <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
                  {user ? (
                    <>
                      {isAdmin && (
                        <>
                          <Link
                            to="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
                          >
                            <LayoutDashboard className="w-5 h-5" />
                            <span>Dashboard Admin</span>
                          </Link>
                          <Link
                            to="/admin/select-event-scan"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-3 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20"
                          >
                            <QrCode className="w-5 h-5" />
                            <span>📱 Scanner QR Codes</span>
                          </Link>
                        </>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        <User className="w-5 h-5" />
                        <span>Mon profil</span>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Se déconnecter</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          navigate('/login');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full justify-start"
                      >
                        Connexion
                      </Button>
                      <Button
                        onClick={() => {
                          navigate('/signup');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                      >
                        Créer un compte
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
