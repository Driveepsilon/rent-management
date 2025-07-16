import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Home,
  Users,
  Building,
  FileText,
  Receipt,
  CreditCard,
  FileCheck,
  Menu,
  X,
  Mail,
  BarChart3 } from
'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);

  const navigationItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/tenants', label: 'Tenants', icon: Users },
  { href: '/properties', label: 'Properties', icon: Building },
  { href: '/leases', label: 'Lease Agreements', icon: FileCheck },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/receipts', label: 'Receipts', icon: Receipt },
  { href: '/expenses', label: 'Expenses', icon: CreditCard },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/email-history', label: 'Email History', icon: Mail }];


  React.useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data, error } = await window.ezsite.apis.getUserInfo();
      if (error) {
        console.log('User not authenticated');
        return;
      }
      setUser(data);
    } catch (error) {
      console.log('Auth check failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await window.ezsite.apis.logout();
      if (error) {
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive'
        });
        return;
      }
      setUser(null);
      toast({
        title: 'Success',
        description: 'Logged out successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log out',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Building className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">PropertyPro</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.href ?
                    'bg-blue-100 text-blue-700' :
                    'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
                    }>

                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>);

              })}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {user ?
              <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">Welcome, {user.Name}</span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div> :

              <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/register">Register</Link>
                  </Button>
                </div>
              }

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>

                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen &&
        <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  location.pathname === item.href ?
                  'bg-blue-100 text-blue-700' :
                  'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}>

                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>);

            })}
            </div>
          </div>
        }
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>);

};

export default Layout;