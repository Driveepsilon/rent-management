import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Home, 
  Users, 
  Building, 
  FileText, 
  Receipt, 
  FileCheck, 
  TrendingUp, 
  BarChart3,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Globe,
  DollarSign,
  Calendar,
  Building2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();

  const navigationItems = [
    { path: '/', icon: Home, label: t('navigation.dashboard') },
    { path: '/tenants', icon: Users, label: t('navigation.tenants') },
    { path: '/properties', icon: Building, label: t('navigation.properties') },
    { path: '/invoices', icon: FileText, label: t('navigation.invoices') },
    { path: '/receipts', icon: Receipt, label: t('navigation.receipts') },
    { path: '/leases', icon: FileCheck, label: t('navigation.leases') },
    { path: '/expenses', icon: TrendingUp, label: t('navigation.expenses') },
    { path: '/reports', icon: BarChart3, label: t('navigation.reports') },
    { path: '/owners', icon: UserCheck, label: t('navigation.owners') },
    { path: '/trustee-fees', icon: Building2, label: t('navigation.trusteeFees') },
    { path: '/periodic-invoices', icon: Calendar, label: t('navigation.periodicInvoices') },
    { path: '/notifications', icon: Bell, label: t('navigation.notifications') },
  ];

  useEffect(() => {
    checkAuth();
    if (user) {
      loadNotifications();
    }
  }, [user?.ID]);

  const checkAuth = async () => {
    try {
      const { data, error } = await window.ezsite.apis.getUserInfo();
      if (error) {
        setUser(null);
        navigate('/login');
      } else {
        setUser(data);
      }
    } catch (error) {
      setUser(null);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (!user?.ID) return;
    
    try {
      const { data, error } = await window.ezsite.apis.tablePage(28877, {
        PageNo: 1,
        PageSize: 10,
        OrderByField: 'created_date',
        IsAsc: false,
        Filters: [
          {
            name: 'user_id',
            op: 'Equal',
            value: user.ID
          },
          {
            name: 'is_read',
            op: 'Equal',
            value: false
          }
        ]
      });

      if (!error && data) {
        setNotifications(data.List || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await window.ezsite.apis.logout();
      setUser(null);
      navigate('/login');
      toast({
        title: t('common.success'),
        description: 'Logged out successfully',
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'Failed to logout',
        variant: 'destructive',
      });
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      const { error } = await window.ezsite.apis.tableUpdate(28877, {
        id: notificationId,
        is_read: true
      });

      if (!error) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Property Manager</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-20">
                  <Globe className="h-4 w-4 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="fr">FR</SelectItem>
                </SelectContent>
              </Select>

              {/* Currency Selector */}
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-24">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="XOF">XOF</SelectItem>
                </SelectContent>
              </Select>

              {/* Notifications */}
              <div className="relative">
                <Button variant="ghost" size="sm" onClick={loadNotifications}>
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                      {notifications.length}
                    </Badge>
                  )}
                </Button>
                
                {notifications.length > 0 && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border max-h-96 overflow-y-auto z-50">
                    <div className="p-3 border-b">
                      <h3 className="font-medium text-sm">{t('notifications.title')}</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className="font-medium text-sm">{notification.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{notification.message}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(notification.created_date).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">{user.Name}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;