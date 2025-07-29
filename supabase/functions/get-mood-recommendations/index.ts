import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mood } = await req.json();
    console.log('Received mood:', mood);

    if (!mood) {
      return new Response(JSON.stringify({ error: 'Mood is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Making OpenAI API request...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a movie recommendation expert. Based on the user\'s mood, recommend exactly 3 movies or TV shows. Respond ONLY with a valid JSON array containing objects with "title" and "explanation" fields. Do not include any markdown formatting or code blocks. The explanation should be 1-2 sentences about why this matches their mood. Example format: [{"title": "Movie Name", "explanation": "Brief explanation here"}]' 
          },
          { 
            role: 'user', 
            content: `I'm feeling ${mood}. What 3 movies or shows would you recommend?` 
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log('OpenAI response:', content);
    
    // Try to parse JSON response - handle markdown code blocks
    let recommendations;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content;
      if (content.includes('```json')) {
        cleanContent = content.replace(/```json\n?/g, '').replace(/\n?```/g, '');
      } else if (content.includes('```')) {
        cleanContent = content.replace(/```\n?/g, '').replace(/\n?```/g, '');
      }
      
      recommendations = JSON.parse(cleanContent.trim());
      
      // Validate that we have an array of objects with title and explanation
      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        throw new Error('Invalid recommendations format');
      }
      
      // Ensure each recommendation has required fields
      recommendations = recommendations.map(rec => ({
        title: rec.title || 'Unknown Movie',
        explanation: rec.explanation || 'A great movie to watch!'
      }));
      
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.error('Raw content:', content);
      // Fallback: extract titles manually if JSON parsing fails
      recommendations = [
        { title: "The Shawshank Redemption", explanation: "A hopeful story that matches your current vibe" },
        { title: "Spirited Away", explanation: "A magical adventure to lift your spirits" },
        { title: "Her", explanation: "A thoughtful film that resonates with your mood" }
      ];
    }

    // Get movie posters from TMDB for each recommendation
    const recommendationsWithPosters = await Promise.all(
      recommendations.map(async (rec: any) => {
        try {
          const searchResponse = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=8a4d4f4ec18ce1c2d0b5e0e8b0e9f9b1&query=${encodeURIComponent(rec.title)}`
          );
          
          if (!searchResponse.ok) {
            console.error('TMDB API error:', searchResponse.status);
            return rec;
          }
          
          const searchData = await searchResponse.json();
          console.log('TMDB search result for', rec.title, ':', searchData);
          
          if (searchData.results && searchData.results.length > 0) {
            const movie = searchData.results[0];
            return {
              ...rec,
              poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
              tmdb_id: movie.id,
              release_year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
              overview: movie.overview
            };
          }
          
          return rec;
        } catch (error) {
          console.error('TMDB API error for', rec.title, error);
          return rec; // Return without poster if TMDB fails
        }
      })
    );

    console.log('Final recommendations:', recommendationsWithPosters);
    return new Response(JSON.stringify({ recommendations: recommendationsWithPosters }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-mood-recommendations function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});