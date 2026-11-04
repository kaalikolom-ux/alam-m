import { INITIAL_SEED_DATA } from "@/integrations/d1/seed-data";

export const STATIC_CATEGORIES = INITIAL_SEED_DATA.categories as any[];

export const STATIC_AUTHORS = (INITIAL_SEED_DATA.authors || []) as any[];
