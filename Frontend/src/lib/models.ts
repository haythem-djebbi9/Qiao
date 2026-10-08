/** Formes des données renvoyées par l'API NestJS. */

export interface User {
  id: string;
  fullName: string;
  email: string;
  company: string | null;
  accountType: 'enterprise' | 'expert' | 'individual';
  origin: 'china' | 'north-africa';
  title: string | null;
  location: string | null;
  avatarUrl: string | null;
  language: string;
  verified: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationList {
  items: AppNotification[];
  unreadCount: number;
}

export interface EventDetails {
  organizer: string;
  expectedAttendees: string;
  venue: string;
  focusSectors: string[];
  programHighlights: string[];
  website?: string;
}

export interface QiaoEvent {
  id: string;
  title: string;
  category: string;
  categoryKey: string;
  startDate: string;
  dateRange: string;
  monthYear: string;
  time: string;
  location: string;
  country: string;
  isOnline: boolean;
  image: string;
  description: string;
  details: EventDetails | null;
  capacity: number;
  registrationsCount: number;
  isRegistered: boolean;
}

export interface TrainingDomain {
  id: string;
  title: string;
  description: string;
  iconName: string;
  coursesCount: number;
  featuredCourse: string;
  duration: string;
  accentColor: 'red' | 'blue';
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  instructorRole: string | null;
  instructorImg: string;
  rating: number;
  reviewsCount: number;
  duration: string;
  durationMinutes: number;
  price: number;
  image: string;
  domain: string;
  level: string;
  format: string;
  badge: string | null;
  badgeColor: string | null;
  description: string;
  modules: string[];
  sections: string[] | null;
}

export interface LearningPath {
  id: string;
  title: string;
  coursesCount: number;
  duration: string;
  price: number;
  image: string;
  description: string;
}

export type AcademyItemType = 'course' | 'path';

export interface CartLine {
  id: string;
  itemType: AcademyItemType;
  itemId: string;
  title: string;
  price: number;
  image: string;
  subtitle: string;
}

export interface Cart {
  items: CartLine[];
  count: number;
  total: number;
  currency: string;
}

export interface Order {
  id: string;
  reference: string;
  items: { itemType: AcademyItemType; itemId: string; title: string; price: number }[];
  total: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  itemType: AcademyItemType;
  itemId: string;
  title: string;
  image: string;
  progress: number;
  status: string;
  createdAt: string;
}

export interface PostComment {
  id: string;
  author: string;
  avatar: string | null;
  text: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  role: string;
  location: string;
  avatar: string | null;
  content: string;
  tags: string[];
  category: string;
  community: string | null;
  likes: number;
  commentsCount: number;
  createdAt: string;
  isLiked: boolean;
  isBookmarked: boolean;
  comments: PostComment[];
}

export interface Expert {
  id: string;
  name: string;
  role: string;
  country: string;
  flag: string;
  avatar: string;
  connected: boolean;
}

export interface QiaoDocument {
  id: string;
  title: string;
  kind: string;
  category: string;
  format: 'PDF' | 'DOCX' | 'XLSX' | 'Vidéo';
  sizeLabel: string;
  publishedAt: string;
  dateLabel: string;
  image: string | null;
  description: string;
  publisher: string;
  countries: string[] | null;
  needs: string[] | null;
  sector: string | null;
  reportType: string | null;
  premium: boolean;
  pages: number;
  totalDownloads: number;
  downloadsLabel: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string;
  dateLabel: string;
  readTime: string;
  image: string;
  author: string;
  keyPoints: string[];
  content: string[];
  countries: string[] | null;
  sector: string | null;
  analysisType: string | null;
}

export interface Opportunity {
  id: string;
  title: string;
  type: string;
  sector: string;
  fromCountry: string;
  toCountry: string;
  country: string;
  amountLabel: string;
  amountIcon: string;
  partnerType: string;
  image: string;
  description: string;
  deadline: string | null;
  publishedAt: string;
  verified: boolean;
  urgent: boolean;
  status: string;
  hasApplied?: boolean;
}

export interface Company {
  id: string;
  name: string;
  nativeName: string | null;
  origin: string;
  businessType: string;
  country: string;
  countryCode: string;
  city: string;
  sector: string;
  sectorGroup: string;
  badges: string[];
  verified: boolean;
  rating: number;
  description: string;
  turnover: string | null;
  employees: string | null;
  founded: string | null;
  certifications: string[] | null;
  mainProducts: string[] | null;
  contactEmail: string | null;
  logoColor: string;
  isStartup: boolean;
  featured: boolean;
  addedAt: string;
  addedLabel: string;
}

export interface HsCode {
  code: string;
  label: string;
  category: string;
  duties: Record<'maroc' | 'algerie' | 'tunisie' | 'egypte' | 'libye', number>;
  requirements: string | null;
  featured: boolean;
}

export interface RegulationProfile {
  id: string;
  name: string;
  kind: 'country' | 'agreement';
  countryCode: string | null;
  summary: string;
  requirements: string[];
  documents: string[];
  agencies: string[];
  clearanceTime: string | null;
  guideDocumentId: string | null;
}

export interface CustomsTariff {
  country: string;
  category: string;
  categoryLabel: string;
  dutyRate: number;
  vatRate: number;
  portFees: number;
  port: string;
}

export interface FreightRate {
  country: string;
  mode: string;
  cost: number;
  transitTime: string;
}

export interface SimulationRates {
  tariffs: CustomsTariff[];
  freight: FreightRate[];
  insuranceRate: number;
}

export interface SimulationResult {
  customsDutyRate: number;
  vatRate: number;
  freightCost: number;
  insuranceCost: number;
  cifValue: number;
  dutyAmount: number;
  vatAmount: number;
  portFees: number;
  totalLandedCost: number;
  transitTime: string;
  port: string;
}

export interface Appointment {
  id: string;
  specialty: string;
  specialtyLabel: string;
  date: string;
  time: string;
  status: 'confirmed' | 'cancelled';
  meetingLink: string;
  notes: string | null;
  createdAt: string;
}

export interface Dashboard {
  user: User;
  stats: Record<string, number>;
  appointments: Appointment[];
  eventRegistrations: { id: string; badgeCode: string; createdAt: string; event: QiaoEvent }[];
  enrollments: Enrollment[];
  orders: Order[];
  cart: Cart;
  connections: (Expert & { connectedAt: string })[];
  bookmarks: Omit<CommunityPost, 'isLiked' | 'isBookmarked' | 'comments'>[];
  downloads: { id: string; createdAt: string; document: QiaoDocument }[];
  applications: { id: string; status: string; createdAt: string; opportunity: Opportunity }[];
  companyRequests: { id: string; createdAt: string; company: { id: string; name: string; country: string } }[];
  simulations: { id: string; reference: string | null; destCountry: string; fobValue: number; result: SimulationResult; createdAt: string }[];
  requests: { id: string; reference: string; source: string; subject: string | null; message: string; createdAt: string; status: string }[];
  notifications: AppNotification[];
}
