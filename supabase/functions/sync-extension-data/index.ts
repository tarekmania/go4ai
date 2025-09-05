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

    const { syncData, syncType } = await req.json();

    // Save sync data
    const { data: syncRecord, error: syncError } = await supabaseClient
      .from('extension_sync')
      .insert({
        user_id: user.id,
        sync_type: syncType,
        data: syncData,
        processed: false
      })
      .select()
      .single();

    if (syncError) {
      console.error('Sync data save error:', syncError);
      return new Response(JSON.stringify({ error: 'Failed to save sync data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process the sync data based on type
    let processedCount = 0;
    let errors: any[] = [];

    if (syncType === 'contacts_batch') {
      for (const contactData of syncData.contacts || []) {
        try {
          // Check if contact already exists
          const { data: existingContact } = await supabaseClient
            .from('contacts')
            .select('id')
            .eq('user_id', user.id)
            .eq('person_name', contactData.person_name)
            .eq('organization', contactData.organization)
            .maybeSingle();

          if (!existingContact) {
            // Insert new contact
            const { data: newContact, error: contactError } = await supabaseClient
              .from('contacts')
              .insert({
                user_id: user.id,
                person_name: contactData.person_name,
                title: contactData.title,
                organization: contactData.organization,
                location: contactData.location,
                email: contactData.email,
                linkedin_url: contactData.linkedin_url,
                twitter_url: contactData.twitter_url,
                website_url: contactData.website_url,
                notes: contactData.notes,
                tags: contactData.tags || [],
                source: 'extension'
              })
              .select()
              .single();

            if (contactError) {
              errors.push({ contact: contactData.person_name, error: contactError.message });
              continue;
            }

            // Insert scheduler links if any
            if (contactData.schedulerLinks && contactData.schedulerLinks.length > 0) {
              const linksToInsert = contactData.schedulerLinks.map((link: any) => ({
                contact_id: newContact.id,
                url: link.url,
                platform: link.platform,
                confidence_score: link.confidence_score || 0.0,
                context_snippet: link.context_snippet,
                is_verified: false
              }));

              await supabaseClient
                .from('scheduler_links')
                .insert(linksToInsert);
            }

            processedCount++;
          }
        } catch (error) {
          errors.push({ contact: contactData.person_name, error: error.message });
        }
      }
    }

    // Mark sync as processed
    await supabaseClient
      .from('extension_sync')
      .update({ processed: true })
      .eq('id', syncRecord.id);

    return new Response(JSON.stringify({ 
      success: true,
      syncId: syncRecord.id,
      processedCount,
      errors,
      totalContacts: syncData.contacts?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-extension-data function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});