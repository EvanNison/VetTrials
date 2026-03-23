-- Full-text search index on trials
CREATE INDEX idx_trials_search ON trials USING GIN (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(condition_specific, '') || ' ' || coalesce(eligibility_summary, ''))
);

-- GIN index on species array for overlap queries
CREATE INDEX idx_trials_species ON trials USING GIN (species);
