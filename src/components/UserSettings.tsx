import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  User, 
  Building, 
  Palette, 
  Globe, 
  Clock, 
  DollarSign,
  FileText,
  Receipt,
  BarChart3,
  Users,
  Shield,
  Upload,
  Check,
  X,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserSettings {
  id?: number;
  user_id: number;
  language: string;
  timezone: string;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_logo: string;
  invoice_template: string;
  receipt_template: string;
  report_template: string;
  default_currency: string;
}

interface UserRole {
  id?: number;
  user_id: number;
  role_name: string;
  permissions: string;
  is_active: boolean;
}

const UserSettings: React.FC = () => {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const { currency, setCurrency } = useCurrency();
  const { t } = useLanguage();

  const timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
    'Australia/Sydney'
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' }
  ];

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA' },
    { code: 'GBP', name: 'British Pound', symbol: '£' }
  ];

  const templates = [
    { id: 'default', name: 'Default Template' },
    { id: 'modern', name: 'Modern Template' },
    { id: 'classic', name: 'Classic Template' },
    { id: 'minimal', name: 'Minimal Template' }
  ];

  const permissions = [
    'view_dashboard', 'manage_tenants', 'manage_properties', 'manage_invoices',
    'manage_receipts', 'manage_expenses', 'manage_reports', 'manage_users',
    'manage_settings', 'send_emails'
  ];

  const [formData, setFormData] = useState<UserSettings>({
    user_id: 0,
    language: 'en',
    timezone: 'UTC',
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_logo: '',
    invoice_template: 'default',
    receipt_template: 'default',
    report_template: 'default',
    default_currency: 'USD'
  });

  const [roleFormData, setRoleFormData] = useState({
    role_name: '',
    permissions: [] as string[]
  });

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadSettings();
      loadRoles();
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

  const loadSettings = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(28887, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [{ name: 'user_id', op: 'Equal', value: user.ID }]
      });

      if (!error && data && data.List && data.List.length > 0) {
        const settings = data.List[0];
        setUserSettings(settings);
        setFormData(settings);
        setCurrency(settings.default_currency);
      } else {
        // Create default settings
        const defaultSettings = {
          user_id: user.ID,
          language: 'en',
          timezone: 'UTC',
          company_name: '',
          company_address: '',
          company_phone: '',
          company_email: user.Email,
          company_logo: '',
          invoice_template: 'default',
          receipt_template: 'default',
          report_template: 'default',
          default_currency: 'USD'
        };
        setFormData(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadRoles = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(28888, {
        PageNo: 1,
        PageSize: 50,
        OrderByField: 'role_name',
        IsAsc: true,
        Filters: [{ name: 'user_id', op: 'Equal', value: user.ID }]
      });

      if (!error && data) {
        setUserRoles(data.List || []);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const settingsData = {
        ...formData,
        updated_date: new Date().toISOString()
      };

      let error;
      if (userSettings?.id) {
        ({ error } = await window.ezsite.apis.tableUpdate(28887, {
          id: userSettings.id,
          ...settingsData
        }));
      } else {
        ({ error } = await window.ezsite.apis.tableCreate(28887, {
          ...settingsData,
          created_date: new Date().toISOString()
        }));
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Settings saved successfully'
      });

      setCurrency(formData.default_currency);
      loadSettings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive'
      });
    }
  };

  const handleSaveRole = async () => {
    try {
      const roleData = {
        user_id: user.ID,
        role_name: roleFormData.role_name,
        permissions: JSON.stringify(roleFormData.permissions),
        is_active: true,
        created_by: user.ID,
        created_date: new Date().toISOString()
      };

      let error;
      if (selectedRole?.id) {
        ({ error } = await window.ezsite.apis.tableUpdate(28888, {
          id: selectedRole.id,
          ...roleData
        }));
      } else {
        ({ error } = await window.ezsite.apis.tableCreate(28888, roleData));
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: selectedRole ? 'Role updated successfully' : 'Role created successfully'
      });

      setIsRoleDialogOpen(false);
      setSelectedRole(null);
      setRoleFormData({ role_name: '', permissions: [] });
      loadRoles();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save role',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const { error } = await window.ezsite.apis.tableDelete(28888, { id: roleId });
      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Role deleted successfully'
      });

      loadRoles();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete role',
        variant: 'destructive'
      });
    }
  };

  const openRoleDialog = (role?: UserRole) => {
    if (role) {
      setSelectedRole(role);
      setRoleFormData({
        role_name: role.role_name,
        permissions: JSON.parse(role.permissions || '[]')
      });
    } else {
      setSelectedRole(null);
      setRoleFormData({ role_name: '', permissions: [] });
    }
    setIsRoleDialogOpen(true);
  };

  const togglePermission = (permission: string) => {
    setRoleFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { data, error } = await window.ezsite.apis.upload({
        filename: file.name,
        file: file
      });

      if (error) throw error;

      setFormData(prev => ({
        ...prev,
        company_logo: data.toString()
      }));

      toast({
        title: 'Success',
        description: 'Logo uploaded successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload logo',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <Settings className="h-8 w-8 mr-3 text-blue-600" />
        <h1 className="text-3xl font-bold">User Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">
            <User className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building className="h-4 w-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Palette className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="localization">
            <Globe className="h-4 w-4 mr-2" />
            Localization
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="currency">
            <DollarSign className="h-4 w-4 mr-2" />
            Currency
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={formData.timezone} onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map(tz => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveSettings} className="w-full">
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label htmlFor="company_email">Company Email</Label>
                  <Input
                    id="company_email"
                    type="email"
                    value={formData.company_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_email: e.target.value }))}
                    placeholder="Enter company email"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="company_address">Company Address</Label>
                <Textarea
                  id="company_address"
                  value={formData.company_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_address: e.target.value }))}
                  placeholder="Enter company address"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="company_phone">Company Phone</Label>
                <Input
                  id="company_phone"
                  value={formData.company_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_phone: e.target.value }))}
                  placeholder="Enter company phone"
                />
              </div>
              <div>
                <Label htmlFor="company_logo">Company Logo</Label>
                <div className="flex items-center space-x-4">
                  <Input
                    id="company_logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                  {formData.company_logo && (
                    <img 
                      src={formData.company_logo} 
                      alt="Company Logo" 
                      className="h-16 w-16 object-contain border rounded"
                    />
                  )}
                </div>
              </div>
              <Button onClick={handleSaveSettings} className="w-full">
                Save Company Information
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Invoice Template</Label>
                  <Select value={formData.invoice_template} onValueChange={(value) => setFormData(prev => ({ ...prev, invoice_template: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            {template.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Receipt Template</Label>
                  <Select value={formData.receipt_template} onValueChange={(value) => setFormData(prev => ({ ...prev, receipt_template: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center">
                            <Receipt className="h-4 w-4 mr-2" />
                            {template.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Report Template</Label>
                  <Select value={formData.report_template} onValueChange={(value) => setFormData(prev => ({ ...prev, report_template: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            {template.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveSettings} className="w-full">
                Save Template Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="localization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Localization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Display Language</Label>
                  <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 mr-2" />
                            {lang.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Time Zone</Label>
                  <Select value={formData.timezone} onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map(tz => (
                        <SelectItem key={tz} value={tz}>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {tz}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveSettings} className="w-full">
                Save Localization Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                User Roles & Permissions
                <Button onClick={() => openRoleDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Role
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {userRoles.map(role => (
                  <div key={role.id} className="flex justify-between items-center p-4 border rounded">
                    <div>
                      <h4 className="font-semibold">{role.role_name}</h4>
                      <p className="text-sm text-gray-600">
                        {JSON.parse(role.permissions || '[]').length} permissions
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openRoleDialog(role)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteRole(role.id!)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="currency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Currency Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Default Currency</Label>
                <Select value={formData.default_currency} onValueChange={(value) => setFormData(prev => ({ ...prev, default_currency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(curr => (
                      <SelectItem key={curr.code} value={curr.code}>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          {curr.symbol} - {curr.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <h4 className="font-semibold mb-2">Currency Symbols</h4>
                <div className="grid grid-cols-2 gap-2">
                  {currencies.map(curr => (
                    <div key={curr.code} className="flex justify-between">
                      <span>{curr.code}</span>
                      <span className="font-mono">{curr.symbol}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleSaveSettings} className="w-full">
                Save Currency Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRole ? 'Edit Role' : 'Add New Role'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role_name">Role Name</Label>
              <Input
                id="role_name"
                value={roleFormData.role_name}
                onChange={(e) => setRoleFormData(prev => ({ ...prev, role_name: e.target.value }))}
                placeholder="Enter role name"
              />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {permissions.map(permission => (
                  <div key={permission} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={permission}
                      checked={roleFormData.permissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                    />
                    <Label htmlFor={permission} className="text-sm">
                      {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRole}>
                {selectedRole ? 'Update Role' : 'Create Role'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserSettings;
