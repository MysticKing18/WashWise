import { BRANCH_CATALOG } from './branchCatalog'
import { createBranch } from './services/branchService'

export const BRANCH_SEED_DATA = BRANCH_CATALOG

export const seedBranches = async (): Promise<void> => {
  await Promise.all(BRANCH_SEED_DATA.map((branch) => createBranch(branch)))
}