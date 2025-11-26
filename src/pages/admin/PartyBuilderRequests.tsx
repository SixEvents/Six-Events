import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Loader2, Mail, Phone, MessageSquare, Euro, Calendar, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PartyBuilderRequest {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_message: string | null;
  custom_theme: string;
  selected_options: any[];
  estimated_price: number;
  final_price: number | null;
  status: 'pending' | 'processing' | 'quoted' | 'accepted' | 'rejected' | 'completed';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-500', variant: 'secondary' as const },
  processing: { label: 'En cours', color: 'bg-blue-500', variant: 'default' as const },
  quoted: { label: 'Devisé', color: 'bg-purple-500', variant: 'default' as const },
  accepted: { label: 'Accepté', color: 'bg-green-500', variant: 'default' as const },
  rejected: { label: 'Refusé', color: 'bg-red-500', variant: 'destructive' as const },
  completed: { label: 'Terminé', color: 'bg-gray-500', variant: 'outline' as const },
};

export default function AdminPartyBuilderRequests() {
  const [requests, setRequests] = useState<PartyBuilderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PartyBuilderRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updating, setUpdating] = useState(false);

  // Form pour update
  const [finalPrice, setFinalPrice] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('party_builder_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const openRequestDialog = (request: PartyBuilderRequest) => {
    setSelectedRequest(request);
    setFinalPrice(request.final_price?.toString() || '');
    setAdminNotes(request.admin_notes || '');
    setNewStatus(request.status);
    setIsDialogOpen(true);
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return;

    setUpdating(true);
    try {
      const updates: any = {
        status: newStatus,
        admin_notes: adminNotes || null,
      };

      if (finalPrice) {
        updates.final_price = parseFloat(finalPrice);
      }

      const { error } = await supabase
        .from('party_builder_requests')
        .update(updates)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success('Demande mise à jour!');
      setIsDialogOpen(false);
      fetchRequests();
    } catch (error: any) {
      console.error('Error updating request:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.client_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.custom_theme.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des demandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Demandes Party Builder</h1>
          <p className="text-muted-foreground">
            Gérez les demandes de fêtes personnalisées
          </p>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="search">Rechercher</Label>
            <Input
              id="search"
              placeholder="Nom, email, thème..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="statusFilter">Statut</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En cours</SelectItem>
                <SelectItem value="quoted">Devisé</SelectItem>
                <SelectItem value="accepted">Accepté</SelectItem>
                <SelectItem value="rejected">Refusé</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = requests.filter(r => r.status === status).length;
            return (
              <Card key={status} className="text-center">
                <CardContent className="p-4">
                  <div className={`w-3 h-3 rounded-full ${config.color} mx-auto mb-2`} />
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground">{config.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Aucune demande trouvée</p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map(request => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold">{request.client_name}</h3>
                        <Badge variant={statusConfig[request.status].variant}>
                          {statusConfig[request.status].label}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-primary" />
                          <a href={`mailto:${request.client_email}`} className="hover:underline">
                            {request.client_email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-primary" />
                          <a href={`tel:${request.client_phone}`} className="hover:underline">
                            {request.client_phone}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-primary" />
                          {format(new Date(request.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Euro className="w-4 h-4 text-primary" />
                          Options: {request.estimated_price.toFixed(2)}€
                          {request.final_price && ` • Final: ${request.final_price.toFixed(2)}€`}
                        </div>
                      </div>

                      <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg mb-3">
                        <p className="text-sm font-semibold mb-1">🎨 Décoration personnalisée :</p>
                        <p className="text-sm whitespace-pre-line">{request.custom_theme}</p>
                      </div>

                      {request.selected_options && request.selected_options.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-semibold mb-2">Options sélectionnées :</p>
                          <div className="flex flex-wrap gap-2">
                            {request.selected_options.map((opt: any, idx: number) => (
                              <Badge key={idx} variant="outline">
                                {opt.name} x{opt.quantity} ({opt.total}€)
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {request.client_message && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MessageSquare className="w-4 h-4 mt-0.5" />
                          <p>{request.client_message}</p>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRequestDialog(request)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Gérer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog de gestion */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gérer la demande</DialogTitle>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4">
                <div>
                  <Label>Client</Label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="font-semibold">{selectedRequest.client_name}</p>
                    <p className="text-sm">{selectedRequest.client_email}</p>
                    <p className="text-sm">{selectedRequest.client_phone}</p>
                  </div>
                </div>

                <div>
                  <Label>Statut</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([status, config]) => (
                        <SelectItem key={status} value={status}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="finalPrice">Prix final (€)</Label>
                  <Input
                    id="finalPrice"
                    type="number"
                    step="0.01"
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(e.target.value)}
                    placeholder="Prix total après étude"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Prix estimé options : {selectedRequest.estimated_price.toFixed(2)}€
                  </p>
                </div>

                <div>
                  <Label htmlFor="adminNotes">Notes internes</Label>
                  <Textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    placeholder="Notes pour l'équipe..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={updating}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleUpdateRequest}
                    disabled={updating}
                  >
                    {updating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
