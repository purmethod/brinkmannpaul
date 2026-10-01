export type PostKind = 'reel' | 'carousel' | 'photo';
export type PostStatus = 'processing' | 'ready' | 'approved' | 'posted' | 'error';
export type ScheduleStatus = 'pending' | 'done' | 'error' | 'canceled';

export interface User {
  id: string;
  email: string;
  timezone: string;
}

export interface BrandSettings {
  autoApprove?: boolean;
  captionRules?: string;
  cutRules?: string;
  subtitleLanguage?: string;
  signatureUrl?: string | null;
  defaultTemplate?: string;
}

export interface BrandRow {
  id: string;
  user_id: string;
  kit: string; // folder in brands/ with the defaults (fonts, templates)
  name: string;
  settings: BrandSettings;
}

export interface Media {
  id: string;
  brand_id: string;
  number: number;
  kind: 'video' | 'photo';
  url: string;
  status: 'uploading' | 'ready';
  filename: string | null;
  created_at: string;
}

export interface Slide {
  png: string;
  jpg: string;
}

export interface PostOutput {
  video?: string;
  cover?: string;
  duration?: number;
  slides?: Slide[];
  plan?: unknown; // cut list from the worker, reused for voiceover re-renders
}

export interface PostOptions {
  subtitleLanguage?: string;
  voiceoverUrl?: string | null;
  song?: string | null; // requested song title (see README: music)
  collaborators?: string[];
}

export interface Post {
  id: string;
  brand_id: string;
  kind: PostKind;
  status: PostStatus;
  template: string;
  media_ids: string[];
  text: string | null;
  caption: string;
  output: PostOutput;
  options: PostOptions;
  transcript: string | null;
  error: string | null;
  ig_media_id: string | null;
  permalink: string | null;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  post_id: string;
  brand_id: string;
  at: string;
  status: ScheduleStatus;
  message_id: string | null;
  attempts: number;
  error: string | null;
}

export interface BrandKit {
  id: string;
  name: string;
  handle: string;
  language: string;
  autoApprove: boolean;
  timezone: string;
  defaultTemplate: string;
  maxTemplates: number;
  subtitleLanguage: string;
  cutRules: string;
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

export interface TemplateSet {
  default: string;
  templates: Record<string, BrandTemplate>;
}
