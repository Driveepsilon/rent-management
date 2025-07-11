
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Mail, Phone, User, Search, IdCard, X, UserPlus } from 'lucide-react';

interface Tenant {
  id: number;
  tenant_name: string;
  id_number: string;
  diplomatic: boolean;
  email: string;
  phone: string;
  address: string;
  emergency_contact: string;
  status: string;
  notes: string;
  title: string;
  id_type: string;
  user_id: number;
}

interface TenantContact {
  id?: number;
  tenant_id?: number;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
}

const TenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantContacts, setTenantContacts] = useState<{ [key: number]: TenantContact[] }>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    tenant_name: '',
    id_number: '',
    diplomatic: false,
    email: '',
    phone: '',
    address: '',
    id_type: '',
    emergency_contact: '',
    status: 'active',
    notes: ''
  });

  const [contacts, setContacts] = useState<TenantContact[]>([
    { contact_name: '', contact_phone: '', contact_email: '' }
  ]);

  const titleOptions = ['Mr', 'Mrs', 'Sir', 'Company'];
  const idTypeOptions = ['Passport', 'ID', 'Company Registration Number'];

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const { data: userData, error: userError } = await window.ezsite.apis.getUserInfo();
      if (userError) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to view tenants.',
          variant: 'destructive'
        });
        return;
      }

      const { data, error } = await window.ezsite.apis.tablePage('26864', {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: 'ID',
        IsAsc: false,
        Filters: [{ name: 'user_id', op: 'Equal', value: userData.ID }]
      });

      if (error) {
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive'
        });
        return;
      }

      setTenants(data?.List || []);
      
      // Load contacts for each tenant
      const tenantIds = (data?.List || []).map((tenant: Tenant) => tenant.id);
      await loadTenantContacts(tenantIds);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load tenants',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTenantContacts = async (tenantIds: number[]) => {
    try {
      const { data: userData, error: userError } = await window.ezsite.apis.getUserInfo();
      if (userError) return;

      const { data, error } = await window.ezsite.apis.tablePage('27113', {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: 'ID',
        IsAsc: false,
        Filters: [{ name: 'user_id', op: 'Equal', value: userData.ID }]
      });

      if (error) return;

      const contactsByTenant: { [key: number]: TenantContact[] } = {};
      (data?.List || []).forEach((contact: any) => {
        if (!contactsByTenant[contact.tenant_id]) {
          contactsByTenant[contact.tenant_id] = [];
        }
        contactsByTenant[contact.tenant_id].push(contact);
      });

      setTenantContacts(contactsByTenant);
    } catch (error) {
      console.error('Failed to load tenant contacts:', error);
    }
  };

  const addContact = () => {
    setContacts([...contacts, { contact_name: '', contact_phone: '', contact_email: '' }]);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const updateContact = (index: number, field: keyof TenantContact, value: string) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setContacts(updatedContacts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tenant_name || !formData.email) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data: userData, error: userError } = await window.ezsite.apis.getUserInfo();
      if (userError) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to continue.',
          variant: 'destructive'
        });
        return;
      }

      const tenantData = {
        ...formData,
        user_id: userData.ID
      };

      let tenantId: number;

      if (editingTenant) {
        const { error } = await window.ezsite.apis.tableUpdate('26864', {
          ID: editingTenant.id,
          ...tenantData
        });

        if (error) {
          toast({
            title: 'Error',
            description: error,
            variant: 'destructive'
          });
          return;
        }

        tenantId = editingTenant.id;
        
        // Delete existing contacts for this tenant
        const existingContacts = tenantContacts[tenantId] || [];
        for (const contact of existingContacts) {
          if (contact.id) {
            await window.ezsite.apis.tableDelete('27113', { ID: contact.id });
          }
        }

        toast({
          title: 'Success',
          description: 'Tenant updated successfully'
        });
      } else {
        const { data: newTenant, error } = await window.ezsite.apis.tableCreate('26864', tenantData);

        if (error) {
          toast({
            title: 'Error',
            description: error,
            variant: 'destructive'
          });
          return;
        }

        tenantId = newTenant?.id || 0;

        toast({
          title: 'Success',
          description: 'Tenant added successfully'
        });
      }

      // Save contacts
      for (const contact of contacts) {
        if (contact.contact_name || contact.contact_phone || contact.contact_email) {
          await window.ezsite.apis.tableCreate('27113', {
            tenant_id: tenantId,
            user_id: userData.ID,
            ...contact
          });
        }
      }

      resetForm();
      setEditingTenant(null);
      setShowAddDialog(false);
      loadTenants();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save tenant',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setFormData({
      title: tenant.title || '',
      tenant_name: tenant.tenant_name,
      id_number: tenant.id_number || '',
      diplomatic: tenant.diplomatic || false,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      id_type: tenant.id_type || '',
      emergency_contact: tenant.emergency_contact,
      status: tenant.status,
      notes: tenant.notes
    });
    
    // Load contacts for this tenant
    const existingContacts = tenantContacts[tenant.id] || [];
    setContacts(existingContacts.length > 0 ? existingContacts : [{ contact_name: '', contact_phone: '', contact_email: '' }]);
    
    setEditingTenant(tenant);
    setShowAddDialog(true);
  };

  const handleDelete = async (tenant: Tenant) => {
    if (!confirm('Are you sure you want to delete this tenant?')) return;

    try {
      const { error } = await window.ezsite.apis.tableDelete('26864', { ID: tenant.id });

      if (error) {
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive'
        });
        return;
      }

      // Delete associated contacts
      const existingContacts = tenantContacts[tenant.id] || [];
      for (const contact of existingContacts) {
        if (contact.id) {
          await window.ezsite.apis.tableDelete('27113', { ID: contact.id });
        }
      }

      toast({
        title: 'Success',
        description: 'Tenant deleted successfully'
      });

      loadTenants();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete tenant',
        variant: 'destructive'
      });
    }
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tenant.id_number && tenant.id_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || tenant.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      tenant_name: '',
      id_number: '',
      diplomatic: false,
      email: '',
      phone: '',
      address: '',
      id_type: '',
      emergency_contact: '',
      status: 'active',
      notes: ''
    });
    setContacts([{ contact_name: '', contact_phone: '', contact_email: '' }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTenant(null);
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Select value={formData.title} onValueChange={(value) => setFormData({ ...formData, title: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      {titleOptions.map((title) =>
                        <SelectItem key={title} value={title}>{title}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="id_type">ID Type</Label>
                  <Select value={formData.id_type} onValueChange={(value) => setFormData({ ...formData, id_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      {idTypeOptions.map((type) =>
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tenant_name">Tenant Name *</Label>
                  <Input
                    id="tenant_name"
                    value={formData.tenant_name}
                    onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })}
                    required />
                </div>
                <div>
                  <Label htmlFor="id_number">ID Number</Label>
                  <Input
                    id="id_number"
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })} />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="diplomatic"
                  checked={formData.diplomatic}
                  onCheckedChange={(checked) => setFormData({ ...formData, diplomatic: checked as boolean })} />
                <Label htmlFor="diplomatic">Diplomatic Status</Label>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>

              {/* Contact Information Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Contact Information</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addContact}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
                {contacts.map((contact, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Contact {index + 1}</Label>
                      {contacts.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeContact(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor={`contact_name_${index}`}>Name</Label>
                        <Input
                          id={`contact_name_${index}`}
                          value={contact.contact_name}
                          onChange={(e) => updateContact(index, 'contact_name', e.target.value)}
                          placeholder="Contact name" />
                      </div>
                      <div>
                        <Label htmlFor={`contact_phone_${index}`}>Phone</Label>
                        <Input
                          id={`contact_phone_${index}`}
                          value={contact.contact_phone}
                          onChange={(e) => updateContact(index, 'contact_phone', e.target.value)}
                          placeholder="Phone number" />
                      </div>
                      <div>
                        <Label htmlFor={`contact_email_${index}`}>Email</Label>
                        <Input
                          id={`contact_email_${index}`}
                          type="email"
                          value={contact.contact_email}
                          onChange={(e) => updateContact(index, 'contact_email', e.target.value)}
                          placeholder="Email address" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <Label htmlFor="emergency_contact">Emergency Contact</Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })} />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3} />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTenant ? 'Update' : 'Add'} Tenant
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tenants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tenant Cards */}
      {loading ?
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) =>
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          )}
        </div> :
        filteredTenants.length === 0 ?
          <Card>
            <CardContent className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tenants found</p>
            </CardContent>
          </Card> :

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTenants.map((tenant) =>
              <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {tenant.title && `${tenant.title} `}{tenant.tenant_name}
                      {tenant.diplomatic && <Badge variant="secondary">Diplomatic</Badge>}
                    </CardTitle>
                    <Badge className={getStatusColor(tenant.status)}>
                      {tenant.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{tenant.email}</span>
                  </div>
                  {tenant.phone &&
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{tenant.phone}</span>
                    </div>
                  }
                  {tenant.id_number &&
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <IdCard className="h-4 w-4" />
                      <span>{tenant.id_number}</span>
                    </div>
                  }
                  {tenant.address &&
                    <p className="text-sm text-gray-600">{tenant.address}</p>
                  }
                  
                  {/* Display contacts */}
                  {tenantContacts[tenant.id] && tenantContacts[tenant.id].length > 0 && (
                    <div className="text-sm text-gray-600">
                      <div className="font-medium mb-1">Contacts:</div>
                      {tenantContacts[tenant.id].map((contact, index) => (
                        <div key={index} className="text-xs ml-2">
                          {contact.contact_name} - {contact.contact_phone}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {tenant.notes &&
                    <p className="text-sm text-gray-500 italic">{tenant.notes}</p>
                  }
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(tenant)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(tenant)}
                      className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
      }
    </div>
  );
};

export default TenantManagement;
