import { loadTemplates } from '@/lib/brand';
import Preview from './preview';

export const dynamic = 'force-dynamic';

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const templates = Object.entries(loadTemplates().templates).map(([id, t]) => ({ id, label: t.label, media: t.background.type === 'media' }));
  return <Preview id={(await params).id} templates={templates} />;
}
