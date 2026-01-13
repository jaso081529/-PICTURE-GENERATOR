import React from 'react';
import { BrandProfile } from '../types';
import { Flame, ShoppingBag, Palette, Mic2, Star, CheckCircle } from 'lucide-react';

interface BrandCardProps {
  brand: BrandProfile;
  isSelected: boolean;
  onClick: () => void;
}

const BrandCard: React.FC<BrandCardProps> = ({ brand, isSelected, onClick }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-6 h-6" />;
      case 'ShoppingBag': return <ShoppingBag className="w-6 h-6" />;
      case 'Palette': return <Palette className="w-6 h-6" />;
      case 'Mic2': return <Mic2 className="w-6 h-6" />;
      default: return <Star className="w-6 h-6" />;
    }
  };

  return (
    <button
      onClick={onClick}
      className={`relative group flex flex-col items-start p-5 rounded-xl border transition-all duration-300 text-left w-full h-full
        ${isSelected 
          ? 'bg-brand-surface border-brand-red ring-1 ring-brand-red shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
          : 'bg-brand-surface/50 border-zinc-800 hover:border-zinc-600 hover:bg-brand-surface'
        }
      `}
    >
      <div className={`mb-3 p-3 rounded-lg ${isSelected ? 'bg-brand-red text-white' : 'bg-zinc-800 text-zinc-400 group-hover:text-white'}`}>
        {getIcon(brand.icon)}
      </div>
      
      <h3 className="text-lg font-bold text-white mb-1">{brand.name}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{brand.description}</p>
      
      {isSelected && (
        <div className="absolute top-3 right-3 text-brand-red">
          <CheckCircle className="w-5 h-5 fill-brand-red text-black" />
        </div>
      )}
    </button>
  );
};

export default BrandCard;
