
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Shield, Crown } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PermissionsManagementProps {
  currentUserEmail: string;
  permissions: {
    admins: string[];
    superAdmins: string[];
  };
  addAdmin: (email: string) => Promise<string | void>;
  removeAdmin: (email: string) => Promise<string | void>;
  addSuperAdmin: (email: string) => Promise<string | void>;
  removeSuperAdmin: (email: string) => Promise<string | void>;
}

export function PermissionsManagement({
  currentUserEmail,
  permissions,
  addAdmin,
  removeAdmin,
  addSuperAdmin,
  removeSuperAdmin,
}: PermissionsManagementProps) {
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newSuperAdminEmail, setNewSuperAdminEmail] = useState('');

  const handleAddAdmin = async () => {
    if (newAdminEmail.trim()) {
      await addAdmin(newAdminEmail.trim());
      setNewAdminEmail('');
    }
  };
  
  const handleAddSuperAdmin = async () => {
    if (newSuperAdminEmail.trim()) {
      await addSuperAdmin(newSuperAdminEmail.trim());
      setNewSuperAdminEmail('');
    }
  };

  const UserList = ({ title, emails, onRemove, icon, variant }: { title: string, emails: string[], onRemove: (email: string) => Promise<string | void>, icon: React.ReactNode, variant: 'admin' | 'superadmin' }) => (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">{icon} {title}</CardTitle>
        <CardDescription>{variant === 'admin' ? 'Podem acessar o painel e gerenciar a gira e os médiuns.' : 'Possuem todas as permissões de admin, mais acesso às configurações avançadas.'}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {emails.map((email) => (
            <div key={email} className="flex items-center justify-between p-2 rounded-md bg-secondary/50">
              <span className="font-medium text-sm">{email}</span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive/70 hover:text-destructive h-7 w-7"
                    disabled={email === currentUserEmail}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso removerá todas as permissões de {variant} para o e-mail <strong>{email}</strong>. Esta ação é irreversível.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onRemove(email)} variant="destructive">
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          {emails.length === 0 && <p className="text-sm text-center italic text-muted-foreground p-4">Nenhum usuário nesta lista.</p>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base">Adicionar Administrador</Label>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="email.do.admin@exemplo.com"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddAdmin(); }}
          />
          <Button onClick={handleAddAdmin}>Adicionar Admin</Button>
        </div>
      </div>
      <div className="space-y-4">
        <Label className="text-base">Adicionar Super Administrador</Label>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="email.do.superadmin@exemplo.com"
            value={newSuperAdminEmail}
            onChange={(e) => setNewSuperAdminEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddSuperAdmin(); }}
          />
          <Button onClick={handleAddSuperAdmin} variant="secondary">Adicionar Super Admin</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UserList 
          title="Administradores" 
          emails={permissions.admins}
          onRemove={removeAdmin}
          icon={<Shield className="text-blue-500" />}
          variant="admin"
        />
        <UserList 
          title="Super Admins" 
          emails={permissions.superAdmins}
          onRemove={removeSuperAdmin}
          icon={<Crown className="text-amber-500" />}
          variant="superadmin"
        />
      </div>
    </div>
  );
}
