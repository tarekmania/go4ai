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

    const { contactId, updates } = await req.json();

    if (!contactId) {
      return new Response(JSON.stringify({ error: 'Contact ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update contact
    const { data: updatedContact, error: updateError } = await supabaseClient
      .from('contacts')
      .update({
        person_name: updates.person_name,
        title: updates.title,
        organization: updates.organization,
        location: updates.location,
        email: updates.email,
        linkedin_url: updates.linkedin_url,
        twitter_url: updates.twitter_url,
        website_url: updates.website_url,
        notes: updates.notes,
        tags: updates.tags,
        status: updates.status
      })
      .eq('id', contactId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Contact update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update contact' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!updatedContact) {
      return new Response(JSON.stringify({ error: 'Contact not found or unauthorized' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      contact: updatedContact
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in update-contact function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});