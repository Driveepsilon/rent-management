import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, Calendar, User, Home, Edit, Eye, IdCard } from 'lucide-react';

interface LeaseAgreement {
  id: number;
  tenant_id: number;
  property_id: number;
  lease_start_date: string;
  lease_end_date: string;
  monthly_rent: number;
  security_deposit: number;
  status: string;
  terms: string;
  created_date: string;
  id_number: string;
}

interface Tenant {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface Property {
  id: number;
  name: string;
  address: string;
  monthly_rent: number;
  security_deposit: number;
}

const LeaseAgreements: React.FC = () => {
  const [leases, setLeases] = useState<LeaseAgreement[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<LeaseAgreement | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    tenant_id: '',
    property_id: '',
    lease_start_date: '',
    lease_end_date: '',
    monthly_rent: '',
    security_deposit: '',
    terms: '',
    id_number: ''
  });

  useEffect(() => {
    fetchLeases();
    fetchTenants();
    fetchProperties();
  }, []);

  const fetchLeases = async () => {
    try {
      const { data: userData, error: userError } = await window.ezsite.apis.getUserInfo();
      if (userError) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to view lease agreements.',
          variant: 'destructive'
        });
        return;
      }

      const { data, error } = await window.ezsite.apis.tablePage('26866', {
        PageNo: 1,
        PageSize: 50,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [{ name: 'user_id', op: 'Equal', value: userData.ID }]
      });
      if (error) throw error;
      setLeases(data.List || []);
    } catch (error) {
      console.error('Error fetching leases:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch lease agreements',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const { data: userData, error: userError } = await window.ezsite.apis.getUserInfo();
      if (userError) return;

      const { data, error } = await window.ezsite.apis.tablePage('26864', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [
          { name: 'user_id', op: 'Equal', value: userData.ID },
          { name: 'status', op: 'Equal', value: 'active' }
        ]
      });
      if (error) throw error;
      setTenants(data.List || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const { data: userData, error: userError } = await window.ezsite.apis.getUserInfo();
      if (userError) return;

      const { data, error } = await window.ezsite.apis.tablePage('26865', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [
          { name: 'user_id', op: 'Equal', value: userData.ID },
          { name: 'status', op: 'Equal', value: 'available' }
        ]
      });
      if (error) throw error;
      setProperties(data.List || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleCreateLease = async () => {
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

      const { error } = await window.ezsite.apis.tableCreate('26866', {
        tenant_id: parseInt(formData.tenant_id),
        property_id: parseInt(formData.property_id),
        lease_start_date: new Date(formData.lease_start_date).toISOString(),
        lease_end_date: new Date(formData.lease_end_date).toISOString(),
        monthly_rent: parseFloat(formData.monthly_rent),
        security_deposit: parseFloat(formData.security_deposit),
        status: 'active',
        terms: formData.terms,
        created_date: new Date().toISOString(),
        id_number: formData.id_number,
        user_id: userData.ID
      });

      if (error) throw error;

      // Update property status to occupied
      const property = properties.find((p) => p.id === parseInt(formData.property_id));
      if (property) {
        await window.ezsite.apis.tableUpdate('26865', {
          ID: property.id,
          ...property,
          status: 'occupied'
        });
      }

      toast({
        title: 'Success',
        description: 'Lease agreement created successfully'
      });

      setIsCreateDialogOpen(false);
      setFormData({
        tenant_id: '',
        property_id: '',
        lease_start_date: '',
        lease_end_date: '',
        monthly_rent: '',
        security_deposit: '',
        terms: '',
        id_number: ''
      });
      fetchLeases();
      fetchProperties();
    } catch (error) {
      console.error('Error creating lease:', error);
      toast({
        title: 'Error',
        description: 'Failed to create lease agreement',
        variant: 'destructive'
      });
    }
  };

  const handleStatusUpdate = async (lease: LeaseAgreement, newStatus: string) => {
    try {
      const { error } = await window.ezsite.apis.tableUpdate('26866', {
        ID: lease.id,
        ...lease,
        status: newStatus
      });

      if (error) throw error;

      // If terminating lease, update property status to available
      if (newStatus === 'terminated') {
        const property = properties.find((p) => p.id === lease.property_id);
        if (property) {
          await window.ezsite.apis.tableUpdate('26865', {
            ID: property.id,
            ...property,
            status: 'available'
          });
        }
      }

      toast({
        title: 'Success',
        description: 'Lease status updated successfully'
      });

      fetchLeases();
      fetchProperties();
    } catch (error) {
      console.error('Error updating lease status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lease status',
        variant: 'destructive'
      });
    }
  };

  const getTenantName = (tenantId: number) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unknown';
  };

  const getPropertyName = (propertyId: number) => {
    const property = properties.find((p) => p.id === propertyId);
    return property ? property.name : 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateLeaseDocument = (lease: LeaseAgreement) => {
    const tenant = tenants.find((t) => t.id === lease.tenant_id);
    const property = properties.find((p) => p.id === lease.property_id);

    const leaseDocument = `
      RESIDENTIAL LEASE AGREEMENT
      
      This lease agreement is entered into between:
      
      LANDLORD: [Your Name/Company]
      TENANT: ${tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unknown Tenant'}
      Email: ${tenant ? tenant.email : ''}
      Phone: ${tenant ? tenant.phone : ''}
      ID Number: ${lease.id_number || 'Not provided'}
      
      PROPERTY DETAILS:
      Address: ${property ? property.address : 'Unknown Address'}
      Property: ${property ? property.name : 'Unknown Property'}
      
      LEASE TERMS:
      Start Date: ${new Date(lease.lease_start_date).toLocaleDateString()}
      End Date: ${new Date(lease.lease_end_date).toLocaleDateString()}
      Monthly Rent: $${lease.monthly_rent.toFixed(2)}
      Security Deposit: $${lease.security_deposit.toFixed(2)}
      
      ADDITIONAL TERMS:
      ${lease.terms}
      
      Status: ${lease.status.toUpperCase()}
      Created: ${new Date(lease.created_date).toLocaleDateString()}
      
      This lease agreement is binding upon both parties.
      
      Signatures:
      Landlord: _____________________ Date: _______
      Tenant: ______________________ Date: _______
    `;

    const blob = new Blob([leaseDocument], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lease-agreement-${lease.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePropertySelect = (propertyId: string) => {
    const property = properties.find((p) => p.id === parseInt(propertyId));
    if (property) {
      setFormData({
        ...formData,
        property_id: propertyId,
        monthly_rent: property.monthly_rent.toString(),
        security_deposit: property.security_deposit.toString()
      });
    }
  };

  const defaultTerms = `1. RENT: Tenant agrees to pay rent in the amount specified above, due on the first day of each month.

2. SECURITY DEPOSIT: Security deposit will be held for the term of the lease and returned upon satisfactory completion of the lease terms.

3. USE OF PREMISES: The premises shall be used only as a private residence and for no other purpose.

4. MAINTENANCE: Tenant agrees to maintain the premises in clean and good condition.

5. UTILITIES: Tenant is responsible for all utilities unless otherwise specified.

6. PETS: No pets allowed without prior written consent from landlord.

7. ALTERATIONS: No alterations to the premises without written consent from landlord.

8. TERMINATION: Either party may terminate this lease with 30 days written notice.`;

  if (loading) {
    return <div className="p-6">Loading lease agreements...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lease Agreements</h1>
          <p className="text-gray-600">Create and manage lease agreements for your properties</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Lease
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Lease Agreement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tenant">Tenant</Label>
                  <Select value={formData.tenant_id} onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id.toString()}>
                          {tenant.first_name} {tenant.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="property">Property</Label>
                  <Select value={formData.property_id} onValueChange={handlePropertySelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.name} - {property.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lease_start_date">Lease Start Date</Label>
                  <Input
                    id="lease_start_date"
                    type="date"
                    value={formData.lease_start_date}
                    onChange={(e) => setFormData({ ...formData, lease_start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="lease_end_date">Lease End Date</Label>
                  <Input
                    id="lease_end_date"
                    type="date"
                    value={formData.lease_end_date}
                    onChange={(e) => setFormData({ ...formData, lease_end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthly_rent">Monthly Rent</Label>
                  <Input
                    id="monthly_rent"
                    type="number"
                    step="0.01"
                    value={formData.monthly_rent}
                    onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="security_deposit">Security Deposit</Label>
                  <Input
                    id="security_deposit"
                    type="number"
                    step="0.01"
                    value={formData.security_deposit}
                    onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="id_number">ID Number</Label>
                <Input
                  id="id_number"
                  value={formData.id_number}
                  onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                  placeholder="Enter tenant's ID number"
                />
              </div>
              <div>
                <Label htmlFor="terms">Lease Terms and Conditions</Label>
                <Textarea
                  id="terms"
                  value={formData.terms || defaultTerms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Enter lease terms and conditions"
                  className="min-h-[200px]"
                />
              </div>
              <Button onClick={handleCreateLease} className="w-full">
                Create Lease Agreement
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {leases.map((lease) => (
          <Card key={lease.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">Lease #{lease.id}</h3>
                    <Badge className={getStatusColor(lease.status)}>
                      {lease.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Tenant:</strong> {getTenantName(lease.tenant_id)}</p>
                    <p><strong>Property:</strong> {getPropertyName(lease.property_id)}</p>
                    {lease.id_number && (
                      <p className="flex items-center gap-2">
                        <IdCard className="h-4 w-4" />
                        <strong>ID Number:</strong> {lease.id_number}
                      </p>
                    )}
                    <p><strong>Monthly Rent:</strong> ${lease.monthly_rent.toFixed(2)}</p>
                    <p><strong>Term:</strong> {new Date(lease.lease_start_date).toLocaleDateString()} - {new Date(lease.lease_end_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedLease(lease);
                      setIsViewDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateLeaseDocument(lease)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  {lease.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(lease, 'terminated')}
                    >
                      Terminate
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedLease && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lease Agreement Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Lease ID</Label>
                  <p className="font-mono text-sm">#{selectedLease.id}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedLease.status)}>
                    {selectedLease.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tenant</Label>
                  <p>{getTenantName(selectedLease.tenant_id)}</p>
                </div>
                <div>
                  <Label>Property</Label>
                  <p>{getPropertyName(selectedLease.property_id)}</p>
                </div>
              </div>
              {selectedLease.id_number && (
                <div>
                  <Label>ID Number</Label>
                  <p className="flex items-center gap-2">
                    <IdCard className="h-4 w-4" />
                    {selectedLease.id_number}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <p>{new Date(selectedLease.lease_start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>End Date</Label>
                  <p>{new Date(selectedLease.lease_end_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Monthly Rent</Label>
                  <p className="text-lg font-semibold">${selectedLease.monthly_rent.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Security Deposit</Label>
                  <p className="text-lg font-semibold">${selectedLease.security_deposit.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <Label>Terms and Conditions</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">{selectedLease.terms}</pre>
                </div>
              </div>
              <div>
                <Label>Created Date</Label>
                <p>{new Date(selectedLease.created_date).toLocaleDateString()}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {leases.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No lease agreements yet</h3>
            <p className="text-gray-600 mb-4">Create your first lease agreement to get started</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Lease
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeaseAgreements;