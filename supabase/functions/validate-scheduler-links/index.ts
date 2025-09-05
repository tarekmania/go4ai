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

    const { linkIds } = await req.json();

    if (!linkIds || !Array.isArray(linkIds)) {
      return new Response(JSON.stringify({ error: 'Link IDs array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validationResults = [];

    for (const linkId of linkIds) {
      try {
        // Get the scheduler link
        const { data: link, error: linkError } = await supabaseClient
          .from('scheduler_links')
          .select(`
            *,
            contacts!inner(user_id)
          `)
          .eq('id', linkId)
          .eq('contacts.user_id', user.id)
          .single();

        if (linkError || !link) {
          validationResults.push({
            linkId,
            isValid: false,
            error: 'Link not found or unauthorized'
          });
          continue;
        }

        // Validate the URL by making a HEAD request
        try {
          const response = await fetch(link.url, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });

          const isValid = response.ok;
          const platform = detectPlatform(link.url);

          // Update the link with validation results
          await supabaseClient
            .from('scheduler_links')
            .update({
              is_verified: isValid,
              verification_date: new Date().toISOString(),
              last_checked: new Date().toISOString(),
              platform: platform || link.platform,
              confidence_score: isValid ? Math.min((link.confidence_score || 0) + 0.2, 1.0) : Math.max((link.confidence_score || 0) - 0.1, 0)
            })
            .eq('id', linkId);

          validationResults.push({
            linkId,
            isValid,
            platform,
            statusCode: response.status,
            responseTime: Date.now() // Simplified timing
          });

        } catch (fetchError) {
          // URL is not accessible
          await supabaseClient
            .from('scheduler_links')
            .update({
              is_verified: false,
              verification_date: new Date().toISOString(),
              last_checked: new Date().toISOString(),
              confidence_score: Math.max((link.confidence_score || 0) - 0.2, 0)
            })
            .eq('id', linkId);

          validationResults.push({
            linkId,
            isValid: false,
            error: fetchError.message
          });
        }

      } catch (error) {
        validationResults.push({
          linkId,
          isValid: false,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      results: validationResults,
      totalValidated: validationResults.length,
      validLinks: validationResults.filter(r => r.isValid).length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in validate-scheduler-links function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function detectPlatform(url: string): string {
  const domain = new URL(url).hostname.toLowerCase();
  
  if (domain.includes('calendly')) return 'calendly';
  if (domain.includes('acuity')) return 'acuity';
  if (domain.includes('youcanbook')) return 'youcanbook';
  if (domain.includes('appointlet')) return 'appointlet';
  if (domain.includes('hubspot')) return 'hubspot';
  if (domain.includes('outcry')) return 'outcry';
  if (domain.includes('meetingbird')) return 'meetingbird';
  if (domain.includes('cal.com')) return 'cal_com';
  if (domain.includes('picktime')) return 'picktime';
  if (domain.includes('savvycal')) return 'savvycal';
  
  return 'other';
}