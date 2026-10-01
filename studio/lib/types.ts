export type PostStatus = 'processing' | 'draft' | 'approved' | 'posted' | 'error';
export type PostType = 'carousel' | 'reel';

export interface Slide {
  png: string; // preview / download
  jpg: string; // instagram only accepts jpeg for image publishing
}

export interface Post {
  id: string;
  brandId: string;
  type: PostType;
  templateId: string;
  status: PostStatus;
  caption: string;
  scheduledFor?: string | null; // YYYY-MM-DD in brand timezone
  createdAt: number;
  updatedAt: number;
  approvedAt?: number;
  postedAt?: number;
  igMediaId?: string;
  permalink?: string;
  error?: string | null;
  slides?: Slide[];
  video?: { url: string; duration?: number };
  source: { text?: string; media?: string[] };
  transcript?: string;
}

export interface BrandTemplate {
  label: string;
  background: { type: 'color' | 'media'; color: string };
  text: string;
  signature: 'original' | 'inverted';
  gradient?: { color: string; maxAlpha: number; heightRatio: number };
  logo?: { file: string; width: number; x: number; y: number };
  carousel: { valign: 'center' | 'bottom' };
  video: { layout: 'framed' | 'fullbleed'; boxHeight: number; subtitleColor: string; subtitleMarginV: number };
}

export interface Brand {
  id: string;
  name: string;
  handle: string;
  language: string;
  autoApprove: boolean;
  timezone: string;
  postHour: number;
  fonts: { family: string; regular: string; bold: string };
  signature: { file: string };
  carousel: {
    width: number;
    height: number;
    margin: number;
    fontSizeMax: number;
    fontSizeMin: number;
    lineHeight: number;
    lowercase: boolean;
    maxSlides: number;
    signature: { width: number; margin: number };
  };
  caption: { model: string; maxHashtags: number; rules: string[] };
}

export interface TemplateSet {
  default: string;
  templates: Record<string, BrandTemplate>;
}
