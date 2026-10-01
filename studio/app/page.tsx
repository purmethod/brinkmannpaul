import { loadTemplates } from '@/lib/brand';
import UploadForm from './upload-form';

export const dynamic = 'force-dynamic';

export default function Home() {
  const set = loadTemplates();
  const templates = Object.entries(set.templates).map(([id, t]) => ({ id, label: t.label, media: t.background.type === 'media' }));
  return (
    <>
      <h1>new post</h1>
      <UploadForm templates={templates} defaultTemplate={set.default} />
    </>
  );
}
