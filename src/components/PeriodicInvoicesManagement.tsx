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
import { Plus, Edit, Trash2, Calendar, Clock, Building2, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';

interface PeriodicRentInvoice {
  id: number;
  tenant_id: number;
  property_id: number;
  periodicity: string;
  generation_day: number;
  rent_amount: number;
  currency: string;
  is_active: boolean;
  next_generation_date: string;
  created_date: string;
}

interface PeriodicTrusteeFeesInvoice {
  id: number;
  owner_id: number;
  property_id: number;
  periodicity: string;
  generation_day: number;
  template_description: string;
  currency: string;
  is_active: boolean;
  next_generation_date: string;
  created_date: string;
}

interface Tenant {
  id: number;
  tenant_name: string;
  email: string;
}

interface Owner {
  id: number;
  owner_name: string;
  email: string;
}

interface Property {
  id: number;
  name: string;
  address: string;
  monthly_rent: number;
}

const PeriodicInvoicesManagement: React.FC = () => {
  const [rentInvoices, setRentInvoices] = useState<PeriodicRentInvoice[]>([]);
  const [trusteeFeesInvoices, setTrusteeFeesInvoices] = useState<PeriodicTrusteeFeesInvoice[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedRentInvoice, setSelectedRentInvoice] = useState<PeriodicRentInvoice | null>(null);
  const [selectedTrusteeFeesInvoice, setSelectedTrusteeFeesInvoice] = useState<PeriodicTrusteeFeesInvoice | null>(null);
  const [isRentDialogOpen, setIsRentDialogOpen] = useState(false);
  const [isTrusteeFeesDialogOpen, setIsTrusteeFeesDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'rent' | 'trustee-fees'>('rent');
  
  const { toast } = useToast();
  const { t } = useLanguage();
  const { currency, formatCurrency } = useCurrency();

  const [rentForm, setRentForm] = useState({
    tenant_id: 0,
    property_id: 0,
    periodicity: 'monthly',
    generation_day: 1,
    rent_amount: 0,
    currency: currency,
    is_active: true
  });

  const [trusteeFeesForm, setTrusteeFeesForm] = useState({
    owner_id: 0,
    property_id: 0,
    periodicity: 'monthly',
    generation_day: 1,
    template_description: '',
    currency: currency,
    is_active: true
  });

  const periodicityOptions = [
    { value: 'monthly', label: t('periodicInvoices.monthly') },
    { value: 'quarterly', label: t('periodicInvoices.quarterly') },
    { value: '2_months', label: t('periodicInvoices.bimonthly') }
  ];

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadRentInvoices();
      loadTrusteeFeesInvoices();
      loadTenants();
      loadOwners();
      loadProperties();
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const { data, error } = await window.ezsite.apis.getUserInfo();
      if (!error && data) {
        setUser(data);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRentInvoices = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(28875, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'next_generation_date',
        IsAsc: true,
        Filters: [
          {
            name: 'user_id',
            op: 'Equal',
            value: user.ID
          }
        ]
      });

      if (!error && data) {
        setRentInvoices(data.List || []);
      }
    } catch (error) {
      console.error('Error loading rent invoices:', error);
    }
  };

  const loadTrusteeFeesInvoices = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(28876, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'next_generation_date',
        IsAsc: true,
        Filters: [
          {
            name: 'user_id',
            op: 'Equal',
            value: user.ID
          }
        ]
      });

      if (!error && data) {
        setTrusteeFeesInvoices(data.List || []);
      }
    } catch (error) {
      console.error('Error loading trustee fees invoices:', error);
    }
  };

  const loadTenants = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(26864, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'tenant_name',
        IsAsc: true,
        Filters: [
          {
            name: 'user_id',
            op: 'Equal',
            value: user.ID
          }
        ]
      });

      if (!error && data) {
        setTenants(data.List || []);
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const loadOwners = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(28844, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'owner_name',
        IsAsc: true,
        Filters: [
          {
            name: 'user_id',
            op: 'Equal',
            value: user.ID
          }
        ]
      });

      if (!error && data) {
        setOwners(data.List || []);
      }
    } catch (error) {
      console.error('Error loading owners:', error);
    }
  };

  const loadProperties = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(26865, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'name',
        IsAsc: true,
        Filters: [
          {
            name: 'user_id',
            op: 'Equal',
            value: user.ID
          }
        ]
      });

      if (!error && data) {
        setProperties(data.List || []);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const calculateNextGenerationDate = (periodicity: string, day: number): string => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let nextDate = new Date(currentYear, currentMonth, day);
    
    // If the day has passed this month, move to next period
    if (nextDate <= now) {
      switch (periodicity) {
        case 'monthly':
          nextDate = new Date(currentYear, currentMonth + 1, day);
          break;
        case 'quarterly':
          nextDate = new Date(currentYear, currentMonth + 3, day);
          break;
        case '2_months':
          nextDate = new Date(currentYear, currentMonth + 2, day);
          break;
      }
    }
    
    return nextDate.toISOString();
  };

  const saveRentInvoice = async () => {
    try {
      const nextGenerationDate = calculateNextGenerationDate(rentForm.periodicity, rentForm.generation_day);
      
      const invoiceData = {
        ...rentForm,
        user_id: user.ID,
        next_generation_date: nextGenerationDate,
        created_date: new Date().toISOString()
      };

      let error;
      if (selectedRentInvoice) {
        ({ error } = await window.ezsite.apis.tableUpdate(28875, {
          id: selectedRentInvoice.id,
          ...invoiceData
        }));
      } else {
        ({ error } = await window.ezsite.apis.tableCreate(28875, invoiceData));
      }

      if (error) {
        throw new Error(error);
      }

      // Create notification
      await window.ezsite.apis.tableCreate(28877, {
        user_id: user.ID,
        notification_type: 'periodic_rent_setup',
        title: 'Periodic Rent Invoice Created',
        message: `Periodic rent invoice for ${properties.find(p => p.id === rentForm.property_id)?.name} has been set up`,
        reference_id: selectedRentInvoice?.id || 0,
        reference_type: 'periodic_rent_invoice',
        is_read: false,
        created_date: new Date().toISOString()
      });

      toast({
        title: t('common.success'),
        description: selectedRentInvoice ? 'Periodic rent invoice updated successfully' : 'Periodic rent invoice created successfully',
      });

      setIsRentDialogOpen(false);
      setSelectedRentInvoice(null);
      resetRentForm();
      loadRentInvoices();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to save periodic rent invoice',
        variant: 'destructive',
      });
    }
  };

  const saveTrusteeFeesInvoice = async () => {
    try {
      const nextGenerationDate = calculateNextGenerationDate(trusteeFeesForm.periodicity, trusteeFeesForm.generation_day);
      
      const invoiceData = {
        ...trusteeFeesForm,
        user_id: user.ID,
        next_generation_date: nextGenerationDate,
        created_date: new Date().toISOString()
      };

      let error;
      if (selectedTrusteeFeesInvoice) {
        ({ error } = await window.ezsite.apis.tableUpdate(28876, {
          id: selectedTrusteeFeesInvoice.id,
          ...invoiceData
        }));
      } else {
        ({ error } = await window.ezsite.apis.tableCreate(28876, invoiceData));
      }

      if (error) {
        throw new Error(error);
      }

      // Create notification
      await window.ezsite.apis.tableCreate(28877, {
        user_id: user.ID,
        notification_type: 'periodic_trustee_fees_setup',
        title: 'Periodic Trustee Fees Invoice Created',
        message: `Periodic trustee fees invoice for ${properties.find(p => p.id === trusteeFeesForm.property_id)?.name} has been set up`,
        reference_id: selectedTrusteeFeesInvoice?.id || 0,
        reference_type: 'periodic_trustee_fees_invoice',
        is_read: false,
        created_date: new Date().toISOString()
      });

      toast({
        title: t('common.success'),
        description: selectedTrusteeFeesInvoice ? 'Periodic trustee fees invoice updated successfully' : 'Periodic trustee fees invoice created successfully',
      });

      setIsTrusteeFeesDialogOpen(false);
      setSelectedTrusteeFeesInvoice(null);
      resetTrusteeFeesForm();
      loadTrusteeFeesInvoices();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to save periodic trustee fees invoice',
        variant: 'destructive',
      });
    }
  };

  const deleteRentInvoice = async (invoiceId: number) => {
    try {
      const { error } = await window.ezsite.apis.tableDelete(28875, { id: invoiceId });

      if (error) {
        throw new Error(error);
      }

      toast({
        title: t('common.success'),
        description: 'Periodic rent invoice deleted successfully',
      });

      loadRentInvoices();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to delete periodic rent invoice',
        variant: 'destructive',
      });
    }
  };

  const deleteTrusteeFeesInvoice = async (invoiceId: number) => {
    try {
      const { error } = await window.ezsite.apis.tableDelete(28876, { id: invoiceId });

      if (error) {
        throw new Error(error);
      }

      toast({
        title: t('common.success'),
        description: 'Periodic trustee fees invoice deleted successfully',
      });

      loadTrusteeFeesInvoices();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to delete periodic trustee fees invoice',
        variant: 'destructive',
      });
    }
  };

  const resetRentForm = () => {
    setRentForm({
      tenant_id: 0,
      property_id: 0,
      periodicity: 'monthly',
      generation_day: 1,
      rent_amount: 0,
      currency: currency,
      is_active: true
    });
  };

  const resetTrusteeFeesForm = () => {
    setTrusteeFeesForm({
      owner_id: 0,
      property_id: 0,
      periodicity: 'monthly',
      generation_day: 1,
      template_description: '',
      currency: currency,
      is_active: true
    });
  };

  const editRentInvoice = (invoice: PeriodicRentInvoice) => {
    setSelectedRentInvoice(invoice);
    setRentForm({
      tenant_id: invoice.tenant_id,
      property_id: invoice.property_id,
      periodicity: invoice.periodicity,
      generation_day: invoice.generation_day,
      rent_amount: invoice.rent_amount,
      currency: invoice.currency,
      is_active: invoice.is_active
    });
    setIsRentDialogOpen(true);
  };

  const editTrusteeFeesInvoice = (invoice: PeriodicTrusteeFeesInvoice) => {
    setSelectedTrusteeFeesInvoice(invoice);
    setTrusteeFeesForm({
      owner_id: invoice.owner_id,
      property_id: invoice.property_id,
      periodicity: invoice.periodicity,
      generation_day: invoice.generation_day,
      template_description: invoice.template_description,
      currency: invoice.currency,
      is_active: invoice.is_active
    });
    setIsTrusteeFeesDialogOpen(true);
  };

  const handlePropertySelect = (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    if (property && activeTab === 'rent') {
      setRentForm(prev => ({
        ...prev,
        property_id: propertyId,
        rent_amount: property.monthly_rent,
        currency: property.currency || currency
      }));
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">{t('common.loading')}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('periodicInvoices.title')}</h1>
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'rent' ? 'default' : 'outline'}
            onClick={() => setActiveTab('rent')}
          >
            <Users className="h-4 w-4 mr-2" />
            {t('periodicInvoices.rentInvoices')}
          </Button>
          <Button
            variant={activeTab === 'trustee-fees' ? 'default' : 'outline'}
            onClick={() => setActiveTab('trustee-fees')}
          >
            <Building2 className="h-4 w-4 mr-2" />
            {t('periodicInvoices.trusteeFeesInvoices')}
          </Button>
        </div>
      </div>

      {activeTab === 'rent' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('periodicInvoices.rentInvoices')}</h2>
            <Dialog open={isRentDialogOpen} onOpenChange={setIsRentDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedRentInvoice(null);
                  resetRentForm();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('periodicInvoices.addPeriodicRent')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedRentInvoice ? 'Edit Periodic Rent Invoice' : t('periodicInvoices.addPeriodicRent')}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tenant">Tenant</Label>
                      <Select value={rentForm.tenant_id.toString()} onValueChange={(value) => setRentForm(prev => ({ ...prev, tenant_id: parseInt(value) }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tenant" />
                        </SelectTrigger>
                        <SelectContent>
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id.toString()}>
                              {tenant.tenant_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="property">Property</Label>
                      <Select value={rentForm.property_id.toString()} onValueChange={(value) => handlePropertySelect(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                        <SelectContent>
                          {properties.map((property) => (
                            <SelectItem key={property.id} value={property.id.toString()}>
                              {property.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="periodicity">{t('periodicInvoices.periodicity')}</Label>
                      <Select value={rentForm.periodicity} onValueChange={(value) => setRentForm(prev => ({ ...prev, periodicity: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {periodicityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="generationDay">{t('periodicInvoices.generationDay')}</Label>
                      <Input
                        id="generationDay"
                        type="number"
                        min="1"
                        max="31"
                        value={rentForm.generation_day}
                        onChange={(e) => setRentForm(prev => ({ ...prev, generation_day: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">{t('common.currency')}</Label>
                      <Select value={rentForm.currency} onValueChange={(value) => setRentForm(prev => ({ ...prev, currency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="XOF">XOF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="rentAmount">Rent Amount</Label>
                    <Input
                      id="rentAmount"
                      type="number"
                      value={rentForm.rent_amount}
                      onChange={(e) => setRentForm(prev => ({ ...prev, rent_amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={rentForm.is_active}
                      onChange={(e) => setRentForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    />
                    <Label htmlFor="isActive">{t('periodicInvoices.isActive')}</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsRentDialogOpen(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={saveRentInvoice}>
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {rentInvoices.map((invoice) => {
              const tenant = tenants.find(t => t.id === invoice.tenant_id);
              const property = properties.find(p => p.id === invoice.property_id);

              return (
                <Card key={invoice.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{tenant?.tenant_name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{property?.name}</p>
                        <p className="text-sm text-gray-600">
                          {t('common.amount')}: {formatCurrency(invoice.rent_amount, invoice.currency as any)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t('periodicInvoices.periodicity')}: {periodicityOptions.find(p => p.value === invoice.periodicity)?.label}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t('periodicInvoices.nextGeneration')}: {new Date(invoice.next_generation_date).toLocaleDateString()}
                        </p>
                        <div className="mt-2 flex space-x-2">
                          <Badge variant={invoice.is_active ? 'default' : 'secondary'}>
                            {invoice.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">
                            Day {invoice.generation_day}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editRentInvoice(invoice)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteRentInvoice(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'trustee-fees' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('periodicInvoices.trusteeFeesInvoices')}</h2>
            <Dialog open={isTrusteeFeesDialogOpen} onOpenChange={setIsTrusteeFeesDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedTrusteeFeesInvoice(null);
                  resetTrusteeFeesForm();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('periodicInvoices.addPeriodicTrusteeFees')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedTrusteeFeesInvoice ? 'Edit Periodic Trustee Fees Invoice' : t('periodicInvoices.addPeriodicTrusteeFees')}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="owner">Owner</Label>
                      <Select value={trusteeFeesForm.owner_id.toString()} onValueChange={(value) => setTrusteeFeesForm(prev => ({ ...prev, owner_id: parseInt(value) }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                        <SelectContent>
                          {owners.map((owner) => (
                            <SelectItem key={owner.id} value={owner.id.toString()}>
                              {owner.owner_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="property">Property</Label>
                      <Select value={trusteeFeesForm.property_id.toString()} onValueChange={(value) => setTrusteeFeesForm(prev => ({ ...prev, property_id: parseInt(value) }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                        <SelectContent>
                          {properties.map((property) => (
                            <SelectItem key={property.id} value={property.id.toString()}>
                              {property.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="periodicity">{t('periodicInvoices.periodicity')}</Label>
                      <Select value={trusteeFeesForm.periodicity} onValueChange={(value) => setTrusteeFeesForm(prev => ({ ...prev, periodicity: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {periodicityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="generationDay">{t('periodicInvoices.generationDay')}</Label>
                      <Input
                        id="generationDay"
                        type="number"
                        min="1"
                        max="31"
                        value={trusteeFeesForm.generation_day}
                        onChange={(e) => setTrusteeFeesForm(prev => ({ ...prev, generation_day: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">{t('common.currency')}</Label>
                      <Select value={trusteeFeesForm.currency} onValueChange={(value) => setTrusteeFeesForm(prev => ({ ...prev, currency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="XOF">XOF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="templateDescription">{t('periodicInvoices.templateDescription')}</Label>
                    <Textarea
                      id="templateDescription"
                      value={trusteeFeesForm.template_description}
                      onChange={(e) => setTrusteeFeesForm(prev => ({ ...prev, template_description: e.target.value }))}
                      placeholder="Template description for generated invoices"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={trusteeFeesForm.is_active}
                      onChange={(e) => setTrusteeFeesForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    />
                    <Label htmlFor="isActive">{t('periodicInvoices.isActive')}</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsTrusteeFeesDialogOpen(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={saveTrusteeFeesInvoice}>
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {trusteeFeesInvoices.map((invoice) => {
              const owner = owners.find(o => o.id === invoice.owner_id);
              const property = properties.find(p => p.id === invoice.property_id);

              return (
                <Card key={invoice.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{owner?.owner_name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{property?.name}</p>
                        <p className="text-sm text-gray-600">
                          {t('periodicInvoices.periodicity')}: {periodicityOptions.find(p => p.value === invoice.periodicity)?.label}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t('periodicInvoices.nextGeneration')}: {new Date(invoice.next_generation_date).toLocaleDateString()}
                        </p>
                        <div className="mt-2 flex space-x-2">
                          <Badge variant={invoice.is_active ? 'default' : 'secondary'}>
                            {invoice.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">
                            Day {invoice.generation_day}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editTrusteeFeesInvoice(invoice)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTrusteeFeesInvoice(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodicInvoicesManagement;