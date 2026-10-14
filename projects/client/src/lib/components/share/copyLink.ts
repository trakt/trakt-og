import { toast } from '../toast/toast.svelte.ts';

/** Copies a link to the clipboard and says so in a toast, like OG's Copy Link. */
export async function copyLink(url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Link copied to your clipboard!');
  } catch {
    toast.error('We could not copy this link. Please try again.');
  }
}
