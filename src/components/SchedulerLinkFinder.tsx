import { useState } from 'react';
import { SearchForm } from './SearchForm';
import { ResultsTable } from './ResultsTable';
import { ExportPanel } from './ExportPanel';
import { type SearchParams, type SchedulerResult } from '@/types/scheduler';

// Mock data for demonstration
const mockResults: SchedulerResult[] = [
  {
    person_name: "Sarah Chen",
    title: "Partner", 
    organization: "Sequoia Capital",
    location: "San Francisco, CA",
    platform: "LinkedIn",
    source_url: "https://www.linkedin.com/in/sarahchen/",
    scheduler_url: "https://calendly.com/sarah-chen/partner-intro",
    context_snippet: "...Book time with Sarah for partnership discussions... Partner at Sequoia Capital focusing on enterprise software...",
    confidence: 95,
    signals: ["name+org match", "investor keywords", "platform=LinkedIn", "location match"],
    last_seen: "2025-09-03"
  },
  {
    person_name: "Michael Rodriguez",
    title: "Managing Director",
    organization: "Goldman Sachs Private Wealth",
    location: "New York, NY", 
    platform: "Company Site",
    source_url: "https://www.goldmansachs.com/our-people/michael-rodriguez",
    scheduler_url: "https://calendly.com/m-rodriguez-gs/client-consultation",
    context_snippet: "...Schedule a consultation with Michael... Managing Director specializing in family office services...",
    confidence: 88,
    signals: ["name+org match", "family office keywords", "platform=Company Site"],
    last_seen: "2025-09-02"
  },
  {
    person_name: "Emma Thompson",
    title: "Principal",
    organization: "Andreessen Horowitz",
    location: "Menlo Park, CA",
    platform: "Twitter",
    source_url: "https://twitter.com/emmathompson_a16z",
    scheduler_url: "https://cal.com/emma-thompson/startup-office-hours",
    context_snippet: "...Weekly office hours for founders... Principal @a16z investing in early-stage startups...",
    confidence: 92,
    signals: ["name+org match", "investor keywords", "platform=Twitter", "location match"],
    last_seen: "2025-09-04"
  }
];

export const SchedulerLinkFinder = () => {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    targets: [],
    organizations: [],
    location: '',
    platforms: ['LinkedIn', 'Twitter', 'Company Sites'],
    timeRange: 'any',
    includeVariants: true,
    excludeTerms: [],
    similarityMatch: 'fuzzy',
    maxResults: 20
  });
  
  const [results, setResults] = useState<SchedulerResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (params: SearchParams) => {
    setIsLoading(true);
    setSearchParams(params);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For demo, show mock results
    setResults(mockResults);
    setIsLoading(false);
    setHasSearched(true);
  };

  return (
    <div className="space-y-8">
      <SearchForm 
        onSearch={handleSearch} 
        isLoading={isLoading}
        initialParams={searchParams}
      />
      
      {(hasSearched || results.length > 0) && (
        <>
          <ResultsTable 
            results={results} 
            isLoading={isLoading}
            searchParams={searchParams}
          />
          
          {results.length > 0 && (
            <ExportPanel 
              results={results}
              searchParams={searchParams}
            />
          )}
        </>
      )}
    </div>
  );
};