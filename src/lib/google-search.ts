import { type SearchParams } from '@/types/scheduler';

export interface SearchQuery {
  id: string;
  title: string;
  query: string;
  url: string;
  platform: string;
}

export const buildGoogleSearchQueries = (params: SearchParams): SearchQuery[] => {
  const queries: SearchQuery[] = [];
  
  // Helper function to build search terms
  const buildSearchTerms = (terms: string[]): string => {
    return terms.map(term => `"${term}"`).join(' ');
  };

  // Build scheduler terms from selected platforms
  let schedulerTerms = '';
  if (params.schedulerPlatforms.length > 0) {
    const platformTerms = params.schedulerPlatforms.map(platform => `"${platform}"`).join(' OR ');
    schedulerTerms = `(${platformTerms})`;
    
    // Add generic booking terms if enabled
    if (params.includeGenericBookingTerms) {
      schedulerTerms = `(${platformTerms} OR "book a call" OR "schedule a meeting" OR "book time" OR "book a meeting")`;
    }
  }

  // Build target terms
  const targetTerms = params.targets.length > 0 ? buildSearchTerms(params.targets) : '';
  const orgTerms = params.organizations.length > 0 ? buildSearchTerms(params.organizations) : '';
  const locationTerm = params.location ? `"${params.location}"` : '';
  
  // Build exclude terms
  const excludeTerms = params.excludeTerms.length > 0 
    ? params.excludeTerms.map(term => `-"${term}"`).join(' ')
    : '';

  // Time range parameter for Google
  const getTimeParam = (timeRange: string): string => {
    switch (timeRange) {
      case 'past-year': return '&tbs=qdr:y';
      case 'past-month': return '&tbs=qdr:m';
      default: return '';
    }
  };

  const timeParam = getTimeParam(params.timeRange);

  // Platform-specific search strategies
  params.platforms.forEach(platform => {
    let siteFilter = '';
    let platformSpecific = '';
    
    switch (platform) {
      case 'LinkedIn':
        siteFilter = 'site:linkedin.com/in';
        platformSpecific = `${siteFilter} ${schedulerTerms} ${targetTerms} ${orgTerms} ${locationTerm} ${excludeTerms}`.trim();
        break;
        
      case 'Twitter':
        siteFilter = 'site:twitter.com';
        platformSpecific = `${siteFilter} ${schedulerTerms} ${targetTerms} ${orgTerms} ${locationTerm} ${excludeTerms}`.trim();
        break;
        
      case 'Company Sites':
        if (orgTerms) {
          // Search for scheduler links on organization websites
          platformSpecific = `${schedulerTerms} ${targetTerms} ${orgTerms} ${locationTerm} ${excludeTerms} -site:linkedin.com -site:twitter.com -site:facebook.com`.trim();
        } else {
          platformSpecific = `${schedulerTerms} ${targetTerms} ${locationTerm} "partner" OR "principal" OR "director" OR "founder" ${excludeTerms} -site:linkedin.com -site:twitter.com`.trim();
        }
        break;
        
      case 'Medium/Substack':
        siteFilter = '(site:medium.com OR site:substack.com)';
        platformSpecific = `${siteFilter} ${schedulerTerms} ${targetTerms} ${orgTerms} ${locationTerm} ${excludeTerms}`.trim();
        break;
        
      case 'Crunchbase':
        siteFilter = 'site:crunchbase.com';
        platformSpecific = `${siteFilter} ${schedulerTerms} ${targetTerms} ${orgTerms} ${locationTerm} ${excludeTerms}`.trim();
        break;
        
      case 'PDFs':
        platformSpecific = `filetype:pdf ${schedulerTerms} ${targetTerms} ${orgTerms} ${locationTerm} ${excludeTerms}`.trim();
        break;
    }

    if (platformSpecific) {
      const cleanQuery = platformSpecific.replace(/\s+/g, ' ').trim();
      const encodedQuery = encodeURIComponent(cleanQuery);
      const searchUrl = `https://www.google.com/search?q=${encodedQuery}${timeParam}`;
      
      queries.push({
        id: `${platform}-${Date.now()}-${Math.random()}`,
        title: `${platform} Search`,
        query: cleanQuery,
        url: searchUrl,
        platform
      });
    }
  });

  // Add general search if targets/orgs are specified
  if (targetTerms || orgTerms) {
    const generalQuery = `${schedulerTerms} ${targetTerms} ${orgTerms} ${locationTerm} ${excludeTerms} -site:linkedin.com -site:twitter.com`.trim();
    const cleanQuery = generalQuery.replace(/\s+/g, ' ').trim();
    const encodedQuery = encodeURIComponent(cleanQuery);
    const searchUrl = `https://www.google.com/search?q=${encodedQuery}${timeParam}`;
    
    queries.push({
      id: `general-${Date.now()}-${Math.random()}`,
      title: 'General Web Search',
      query: cleanQuery,
      url: searchUrl,
      platform: 'General'
    });
  }

  return queries;
};

export const openSearchQuery = (query: SearchQuery): void => {
  window.open(query.url, '_blank', 'noopener,noreferrer');
};

export const copySearchQuery = async (query: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(query);
    return true;
  } catch (error) {
    console.error('Failed to copy query:', error);
    return false;
  }
};