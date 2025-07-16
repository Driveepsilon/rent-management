import React, { createContext, useContext, useState, useEffect } from 'react';

export type Currency = 'USD' | 'EUR' | 'XOF';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number, currencyCode?: Currency) => string;
  getCurrencySymbol: (currencyCode?: Currency) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    const savedCurrency = localStorage.getItem('currency');
    return (savedCurrency as Currency) || 'USD';
  });

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const getCurrencySymbol = (currencyCode?: Currency): string => {
    const code = currencyCode || currency;
    switch (code) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'XOF':
        return 'CFA';
      default:
        return '$';
    }
  };

  const formatCurrency = (amount: number, currencyCode?: Currency): string => {
    const code = currencyCode || currency;
    const symbol = getCurrencySymbol(code);
    
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    if (code === 'XOF') {
      return `${formatter.format(amount)} ${symbol}`;
    }
    
    return `${symbol}${formatter.format(amount)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, getCurrencySymbol }}>
      {children}
    </CurrencyContext.Provider>
  );
};