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
import { Plus, Edit, Trash2, MapPin, Home, Search, DollarSign, Bed, Bath, Globe, Building, Wifi, Car, Waves, Shield, Users, Settings, Dumbbell } from 'lucide-react';

interface Property {
  id: number;
  name: string;
  address: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  monthly_rent: number;
  security_deposit: number;
  status: string;
  description: string;
  image_url: string;
  website: string;
  floor: string;
  collective_services: string;
  nature: string;
  user_id: number;
}

const PropertyManagement: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    residence: '',
    property_type: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    square_feet: 0,
    monthly_rent: 0,
    security_deposit: 0,
    status: 'available',
    description: '',
    image_url: '',
    website: '',
    floor: '',
    collective_services: [] as string[],
    nature: ''
  });

  const collectiveServiceOptions = [
  'Air-conditioned rooms and living rooms',
  'Equipped kitchens',
  'Gym',
  'Generator',
  'Water tank',
  'Elevator and freight elevator',
  'Parking on the ground floor and basement',
  'Swimming pool',
  'On-site syndic',
  'Video surveillance',
  'Concierge service',
  'Continuous cleaning service',
  'Security',
  'Fiber optics'];


  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'Gym':return <Dumbbell className="h-4 w-4" />;
      case 'Swimming pool':return <Waves className="h-4 w-4" />;
      case 'Parking on the ground floor and basement':return <Car className="h-4 w-4" />;
      case 'Fiber optics':return <Wifi className="h-4 w-4" />;
      case 'Security':return <Shield className="h-4 w-4" />;
      case 'Concierge service':return <Users className="h-4 w-4" />;
      case 'Video surveillance':return <Shield className="h-4 w-4" />;
      case 'Elevator and freight elevator':return <Building className="h-4 w-4" />;
      default:return <Settings className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const { data: userData, error: userError } = await window.ezsite.apis.getUserInfo();
      if (userError) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to view properties.',
          variant: 'destructive'
        });
        return;
      }

      const { data, error } = await window.ezsite.apis.tablePage('26865', {
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

      setProperties(data?.List || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load properties',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.address) {
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

      const propertyData = {
        ...formData,
        collective_services: JSON.stringify(formData.collective_services),
        user_id: userData.ID
      };

      if (editingProperty) {
        const { error } = await window.ezsite.apis.tableUpdate('26865', {
          ID: editingProperty.id,
          ...propertyData
        });

        if (error) {
          toast({
            title: 'Error',
            description: error,
            variant: 'destructive'
          });
          return;
        }

        toast({
          title: 'Success',
          description: 'Property updated successfully'
        });
      } else {
        const { error } = await window.ezsite.apis.tableCreate('26865', propertyData);

        if (error) {
          toast({
            title: 'Error',
            description: error,
            variant: 'destructive'
          });
          return;
        }

        toast({
          title: 'Success',
          description: 'Property added successfully'
        });
      }

      resetForm();
      setEditingProperty(null);
      setShowAddDialog(false);
      loadProperties();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save property',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      residence: '',
      property_type: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
      square_feet: 0,
      monthly_rent: 0,
      security_deposit: 0,
      status: 'available',
      description: '',
      image_url: '',
      website: '',
      floor: '',
      collective_services: [],
      nature: ''
    });
  };

  const handleEdit = (property: Property) => {
    let services: string[] = [];
    try {
      services = property.collective_services ? JSON.parse(property.collective_services) : [];
    } catch (e) {
      services = [];
    }

    setFormData({
      name: property.name,
      address: property.address,
      residence: property.residence || '',
      property_type: property.property_type,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      square_feet: property.square_feet,
      monthly_rent: property.monthly_rent,
      security_deposit: property.security_deposit,
      status: property.status,
      description: property.description,
      image_url: property.image_url,
      website: property.website || '',
      floor: property.floor || '',
      collective_services: services,
      nature: property.nature || ''
    });
    setEditingProperty(property);
    setShowAddDialog(true);
  };

  const handleDelete = async (property: Property) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const { error } = await window.ezsite.apis.tableDelete('26865', { ID: property.id });

      if (error) {
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Property deleted successfully'
      });

      loadProperties();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete property',
        variant: 'destructive'
      });
    }
  };

  const handleServiceToggle = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      collective_services: prev.collective_services.includes(service) ?
      prev.collective_services.filter((s) => s !== service) :
      [...prev.collective_services, service]
    }));
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.property_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || property.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':return 'bg-green-100 text-green-800';
      case 'occupied':return 'bg-blue-100 text-blue-800';
      case 'maintenance':return 'bg-yellow-100 text-yellow-800';
      default:return 'bg-gray-100 text-gray-800';
    }
  };

  const getPropertyServices = (servicesStr: string) => {
    try {
      return servicesStr ? JSON.parse(servicesStr) : [];
    } catch (e) {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingProperty(null);
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProperty ? 'Edit Property' : 'Add New Property'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Property Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required />

                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..." />

                </div>
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required />

              </div>

              <div>
                <Label htmlFor="residence">Residence</Label>
                <Input
                  id="residence"
                  value={formData.residence}
                  onChange={(e) => setFormData({ ...formData, residence: e.target.value })}
                  placeholder="e.g., Residential Complex, Building Name" />

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="property_type">Property Type</Label>
                  <Select value={formData.property_type} onValueChange={(value) => setFormData({ ...formData, property_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="floor">Floor</Label>
                  <Input
                    id="floor"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    placeholder="e.g., 2nd Floor, Ground Floor" />

                </div>
                <div>
                  <Label htmlFor="nature">Nature</Label>
                  <Select value={formData.nature} onValueChange={(value) => setFormData({ ...formData, nature: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select nature" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="furnished">Furnished</SelectItem>
                      <SelectItem value="unfurnished">Unfurnished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="square_feet">Square Feet</Label>
                  <Input
                    id="square_feet"
                    type="number"
                    min="0"
                    value={formData.square_feet}
                    onChange={(e) => setFormData({ ...formData, square_feet: parseInt(e.target.value) || 0 })} />

                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="0"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })} />

                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="0"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 0 })} />

                </div>
                <div>
                  <Label htmlFor="monthly_rent">Monthly Rent ($)</Label>
                  <Input
                    id="monthly_rent"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.monthly_rent}
                    onChange={(e) => setFormData({ ...formData, monthly_rent: parseFloat(e.target.value) || 0 })} />

                </div>
              </div>

              <div>
                <Label htmlFor="security_deposit">Security Deposit ($)</Label>
                <Input
                  id="security_deposit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.security_deposit}
                  onChange={(e) => setFormData({ ...formData, security_deposit: parseFloat(e.target.value) || 0 })} />

              </div>

              <div>
                <Label>Collective Services</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded p-3">
                  {collectiveServiceOptions.map((service) =>
                  <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                      id={service}
                      checked={formData.collective_services.includes(service)}
                      onCheckedChange={() => handleServiceToggle(service)} />

                      <Label htmlFor={service} className="text-sm">
                        {service}
                      </Label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3} />

              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProperty ? 'Update' : 'Add'} Property
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
            placeholder="Search properties..."
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
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Property Cards */}
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
      filteredProperties.length === 0 ?
      <Card>
          <CardContent className="text-center py-8">
            <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No properties found</p>
          </CardContent>
        </Card> :

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => {
          const services = getPropertyServices(property.collective_services);
          return (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                    <Badge className={getStatusColor(property.status)}>
                      {property.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{property.address}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <span className="capitalize">{property.property_type}</span>
                    {property.floor && <span>Floor: {property.floor}</span>}
                  </div>

                  {property.website &&
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Globe className="h-4 w-4" />
                      <a href={property.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Website
                      </a>
                    </div>
                }

                  {property.nature &&
                <div className="text-sm text-gray-600">
                      <span className="font-medium">Nature:</span> {property.nature}
                    </div>
                }

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Bed className="h-4 w-4" />
                      <span>{property.bedrooms} bed</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Bath className="h-4 w-4" />
                      <span>{property.bathrooms} bath</span>
                    </div>
                    {property.square_feet > 0 &&
                  <span>{property.square_feet} sqft</span>
                  }
                  </div>

                  <div className="flex items-center space-x-2 text-sm font-semibold text-gray-900">
                    <DollarSign className="h-4 w-4" />
                    <span>${property.monthly_rent.toLocaleString()}/month</span>
                  </div>

                  {services.length > 0 &&
                <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-700">Services:</div>
                      <div className="flex flex-wrap gap-1">
                        {services.slice(0, 3).map((service: string) =>
                    <div key={service} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-xs">
                            {getServiceIcon(service)}
                            <span>{service}</span>
                          </div>
                    )}
                        {services.length > 3 &&
                    <div className="bg-gray-100 px-2 py-1 rounded text-xs">
                            +{services.length - 3} more
                          </div>
                    }
                      </div>
                    </div>
                }

                  {property.description &&
                <p className="text-sm text-gray-500 line-clamp-2">{property.description}</p>
                }

                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(property)}>

                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(property)}
                    className="text-red-600 hover:text-red-700">

                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>);

        })}
        </div>
      }
    </div>);

};

export default PropertyManagement;