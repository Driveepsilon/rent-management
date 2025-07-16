import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, X, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_date: string;
  reference_id: number;
  reference_type: string;
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadNotifications();
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

  const loadNotifications = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(28877, {
        PageNo: 1,
        PageSize: 50,
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
        setNotifications(data.List || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const { error } = await window.ezsite.apis.tableUpdate(28877, {
        id: notificationId,
        is_read: true
      });

      if (!error) {
        setNotifications((prev) =>
        prev.map((n) => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        toast({
          title: t('common.success'),
          description: t('notifications.markAsRead')
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.is_read);

      for (const notification of unreadNotifications) {
        await window.ezsite.apis.tableUpdate(28877, {
          id: notification.id,
          is_read: true
        });
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast({
        title: t('common.success'),
        description: t('notifications.markAllAsRead')
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const { error } = await window.ezsite.apis.tableDelete(28877, { id: notificationId });

      if (!error) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        toast({
          title: t('common.success'),
          description: 'Notification deleted successfully'
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invoice_generated':
      case 'periodic_rent_setup':
      case 'periodic_trustee_fees_setup':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'payment_due':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'payment_received':
        return <Check className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'invoice_generated':
        return t('notifications.invoiceGenerated');
      case 'payment_due':
        return t('notifications.paymentDue');
      case 'payment_received':
        return t('notifications.paymentReceived');
      case 'periodic_rent_setup':
        return 'Periodic Rent Setup';
      case 'periodic_trustee_fees_setup':
        return 'Periodic Trustee Fees Setup';
      default:
        return type.replace('_', ' ').toUpperCase();
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">{t('common.loading')}</div>;
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">{t('notifications.title')}</h1>
          {unreadCount > 0 &&
          <Badge variant="destructive">{unreadCount} unread</Badge>
          }
        </div>
        {unreadCount > 0 &&
        <Button onClick={markAllAsRead} variant="outline">
            <Check className="h-4 w-4 mr-2" />
            {t('notifications.markAllAsRead')}
          </Button>
        }
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ?
        <Card>
            <CardContent className="py-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t('notifications.noNotifications')}</p>
            </CardContent>
          </Card> :

        notifications.map((notification) =>
        <Card key={notification.id} className={`${!notification.is_read ? 'border-blue-200 bg-blue-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-sm">{notification.title}</h3>
                        {!notification.is_read &&
                    <Badge variant="secondary" className="text-xs">New</Badge>
                    }
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{getNotificationTypeLabel(notification.notification_type)}</span>
                        <span>{new Date(notification.created_date).toLocaleDateString()}</span>
                        <span>{new Date(notification.created_date).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.is_read &&
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAsRead(notification.id)}>

                        <Check className="h-4 w-4" />
                      </Button>
                }
                    <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNotification(notification.id)}>

                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
        )
        }
      </div>
    </div>);

};

export default NotificationCenter;