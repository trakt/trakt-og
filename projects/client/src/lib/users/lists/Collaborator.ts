import type { VipBadge } from '../VipBadge.ts';

/** An approved list collaborator: the slug to spot the viewer, and what the collaborators panel shows. */
export type Collaborator = {
  readonly slug: string;
  readonly name: string;
  readonly href: string;
  readonly avatar: string;
  readonly vip: VipBadge | null;
};
