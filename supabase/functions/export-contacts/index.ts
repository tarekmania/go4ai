import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'json';
    const includeSchedulerLinks = url.searchParams.get('includeSchedulerLinks') === 'true';

    // Get all contacts for the user
    const { data: contacts, error: contactsError } = await supabaseClient
      .from('contacts')
      .select(`
        *,
        scheduler_links (
          id,
          url,
          platform,
          confidence_score,
          is_verified,
          context_snippet,
          discovered_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (contactsError) {
      console.error('Contacts fetch error:', contactsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch contacts' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'Name',
        'Title',
        'Organization',
        'Location',
        'Email',
        'LinkedIn',
        'Twitter',
        'Website',
        'Status',
        'Tags',
        'Notes',
        'Created At'
      ];

      if (includeSchedulerLinks) {
        csvHeaders.push('Scheduler Links', 'Link Platforms', 'Link Confidence');
      }

      const csvRows = contacts.map(contact => {
        const row = [
          contact.person_name || '',
          contact.title || '',
          contact.organization || '',
          contact.location || '',
          contact.email || '',
          contact.linkedin_url || '',
          contact.twitter_url || '',
          contact.website_url || '',
          contact.status || '',
          contact.tags?.join('; ') || '',
          contact.notes || '',
          contact.created_at || ''
        ];

        if (includeSchedulerLinks && contact.scheduler_links) {
          const links = contact.scheduler_links.map((link: any) => link.url).join('; ');
          const platforms = contact.scheduler_links.map((link: any) => link.platform).join('; ');
          const confidence = contact.scheduler_links.map((link: any) => link.confidence_score).join('; ');
          row.push(links, platforms, confidence);
        } else if (includeSchedulerLinks) {
          row.push('', '', '');
        }

        return row;
      });

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
        .join('\n');

      return new Response(csvContent, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="contacts.csv"'
        },
      });
    } else {
      // Return JSON
      const exportData = {
        exported_at: new Date().toISOString(),
        total_contacts: contacts.length,
        contacts: includeSchedulerLinks ? contacts : contacts.map(contact => {
          const { scheduler_links, ...contactWithoutLinks } = contact;
          return contactWithoutLinks;
        })
      };

      return new Response(JSON.stringify(exportData, null, 2), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="contacts.json"'
        },
      });
    }

  } catch (error) {
    console.error('Error in export-contacts function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});