import React from 'react';
import { ReportCategory } from '../../types';
import {
  Car,
  Trash2,
  Lightbulb,
  Droplets,
  Waves,
  Dog,
  AlertCircle,
} from 'lucide-react';

interface CategoryIconProps {
  category: ReportCategory | string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, className = 'w-5 h-5' }) => {
  switch (category) {
    case 'Pothole':
      return <Car className={className} />;
    case 'Garbage':
      return <Trash2 className={className} />;
    case 'Streetlight':
      return <Lightbulb className={className} />;
    case 'Water Leak':
      return <Droplets className={className} />;
    case 'Drainage':
      return <Waves className={className} />;
    case 'Stray Animal':
      return <Dog className={className} />;
    default:
      return <AlertCircle className={className} />;
  }
};
