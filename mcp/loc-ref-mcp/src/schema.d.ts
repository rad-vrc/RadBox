export interface GetByKeyInput { key: string }
export interface GetByKeyOutput { key: string; value: string | null; exists: boolean }
export interface FuzzySearchInput { query: string; limit?: number }
export interface FuzzySearchMatch { key: string; value: string; score: number }
export interface FuzzySearchOutput { matches: FuzzySearchMatch[] }
export interface PlaceholderCheckInput { text: string }
export interface PlaceholderCheckOutput { placeholders: string[] }
