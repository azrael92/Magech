import { defineCollection, z } from 'astro:content';

// Universal frontmatter — every section extends this.
// NOTE: Astro v5 auto-derives the URL slug from the filename, so the `slug` field
// in frontmatter is decorative (documented for agents) but not validated here.
const universal = z.object({
  title: z.string(),
  slug: z.string().optional(), // auto-derived by Astro; kept for agent contracts
  status: z.enum(['draft', 'review', 'published', 'retired']),
  authored_by: z.string(),
  reviewed_by: z.string().nullable().optional(),
  created: z.coerce.date(),
  published: z.coerce.date().nullable().optional(),
  revision: z.number().int().nonnegative(),
  tags: z.array(z.string()).min(3).max(7),
});

// Negative Space — monthly editorial essays
const negativeSpace = defineCollection({
  type: 'content',
  schema: universal.extend({
    section: z.literal('negative-space'),
    issue_number: z.number().int().positive(),
    deck: z.string().min(20).max(280),
    read_minutes: z.number().int().nonnegative(),
    hero_question: z.string(),
    opens_with: z.enum(['drop_cap', 'image', 'pullquote']),
    related_projects: z.array(z.string()).default([]),
  }),
});

// Projects — build log
const projects = defineCollection({
  type: 'content',
  schema: universal.extend({
    section: z.literal('projects'),
    project_name: z.string(),
    project_status: z.enum(['active', 'shipped', 'dormant', 'postmortem']),
    tagline: z.string().max(140),
    problem: z.string(),
    approach: z.string(),
    stack: z.array(z.string()),
    links: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
    metrics: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
    postmortem_notes: z.string().nullable().optional(),
  }),
});

// About — the three intro pieces (formerly "overview")
const about = defineCollection({
  type: 'content',
  schema: universal.extend({
    section: z.literal('about'),
    piece: z.enum(['whoami', 'whyamihere', 'whyarewehere']),
    order: z.number().int().min(1).max(3),
    last_revised: z.coerce.date(),
  }),
});

export const collections = {
  'negative-space': negativeSpace,
  'projects': projects,
  'about': about,
};
