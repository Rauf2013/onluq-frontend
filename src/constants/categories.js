import { Palette, Code, PenTool, Video, TrendingUp, Mic, Briefcase } from 'lucide-react';

export const CATEGORY_DATA = [
  {
    name: 'Qrafik və Dizayn',
    icon: Palette,
    subcategories: ['Loqo Dizaynı', 'Veb və Tətbiq Dizaynı', 'Sosial Media Dizaynı', 'Banner və Reklam', 'İllüstrasiya', 'Qablaşdırma Dizaynı', '3D Modelləşdirmə', 'NFT İncəsənəti', 'T-shirt və Geyim', 'Təqdimat Dizaynı'],
  },
  {
    name: 'Proqramlaşdırma',
    icon: Code,
    subcategories: ['Veb Sayt Yaradılması', 'E-ticarət', 'WordPress', 'Mobil Tətbiqlər', 'Masaüstü Tətbiqlər', 'Xəta Həlli (Bug Fix)', 'Süni İntellekt (AI)', 'Verilənlər Bazası', 'Kibertəhlükəsizlik', 'Oyun İnkişafı'],
  },
  {
    name: 'Yazı və Tərcümə',
    icon: PenTool,
    subcategories: ['Məqalə və Bloq', 'Tərcümə', 'Kopyaraytinq', 'CV və Müşayiət Məktubu', 'Redaktə və Təshih', 'Ssenari Yazarlığı', 'Kitab Redaktəsi', 'Texniki Yazı'],
  },
  {
    name: 'Video və Montaj',
    icon: Video,
    subcategories: ['Video Montaj', '2D/3D Animasiya', 'İntro və Outro', 'Reklam Videoları', 'YouTube Videoları', 'Subtitr və Tərcümə', 'Vizual Effektlər (VFX)'],
  },
  {
    name: 'Rəqəmsal Marketinq',
    icon: TrendingUp,
    subcategories: ['SEO', 'SMM (Sosial Media)', 'Google Ads', 'E-poçt Marketinqi', 'Veb Analitika', 'İnfluencer Marketinq', 'Məzmun Marketinqi', 'Lokal SEO'],
  },
  {
    name: 'Səs və Musiqi',
    icon: Mic,
    subcategories: ['Səsləndirmə (Voiceover)', 'Səs Montajı', 'Musiqi Bəstələmə', 'Podkast Redaktəsi', 'Vokal və Mahnı', 'Səs Effektləri'],
  },
  {
    name: 'Biznes',
    icon: Briefcase,
    subcategories: ['Biznes Planı', 'Hüquqi Məsləhət', 'Maliyyə və Mühasibat', 'Layihə İdarəedilməsi', 'Karyera Məsləhəti', 'Data Analizi'],
  },
];

export const CATEGORY_NAMES = CATEGORY_DATA.map((c) => c.name);
