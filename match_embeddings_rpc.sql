-- Run this SQL query in your Supabase SQL Editor to enable pgvector similarity searching:

CREATE OR REPLACE FUNCTION match_embeddings (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  filter_source_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  source_id text,
  source_type text,
  content text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    embeddings.id,
    embeddings.source_id,
    embeddings.source_type,
    embeddings.content,
    1 - (embeddings.embedding <=> query_embedding) AS similarity,
    embeddings.metadata
  FROM embeddings
  WHERE 
    (filter_source_type IS NULL OR embeddings.source_type = filter_source_type)
    AND 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
