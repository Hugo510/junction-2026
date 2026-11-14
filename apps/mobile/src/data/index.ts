import { createMockRepositories } from './mock';
import type { Repositories } from './repositories';
// import { createApiRepositories } from './api';

/**
 * Single switch between data sources.
 * To use the real backend later, replace the line below with:
 *   export const repositories: Repositories = createApiRepositories();
 */
export const repositories: Repositories = createMockRepositories();

export type { Repositories } from './repositories';
