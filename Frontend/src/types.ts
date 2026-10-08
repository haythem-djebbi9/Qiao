export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  iconName: string;
  image: string;
  isNew?: boolean;
  accentColor?: 'red' | 'blue';
  stats?: string;
  details?: string[];
}

export interface TrainingDomain {
  id: string;
  title: string;
  description: string;
  iconName: string;
  coursesCount: number;
  featuredCourse: string;
  duration: string;
  accentColor?: 'red' | 'blue';
}

export interface CaseStudy {
  id: string;
  company: string;
  tag: string;
  title: string;
  image: string;
  logoText: string;
  logoBg?: string;
  metrics: {
    label: string;
    icon: string;
    type?: string;
  }[];
  description?: string;
  results?: string[];
  fullStory?: string;
}

export interface ResourceArticle {
  id: string;
  title: string;
  description?: string;
  date: string;
  category: string;
  readTime: string;
  image: string;
  author?: string;
  fullContent?: string;
}

export interface ArticleItem extends ResourceArticle {}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar: string;
  rating: number;
  companyLogo?: string;
}

export interface PartnerLogo {
  name: string;
  subtext?: string;
  logoType?: 'ccpit' | 'tabc' | 'boc' | 'ifc' | 'afrexim' | 'ccina' | 'tt' | 'biat' | 'sotufab' | 'puro' | 'amen' | 'ooredoo' | 'gica';
  category?: 'institution' | 'client';
}

export interface ReportItem {
  id: string;
  title: string;
  format: string;
  size: string;
  date: string;
  downloadCount: string;
}

export interface EventItem {
  id: string;
  day: string;
  month: string;
  title: string;
  location: string;
  time: string;
  isOnline: boolean;
}

export interface ToolResourceItem {
  id: string;
  title: string;
  description: string;
  type: string;
  iconName: string;
  actionText: string;
}

export type AppTab =
  | 'home'
  | 'about'
  | 'services'
  | 'community'
  | 'intelligence'
  | 'how-it-works'
  | 'academy'
  | 'stories'
  | 'evenements'
  | 'partners'
  | 'resources'
  | 'contact'
  | 'secteurs'
  | 'sector-detail'
  | 'commerce-hub'
  | 'dashboard';

export type CommerceHubTab =
  | 'vue-ensemble'
  | 'flux-commerciaux'
  | 'produits'
  | 'marches-ecommerce'
  | 'entreprises'
  | 'opportunites'
  | 'reglementation'
  | 'rapports'
  | 'analyses';

