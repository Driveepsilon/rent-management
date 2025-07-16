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
import { Plus, Edit, Trash2, Send, Download, FileText, Building2, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { sendEmailWithPDF } from '@/utils/enhancedEmailService';
import { generateInvoicePDF } from '@/utils/pdfGenerator';

interface TrusteeFeesArticle {
  id: number;
  description: string;
  unit_price: number;
  is_active: boolean;
  created_date: string;
}

interface TrusteeFeesInvoice {
  id: number;
  owner_id: number;
  property_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  currency: string;
  description: string;
  status: string;
  notes: string;
  created_date: string;
}

interface TrusteeFeesInvoiceItem {
  id: number;
  invoice_id: number;
  article_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

interface Owner {
  id: number;
  owner_name: string;
  email: string;
  type_of_owner: string;
}

interface Property {
  id: number;
  name: string;
  address: string;
}

const TrusteeFeesManagement: React.FC = () => {
  const [articles, setArticles] = useState<TrusteeFeesArticle[]>([]);
  const [invoices, setInvoices] = useState<TrusteeFeesInvoice[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<TrusteeFeesArticle | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<TrusteeFeesInvoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<TrusteeFeesInvoiceItem[]>([]);
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isEditInvoiceDialogOpen, setIsEditInvoiceDialogOpen] = useState(false);
  const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'articles' | 'invoices'>('articles');
  const [emailSentStatuses, setEmailSentStatuses] = useState<{ [key: number]: boolean }>({});

  const { toast } = useToast();
  const { t } = useLanguage();
  const { currency, formatCurrency } = useCurrency();

  const [articleForm, setArticleForm] = useState({
    description: '',
    unit_price: 0,
    is_active: true
  });

  const [invoiceForm, setInvoiceForm] = useState({
    owner_id: 0,
    property_id: 0,
    invoice_number: '',
    invoice_date: '',
    due_date: '',
    description: '',
    notes: '',
    status: 'pending',
    currency: currency
  });

  const [newItem, setNewItem] = useState({
    article_id: 0,
    description: '',
    quantity: 1,
    unit_price: 0
  });

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadArticles();
      loadInvoices();
      loadOwners();
      loadProperties();
    }
  }, [user]);

  useEffect(() => {
    if (invoices.length > 0) {
      checkEmailStatuses();
    }
  }, [invoices]);

  const checkEmailStatuses = async () => {
    try {
      const statuses: { [key: number]: boolean } = {};
      for (const invoice of invoices) {
        const { data, error } = await window.ezsite.apis.tablePage('27120', {
          PageNo: 1,
          PageSize: 1,
          OrderByField: 'id',
          IsAsc: false,
          Filters: [
            { name: 'invoice_id', op: 'Equal', value: invoice.id },
            { name: 'email_type', op: 'Equal', value: 'trustee_fees' },
            { name: 'status', op: 'Equal', value: 'sent' }
          ]
        });
        if (!error && data.List && data.List.length > 0) {
          statuses[invoice.id] = true;
        }
      }
      setEmailSentStatuses(statuses);
    } catch (error) {
      console.error('Error checking email statuses:', error);
    }
  };

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

  const loadArticles = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(28872, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'created_date',
        IsAsc: false,
        Filters: [
        {
          name: 'user_id',
          op: 'Equal',
          value: user.ID
        }]

      });

      if (!error && data) {
        setArticles(data.List || []);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(28873, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'created_date',
        IsAsc: false,
        Filters: [
        {
          name: 'user_id',
          op: 'Equal',
          value: user.ID
        }]

      });

      if (!error && data) {
        setInvoices(data.List || []);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
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
        }]

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
        }]

      });

      if (!error && data) {
        setProperties(data.List || []);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const loadInvoiceItems = async (invoiceId: number) => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(28874, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: true,
        Filters: [
        {
          name: 'invoice_id',
          op: 'Equal',
          value: invoiceId
        }]

      });

      if (!error && data) {
        setInvoiceItems(data.List || []);
      }
    } catch (error) {
      console.error('Error loading invoice items:', error);
    }
  };

  const saveArticle = async () => {
    try {
      const articleData = {
        ...articleForm,
        user_id: user.ID,
        created_date: new Date().toISOString()
      };

      let error;
      if (selectedArticle) {
        ({ error } = await window.ezsite.apis.tableUpdate(28872, {
          id: selectedArticle.id,
          ...articleData
        }));
      } else {
        ({ error } = await window.ezsite.apis.tableCreate(28872, articleData));
      }

      if (error) {
        throw new Error(error);
      }

      toast({
        title: t('common.success'),
        description: selectedArticle ? 'Article updated successfully' : 'Article created successfully'
      });

      setIsArticleDialogOpen(false);
      setSelectedArticle(null);
      setArticleForm({ description: '', unit_price: 0, is_active: true });
      loadArticles();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to save article',
        variant: 'destructive'
      });
    }
  };

  const saveInvoice = async () => {
    try {
      const invoiceData = {
        ...invoiceForm,
        user_id: user.ID,
        total_amount: 0, // Will be calculated from items
        created_date: new Date().toISOString()
      };

      let error;
      if (selectedInvoice) {
        ({ error } = await window.ezsite.apis.tableUpdate(28873, {
          id: selectedInvoice.id,
          ...invoiceData
        }));
      } else {
        ({ error } = await window.ezsite.apis.tableCreate(28873, invoiceData));
      }

      if (error) {
        throw new Error(error);
      }

      toast({
        title: t('common.success'),
        description: selectedInvoice ? 'Invoice updated successfully' : 'Invoice created successfully'
      });

      setIsInvoiceDialogOpen(false);
      setIsEditInvoiceDialogOpen(false);
      setSelectedInvoice(null);
      setInvoiceForm({
        owner_id: 0,
        property_id: 0,
        invoice_number: '',
        invoice_date: '',
        due_date: '',
        description: '',
        notes: '',
        status: 'pending',
        currency: currency
      });
      loadInvoices();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to save invoice',
        variant: 'destructive'
      });
    }
  };

  const handleCancelInvoice = async (invoice: TrusteeFeesInvoice) => {
    if (!confirm('Are you sure you want to cancel this trustee fees invoice? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await window.ezsite.apis.tableUpdate(28873, {
        id: invoice.id,
        ...invoice,
        status: 'cancelled'
      });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: 'Invoice cancelled successfully'
      });

      loadInvoices();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to cancel invoice',
        variant: 'destructive'
      });
    }
  };

  const addInvoiceItem = async () => {
    try {
      const selectedArticleData = articles.find((a) => a.id === newItem.article_id);
      const totalAmount = newItem.quantity * newItem.unit_price;

      const { error } = await window.ezsite.apis.tableCreate(28874, {
        invoice_id: selectedInvoice!.id,
        article_id: newItem.article_id,
        description: newItem.description || selectedArticleData?.description || '',
        quantity: newItem.quantity,
        unit_price: newItem.unit_price,
        total_amount: totalAmount
      });

      if (error) {
        throw new Error(error);
      }

      // Update invoice total
      const currentTotal = invoiceItems.reduce((sum, item) => sum + item.total_amount, 0);
      const newTotal = currentTotal + totalAmount;

      await window.ezsite.apis.tableUpdate(28873, {
        id: selectedInvoice!.id,
        total_amount: newTotal
      });

      setNewItem({
        article_id: 0,
        description: '',
        quantity: 1,
        unit_price: 0
      });

      loadInvoiceItems(selectedInvoice!.id);
      loadInvoices();

      toast({
        title: t('common.success'),
        description: 'Item added to invoice successfully'
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to add item',
        variant: 'destructive'
      });
    }
  };

  const deleteArticle = async (articleId: number) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      const { error } = await window.ezsite.apis.tableDelete(28872, { id: articleId });

      if (error) {
        throw new Error(error);
      }

      toast({
        title: t('common.success'),
        description: 'Article deleted successfully'
      });

      loadArticles();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to delete article',
        variant: 'destructive'
      });
    }
  };

  const deleteInvoice = async (invoiceId: number) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const { error } = await window.ezsite.apis.tableDelete(28873, { id: invoiceId });

      if (error) {
        throw new Error(error);
      }

      toast({
        title: t('common.success'),
        description: 'Invoice deleted successfully'
      });

      loadInvoices();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to delete invoice',
        variant: 'destructive'
      });
    }
  };

  const sendInvoiceEmail = async (invoice: TrusteeFeesInvoice) => {
    try {
      const owner = owners.find((o) => o.id === invoice.owner_id);
      const property = properties.find((p) => p.id === invoice.property_id);

      if (!owner || !property) {
        throw new Error('Owner or property not found');
      }

      const emailData = {
        to: [owner.email],
        subject: `Trustee Fees Invoice ${invoice.invoice_number}`,
        html: `
          <h2>Trustee Fees Invoice</h2>
          <p>Dear ${owner.owner_name},</p>
          <p>Please find attached your trustee fees invoice for property: ${property.name}</p>
          <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
          <p><strong>Amount:</strong> ${formatCurrency(invoice.total_amount, invoice.currency as any)}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
          <p>Thank you for your attention to this matter.</p>
        `
      };

      const pdfData = {
        type: 'invoice' as const,
        data: {
          ...invoice,
          owner,
          property,
          items: invoiceItems
        },
        filename: `trustee-fees-invoice-${invoice.invoice_number}.pdf`
      };

      const { error } = await sendEmailWithPDF(emailData, pdfData);

      if (error) {
        throw new Error(error);
      }

      toast({
        title: t('common.success'),
        description: 'Invoice sent successfully'
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to send invoice',
        variant: 'destructive'
      });
    }
  };

  const editArticle = (article: TrusteeFeesArticle) => {
    setSelectedArticle(article);
    setArticleForm({
      description: article.description,
      unit_price: article.unit_price,
      is_active: article.is_active
    });
    setIsArticleDialogOpen(true);
  };

  const editInvoice = (invoice: TrusteeFeesInvoice) => {
    setSelectedInvoice(invoice);
    setInvoiceForm({
      owner_id: invoice.owner_id,
      property_id: invoice.property_id,
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date.split('T')[0],
      due_date: invoice.due_date.split('T')[0],
      description: invoice.description,
      notes: invoice.notes,
      status: invoice.status,
      currency: invoice.currency
    });
    setIsEditInvoiceDialogOpen(true);
  };

  const openItemsDialog = (invoice: TrusteeFeesInvoice) => {
    setSelectedInvoice(invoice);
    loadInvoiceItems(invoice.id);
    setIsItemsDialogOpen(true);
  };

  const handleArticleSelect = (articleId: number) => {
    const article = articles.find((a) => a.id === articleId);
    if (article) {
      setNewItem((prev) => ({
        ...prev,
        article_id: articleId,
        description: article.description,
        unit_price: article.unit_price
      }));
    }
  };

  const canEdit = (invoice: TrusteeFeesInvoice) => {
    return invoice.status !== 'cancelled' && !emailSentStatuses[invoice.id];
  };

  const canCancel = (invoice: TrusteeFeesInvoice) => {
    return invoice.status !== 'cancelled' && invoice.status !== 'paid';
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">{t('common.loading')}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('trusteeFees.title')}</h1>
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'articles' ? 'default' : 'outline'}
            onClick={() => setActiveTab('articles')}>

            {t('trusteeFees.articles')}
          </Button>
          <Button
            variant={activeTab === 'invoices' ? 'default' : 'outline'}
            onClick={() => setActiveTab('invoices')}>

            {t('invoices.title')}
          </Button>
        </div>
      </div>

      {activeTab === 'articles' &&
      <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('trusteeFees.articles')}</h2>
            <Dialog open={isArticleDialogOpen} onOpenChange={setIsArticleDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                setSelectedArticle(null);
                setArticleForm({ description: '', unit_price: 0, is_active: true });
              }}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('trusteeFees.addArticle')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedArticle ? t('trusteeFees.editArticle') : t('trusteeFees.addArticle')}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="description">{t('trusteeFees.articleDescription')}</Label>
                    <Textarea
                    id="description"
                    value={articleForm.description}
                    onChange={(e) => setArticleForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter article description" />

                  </div>
                  <div>
                    <Label htmlFor="unitPrice">{t('trusteeFees.unitPrice')}</Label>
                    <Input
                    id="unitPrice"
                    type="number"
                    value={articleForm.unit_price}
                    onChange={(e) => setArticleForm((prev) => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00" />

                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                    type="checkbox"
                    id="isActive"
                    checked={articleForm.is_active}
                    onChange={(e) => setArticleForm((prev) => ({ ...prev, is_active: e.target.checked }))} />

                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsArticleDialogOpen(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={saveArticle}>
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {articles.map((article) =>
          <Card key={article.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{article.description}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {t('trusteeFees.unitPrice')}: {formatCurrency(article.unit_price)}
                      </p>
                      <div className="mt-2">
                        <Badge variant={article.is_active ? 'default' : 'secondary'}>
                          {article.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editArticle(article)}>

                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteArticle(article.id)}>

                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
          )}
          </div>
        </div>
      }

      {activeTab === 'invoices' &&
      <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('trusteeFees.title')}</h2>
            <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                setSelectedInvoice(null);
                setInvoiceForm({
                  owner_id: 0,
                  property_id: 0,
                  invoice_number: '',
                  invoice_date: '',
                  due_date: '',
                  description: '',
                  notes: '',
                  status: 'pending',
                  currency: currency
                });
              }}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('trusteeFees.addInvoice')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {t('trusteeFees.addInvoice')}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="owner">{t('trusteeFees.owner')}</Label>
                      <Select value={invoiceForm.owner_id.toString()} onValueChange={(value) => setInvoiceForm((prev) => ({ ...prev, owner_id: parseInt(value) }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                        <SelectContent>
                          {owners.map((owner) =>
                        <SelectItem key={owner.id} value={owner.id.toString()}>
                              {owner.owner_name}
                            </SelectItem>
                        )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="property">{t('trusteeFees.property')}</Label>
                      <Select value={invoiceForm.property_id.toString()} onValueChange={(value) => setInvoiceForm((prev) => ({ ...prev, property_id: parseInt(value) }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                        <SelectContent>
                          {properties.map((property) =>
                        <SelectItem key={property.id} value={property.id.toString()}>
                              {property.name}
                            </SelectItem>
                        )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="invoiceNumber">{t('invoices.invoiceNumber')}</Label>
                      <Input
                      id="invoiceNumber"
                      value={invoiceForm.invoice_number}
                      onChange={(e) => setInvoiceForm((prev) => ({ ...prev, invoice_number: e.target.value }))}
                      placeholder="TF-001" />

                    </div>
                    <div>
                      <Label htmlFor="currency">{t('common.currency')}</Label>
                      <Select value={invoiceForm.currency} onValueChange={(value) => setInvoiceForm((prev) => ({ ...prev, currency: value }))}>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="invoiceDate">{t('invoices.invoiceDate')}</Label>
                      <Input
                      id="invoiceDate"
                      type="date"
                      value={invoiceForm.invoice_date}
                      onChange={(e) => setInvoiceForm((prev) => ({ ...prev, invoice_date: e.target.value }))} />

                    </div>
                    <div>
                      <Label htmlFor="dueDate">{t('invoices.dueDate')}</Label>
                      <Input
                      id="dueDate"
                      type="date"
                      value={invoiceForm.due_date}
                      onChange={(e) => setInvoiceForm((prev) => ({ ...prev, due_date: e.target.value }))} />

                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">{t('common.description')}</Label>
                    <Textarea
                    id="description"
                    value={invoiceForm.description}
                    onChange={(e) => setInvoiceForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Invoice description" />

                  </div>
                  <div>
                    <Label htmlFor="notes">{t('tenants.notes')}</Label>
                    <Textarea
                    id="notes"
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes" />

                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={saveInvoice}>
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {invoices.map((invoice) => {
            const owner = owners.find((o) => o.id === invoice.owner_id);
            const property = properties.find((p) => p.id === invoice.property_id);

            return (
              <Card key={invoice.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{invoice.invoice_number}</h3>
                          <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                            {invoice.status}
                          </Badge>
                          {emailSentStatuses[invoice.id] && (
                            <Badge className="bg-blue-100 text-blue-800">
                              Email Sent
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {owner?.owner_name} - {property?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t('common.amount')}: {formatCurrency(invoice.total_amount, invoice.currency as any)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t('invoices.dueDate')}: {new Date(invoice.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openItemsDialog(invoice)}>

                          <FileText className="h-4 w-4" />
                        </Button>
                        {canEdit(invoice) && (
                          <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editInvoice(invoice)}>

                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canCancel(invoice) && (
                          <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelInvoice(invoice)}>

                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendInvoiceEmail(invoice)}>

                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteInvoice(invoice.id)}>

                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>);

          })}
          </div>
        </div>
      }

      {/* Edit Invoice Dialog */}
      <Dialog open={isEditInvoiceDialogOpen} onOpenChange={setIsEditInvoiceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t('trusteeFees.editInvoice')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="owner">{t('trusteeFees.owner')}</Label>
                <Select value={invoiceForm.owner_id.toString()} onValueChange={(value) => setInvoiceForm((prev) => ({ ...prev, owner_id: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) =>
                  <SelectItem key={owner.id} value={owner.id.toString()}>
                        {owner.owner_name}
                      </SelectItem>
                  )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="property">{t('trusteeFees.property')}</Label>
                <Select value={invoiceForm.property_id.toString()} onValueChange={(value) => setInvoiceForm((prev) => ({ ...prev, property_id: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) =>
                  <SelectItem key={property.id} value={property.id.toString()}>
                        {property.name}
                      </SelectItem>
                  )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceNumber">{t('invoices.invoiceNumber')}</Label>
                <Input
                id="invoiceNumber"
                value={invoiceForm.invoice_number}
                onChange={(e) => setInvoiceForm((prev) => ({ ...prev, invoice_number: e.target.value }))}
                placeholder="TF-001" />
              </div>
              <div>
                <Label htmlFor="currency">{t('common.currency')}</Label>
                <Select value={invoiceForm.currency} onValueChange={(value) => setInvoiceForm((prev) => ({ ...prev, currency: value }))}>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceDate">{t('invoices.invoiceDate')}</Label>
                <Input
                id="invoiceDate"
                type="date"
                value={invoiceForm.invoice_date}
                onChange={(e) => setInvoiceForm((prev) => ({ ...prev, invoice_date: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="dueDate">{t('invoices.dueDate')}</Label>
                <Input
                id="dueDate"
                type="date"
                value={invoiceForm.due_date}
                onChange={(e) => setInvoiceForm((prev) => ({ ...prev, due_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label htmlFor="description">{t('common.description')}</Label>
              <Textarea
              id="description"
              value={invoiceForm.description}
              onChange={(e) => setInvoiceForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Invoice description" />
            </div>
            <div>
              <Label htmlFor="notes">{t('tenants.notes')}</Label>
              <Textarea
              id="notes"
              value={invoiceForm.notes}
              onChange={(e) => setInvoiceForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes" />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditInvoiceDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={saveInvoice}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Items Dialog */}
      <Dialog open={isItemsDialogOpen} onOpenChange={setIsItemsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {t('trusteeFees.invoiceItems')} - {selectedInvoice?.invoice_number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add New Item */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Add New Item</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="article">Article</Label>
                  <Select value={newItem.article_id.toString()} onValueChange={(value) => handleArticleSelect(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select article" />
                    </SelectTrigger>
                    <SelectContent>
                      {articles.filter((a) => a.is_active).map((article) =>
                      <SelectItem key={article.id} value={article.id.toString()}>
                          {article.description}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">{t('trusteeFees.quantity')}</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
                    min="1" />

                </div>
                <div>
                  <Label htmlFor="unitPrice">{t('trusteeFees.unitPrice')}</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00" />

                </div>
                <div className="flex items-end">
                  <Button onClick={addInvoiceItem} disabled={!newItem.article_id}>
                    {t('common.add')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              {invoiceItems.map((item) =>
              <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} × {formatCurrency(item.unit_price)} = {formatCurrency(item.total_amount)}
                    </p>
                  </div>
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {


                    // Delete item logic can be added here
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>)}
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">{t('trusteeFees.total')}:</span>
                <span className="text-lg font-bold">
                  {formatCurrency(invoiceItems.reduce((sum, item) => sum + item.total_amount, 0))}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

};

export default TrusteeFeesManagement;