/** The report message's placeholder: what the team needs for the picked reason. */
export function reportPlaceholder(reason: string): string {
  if (reason === 'duplicate') return 'Paste Trakt links to the original and each duplicate';
  if (reason === 'spoilers') return 'Which part is the spoiler?';
  return 'Add details for the Trakt team';
}
