import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import TenantManagement from '@/components/TenantManagement';
import PropertyManagement from '@/components/PropertyManagement';
import InvoiceManagement from '@/components/InvoiceManagement';
import ReceiptManagement from '@/components/ReceiptManagement';
import LeaseAgreements from '@/components/LeaseAgreements';
import EmailHistory from '@/components/EmailHistory';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () =>
<QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/tenants" element={<Layout><TenantManagement /></Layout>} />
          <Route path="/properties" element={<Layout><PropertyManagement /></Layout>} />
          <Route path="/invoices" element={<Layout><InvoiceManagement /></Layout>} />
          <Route path="/receipts" element={<Layout><ReceiptManagement /></Layout>} />
          <Route path="/leases" element={<Layout><LeaseAgreements /></Layout>} />
          <Route path="/email-history" element={<Layout><EmailHistory /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>;

export default App;