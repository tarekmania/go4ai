export interface SearchParams {
  targets: string[];
  organizations: string[];
  location: string;
  platforms: string[];
  timeRange: 'any' | 'past-year' | 'past-month';
  schedulerPlatforms: string[];
  includeGenericBookingTerms: boolean;
  excludeTerms: string[];
  similarityMatch: 'strict' | 'fuzzy';
  maxResults: number;
}

export interface SchedulerResult {
  person_name: string;
  title: string;
  organization: string;
  location: string;
  platform: string;
  source_url: string;
  scheduler_url: string;
  context_snippet: string;
  confidence: number;
  signals: string[];
  last_seen: string;
}

export interface ExportData {
  query: string;
  generated_at: string;
  results: SchedulerResult[];
}