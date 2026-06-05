import React from 'react';
import { Globe, Palette, Code, PenTool, Video } from 'lucide-react';

// value kısımları backend'e kaydederken kullandığımız anahtar kelimelerle aynı olmalı
const categories = [
  { id: 'hepsi', name: 'Bütün Xidmətlər', Icon: Globe, value: '' },
  { id: 'dizayn', name: 'Qrafik və Dizayn', Icon: Palette, value: 'dizayn' },
  { id: 'veb', name: 'Veb Proqramlaşdırma', Icon: Code, value: 'veb' },
  { id: 'tercume', name: 'Tərcümə və Yazı', Icon: PenTool, value: 'tercume' },
  { id: 'video', name: 'Video və Animasiya', Icon: Video, value: 'video' },
];

function CategoryList({ activeCategory, onCategorySelect }) {
  return (
    <div className="categories-container">
      <h2 className="section-title">Kateqoriyalar üzrə Filterlə</h2>
      <div className="category-grid">
        {categories.map((cat) => {
          const IconComponent = cat.Icon;
          return (
            <div
              key={cat.id}
              className={`category-item ${activeCategory === cat.value ? 'active-cat' : ''}`}
              onClick={() => onCategorySelect(cat.value)}
            >
              <span className="category-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconComponent size={36} color="#14224F" />
              </span>
              <span className="category-name">{cat.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryList;
