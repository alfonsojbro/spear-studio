-- Local development seed. Applied by `pnpm dev` to the LOCAL D1 only.
-- Idempotent (INSERT OR IGNORE with fixed ids). Never apply with --remote.
-- All people and clients here are fictional. Sample clients carry is_sample = 1.

INSERT OR IGNORE INTO agency (id, name, slug, settings) VALUES
  ('00000000-0000-4000-8000-000000000001', 'Spear Media', 'spear-media', '{"staffEmailDomains":["spearmedia.test"]}');

-- Dev identities. DEV_USER_EMAIL in apps/web/.dev.vars picks who you are.
INSERT OR IGNORE INTO member (id, agency_id, email, name, role) VALUES
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'owner@spearmedia.test', 'Dev Owner', 'owner'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'editor@spearmedia.test', 'Dev Editor', 'editor'),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'freelancer@spearmedia.test', 'Dev Freelancer', 'freelancer');

INSERT OR IGNORE INTO client (id, agency_id, name, slug, timezone, language, region, is_sample, brand_kit) VALUES
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', 'Casa Lumbre', 'casa-lumbre', 'America/Managua', 'es', 'NI', 1, '{"niche":"Restaurant"}'),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000001', 'Norte Fitness', 'norte-fitness', 'America/Panama', 'es', 'PA', 1, '{"niche":"Gym"}'),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000001', 'Harbor & Pine Realty', 'harbor-pine-realty', 'America/New_York', 'en', 'US', 1, '{"niche":"Real estate"}'),
  ('00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000001', 'Sol Andino Coffee', 'sol-andino-coffee', 'America/Bogota', 'es', 'CO', 1, '{"niche":"Coffee roaster"}');

INSERT OR IGNORE INTO client_member (id, client_id, member_id, role) VALUES
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000103', 'freelancer');

INSERT OR IGNORE INTO social_account (id, client_id, platform, handle, status) VALUES
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000201', 'ig', 'casalumbre.ni', 'manual'),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000201', 'tiktok', 'casalumbre', 'manual'),
  ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-000000000202', 'ig', 'nortefitness.pa', 'manual'),
  ('00000000-0000-4000-8000-000000000404', '00000000-0000-4000-8000-000000000202', 'tiktok', 'nortefitness', 'manual'),
  ('00000000-0000-4000-8000-000000000405', '00000000-0000-4000-8000-000000000202', 'youtube', 'NorteFitnessPA', 'manual'),
  ('00000000-0000-4000-8000-000000000406', '00000000-0000-4000-8000-000000000203', 'ig', 'harborandpine', 'manual'),
  ('00000000-0000-4000-8000-000000000407', '00000000-0000-4000-8000-000000000204', 'ig', 'solandino.coffee', 'manual'),
  ('00000000-0000-4000-8000-000000000408', '00000000-0000-4000-8000-000000000204', 'youtube', 'SolAndinoCoffee', 'manual');

INSERT OR IGNORE INTO staff_invite (id, agency_id, email, role, created_by) VALUES
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000001', 'strategist@spearmedia.test', 'strategist', '00000000-0000-4000-8000-000000000101');
