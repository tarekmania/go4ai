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
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const tags = url.searchParams.get('tags')?.split(',').filter(Boolean) || [];

    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseClient
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`person_name.ilike.%${search}%,organization.ilike.%${search}%,title.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (tags.length > 0) {
      query = query.overlaps('tags', tags);
    }

    const { data: contacts, error: contactsError } = await query;

    if (contactsError) {
      console.error('Contacts fetch error:', contactsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch contacts' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get total count for pagination
    let countQuery = supabaseClient
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (search) {
      countQuery = countQuery.or(`person_name.ilike.%${search}%,organization.ilike.%${search}%,title.ilike.%${search}%`);
    }

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    if (tags.length > 0) {
      countQuery = countQuery.overlaps('tags', tags);
    }

    const { count } = await countQuery;

    return new Response(JSON.stringify({ 
      contacts,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-user-contacts function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});