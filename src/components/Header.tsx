import { Package, ShoppingCart, History } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';

interface HeaderProps {
  cartItemCount: number;
  activeTab: 'inventory' | 'billing' | 'history';
  onTabChange: (tab: 'inventory' | 'billing' | 'history') => void;
}

export function Header({ cartItemCount, activeTab, onTabChange }: HeaderProps) {
  const { t } = useLanguage();
  
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{t('app.title')}</h1>
              <p className="text-xs text-muted-foreground">{t('app.subtitle')}</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-2">
            <button
              onClick={() => onTabChange('inventory')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'inventory'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                {t('nav.inventory')}
              </span>
            </button>
            <button
              onClick={() => onTabChange('billing')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                activeTab === 'billing'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                {t('nav.billing')}
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-success text-success-foreground text-xs rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => onTabChange('history')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <span className="flex items-center gap-2">
                <History className="w-4 h-4" />
                {t('nav.history')}
              </span>
            </button>
            <LanguageToggle />
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
