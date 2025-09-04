import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Copy, 
  ExternalLink,
  Linkedin,
  Twitter,
  Globe,
  FileText,
  Building2,
  File
} from 'lucide-react';
import { type SearchQuery } from '@/lib/google-search';
import { useToast } from '@/hooks/use-toast';

interface SearchQueriesProps {
  queries: SearchQuery[];
  isLoading: boolean;
  onOpenQuery: (query: SearchQuery) => void;
  onCopyQuery: (query: string) => Promise<boolean>;
}

export const SearchQueries = ({ queries, isLoading, onOpenQuery, onCopyQuery }: SearchQueriesProps) => {
  const { toast } = useToast();

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'company sites': return <Building2 className="w-4 h-4" />;
      case 'medium/substack': return <FileText className="w-4 h-4" />;
      case 'pdfs': return <File className="w-4 h-4" />;
      case 'crunchbase': return <Building2 className="w-4 h-4" />;
      case 'general': return <Globe className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const handleCopyQuery = async (query: string, title: string) => {
    const success = await onCopyQuery(query);
    if (success) {
      toast({
        title: "Copied!",
        description: `${title} query copied to clipboard`,
        duration: 2000,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to copy query to clipboard",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const openAllQueries = () => {
    queries.forEach((query, index) => {
      // Stagger the opening to avoid popup blockers
      setTimeout(() => onOpenQuery(query), index * 200);
    });
  };

  if (isLoading) {
    return (
      <Card className="data-table">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-1/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full mt-2" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (queries.length === 0) {
    return (
      <Card className="data-table">
        <div className="p-6 text-center">
          <div className="text-muted-foreground mb-4">
            <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <h3 className="text-lg font-semibold">No search queries generated</h3>
            <p>Please select at least one platform and add some search criteria.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="data-table">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Google Search Queries ({queries.length})</h2>
            <p className="text-muted-foreground text-sm">
              Optimized search queries for finding scheduler links across selected platforms
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openAllQueries} variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open All
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {queries.map((query) => (
            <div key={query.id} className="border rounded-lg p-4 transition-smooth hover:shadow-md">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getPlatformIcon(query.platform)}
                    <span className="font-medium text-sm">{query.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {query.platform}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded text-wrap break-all">
                    {query.query}
                  </div>
                </div>
                
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => onOpenQuery(query)}
                    className="gradient-primary hover:shadow-glow transition-smooth"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Search
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyQuery(query.query, query.title)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Search Tips:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Each query is optimized for specific platforms and search patterns</li>
            <li>• Use "Open All" to search multiple platforms simultaneously</li>
            <li>• Copy queries to customize them further if needed</li>
            <li>• Look for scheduler links in bios, about pages, and contact sections</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};