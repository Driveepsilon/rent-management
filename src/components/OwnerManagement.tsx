import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, User, Building, Phone, Mail, MapPin, Users } from 'lucide-react';

interface Owner {
  id: number;
  user_id: number;
  type_of_owner: string;
  owner_name: string;
  email: string;
  address: string;
  property_id: number;
  phone: string;
  notes: string;
  status: string;
  created_date: string;
}

interface OwnerContact {
  id: number;
  owner_id: number;
  user_id: number;
  contact_name: string;
  contact_email: string;
  contact_address: string;
  contact_phone: string;
  position: string;
  is_primary: boolean;
}

interface Property {
  id: number;
  name: string;
  address: string;
}

const OwnerManagement: React.FC = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contacts, setContacts] = useState<OwnerContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const [ownerContacts, setOwnerContacts] = useState<OwnerContact[]>([]);

  const [formData, setFormData] = useState({
    type_of_owner: 'individual',
    owner_name: '',
    email: '',
    address: '',
    property_id: '',
    phone: '',
    notes: '',
    status: 'active'
  });

  const [contactFormData, setContactFormData] = useState({
    contact_name: '',
    contact_email: '',
    contact_address: '',
    contact_phone: '',
    position: '',
    is_primary: false
  });

  const { toast } = useToast();

  // Table IDs - these would need to be set based on your actual table IDs
  const OWNERS_TABLE_ID = 28844; // Owners table ID
  const OWNER_CONTACTS_TABLE_ID = 28845; // Owner contacts table ID
  const PROPERTIES_TABLE_ID = 26865; // From the provided table definitions

  const fetchOwners = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(OWNERS_TABLE_ID, {
        PageNo: 1,
        PageSize: 50,
        OrderByField: 'created_date',
        IsAsc: false,
        Filters: []
      });

      if (error) throw error;
      setOwners(data.List || []);
    } catch (error) {
      console.error('Error fetching owners:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch owners',
        variant: 'destructive'
      });
    }
  };

  const fetchProperties = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(PROPERTIES_TABLE_ID, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'name',
        IsAsc: true,
        Filters: []
      });

      if (error) throw error;
      setProperties(data.List || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch properties',
        variant: 'destructive'
      });
    }
  };

  const fetchOwnerContacts = async (ownerId: number) => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(OWNER_CONTACTS_TABLE_ID, {
        PageNo: 1,
        PageSize: 50,
        OrderByField: 'contact_name',
        IsAsc: true,
        Filters: [
        {
          name: 'owner_id',
          op: 'Equal',
          value: ownerId
        }]

      });

      if (error) throw error;
      setOwnerContacts(data.List || []);
    } catch (error) {
      console.error('Error fetching owner contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch owner contacts',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchOwners(), fetchProperties()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleAddOwner = async () => {
    try {
      const { error } = await window.ezsite.apis.tableCreate(OWNERS_TABLE_ID, {
        ...formData,
        property_id: parseInt(formData.property_id),
        user_id: 1, // This should be the current user ID
        created_date: new Date().toISOString()
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Owner added successfully'
      });

      setIsAddDialogOpen(false);
      setFormData({
        type_of_owner: 'individual',
        owner_name: '',
        email: '',
        address: '',
        property_id: '',
        phone: '',
        notes: '',
        status: 'active'
      });
      await fetchOwners();
    } catch (error) {
      console.error('Error adding owner:', error);
      toast({
        title: 'Error',
        description: 'Failed to add owner',
        variant: 'destructive'
      });
    }
  };

  const handleEditOwner = async () => {
    if (!selectedOwner) return;

    try {
      const { error } = await window.ezsite.apis.tableUpdate(OWNERS_TABLE_ID, {
        id: selectedOwner.id,
        ...formData,
        property_id: parseInt(formData.property_id),
        user_id: selectedOwner.user_id
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Owner updated successfully'
      });

      setIsEditDialogOpen(false);
      setSelectedOwner(null);
      await fetchOwners();
    } catch (error) {
      console.error('Error updating owner:', error);
      toast({
        title: 'Error',
        description: 'Failed to update owner',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteOwner = async (ownerId: number) => {
    if (!confirm('Are you sure you want to delete this owner?')) return;

    try {
      const { error } = await window.ezsite.apis.tableDelete(OWNERS_TABLE_ID, { id: ownerId });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Owner deleted successfully'
      });

      await fetchOwners();
    } catch (error) {
      console.error('Error deleting owner:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete owner',
        variant: 'destructive'
      });
    }
  };

  const handleAddContact = async () => {
    if (!selectedOwnerId) return;

    try {
      const { error } = await window.ezsite.apis.tableCreate(OWNER_CONTACTS_TABLE_ID, {
        ...contactFormData,
        owner_id: selectedOwnerId,
        user_id: 1 // This should be the current user ID
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Contact added successfully'
      });

      setContactFormData({
        contact_name: '',
        contact_email: '',
        contact_address: '',
        contact_phone: '',
        position: '',
        is_primary: false
      });
      await fetchOwnerContacts(selectedOwnerId);
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to add contact',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const { error } = await window.ezsite.apis.tableDelete(OWNER_CONTACTS_TABLE_ID, { id: contactId });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Contact deleted successfully'
      });

      if (selectedOwnerId) {
        await fetchOwnerContacts(selectedOwnerId);
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete contact',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (owner: Owner) => {
    setSelectedOwner(owner);
    setFormData({
      type_of_owner: owner.type_of_owner,
      owner_name: owner.owner_name,
      email: owner.email,
      address: owner.address,
      property_id: owner.property_id.toString(),
      phone: owner.phone,
      notes: owner.notes,
      status: owner.status
    });
    setIsEditDialogOpen(true);
  };

  const openContactsDialog = (ownerId: number) => {
    setSelectedOwnerId(ownerId);
    setIsContactDialogOpen(true);
    fetchOwnerContacts(ownerId);
  };

  const getPropertyName = (propertyId: number) => {
    const property = properties.find((p) => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Owner Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Owner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Owner</DialogTitle>
              <DialogDescription>
                Create a new property owner record
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type_of_owner">Type of Owner</Label>
                  <Select
                    value={formData.type_of_owner}
                    onValueChange={(value) => setFormData({ ...formData, type_of_owner: value })}>

                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="owner_name">Owner Name</Label>
                  <Input
                    id="owner_name"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    placeholder="Enter owner name" />

                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address" />

                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number" />

                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter owner address" />

              </div>
              <div>
                <Label htmlFor="property_id">Property</Label>
                <Select
                  value={formData.property_id}
                  onValueChange={(value) => setFormData({ ...formData, property_id: value })}>

                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) =>
                    <SelectItem key={property.id} value={property.id.toString()}>
                        {property.name} - {property.address}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about the owner" />

              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}>

                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}>

                Cancel
              </Button>
              <Button onClick={handleAddOwner}>Add Owner</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {owners.map((owner) =>
        <Card key={owner.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {owner.type_of_owner === 'company' ?
                  <Building className="w-5 h-5" /> :

                  <User className="w-5 h-5" />
                  }
                    {owner.owner_name}
                  </CardTitle>
                  <CardDescription>
                    {getPropertyName(owner.property_id)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={owner.status === 'active' ? 'default' : 'secondary'}>
                    {owner.status}
                  </Badge>
                  <Badge variant="outline">
                    {owner.type_of_owner}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{owner.email}</span>
                </div>
                {owner.phone &&
              <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{owner.phone}</span>
                  </div>
              }
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{owner.address}</span>
                </div>
                {owner.notes &&
              <div className="text-sm text-gray-600">
                    <strong>Notes:</strong> {owner.notes}
                  </div>
              }
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                variant="outline"
                size="sm"
                onClick={() => openContactsDialog(owner.id)}>

                  <Users className="w-4 h-4 mr-2" />
                  Contacts
                </Button>
                <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(owner)}>

                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteOwner(owner.id)}>

                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Owner Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Owner</DialogTitle>
            <DialogDescription>
              Update owner information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type_of_owner">Type of Owner</Label>
                <Select
                  value={formData.type_of_owner}
                  onValueChange={(value) => setFormData({ ...formData, type_of_owner: value })}>

                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="owner_name">Owner Name</Label>
                <Input
                  id="owner_name"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  placeholder="Enter owner name" />

              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address" />

              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number" />

              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter owner address" />

            </div>
            <div>
              <Label htmlFor="property_id">Property</Label>
              <Select
                value={formData.property_id}
                onValueChange={(value) => setFormData({ ...formData, property_id: value })}>

                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) =>
                  <SelectItem key={property.id} value={property.id.toString()}>
                      {property.name} - {property.address}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about the owner" />

            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}>

                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}>

              Cancel
            </Button>
            <Button onClick={handleEditOwner}>Update Owner</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contacts Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Owner Contacts</DialogTitle>
            <DialogDescription>
              Manage contact persons for this owner
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Add Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact_name">Contact Name</Label>
                      <Input
                        id="contact_name"
                        value={contactFormData.contact_name}
                        onChange={(e) => setContactFormData({ ...contactFormData, contact_name: e.target.value })}
                        placeholder="Enter contact name" />

                    </div>
                    <div>
                      <Label htmlFor="contact_email">Contact Email</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={contactFormData.contact_email}
                        onChange={(e) => setContactFormData({ ...contactFormData, contact_email: e.target.value })}
                        placeholder="Enter contact email" />

                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact_phone">Contact Phone</Label>
                      <Input
                        id="contact_phone"
                        value={contactFormData.contact_phone}
                        onChange={(e) => setContactFormData({ ...contactFormData, contact_phone: e.target.value })}
                        placeholder="Enter contact phone" />

                    </div>
                    <div>
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        value={contactFormData.position}
                        onChange={(e) => setContactFormData({ ...contactFormData, position: e.target.value })}
                        placeholder="Enter position/role" />

                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contact_address">Contact Address</Label>
                    <Textarea
                      id="contact_address"
                      value={contactFormData.contact_address}
                      onChange={(e) => setContactFormData({ ...contactFormData, contact_address: e.target.value })}
                      placeholder="Enter contact address" />

                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleAddContact}>Add Contact</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contacts List */}
            <div className="space-y-2">
              <h3 className="font-medium">Existing Contacts</h3>
              {ownerContacts.length === 0 ?
              <p className="text-gray-500">No contacts added yet.</p> :

              ownerContacts.map((contact) =>
              <Card key={contact.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <strong>{contact.contact_name}</strong>
                            {contact.is_primary &&
                        <Badge variant="default" className="text-xs">Primary</Badge>
                        }
                          </div>
                          {contact.position &&
                      <div className="text-sm text-gray-600">
                              <strong>Position:</strong> {contact.position}
                            </div>
                      }
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{contact.contact_email}</span>
                          </div>
                          {contact.contact_phone &&
                      <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{contact.contact_phone}</span>
                            </div>
                      }
                          {contact.contact_address &&
                      <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{contact.contact_address}</span>
                            </div>
                      }
                        </div>
                        <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteContact(contact.id)}>

                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
              )
              }
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsContactDialogOpen(false)}>

              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

};

export default OwnerManagement;