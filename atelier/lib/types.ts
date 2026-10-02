export type PostKind = 'reel' | 'carousel' | 'photo';
export type PostStatus = 'processing' | 'review' | 'ready' | 'approved' | 'due' | 'posted' | 'error';
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
  lastTemplate?: string;
  savedTemplates?: SavedTemplate[];
  autopilot?: AutopilotSettings;
  autopilotLock?: string;
  channel?: ChannelSettings;
}

/** Daily posting on its own: a post every few hours in a time window, from the creator's insights + real knowledge. */
export interface AutopilotSettings {
  enabled: boolean;
  everyHours: number;
  from: string; // "08:00"
  to: string; // "22:00"
  slides: number;
  insights: string; // the creator's own knowledge, the core of every post
  recent?: string[]; // last topics, never repeated soon
  review: boolean; // learning phase: every post waits for the owner's ok
  reviewTarget: number; // after this many reviews the channel may go fully automatic
  history?: string; // review outcomes, newest last: a = ok as is, e = ok after a fix, r = rejected
}

/** A theme channel run from the app (on top of a design kit): who it is, what it is about, how it sounds. */
export interface ChannelSettings {
  name?: string;
  handle?: string;
  tagline?: string;
  logo?: string[]; // stacked logo lines, e.g. ["fo", "yo"]
  cta?: string; // last-slide line(s), "|" = new line
  brief?: string; // what the channel is about and for whom
  tone?: string;
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
  notes?: string | null; // style notes from a saved template
  collaborators?: string[];
  retriedAt?: string; // self-healing: last automatic re-render of a stuck post
  autopilot?: boolean; // made by the autopilot
  review?: 'pending' | 'approved'; // learning phase: waits for the owner's ok
  edits?: number; // corrections before the ok
}

export interface Post {
  id: string;
  brand_id: string;
  kind: PostKind;
  status: PostStatus;
  template: string;
  media_ids: string[];
  text: string | null;
  description: string | null;
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
  fonts: { family: string; regular: string; bold: string; italic: string; sans: string; sansRegular: string; sansMedium: string; sansBold: string };
  slots: string[];
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
  brief?: string; // what the account is about (autopilot)
  tone?: string;
}

export type TemplateLayout = 'polaroid' | 'editorial' | 'bauhaus' | 'foyo';
export type TextStyle = 'poetic' | 'hook' | 'statement' | 'longevity';

export interface BrandTemplate {
  label: string;
  layout: TemplateLayout;
  textStyle: TextStyle;
  background: { type: 'color' | 'media'; color: string };
  paper: string;
  text: string;
  accent: string;
  signature: 'original' | 'inverted';
  gradient?: { color: string; maxAlpha: number; heightRatio: number };
  cta?: string; // closing line(s) on the last slide, "|" = new line
  logo?: { lines: string[]; tagline?: string; taglineBelow?: boolean }; // typographic lockup (foyo layout)
  video: { layout: 'framed' | 'fullbleed'; boxHeight: number; subtitleColor: string; subtitleMarginV: number; frameColor?: string };
}

/** A style the user saved from a good post: a base template plus learned notes. */
export interface SavedTemplate {
  id: string;
  name: string;
  base: string;
  notes: string;
}

export interface TemplateSet {
  default: string;
  templates: Record<string, BrandTemplate>;
}
