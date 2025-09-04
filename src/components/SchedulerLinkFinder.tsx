import { useState } from 'react';
import { SearchForm } from './SearchForm';
import { SearchQueries } from './SearchQueries';
import { type SearchParams } from '@/types/scheduler';
import { buildGoogleSearchQueries, openSearchQuery, copySearchQuery, type SearchQuery } from '@/lib/google-search';

export const SchedulerLinkFinder = () => {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    targets: [],
    organizations: [],
    location: '',
    platforms: ['LinkedIn', 'Twitter'],
    timeRange: 'any',
    schedulerPlatforms: ['calendly.com'],
    includeGenericBookingTerms: false,
    excludeTerms: [],
    similarityMatch: 'fuzzy',
    maxResults: 20
  });
  
  const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (params: SearchParams) => {
    setIsLoading(true);
    setSearchParams(params);
    setHasSearched(true);
    
    // Simulate brief loading for UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate Google search queries
    const queries = buildGoogleSearchQueries(params);
    setSearchQueries(queries);
    setIsLoading(false);
  };

  const handleOpenQuery = (query: SearchQuery) => {
    openSearchQuery(query);
  };

  const handleCopyQuery = async (queryText: string): Promise<boolean> => {
    return await copySearchQuery(queryText);
  };

  return (
    <div className="space-y-8">
      <SearchForm 
        onSearch={handleSearch} 
        isLoading={isLoading}
        initialParams={searchParams}
      />
      
      {hasSearched && (
        <SearchQueries 
          queries={searchQueries}
          isLoading={isLoading}
          onOpenQuery={handleOpenQuery}
          onCopyQuery={handleCopyQuery}
        />
      )}
    </div>
  );
};