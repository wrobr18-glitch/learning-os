import { supabase } from "./index";

export interface EmbeddingRow {
  id: string;
  source_id: string;
  source_type: string;
  content: string;
  similarity?: number;
  metadata: any;
}

/**
 * Inserts a new vector embedding into the Supabase database.
 */
export async function insertEmbedding(
  sourceId: string,
  sourceType: string,
  content: string,
  embedding: number[],
  metadata: object = {}
): Promise<void> {
  const { error } = await supabase
    .from("embeddings")
    .insert({
      source_id: sourceId,
      source_type: sourceType,
      content,
      embedding,
      metadata
    });

  if (error) {
    throw new Error(`Failed to insert embedding: ${error.message}`);
  }
}

/**
 * Executes a vector cosine similarity search using the match_embeddings RPC function.
 */
export async function matchEmbeddings(
  queryEmbedding: number[],
  matchThreshold = 0.5,
  matchCount = 5,
  filterSourceType?: string
): Promise<EmbeddingRow[]> {
  const { data, error } = await supabase.rpc("match_embeddings", {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
    filter_source_type: filterSourceType || null
  });

  if (error) {
    throw new Error(`Failed to query vector embeddings: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    source_id: row.source_id,
    source_type: row.source_type,
    content: row.content,
    similarity: row.similarity,
    metadata: row.metadata
  }));
}
