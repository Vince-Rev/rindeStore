import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import type { ExpenseFilters as ExpenseFiltersType, ExpenseStatus, ExpenseCategory } from '../../types/expense';

interface ExpenseFiltersProps {
  filters: ExpenseFiltersType;
  onFilterChange: (filters: ExpenseFiltersType) => void;
}

const categories: ExpenseCategory[] = ['travel', 'food', 'supplies', 'equipment', 'services', 'other'];
const statuses: ExpenseStatus[] = ['pending', 'approved', 'rejected'];

const categoryLabels: Record<ExpenseCategory, string> = {
  travel: 'Viajes',
  food: 'Alimentación',
  supplies: 'Suministros',
  equipment: 'Equipamiento',
  services: 'Servicios',
  other: 'Otros'
};

const statusLabels: Record<ExpenseStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado'
};

export function ExpenseFilters({ filters, onFilterChange }: ExpenseFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value });
  };

  const handleCategoryChange = (category: ExpenseCategory | '') => {
    onFilterChange({ ...filters, category: category || undefined });
  };

  const handleStatusChange = (status: ExpenseStatus | '') => {
    onFilterChange({ ...filters, status: status || undefined });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFilterChange({ ...filters, [field]: value || undefined });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = filters.search || filters.category || filters.status || filters.startDate || filters.endDate;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar gastos..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Category Select */}
        <div className="relative min-w-[140px]">
          <select
            value={filters.category || ''}
            onChange={(e) => handleCategoryChange(e.target.value as ExpenseCategory | '')}
            className="w-full pl-3 pr-8 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
          >
            <option value="">Categoría</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{categoryLabels[cat]}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>

        {/* Status Select */}
        <div className="relative min-w-[130px]">
          <select
            value={filters.status || ''}
            onChange={(e) => handleStatusChange(e.target.value as ExpenseStatus | '')}
            className="w-full pl-3 pr-8 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
          >
            <option value="">Estado</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{statusLabels[status]}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>

        {/* Advanced Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${
            showAdvanced 
              ? 'bg-primary-50 border-primary-300 text-primary-700' 
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Fechas</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        )}
      </div>

      {/* Date Filters - Collapsible */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500 font-medium">Rango:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
