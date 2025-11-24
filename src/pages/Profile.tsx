import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Edit } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function Profile() {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-8">Mon Profil</h1>

          <Card className="p-8">
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                {profile?.full_name?.[0] || user?.email?.[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profile?.full_name}</h2>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-600 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Nom complet
                  </label>
                  <p className="font-semibold mt-1">{profile?.full_name || 'Non renseigné'}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-600 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </label>
                  <p className="font-semibold mt-1">{user?.email}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-600 flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    Téléphone
                  </label>
                  <p className="font-semibold mt-1">{profile?.phone || 'Non renseigné'}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Rôle</label>
                  <p className="font-semibold mt-1 capitalize">{profile?.role}</p>
                </div>
              </div>

              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white">
                <Edit className="w-4 h-4 mr-2" />
                Modifier mon profil
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
