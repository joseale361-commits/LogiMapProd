"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Users, Plus, Mail, Phone, Calendar, Shield, Trash2, Check, AlertCircle } from 'lucide-react';

interface TeamMember {
    id: string;
    user_id: string;
    role: string;
    is_active: boolean;
    employee_code: string | null;
    hire_date: string | null;
    created_at: string;
    profile: {
        id: string;
        full_name: string;
        email: string;
        phone: string | null;
        avatar_url: string | null;
    };
}

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

const roleLabels: Record<string, string> = {
    driver: 'Chofer',
    admin: 'Administrador',
    warehouse: 'Almacén',
    staff: 'Personal',
};

const roleColors: Record<string, string> = {
    driver: 'bg-blue-100 text-blue-800',
    admin: 'bg-purple-100 text-purple-800',
    warehouse: 'bg-green-100 text-green-800',
    staff: 'bg-gray-100 text-gray-800',
};

export default function TeamPage({ params }: PageProps) {
    const [slug, setSlug] = useState<string>('');
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [tempPassword, setTempPassword] = useState<string>('');

    useEffect(() => {
        params.then(({ slug }) => {
            setSlug(slug);
            fetchTeamMembers(slug);
        });
    }, [params]);

    const fetchTeamMembers = async (distributorSlug: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/dashboard/${distributorSlug}/team`);
            const data = await response.json();

            if (data.success) {
                setMembers(data.members);
            } else {
                showNotification('error', data.error || 'Error al cargar el equipo');
            }
        } catch (error) {
            console.error('Error fetching team members:', error);
            showNotification('error', 'Error al cargar el equipo');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMember = async () => {
        if (!formData.name || !formData.email) {
            showNotification('error', 'Por favor completa todos los campos');
            return;
        }

        try {
            setSubmitting(true);
            const response = await fetch(`/api/dashboard/${slug}/team`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();

            if (data.success) {
                showNotification('success', `Miembro creado exitosamente`);
                setTempPassword(data.member.tempPassword || '');
                setShowCreateDialog(false);
                setFormData({ name: '', email: '' });
                fetchTeamMembers(slug);
            } else {
                showNotification('error', data.error || 'Error al crear el miembro');
            }
        } catch (error) {
            console.error('Error creating team member:', error);
            showNotification('error', 'Error al crear el miembro');
        } finally {
            setSubmitting(false);
        }
    };

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Equipo</h1>
                    <p className="text-gray-600 mt-1">
                        Administra los choferes y miembros de tu equipo
                    </p>
                </div>
                <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Agregar Miembro
                </Button>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`p-4 rounded-lg ${notification.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    <div className="flex items-center gap-2">
                        {notification.type === 'success' ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <AlertCircle className="w-5 h-5" />
                        )}
                        <span>{notification.message}</span>
                    </div>
                </div>
            )}

            {/* Temporary Password Display */}
            {tempPassword && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-yellow-600" />
                        <div>
                            <p className="font-medium text-yellow-800">Contraseña Temporal</p>
                            <p className="text-sm text-yellow-700">
                                La contraseña temporal para el nuevo usuario es: <strong>{tempPassword}</strong>
                            </p>
                            <p className="text-xs text-yellow-600 mt-1">
                                Por favor compártela con el usuario de forma segura.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Team Members Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">Cargando equipo...</div>
                </div>
            ) : members.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Users className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No hay miembros en el equipo</h3>
                        <p className="text-gray-500 mt-1">
                            Agrega tu primer miembro para comenzar
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.map((member) => (
                        <Card key={member.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                            {member.profile.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg truncate">
                                                {member.profile.full_name}
                                            </CardTitle>
                                            <Badge className={`mt-1 ${roleColors[member.role] || 'bg-gray-100 text-gray-800'}`}>
                                                {roleLabels[member.role] || member.role}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        title="Eliminar miembro"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail className="w-4 h-4" />
                                    <span className="truncate">{member.profile.email}</span>
                                </div>
                                {member.profile.phone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Phone className="w-4 h-4" />
                                        <span>{member.profile.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>Desde {formatDate(member.hire_date)}</span>
                                </div>
                                {member.employee_code && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Shield className="w-4 h-4" />
                                        <span>Código: {member.employee_code}</span>
                                    </div>
                                )}
                                <div className="pt-2 border-t">
                                    <Badge variant={member.is_active ? "default" : "secondary"}>
                                        {member.is_active ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Member Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Agregar Nuevo Miembro</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre Completo *</Label>
                            <Input
                                id="name"
                                placeholder="Ej: Juan Pérez"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Ej: juan@ejemplo.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                        <p className="font-medium mb-1">Información importante:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                            <li>Se generará una contraseña temporal</li>
                            <li>El usuario podrá cambiarla al iniciar sesión</li>
                            <li>Se enviará un email de confirmación</li>
                        </ul>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowCreateDialog(false)}
                            disabled={submitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateMember}
                            disabled={submitting}
                        >
                            {submitting ? 'Creando...' : 'Crear Miembro'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
