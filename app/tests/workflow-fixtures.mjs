import assert from 'node:assert/strict';
import {fixtures, db, pg, active, post, validDraft, BASE, login} from './review-fixtures.mjs';
export {db, pg, active, post, validDraft, BASE};
export async function workflowFixtures() {
  const f = await fixtures();
  const originalCleanup = f.cleanup;
  const foreignName = f.tag + 'foreign';
  const foreignUser = Number(db(`INSERT INTO kvazi.user_account(username,email,password_hash,role)
    SELECT ${pg(foreignName)},${pg(foreignName+'@kvazi.int')},password_hash,'USER' FROM kvazi.user_account WHERE id=${f.user} RETURNING id`));
  f.sessions.foreign = await login(foreignName,f.password);
  const catalogBackups = new Map();
  function context(revisionId) {
    return {revisionId, validationResultId:Number(db(`SELECT id FROM kvazi.validation_result WHERE revision_id=${revisionId}`))};
  }
  function revision(tokens = [f.token], {valid = false, rules = active} = {}) {
    const sentenceId = Number(db(`INSERT INTO kvazi.sentence(user_id) VALUES (${f.user}) RETURNING id`));
    const draft = {sentenceType:'declarative', implicitSubject:false, tokens};
    const revisionId = Number(db(`INSERT INTO kvazi.sentence_revision(sentence_id,revision_no,rules_version,submitted_by,draft_json)
      VALUES (${sentenceId},1,${pg(rules)},${f.user},${pg(JSON.stringify(draft))}::jsonb) RETURNING id`));
    const validationResultId = Number(db(`INSERT INTO kvazi.validation_result(sentence_id,revision_id,rules_version,validator_version,is_valid,word_score,char_score,result_json)
      SELECT ${sentenceId},${revisionId},version,validator_version,${valid},7,23,'{"fixture":"M3 precondition isolation, not a linguistic verdict"}' FROM kvazi.rules_release WHERE version=${pg(rules)} RETURNING id`));
    return {sentenceId, revisionId, validationResultId};
  }
  async function submit(draft = validDraft(), sentenceId) {
    const response = await post('/api/submit.php', f.sessions.user, {draft, ...(sentenceId ? {sentenceId} : {})});
    assert.equal(response.status, 200, JSON.stringify(response.body));
    return {...context(response.body.revisionId), sentenceId:response.body.id};
  }
  function keyFor(ids, tokenId = 't1') {
    return JSON.parse(db(`SELECT t FROM kvazi.sentence_revision r, LATERAL jsonb_array_elements(r.draft_json->'tokens') t WHERE r.id=${ids.revisionId} AND t->>'id'=${pg(tokenId)}`));
  }
  function backupCatalog(ids, tokenId) {
    const token = keyFor(ids, tokenId);
    // All shared keys in these fixtures are verbs; unique test lexemes need no restore.
    if (token.lemma.startsWith(f.tag) || catalogBackups.has(token.lemma)) return;
    const rows = JSON.parse(db(`SELECT coalesce(json_agg(c),'[]') FROM kvazi.real_word_catalog c WHERE identity_json->>'lemma'=${pg(token.lemma)}`));
    catalogBackups.set(token.lemma, rows);
  }
  async function catalog(ids, approved, tokenId = 't1', extra = {}) {
    backupCatalog(ids, tokenId);
    return post('/api/admin/real-word-catalog.php', f.sessions.admin, {...idsForApi(ids), tokenId, isApproved:approved, ...extra});
  }
  async function morph(ids, verdict = 'APPROVED', tokenId = 't1', extra = {}) {
    return post('/api/admin/morphology-review.php', f.sessions.admin, {...idsForApi(ids), tokenId, expectedDecisionNo:0, verdict, ...extra});
  }
  async function decide(ids, action, reason = '', session = f.sessions.admin) {
    return post('/api/admin/sentence-decision.php', session, {...idsForApi(ids), action, reason});
  }
  async function get(path, session) {
    const r = await fetch(BASE + path, {headers:session ? {Cookie:session.cookie} : {}, redirect:'manual'});
    return {status:r.status, html:await r.text(), location:r.headers.get('location')};
  }
  function cleanup() {
    db(`DELETE FROM kvazi.user_account WHERE id=${foreignUser} AND username=${pg(foreignName)}`);
    db(`BEGIN; SET LOCAL session_replication_role=replica;
      DELETE FROM kvazi.real_word_catalog WHERE admin_id=${f.admin}; COMMIT;`);
    for (const [lemma, rows] of catalogBackups) {
      // Restore exactly the shared entries that this fixture updated, including metadata.
      db(`BEGIN; SET LOCAL session_replication_role=replica;
        DELETE FROM kvazi.real_word_catalog WHERE identity_json->>'lemma'=${pg(lemma)};
        INSERT INTO kvazi.real_word_catalog SELECT * FROM json_populate_recordset(NULL::kvazi.real_word_catalog, ${pg(JSON.stringify(rows))}); COMMIT;`);
    }
    originalCleanup();
    // Shared verb cases created by this fixture can now be removed only if unused.
    db(`BEGIN; SET LOCAL session_replication_role=replica;
      DELETE FROM kvazi.morphology_review_case c WHERE identity_json->>'lemma' IN ('kvaziit','qaziit')
      AND NOT EXISTS (SELECT 1 FROM kvazi.morphology_review_decision d WHERE d.case_id=c.id); COMMIT;`);
  }
  return {...f, context, revision, submit, catalog, morph, decide, get, backupCatalog, cleanup};
}
export const idsForApi = ids => ({revisionId:ids.revisionId, validationResultId:ids.validationResultId});
