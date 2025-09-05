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

    const { contact, schedulerLinks } = await req.json();

    // Save contact
    const { data: savedContact, error: contactError } = await supabaseClient
      .from('contacts')
      .insert({
        user_id: user.id,
        person_name: contact.person_name,
        title: contact.title,
        organization: contact.organization,
        location: contact.location,
        email: contact.email,
        linkedin_url: contact.linkedin_url,
        twitter_url: contact.twitter_url,
        website_url: contact.website_url,
        notes: contact.notes,
        tags: contact.tags || [],
        source: contact.source || 'extension'
      })
      .select()
      .single();

    if (contactError) {
      console.error('Contact save error:', contactError);
      return new Response(JSON.stringify({ error: 'Failed to save contact' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save scheduler links if provided
    if (schedulerLinks && schedulerLinks.length > 0) {
      const linksToInsert = schedulerLinks.map((link: any) => ({
        contact_id: savedContact.id,
        url: link.url,
        platform: link.platform,
        confidence_score: link.confidence_score || 0.0,
        context_snippet: link.context_snippet,
        is_verified: false
      }));

      const { error: linksError } = await supabaseClient
        .from('scheduler_links')
        .insert(linksToInsert);

      if (linksError) {
        console.error('Scheduler links save error:', linksError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      contact: savedContact 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in save-contact function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});