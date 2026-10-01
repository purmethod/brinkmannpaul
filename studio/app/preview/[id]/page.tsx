import Preview from './preview';

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  return <Preview id={(await params).id} />;
}
