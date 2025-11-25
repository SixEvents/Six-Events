import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, UserPlus, Shield, Users } from 'lucide-react';

interface UserRole {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'user';
  created_at: string;
  updated_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

export default function UserManagement() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'manager' | 'staff' | 'user'>('user');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar roles existentes
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;
      setUserRoles(rolesData || []);

      // Carregar usuários do auth (apenas admins podem ver isso)
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (!usersError && users) {
        setAuthUsers(users as AuthUser[]);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addUserRole = async () => {
    if (!selectedEmail) {
      toast({
        title: 'Email obrigatório',
        description: 'Por favor, selecione um email',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Buscar user_id do email
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) throw userError;

      const user = userData.users.find((u) => u.email === selectedEmail);
      if (!user) {
        toast({
          title: 'Usuário não encontrado',
          description: 'Este email não está registrado no sistema',
          variant: 'destructive',
        });
        return;
      }

      // Inserir role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          email: selectedEmail,
          role: selectedRole,
        });

      if (insertError) {
        // Se já existe, fazer update
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ role: selectedRole, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      }

      toast({
        title: 'Sucesso!',
        description: `Permissão ${selectedRole} atribuída para ${selectedEmail}`,
      });

      setSelectedEmail('');
      setSelectedRole('user');
      loadData();
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast({
        title: 'Erro ao adicionar permissão',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteUserRole = async (userId: string, email: string) => {
    if (!confirm(`Tem certeza que deseja remover as permissões de ${email}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: `Permissões removidas de ${email}`,
      });

      loadData();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast({
        title: 'Erro ao remover permissões',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      admin: 'destructive',
      manager: 'default',
      staff: 'secondary',
      user: 'outline',
    };

    const icons: Record<string, JSX.Element> = {
      admin: <Shield className="w-3 h-3 mr-1" />,
      manager: <Users className="w-3 h-3 mr-1" />,
      staff: <UserPlus className="w-3 h-3 mr-1" />,
      user: <Users className="w-3 h-3 mr-1" />,
    };

    return (
      <Badge variant={variants[role] || 'outline'} className="flex items-center gap-1">
        {icons[role]}
        {role.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestão de Permissões</h1>
        <p className="text-muted-foreground">
          Gerencie as permissões de acesso dos usuários da plataforma
        </p>
      </div>

      {/* Adicionar Nova Permissão */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Adicionar Permissão
          </CardTitle>
          <CardDescription>
            Atribua permissões de acesso aos usuários registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do Usuário</Label>
              <Select value={selectedEmail} onValueChange={setSelectedEmail}>
                <SelectTrigger id="email">
                  <SelectValue placeholder="Selecionar usuário" />
                </SelectTrigger>
                <SelectContent>
                  {authUsers.map((user) => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.email}
                      {user.email_confirmed_at ? ' ✓' : ' (não confirmado)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Nível de Acesso</Label>
              <Select
                value={selectedRole}
                onValueChange={(value: any) => setSelectedRole(value)}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Admin - Acesso Total
                    </span>
                  </SelectItem>
                  <SelectItem value="manager">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Manager - Criar/Editar Eventos
                    </span>
                  </SelectItem>
                  <SelectItem value="staff">
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Staff - Visualizar Relatórios
                    </span>
                  </SelectItem>
                  <SelectItem value="user">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      User - Acesso Básico
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={addUserRole} className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Permissão
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Permissões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Usuários com Permissões
          </CardTitle>
          <CardDescription>
            {userRoles.length} usuário(s) com permissões especiais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nível de Acesso</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma permissão configurada ainda
                  </TableCell>
                </TableRow>
              ) : (
                userRoles.map((userRole) => (
                  <TableRow key={userRole.id}>
                    <TableCell className="font-medium">{userRole.email}</TableCell>
                    <TableCell>{getRoleBadge(userRole.role)}</TableCell>
                    <TableCell>
                      {new Date(userRole.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {new Date(userRole.updated_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteUserRole(userRole.user_id, userRole.email)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Legenda de Permissões */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Níveis de Acesso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              {getRoleBadge('admin')}
              <div>
                <p className="font-medium">Admin</p>
                <p className="text-sm text-muted-foreground">
                  Acesso total: criar/editar/deletar eventos, gerenciar usuários, ver todas as reservas
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              {getRoleBadge('manager')}
              <div>
                <p className="font-medium">Manager</p>
                <p className="text-sm text-muted-foreground">
                  Criar e editar eventos, ver reservas dos seus eventos
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              {getRoleBadge('staff')}
              <div>
                <p className="font-medium">Staff</p>
                <p className="text-sm text-muted-foreground">
                  Visualizar relatórios e estatísticas dos eventos
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              {getRoleBadge('user')}
              <div>
                <p className="font-medium">User</p>
                <p className="text-sm text-muted-foreground">
                  Acesso básico: fazer reservas e ver seus próprios tickets
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
