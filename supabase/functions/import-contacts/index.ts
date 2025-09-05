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

    const { contacts, options = {} } = await req.json();

    if (!contacts || !Array.isArray(contacts)) {
      return new Response(JSON.stringify({ error: 'Contacts array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = {
      total: contacts.length,
      imported: 0,
      skipped: 0,
      errors: [] as any[]
    };

    for (const contactData of contacts) {
      try {
        // Validate required fields
        if (!contactData.person_name) {
          results.errors.push({
            contact: contactData,
            error: 'person_name is required'
          });
          continue;
        }

        // Check for duplicates if option is enabled
        if (options.skipDuplicates) {
          const { data: existingContact } = await supabaseClient
            .from('contacts')
            .select('id')
            .eq('user_id', user.id)
            .eq('person_name', contactData.person_name)
            .eq('organization', contactData.organization || '')
            .maybeSingle();

          if (existingContact) {
            results.skipped++;
            continue;
          }
        }

        // Insert the contact
        const { data: newContact, error: insertError } = await supabaseClient
          .from('contacts')
          .insert({
            user_id: user.id,
            person_name: contactData.person_name,
            title: contactData.title || null,
            organization: contactData.organization || null,
            location: contactData.location || null,
            email: contactData.email || null,
            linkedin_url: contactData.linkedin_url || null,
            twitter_url: contactData.twitter_url || null,
            website_url: contactData.website_url || null,
            notes: contactData.notes || null,
            tags: contactData.tags || [],
            status: contactData.status || 'new',
            source: contactData.source || 'import'
          })
          .select()
          .single();

        if (insertError) {
          results.errors.push({
            contact: contactData.person_name,
            error: insertError.message
          });
          continue;
        }

        // Import scheduler links if provided
        if (contactData.scheduler_links && Array.isArray(contactData.scheduler_links)) {
          const linksToInsert = contactData.scheduler_links.map((link: any) => ({
            contact_id: newContact.id,
            url: link.url,
            platform: link.platform || 'other',
            confidence_score: link.confidence_score || 0.0,
            context_snippet: link.context_snippet || null,
            is_verified: link.is_verified || false
          }));

          await supabaseClient
            .from('scheduler_links')
            .insert(linksToInsert);
        }

        results.imported++;

      } catch (error) {
        results.errors.push({
          contact: contactData.person_name || 'Unknown',
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in import-contacts function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});