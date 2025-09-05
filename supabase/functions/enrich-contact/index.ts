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

    const { contactId, enrichmentData } = await req.json();

    if (!contactId) {
      return new Response(JSON.stringify({ error: 'Contact ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the existing contact to verify ownership
    const { data: existingContact, error: fetchError } = await supabaseClient
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingContact) {
      return new Response(JSON.stringify({ error: 'Contact not found or unauthorized' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Merge enrichment data with existing contact
    const updatedFields: any = {};

    // Only update fields that are provided in enrichmentData and are not already filled
    if (enrichmentData.title && !existingContact.title) {
      updatedFields.title = enrichmentData.title;
    }
    if (enrichmentData.location && !existingContact.location) {
      updatedFields.location = enrichmentData.location;
    }
    if (enrichmentData.email && !existingContact.email) {
      updatedFields.email = enrichmentData.email;
    }
    if (enrichmentData.linkedin_url && !existingContact.linkedin_url) {
      updatedFields.linkedin_url = enrichmentData.linkedin_url;
    }
    if (enrichmentData.twitter_url && !existingContact.twitter_url) {
      updatedFields.twitter_url = enrichmentData.twitter_url;
    }
    if (enrichmentData.website_url && !existingContact.website_url) {
      updatedFields.website_url = enrichmentData.website_url;
    }

    // Merge tags (add new ones, don't replace)
    if (enrichmentData.tags && Array.isArray(enrichmentData.tags)) {
      const existingTags = existingContact.tags || [];
      const newTags = [...new Set([...existingTags, ...enrichmentData.tags])];
      updatedFields.tags = newTags;
    }

    // Append to notes if provided
    if (enrichmentData.notes) {
      const existingNotes = existingContact.notes || '';
      const separator = existingNotes ? '\n\n--- Enriched Data ---\n' : '';
      updatedFields.notes = existingNotes + separator + enrichmentData.notes;
    }

    // Only update if there are changes
    if (Object.keys(updatedFields).length === 0) {
      return new Response(JSON.stringify({ 
        success: true,
        contact: existingContact,
        message: 'No enrichment needed - contact already has all available data'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update the contact
    const { data: updatedContact, error: updateError } = await supabaseClient
      .from('contacts')
      .update(updatedFields)
      .eq('id', contactId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Contact enrichment error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to enrich contact' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add new scheduler links if provided
    if (enrichmentData.schedulerLinks && Array.isArray(enrichmentData.schedulerLinks)) {
      const linksToInsert = enrichmentData.schedulerLinks.map((link: any) => ({
        contact_id: contactId,
        url: link.url,
        platform: link.platform || 'other',
        confidence_score: link.confidence_score || 0.5,
        context_snippet: link.context_snippet,
        is_verified: false
      }));

      await supabaseClient
        .from('scheduler_links')
        .insert(linksToInsert);
    }

    return new Response(JSON.stringify({ 
      success: true,
      contact: updatedContact,
      enrichedFields: Object.keys(updatedFields),
      message: 'Contact enriched successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enrich-contact function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});