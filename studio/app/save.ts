/** Save a single file: share sheet on phones (→ "save image/video"), plain download elsewhere. */
export async function saveFile(url: string, name: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const file = new File([blob], name, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  } catch (e) {
    if ((e as Error).name === 'AbortError') return; // share sheet dismissed
    window.open(`${url}?download=1`, '_blank');
  }
}
