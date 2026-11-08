/** Footer link: follow @buildpaul on Instagram. A plain link – no embed, no tracking. */
export const INSTAGRAM_HANDLE = "buildpaul";

export function InstaFollow() {
  return (
    <footer className="flex justify-center pt-2 pb-4">
      <a
        href={`https://www.instagram.com/${INSTAGRAM_HANDLE}/`}
        target="_blank"
        rel="noopener noreferrer"
        dir="ltr"
        aria-label={`Instagram @${INSTAGRAM_HANDLE}`}
        data-testid="instagram"
        className="flex min-h-11 items-center gap-2 rounded-full px-4 text-[15px] text-ink active:bg-surface"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
        </svg>
        <span>@{INSTAGRAM_HANDLE}</span>
      </a>
    </footer>
  );
}
