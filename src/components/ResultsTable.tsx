import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ExternalLink, 
  Calendar, 
  Copy, 
  ChevronDown, 
  ChevronUp,
  Linkedin,
  Twitter,
  Globe,
  FileText,
  Building2
} from 'lucide-react';
import { type SchedulerResult, type SearchParams } from '@/types/scheduler';
import { useToast } from '@/hooks/use-toast';

interface ResultsTableProps {
  results: SchedulerResult[];
  isLoading: boolean;
  searchParams: SearchParams;
}

export const ResultsTable = ({ results, isLoading, searchParams }: ResultsTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const copyAllSchedulerLinks = async () => {
    const links = results.map(r => r.scheduler_url).join('\n');
    await copyToClipboard(links, 'All scheduler links');
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge className="bg-success text-white">High ({confidence})</Badge>;
    if (confidence >= 70) return <Badge className="bg-warning text-black">Medium ({confidence})</Badge>;
    return <Badge variant="destructive">Low ({confidence})</Badge>;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'company site': case 'company sites': return <Building2 className="w-4 h-4" />;
      case 'medium/substack': return <FileText className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
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
                <div className="grid md:grid-cols-4 gap-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="data-table">
        <div className="p-6 text-center">
          <div className="text-muted-foreground mb-4">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <h3 className="text-lg font-semibold">No scheduler links found</h3>
            <p>Try adjusting your search criteria or expanding the platforms searched.</p>
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
            <h2 className="text-xl font-semibold">Results ({results.length})</h2>
            <p className="text-muted-foreground text-sm">
              Found scheduler links from {new Set(results.map(r => r.platform)).size} platforms
            </p>
          </div>
          <Button onClick={copyAllSchedulerLinks} variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            Copy All Links
          </Button>
        </div>

        <div className="space-y-3">
          {results.map((result, index) => (
            <div key={index} className="border rounded-lg transition-smooth hover:shadow-md">
              <div className="p-4">
                <div className="grid md:grid-cols-12 gap-4 items-start">
                  {/* Person Info */}
                  <div className="md:col-span-3">
                    <div className="font-semibold text-sm">{result.person_name}</div>
                    <div className="text-muted-foreground text-xs">{result.title}</div>
                    <div className="text-muted-foreground text-xs">{result.organization}</div>
                    <div className="text-muted-foreground text-xs">{result.location}</div>
                  </div>

                  {/* Scheduler Link */}
                  <div className="md:col-span-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-primary" />
                      <a 
                        href={result.scheduler_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm font-medium truncate"
                      >
                        {result.scheduler_url.replace(/^https?:\/\//, '')}
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(result.scheduler_url, 'Scheduler link')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Source & Platform */}
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-1">
                      {getPlatformIcon(result.platform)}
                      <span className="text-xs font-medium">{result.platform}</span>
                    </div>
                    <a 
                      href={result.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                    >
                      View Source <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Confidence & Actions */}
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      {getConfidenceBadge(result.confidence)}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleRowExpansion(index)}
                      className="h-6 text-xs"
                    >
                      {expandedRows.has(index) ? (
                        <>Less <ChevronUp className="w-3 h-3 ml-1" /></>
                      ) : (
                        <>Details <ChevronDown className="w-3 h-3 ml-1" /></>
                      )}
                    </Button>
                  </div>

                  {/* Last Seen */}
                  <div className="md:col-span-1">
                    <div className="text-xs text-muted-foreground">
                      {new Date(result.last_seen).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedRows.has(index) && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">Context</Label>
                      <p className="text-sm text-muted-foreground mt-1">{result.context_snippet}</p>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">Confidence Signals</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.signals.map((signal, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {signal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);