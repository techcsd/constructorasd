// Blog posts (WB4). No verifiable post content yet → zero posts; the Noticias page shows "Próximamente"
// with the Instagram link. No fake news (rule 2). When real posts exist, add them here (body is markdown,
// rendered with marked + DOMPurify at build in the article page).
import { Post } from './types';

import { ov } from './_overrides';
const POSTS_SEED: Post[] = [];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export const POSTS: Post[] = ov('posts', POSTS_SEED);
