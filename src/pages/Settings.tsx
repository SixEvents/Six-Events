import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Shield, Save, Key } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';

export default function Settings() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        email: user?.email || ''
      }));
    }
  }, [profile, user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: formData.full_name }
      });

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;
      
      setSuccess(true);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2 dark:text-white">Paramètres du compte</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Gérer vos informations personnelles et sécurité</p>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg mb-6"
            >
              ✅ Modifications enregistrées avec succès !
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6"
            >
              ❌ {error}
            </motion.div>
          )}

          {/* Account Info */}
          <Card className="p-6 mb-6 dark:bg-gray-800">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold dark:text-white">{profile?.full_name || 'Utilisateur'}</h2>
                <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
              </div>
              {profile?.role === 'admin' && (
                <Badge className="ml-auto bg-gradient-to-r from-pink-500 to-purple-600">
                  <Shield className="w-3 h-3 mr-1" />
                  Administrateur
                </Badge>
              )}
            </div>
          </Card>

          {/* Profile Form */}
          <Card className="p-6 mb-6 dark:bg-gray-800">
            <h3 className="text-xl font-bold mb-4 flex items-center dark:text-white">
              <User className="w-5 h-5 mr-2 text-pink-500" />
              Informations personnelles
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nom complet</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Votre nom complet"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="pl-10 bg-gray-50 dark:bg-gray-900"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  L'email ne peut pas être modifié
                </p>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </form>
          </Card>

          {/* Password Form */}
          <Card className="p-6 dark:bg-gray-800">
            <h3 className="text-xl font-bold mb-4 flex items-center dark:text-white">
              <Key className="w-5 h-5 mr-2 text-pink-500" />
              Changer le mot de passe
            </h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Minimum 6 caractères"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Retaper le mot de passe"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !formData.newPassword}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                <Key className="w-4 h-4 mr-2" />
                {loading ? 'Mise à jour...' : 'Changer le mot de passe'}
              </Button>
            </form>
          </Card>

          {/* Account Stats */}
          <Card className="p-6 mt-6 dark:bg-gray-800">
            <h3 className="text-xl font-bold mb-4 dark:text-white">Informations du compte</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Type de compte</p>
                <p className="font-semibold dark:text-white">
                  {profile?.role === 'admin' ? 'Administrateur' : 'Client'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Membre depuis</p>
                <p className="font-semibold dark:text-white">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Email vérifié</p>
                <p className="font-semibold dark:text-white">
                  {user?.email_confirmed_at ? '✅ Oui' : '❌ Non'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">ID utilisateur</p>
                <p className="font-mono text-xs dark:text-white">{user?.id.slice(0, 8)}...</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
