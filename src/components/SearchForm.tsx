import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Search, Plus, X, Loader2 } from 'lucide-react';
import { type SearchParams } from '@/types/scheduler';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
  initialParams: SearchParams;
}

export const SearchForm = ({ onSearch, isLoading, initialParams }: SearchFormProps) => {
  const [formData, setFormData] = useState<SearchParams>(initialParams);
  const [currentTarget, setCurrentTarget] = useState('');
  const [currentOrg, setCurrentOrg] = useState('');
  const [currentExclude, setCurrentExclude] = useState('');

  const platforms = ['LinkedIn', 'Twitter', 'Company Sites', 'Medium/Substack', 'Crunchbase', 'PDFs'];

  const addTarget = () => {
    if (currentTarget.trim()) {
      setFormData(prev => ({
        ...prev,
        targets: [...prev.targets, currentTarget.trim()]
      }));
      setCurrentTarget('');
    }
  };

  const removeTarget = (index: number) => {
    setFormData(prev => ({
      ...prev,
      targets: prev.targets.filter((_, i) => i !== index)
    }));
  };

  const addOrganization = () => {
    if (currentOrg.trim()) {
      setFormData(prev => ({
        ...prev,
        organizations: [...prev.organizations, currentOrg.trim()]
      }));
      setCurrentOrg('');
    }
  };

  const removeOrganization = (index: number) => {
    setFormData(prev => ({
      ...prev,
      organizations: prev.organizations.filter((_, i) => i !== index)
    }));
  };

  const addExcludeTerm = () => {
    if (currentExclude.trim()) {
      setFormData(prev => ({
        ...prev,
        excludeTerms: [...prev.excludeTerms, currentExclude.trim()]
      }));
      setCurrentExclude('');
    }
  };

  const removeExcludeTerm = (index: number) => {
    setFormData(prev => ({
      ...prev,
      excludeTerms: prev.excludeTerms.filter((_, i) => i !== index)
    }));
  };

  const togglePlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(formData);
  };

  return (
    <Card className="form-section">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Targets */}
          <div className="space-y-3">
            <Label htmlFor="targets" className="text-sm font-semibold">
              Target People/Roles
            </Label>
            <div className="flex gap-2">
              <Input
                id="targets"
                value={currentTarget}
                onChange={(e) => setCurrentTarget(e.target.value)}
                placeholder="e.g., seed investor, family office principal"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTarget())}
              />
              <Button type="button" onClick={addTarget} size="sm" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.targets.map((target, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {target}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeTarget(index)} />
                </Badge>
              ))}
            </div>
          </div>

          {/* Organizations */}
          <div className="space-y-3">
            <Label htmlFor="organizations" className="text-sm font-semibold">
              Organizations
            </Label>
            <div className="flex gap-2">
              <Input
                id="organizations"
                value={currentOrg}
                onChange={(e) => setCurrentOrg(e.target.value)}
                placeholder="e.g., Sequoia Capital, Goldman Sachs"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOrganization())}
              />
              <Button type="button" onClick={addOrganization} size="sm" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.organizations.map((org, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {org}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeOrganization(index)} />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-3">
          <Label htmlFor="location" className="text-sm font-semibold">
            Location Filter
          </Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="e.g., San Francisco, Zürich, MENA"
          />
        </div>

        {/* Platforms */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Platforms to Search</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {platforms.map(platform => (
              <div key={platform} className="flex items-center space-x-2">
                <Checkbox
                  id={platform}
                  checked={formData.platforms.includes(platform)}
                  onCheckedChange={() => togglePlatform(platform)}
                />
                <Label htmlFor={platform} className="text-sm">{platform}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Time Range */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Time Range</Label>
            <Select value={formData.timeRange} onValueChange={(value: any) => setFormData(prev => ({ ...prev, timeRange: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any time</SelectItem>
                <SelectItem value="past-year">Past year</SelectItem>
                <SelectItem value="past-month">Past month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Similarity Match */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Name Matching</Label>
            <Select value={formData.similarityMatch} onValueChange={(value: any) => setFormData(prev => ({ ...prev, similarityMatch: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strict">Strict</SelectItem>
                <SelectItem value="fuzzy">Fuzzy (recommended)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max Results */}
          <div className="space-y-3">
            <Label htmlFor="maxResults" className="text-sm font-semibold">Max Results</Label>
            <Input
              id="maxResults"
              type="number"
              value={formData.maxResults}
              onChange={(e) => setFormData(prev => ({ ...prev, maxResults: parseInt(e.target.value) || 20 }))}
              min="1"
              max="100"
            />
          </div>
        </div>

        {/* Exclude Terms */}
        <div className="space-y-3">
          <Label htmlFor="exclude" className="text-sm font-semibold">
            Exclude Terms
          </Label>
          <div className="flex gap-2">
            <Input
              id="exclude"
              value={currentExclude}
              onChange={(e) => setCurrentExclude(e.target.value)}
              placeholder="e.g., recruiter, sales, customer support"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExcludeTerm())}
            />
            <Button type="button" onClick={addExcludeTerm} size="sm" variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.excludeTerms.map((term, index) => (
              <Badge key={index} variant="destructive" className="flex items-center gap-1">
                {term}
                <X className="w-3 h-3 cursor-pointer" onClick={() => removeExcludeTerm(index)} />
              </Badge>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="includeVariants"
            checked={formData.includeVariants}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeVariants: !!checked }))}
          />
          <Label htmlFor="includeVariants" className="text-sm">
            Include variants (personal sites, Linktree, Carrd, Bento)
          </Label>
        </div>

        <Button 
          type="submit" 
          disabled={isLoading || formData.platforms.length === 0}
          className="w-full gradient-primary hover:shadow-glow transition-smooth"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Generate Search Queries
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};