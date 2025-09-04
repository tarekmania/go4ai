import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, FileText, Code } from 'lucide-react';
import { type SchedulerResult, type SearchParams, type ExportData } from '@/types/scheduler';
import { useToast } from '@/hooks/use-toast';

interface ExportPanelProps {
  results: SchedulerResult[];
  searchParams: SearchParams;
}

export const ExportPanel = ({ results, searchParams }: ExportPanelProps) => {
  const { toast } = useToast();

  const generateExportData = (): ExportData => {
    const queryTerms = [
      ...searchParams.targets,
      ...searchParams.organizations,
      searchParams.location
    ].filter(Boolean).join(', ');

    return {
      query: queryTerms || 'Scheduler link search',
      generated_at: new Date().toISOString(),
      results
    };
  };

  const downloadCSV = () => {
    const headers = [
      'Name',
      'Title', 
      'Organization',
      'Location',
      'Platform',
      'Scheduler URL',
      'Source URL',
      'Confidence',
      'Signals',
      'Last Seen'
    ];

    const csvContent = [
      headers.join(','),
      ...results.map(result => [
        `"${result.person_name}"`,
        `"${result.title}"`,
        `"${result.organization}"`,
        `"${result.location}"`,
        `"${result.platform}"`,
        `"${result.scheduler_url}"`,
        `"${result.source_url}"`,
        result.confidence,
        `"${result.signals.join('; ')}"`,
        `"${result.last_seen}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scheduler-links-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "CSV Downloaded",
      description: `Exported ${results.length} results to CSV`,
      duration: 3000,
    });
  };

  const downloadJSON = () => {
    const exportData = generateExportData();
    const jsonContent = JSON.stringify(exportData, null, 2);
    
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scheduler-links-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "JSON Downloaded",
      description: `Exported ${results.length} results to JSON`,
      duration: 3000,
    });
  };

  const copyJSONToClipboard = async () => {
    const exportData = generateExportData();
    const jsonContent = JSON.stringify(exportData, null, 2);
    
    try {
      await navigator.clipboard.writeText(jsonContent);
      toast({
        title: "Copied!",
        description: "JSON data copied to clipboard",
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

  if (results.length === 0) return null;

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">Export Results</h3>
          <p className="text-sm text-muted-foreground">
            Download or copy your search results ({results.length} entries)
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button onClick={downloadCSV} variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            CSV
          </Button>
          
          <Button onClick={downloadJSON} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
          
          <Button onClick={copyJSONToClipboard} variant="outline" size="sm">
            <Code className="w-4 h-4 mr-2" />
            Copy JSON
          </Button>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <div className="text-xs text-muted-foreground">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-semibold">Total Results:</span> {results.length}
            </div>
            <div>
              <span className="font-semibold">High Confidence:</span> {results.filter(r => r.confidence >= 90).length}
            </div>
            <div>
              <span className="font-semibold">Unique Platforms:</span> {new Set(results.map(r => r.platform)).size}
            </div>
            <div>
              <span className="font-semibold">Avg Confidence:</span> {Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length)}%
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};