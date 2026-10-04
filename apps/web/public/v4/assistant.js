/* SignalPass's hosted agent: grounded suggestions and drafts, never delivery. */
(async () => {
  'use strict';
  const api = window.SignalPass;
  const $ = (query) => document.querySelector(query);
  const node = (tag, className, value) => { const element = document.createElement(tag); if (className) element.className = className; if (value !== undefined) element.textContent = String(value); return element; };
  const link = (label, href, className = 'sp-text-link') => { const element = node('a', className, label); element.href = href; return element; };
  const action = (label, handler, className = 'button outline') => { const element = node('button', className, label); element.type = 'button'; element.addEventListener('click', handler); return element; };
  const text = (value) => typeof value === 'string' ? value : '';
  const validHandle = (handle) => typeof handle === 'string' && /^[a-z0-9_-]{3,32}$/.test(handle);
  const validId = (id) => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id);
  const dateLabel = (seconds) => new Date(Number(seconds) * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const focusSection = (section) => { section.focus({ preventScroll: true }); section.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); };
  const resumeKey = 'signalpass-assistant-return';
  const owner = () => api.me?.session?.address?.toLowerCase() || null;
  let status = null, workspace = { runs: [], drafts: [] }, busy = false, currentRun = null, currentDraft = null, selectedHandle = null, workTimer = null, activeWork = null;
  const fieldLabels = { whoAmI: 'A little about me', whyYou: 'Why I’m reaching out', whatIOffer: 'What I can offer', nextStep: 'A useful next step' };
  const evidenceLabels = { building: 'Working on', canOffer: 'Can offer', wantsToMeet: 'Wants to meet', interests: 'Interests', displayName: 'Public profile', bio: 'Background' };
  const errorMessages = {
    agent_not_configured: 'Your agent isn’t available on this deployment yet. You can still write an introduction yourself.',
    agent_unavailable: 'Your agent couldn’t finish this request. Your previous work is still here; nothing has been sent.',
    agent_timeout: 'Your agent took too long to respond. Your previous work is still here. Retry when you’re ready, or continue without AI.',
    agent_provider_busy: 'The AI provider is busy right now. Your previous work is safe. You can retry later or continue without AI.',
    agent_response_incomplete: 'The AI response was incomplete, so we couldn’t use it. Your previous results and draft are still here.',
    agent_draft_ungrounded: 'This draft included a personal claim we couldn’t support, so it wasn’t saved. Try again or write the introduction yourself.',
    agent_budget_exhausted: 'Today’s included AI usage is exhausted. Your saved work is still available, and you can write an introduction yourself.',
    agent_busy: 'Your agent is already working on a request. Give it a moment before trying again.',
    agent_draft_not_found: 'This draft is no longer available. Prepare a fresh introduction from your search results.',
    agent_run_not_found: 'This saved search is no longer available. Submit your goal again for current suggestions.',
    agent_history_cleared: 'Your history was cleared while this request was running. Submit a new goal when you’re ready.',
    agent_draft_stale: 'A profile changed or this draft expired. Search again before preparing a fresh introduction.',
    agent_candidate_unavailable: 'This person’s profile is no longer available for this search. Search again to see current profiles.',
    agent_refinement_limit: 'You’ve added three answers to this search. You can choose someone here or start a new goal.',
    agent_profile_consent_required: 'Choose whether to let your agent use your approved profile for this introduction. The checkbox is just above.',
    profile_required: 'Save an approved profile first, so your agent has details you’ve checked. Your goal and selected person will be here when you return.',
    authentication_required: 'Sign in again to continue with this private workspace. Your goal has been kept in this tab.',
  };
  const canRequest = () => Boolean(status?.enabled && api.me && !api.demo && !api.error && status.remainingToday !== 0);
  const canRefine = () => Boolean(currentRun && currentRun.modelCalled !== false && (currentRun.clarifications?.length || 0) < 3);
  const progressElement = (kind) => $(kind === 'draft' ? '#agent-draft-progress' : kind === 'refine' ? '#agent-refine-progress' : '#agent-progress');
  const progress = (message = '', kind = 'search') => { const element = progressElement(kind); element.textContent = message; if (!busy) element.classList.remove('is-working'); };
  const clearErrors = () => { ['#agent-error', '#agent-draft-error', '#agent-refine-error'].forEach((id) => { $(id).replaceChildren(); $(id).hidden = true; }); };
  function persistResume() {
    if (api.demo) return;
    const goal = $('#agent-goal').value.slice(0, 1200);
    try { sessionStorage.setItem(resumeKey, JSON.stringify({ owner: owner(), goal, runId: owner() && validId(currentRun?.id) ? currentRun.id : null, handle: owner() && validHandle(selectedHandle) ? selectedHandle : null, createdAt: Date.now() })); } catch {}
  }
  function profileLink() { const element = link('Review your profile →', '/profile/import?returnTo=assistant', 'button outline'); element.addEventListener('click', persistResume); return element; }
  function showError(error, { kind = 'search', retry, handle } = {}) {
    const box = $(kind === 'draft' ? '#agent-draft-error' : kind === 'refine' ? '#agent-refine-error' : '#agent-error');
    const code = error.name === 'TimeoutError' || error.name === 'AbortError' ? 'agent_timeout' : error.code;
    box.replaceChildren(node('p', '', errorMessages[code] || 'This request could not be completed. Your previous work is still here.'));
    const actions = node('div', 'assistant-actions');
    if (code === 'profile_required') { persistResume(); actions.append(profileLink()); }
    else if (code === 'authentication_required') { persistResume(); actions.append(link('Refresh sign-in →', '/assistant', 'button outline')); }
    else if (code === 'agent_profile_consent_required') {
      actions.append(action('Review profile permission', () => { $('#agent-draft-consent').focus(); }, 'button outline'));
    } else if (retry && !['agent_not_configured', 'agent_budget_exhausted', 'agent_refinement_limit', 'agent_run_not_found', 'agent_candidate_unavailable', 'agent_draft_stale', 'agent_history_cleared'].includes(code)) {
      actions.append(action(kind === 'draft' ? 'Try this draft again' : kind === 'refine' ? 'Retry this refinement' : 'Retry this search', retry, 'button outline assistant-retry'));
    }
    if (['agent_run_not_found', 'agent_candidate_unavailable', 'agent_draft_stale'].includes(code)) actions.append(action('Search this goal again', () => search($('#agent-goal').value.trim()), 'button outline assistant-retry'));
    const person = validHandle(handle) ? handle : validHandle(selectedHandle) ? selectedHandle : null;
    actions.append(link(person ? 'Write an introduction myself ↗' : 'Browse people myself ↗', person ? '/introductions/new/' + encodeURIComponent(person) : '/discover'));
    box.append(actions); box.hidden = false;
    if (code === 'agent_budget_exhausted' && status) status.remainingToday = 0;
    if (currentDraft && kind === 'draft') {
      $('#agent-preserved-draft').hidden = false;
      $('#agent-preserved-draft').textContent = 'Kept from your earlier request: the draft below is for ' + (text(currentDraft.recipientName) || currentDraft.recipientHandle) + '. It has not been replaced or sent.';
    }
    updateControls(); focusSection(box);
  }
  function updateControls() {
    $('#agent-submit').disabled = busy || !canRequest();
    $('#agent-submit').textContent = busy && activeWork === 'search' ? 'Looking for useful connections…' : currentRun ? 'Search this goal again →' : 'Find relevant people →';
    $('#agent-submit').classList.toggle('primary', !currentRun);
    $('#agent-submit').classList.toggle('outline', Boolean(currentRun));
    $('#agent-goal-form').setAttribute('aria-busy', String(busy && activeWork === 'search'));
    $('#agent-refine-form').setAttribute('aria-busy', String(busy && activeWork === 'refine'));
    $('#agent-selection').setAttribute('aria-busy', String(busy && activeWork === 'draft'));
    $('#agent-refine-submit').disabled = busy || !canRequest() || !canRefine();
    $('#agent-refine-submit').textContent = busy && activeWork === 'refine' ? 'Refining your suggestions…' : 'Refine these suggestions →';
    $('#agent-prepare-selected').disabled = busy || !canRequest() || !validHandle(selectedHandle);
    $('#agent-prepare-selected').textContent = busy && activeWork === 'draft' ? 'Preparing your introduction…' : 'Prepare introduction →';
    const selectedDraft = Boolean(currentDraft && currentDraft.recipientHandle === selectedHandle);
    $('#agent-prepare-selected').classList.toggle('primary', !selectedDraft);
    $('#agent-prepare-selected').classList.toggle('outline', selectedDraft);
    $('#agent-draft-handoff').classList.toggle('primary', selectedDraft);
    $('#agent-draft-handoff').classList.toggle('outline', !selectedDraft);
    ['#agent-goal', '#agent-use-profile', '#agent-draft-consent', '#agent-refine-answer'].forEach((id) => { $(id).disabled = busy; });
    document.querySelectorAll('[data-example],.assistant-select-match,#agent-confirm-clear,#agent-clear-history,#agent-edit-goal,.assistant-history-entry button,.assistant-retry').forEach((button) => { button.disabled = busy; });
  }
  function renderBudget() {
    const budget = $('#agent-budget');
    budget.textContent = api.demo ? 'Live AI is off in sample mode.' : !api.me ? 'Included daily usage after sign-in.' : !status?.enabled ? 'AI availability depends on this deployment.' : Number.isFinite(status.remainingToday) && Number.isFinite(status.limit) ? `${status.remainingToday} of ${status.limit} AI requests left today · covered by SignalPass` : 'SignalPass covers a limited number of AI requests each day.';
    updateControls();
  }
  const notice = (message, actions = []) => { $('#agent-notice-text').textContent = message; $('#agent-notice-actions').replaceChildren(...actions); $('#agent-notice').hidden = !message; };
  async function connect() {
    clearErrors(); persistResume(); busy = true; updateControls();
    try { await api.connect(); } catch (error) { $('#agent-error').textContent = error.message || 'Sign-in could not be completed.'; $('#agent-error').hidden = false; }
    finally { busy = false; updateControls(); }
  }
  function renderStatus() {
    const badge = $('#agent-state'); badge.dataset.state = '';
    if (api.demo) {
      badge.textContent = 'Sample mode'; notice('Sample mode does not generate AI recommendations or drafts. Open the live workspace to use your agent.', [link('Open live agent →', '/assistant?demo=0', 'button outline'), link('Browse sample people', '/discover?demo=1')]);
    } else if (api.error) {
      badge.textContent = 'Connection unavailable'; notice('We couldn’t load your workspace. Reconnect to try again. Nothing has been sent.', [action('Try again', () => { persistResume(); location.reload(); })]);
    } else if (!api.me) {
      badge.textContent = 'Ready when you are'; notice('Start with a goal, then connect your wallet to keep working. Sign-in is free and does not request a payment. Or try offline fictional sample people: no wallet, AI requests, or external messages.', [action('Connect wallet', connect), link('Try sample people', '/discover?demo=1', 'button outline')]);
    } else if (!status) {
      badge.textContent = 'Availability unknown'; notice('We couldn’t check your agent’s availability. Try again, or browse people yourself.', [action('Try again', () => { persistResume(); location.reload(); }), link('Browse people →', '/discover')]);
    } else if (!status.enabled) {
      badge.textContent = 'Not available yet'; notice('Your agent isn’t available on this deployment yet. You can still browse people and prepare an introduction yourself.', [link('Browse people →', '/discover', 'button outline')]);
    } else { badge.textContent = 'Live agent'; badge.dataset.state = 'ready'; notice(''); }
    const provider = [text(status?.provider), text(status?.model)].filter(Boolean).join(' · ');
    $('#agent-disclosure').textContent = `Your goal, any follow-up answers, and selected public profiles are sent to ${provider ? `the configured AI provider (${provider})` : 'SignalPass’s AI provider'}. Your approved profile is included only when you check the box. This does not share your profile with another person.`;
    renderBudget();
  }
  const updateUsage = (result) => { if (status && Number.isFinite(result.usage?.remainingToday)) status.remainingToday = result.usage.remainingToday; renderBudget(); };
  const refreshUsage = async () => { try { status = await api.request('/agent/status'); renderBudget(); } catch {} };
  function beginWork(kind, message) {
    busy = true; activeWork = kind; updateControls();
    const element = progressElement(kind); element.classList.add('is-working');
    const started = Date.now(); progress(message + ' This can take up to a minute.', kind);
    workTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000);
      if (elapsed >= 20) progress(`Still waiting for your agent’s response (${elapsed}s). Your previous work is still here; nothing will be sent.`, kind);
    }, 10000);
  }
  function finishWork() { clearInterval(workTimer); workTimer = null; busy = false; if (activeWork) progressElement(activeWork).classList.remove('is-working'); activeWork = null; updateControls(); }
  function selectedMatch() { return currentRun?.matches?.find((match) => match.handle === selectedHandle) || null; }
  function renderSelection() {
    const match = selectedMatch(); $('#agent-selection').hidden = !match;
    document.querySelectorAll('.assistant-match[data-handle]').forEach((card) => {
      const selected = card.dataset.handle === selectedHandle; card.classList.toggle('is-selected', selected);
      card.querySelector('.assistant-select-match')?.setAttribute('aria-pressed', String(selected));
      const badge = card.querySelector('.assistant-selected-badge'); if (badge) badge.hidden = !selected;
    });
    if (match) {
      $('#agent-selected-heading').textContent = 'An introduction to ' + (text(match.displayName) || match.handle) + '.';
      $('#agent-selected-detail').textContent = 'Your agent will prepare a private draft from this search. You’ll edit it and approve delivery yourself.';
      $('#agent-selected-manual').href = '/introductions/new/' + encodeURIComponent(match.handle);
    }
    updateControls();
  }
  function connectionCard(match, run) {
    const section = node('section', 'assistant-connection'); section.append(node('h4', '', 'Why you two'));
    const facts = node('dl');
    const fact = (title, value, source) => { const cell = node('div', 'assistant-connection-cell'); const content = node('dd', '', value); content.append(node('cite', '', source)); cell.append(node('dt', '', title), content); facts.append(cell); };
    fact('What you need', text(run.goal), 'Your stated goal');
    fact('What they offer', text(match.canOffer) || 'No specific offer is listed.', 'Their public profile · Can offer');
    const ownEvidence = match.connection?.senderEvidence;
    fact('What you could offer', ownEvidence?.field === 'canOffer' && text(ownEvidence.quote) ? `“${text(ownEvidence.quote)}”` : 'Use your approved profile in a new search to show your contribution here.', ownEvidence?.field === 'canOffer' ? 'Your approved profile · not a commitment' : 'No personal contribution inferred');
    fact('A possible first step', 'Ask whether a short written exchange about this goal would be useful.', 'A suggestion · both people still decide');
    section.append(facts);
    if (match.connection?.basis === 'shared_interest_only') section.append(node('p', 'assistant-shared-interest', 'This suggestion is based on shared interests only. It is not evidence of experience with your specific need.'));
    return section;
  }
  function renderRun(run, focus = false) {
    const previousHandle = selectedHandle;
    currentRun = run; $('#agent-results').hidden = false;
    $('#results-goal').textContent = text(run.goal);
    const scope = Number.isFinite(run.consideredCandidates) && Number.isFinite(run.eligibleCandidates) ? ` Reviewed ${run.consideredCandidates} of ${run.eligibleCandidates} eligible public profiles.` : '';
    $('#results-context').textContent = run.modelCalled === false ? 'There are no eligible public profiles to consider yet. No AI request was used.' : (run.usedProfile ? 'This search used your goal and approved profile.' : 'This search used your goal only.') + scope + ' The suggestions below need your judgment.';
    const clarifications = Array.isArray(run.clarifications) ? run.clarifications.slice(0, 3) : [];
    $('#agent-clarifications').replaceChildren(...clarifications.map((item, i) => node('p', '', `Added context ${i + 1}: ${text(item.answer)}`)));
    $('#agent-clarifications').hidden = !clarifications.length;
    const container = $('#agent-matches'); container.replaceChildren();
    const matches = Array.isArray(run.matches) ? run.matches.filter((match) => validHandle(match.handle)).slice(0, 3) : [];
    selectedHandle = matches.some((match) => match.handle === previousHandle) ? previousHandle : matches[0]?.handle || null;
    if (!matches.length) {
      const empty = node('article', 'paper assistant-match');
      const guidance = canRefine() ? 'Add a detail below, edit your goal, or browse the people available.' : 'You can edit your goal or browse the people available.';
      empty.append(node('h3', '', run.modelCalled === false ? 'A community is still taking shape.' : 'No clear match yet.'), node('p', 'assistant-reason', run.modelCalled === false ? 'There are no eligible public profiles in this directory yet. Your goal is saved; you can return as more people join.' : 'There may not be someone with the right context here yet. ' + guidance), link('Browse people →', '/discover')); container.append(empty);
    }
    matches.forEach((match) => {
      const card = node('article', 'paper assistant-match'); card.dataset.handle = match.handle;
      const header = node('div', 'assistant-match-header'), name = text(match.displayName) || match.handle;
      const monogram = node('span', 'assistant-monogram', Array.from(name)[0]?.toUpperCase() || ''); monogram.setAttribute('aria-hidden', 'true');
      const heading = node('div'); heading.append(node('h3', '', name), node('p', 'assistant-match-role', text(match.building)));
      header.append(monogram, heading, node('span', 'assistant-selected-badge', 'Selected')); card.append(header, node('p', 'assistant-reason', text(match.reason)), connectionCard(match, run));
      const evidence = node('div', 'assistant-evidence'); evidence.append(node('p', 'assistant-evidence-title', 'From their public profile'));
      (Array.isArray(match.evidence) ? match.evidence : []).slice(0, 3).forEach((source) => { const quote = node('blockquote', '', `“${text(source.quote)}”`); quote.append(node('cite', '', evidenceLabels[source.field] || 'Public profile')); evidence.append(quote); }); card.append(evidence);
      card.append(node('p', 'assistant-caveat', text(match.caveat) || 'A profile can suggest a fit; interest and availability still need a conversation.'));
      const actions = node('div', 'assistant-match-actions');
      const select = action('Choose ' + name, () => {
        selectedHandle = match.handle; clearErrors(); renderSelection(); persistResume();
        if (currentDraft && currentDraft.recipientHandle !== selectedHandle) {
          $('#agent-preserved-draft').hidden = false;
          $('#agent-preserved-draft').textContent = 'Earlier draft for ' + (text(currentDraft.recipientName) || currentDraft.recipientHandle) + '. Choose Prepare introduction above to write to the newly selected person.';
        }
      }, 'button outline assistant-select-match'); select.dataset.handle = match.handle; select.setAttribute('aria-pressed', 'false');
      actions.append(select, link('View profile ↗', '/discover/' + encodeURIComponent(match.handle))); card.append(actions); container.append(card);
    });
    const question = text(run.nextQuestion);
    $('#agent-refine-form').hidden = !canRefine();
    $('#agent-next-question').textContent = question || (matches.length ? 'Not quite right? What should be different?' : 'What detail would make a match more useful?');
    $('#agent-refine-limit').hidden = clarifications.length < 3;
    $('#agent-refine-answer').value = '';
    $('#agent-refine-hint').textContent = `Your original goal stays the same. Add a specific need, constraint, or what is missing from these suggestions (${clarifications.length} of 3 answers used). An AI refinement uses one included request; nothing is sent to another person.`;
    renderSelection(); persistResume(); if (focus) focusSection($('#agent-results'));
  }
  function renderDraft(draft, focus = false, fromHistory = false) {
    if (!validId(draft.id) || !validHandle(draft.recipientHandle)) throw new Error('Invalid draft');
    currentDraft = draft; $('#agent-draft-panel').hidden = false; $('#agent-preserved-draft').hidden = !fromHistory;
    if (fromHistory) $('#agent-preserved-draft').textContent = 'Saved draft for ' + (text(draft.recipientName) || draft.recipientHandle) + '. Original goal: “' + text(draft.goal) + '”. Opening this draft does not change your current search or selected person. Review it below, or use Prepare introduction for your selected person.';
    $('#draft-heading').textContent = 'A hello to ' + (text(draft.recipientName) || draft.recipientHandle) + '.';
    const fields = $('#agent-draft-fields'); fields.replaceChildren();
    Object.entries(fieldLabels).forEach(([key, label]) => { const field = node('div', 'assistant-draft-field'); field.append(node('h3', '', label), node('p', '', text(draft.intent?.[key]))); fields.append(field); });
    $('#agent-draft-notes').textContent = Array.isArray(draft.notes) ? draft.notes.filter((note) => typeof note === 'string').join(' ') : text(draft.notes);
    $('#agent-draft-expiry').textContent = 'Available to review until ' + dateLabel(draft.expiresAt) + '. Profile changes may require a fresh draft.';
    $('#agent-draft-handoff').href = '/introductions/new/' + encodeURIComponent(draft.recipientHandle) + '?agentDraft=' + encodeURIComponent(draft.id);
    updateControls(); if (focus) focusSection($('#agent-draft-panel'));
  }
  function renderHistory() {
    const box = $('#agent-history'); box.replaceChildren();
    const entries = [...workspace.runs.map((record) => ({ kind: 'goal', record })), ...workspace.drafts.map((record) => ({ kind: 'draft', record }))].sort((a, b) => b.record.createdAt - a.record.createdAt).slice(0, 8);
    if (!entries.length) box.append(node('p', 'assistant-history-empty', api.me ? 'Your next connection starts with a goal.' : 'Sign in to keep your goals and drafts here.'));
    entries.forEach(({ kind, record }) => {
      const row = node('div', 'assistant-history-entry');
      const label = kind === 'goal' ? text(record.goal) : 'Draft for ' + (text(record.recipientName) || text(record.recipientHandle));
      const button = action(label, async () => {
        if (busy) return; clearErrors();
        if (kind === 'goal') { $('#agent-goal').value = text(record.goal); currentDraft = null; $('#agent-draft-panel').hidden = true; renderRun(record, true); return; }
        busy = true; updateControls(); progress('Checking your saved draft…');
        try { const result = await api.request('/agent/drafts/' + encodeURIComponent(record.id)); renderDraft(result.draft, true, true); progress('Saved draft ready to review.'); }
        catch (error) { showError(error); progress(); }
        finally { busy = false; updateControls(); }
      }, '');
      row.append(button, node('small', '', (kind === 'goal' ? 'Goal' : record.expiresAt <= Date.now() / 1000 ? 'Expired draft' : 'Unsent draft') + ' · ' + dateLabel(record.createdAt))); box.append(row);
    });
    $('#agent-clear-history').hidden = !entries.length; updateControls();
  }
  async function prepareDraft() {
    const run = currentRun, handle = selectedHandle;
    if (busy || !canRequest() || !run || !validHandle(handle)) return;
    clearErrors(); persistResume();
    if (!api.me?.profile || !api.me?.settings) { showError({ code: 'profile_required' }, { kind: 'draft', handle }); return; }
    if (!$('#agent-use-profile').checked) { showError({ code: 'agent_profile_consent_required' }, { kind: 'draft', handle }); return; }
    beginWork('draft', 'Preparing a draft from the approved profile details.');
    try {
      const result = await api.request('/agent/draft', { runId: run.id, recipientHandle: handle, useProfile: $('#agent-use-profile').checked }); updateUsage(result);
      workspace.drafts = [result.draft, ...workspace.drafts.filter((draft) => draft.id !== result.draft.id)]; renderDraft(result.draft, true); renderHistory(); progress('Your draft is ready. Review and edit it before choosing to send.', 'draft');
    } catch (error) { showError(error, { kind: 'draft', retry: prepareDraft, handle }); progress('', 'draft'); await refreshUsage(); }
    finally { finishWork(); }
  }
  async function search(goal, parentRunId = null, answer = null) {
    if (busy || !canRequest()) return;
    if (parentRunId && !canRefine()) return;
    const kind = parentRunId ? 'refine' : 'search'; clearErrors(); persistResume();
    if ($('#agent-use-profile').checked && (!api.me?.profile || !api.me?.settings)) { showError({ code: 'profile_required' }, { kind }); return; }
    beginWork(kind, kind === 'refine' ? 'Using your answer to reconsider the available people.' : 'Looking for useful connections in public profiles.');
    try {
      const payload = parentRunId ? { parentRunId, answer, useProfile: $('#agent-use-profile').checked } : { goal, useProfile: $('#agent-use-profile').checked };
      const result = await api.request('/agent/discover', payload); updateUsage(result);
      workspace.runs = [result.run, ...workspace.runs.filter((run) => run.id !== result.run.id)];
      currentDraft = null; $('#agent-draft-panel').hidden = true; $('#agent-goal').value = text(result.run.goal);
      renderRun(result.run, true); renderHistory();
      progress(result.run.modelCalled === false ? 'No eligible public profiles yet. Your goal was saved without using an AI request.' : result.run.matches?.length ? 'Suggestions ready. Read the evidence, then choose who you’d like to meet.' : 'There isn’t a clear match in the current public profiles.', kind);
    } catch (error) { showError(error, { kind, retry: () => search(goal, parentRunId, answer) }); progress('', kind); await refreshUsage(); }
    finally { finishWork(); }
  }
  $('#agent-goal-form').addEventListener('submit', (event) => { event.preventDefault(); const goal = $('#agent-goal').value.trim(); if (goal.length < 10) { $('#agent-goal').setCustomValidity('Tell your agent a little more—at least 10 characters.'); $('#agent-goal').reportValidity(); return; } void search(goal); });
  $('#agent-refine-form').addEventListener('submit', (event) => { event.preventDefault(); const answer = $('#agent-refine-answer').value.trim(); if (!currentRun || answer.length < 3) { $('#agent-refine-answer').setCustomValidity('Add a little more detail—at least 3 characters.'); $('#agent-refine-answer').reportValidity(); return; } void search(currentRun.goal, currentRun.id, answer); });
  $('#agent-goal').addEventListener('input', () => { $('#agent-goal').setCustomValidity(''); persistResume(); });
  $('#agent-refine-answer').addEventListener('input', () => $('#agent-refine-answer').setCustomValidity(''));
  $('#agent-edit-goal').addEventListener('click', () => { if (!busy) { focusSection($('#agent-goal-form')); $('#agent-goal').focus(); } });
  ['#agent-use-profile', '#agent-draft-consent'].forEach((id) => $(id).addEventListener('change', () => { const checked = $(id).checked; $('#agent-use-profile').checked = checked; $('#agent-draft-consent').checked = checked; }));
  $('#agent-prepare-selected').addEventListener('click', prepareDraft);
  document.querySelectorAll('[data-example]').forEach((button) => button.addEventListener('click', () => { $('#agent-goal').value = button.dataset.example; $('#agent-goal').setCustomValidity(''); persistResume(); $('#agent-goal').focus(); }));
  document.addEventListener('click', (event) => { if (!api.me && event.target.closest('#session-action')) persistResume(); }, true);
  $('#agent-clear-history').addEventListener('click', () => { $('#agent-clear-confirm').hidden = false; $('#agent-confirm-clear').focus(); });
  $('#agent-cancel-clear').addEventListener('click', () => { $('#agent-clear-confirm').hidden = true; $('#agent-clear-history').focus(); });
  $('#agent-confirm-clear').addEventListener('click', async () => {
    if (busy) return; clearErrors(); busy = true; updateControls(); progress('Clearing your private history…');
    try {
      await api.request('/agent/history/clear', {}); workspace = { runs: [], drafts: [] }; currentRun = null; currentDraft = null; selectedHandle = null;
      $('#agent-results').hidden = true; $('#agent-draft-panel').hidden = true; $('#agent-clear-confirm').hidden = true;
      $('#agent-goal').value = ''; $('#agent-use-profile').checked = false; $('#agent-draft-consent').checked = false;
      try { sessionStorage.removeItem(resumeKey); } catch {}
      const key = 'signalpass-v4-draft-' + api.me.session.address;
      try { const local = JSON.parse(localStorage.getItem(key) || '{}'); if (local.draft?.agentDraftId) { delete local.draft; localStorage.setItem(key, JSON.stringify(local)); } } catch {}
      try { const local = JSON.parse(window.SignalPassMemoryStore?.[key] || '{}'); if (local.draft?.agentDraftId) { delete local.draft; window.SignalPassMemoryStore[key] = JSON.stringify(local); } } catch {}
      renderHistory(); progress('Your goals and drafts have been cleared. Today’s usage is unchanged.');
    } catch (error) { showError(error); progress(); }
    finally { busy = false; updateControls(); $('#agent-goal').focus(); }
  });
  function restoreResume() {
    let saved; try { saved = JSON.parse(sessionStorage.getItem(resumeKey) || 'null'); } catch { return; }
    if (!saved || typeof saved.goal !== 'string' || saved.goal.length > 1200 || !Number.isFinite(saved.createdAt) || Date.now() - saved.createdAt < 0 || Date.now() - saved.createdAt > 86400000) { try { sessionStorage.removeItem(resumeKey); } catch {} return; }
    if (saved.owner === null) {
      $('#agent-goal').value = saved.goal;
      // A guest's goal can be adopted only once. No identity or selected person travels with it.
      currentRun = null; selectedHandle = null; persistResume();
      if (owner() && saved.goal) progress('Your goal is here. Review it and start the search when you’re ready.');
      return;
    }
    if (!owner()) return;
    if (saved.owner !== owner()) { try { sessionStorage.removeItem(resumeKey); } catch {} return; }
    $('#agent-goal').value = saved.goal;
    const run = validId(saved.runId) ? workspace.runs.find((item) => item.id === saved.runId) : null;
    const unavailableSelection = run && validHandle(saved.handle) && !run.matches?.some((match) => match.handle === saved.handle);
    if (run) { selectedHandle = validHandle(saved.handle) ? saved.handle : null; renderRun(run); $('#agent-goal').value = saved.goal; if (unavailableSelection) { selectedHandle = null; renderSelection(); } }
    if (unavailableSelection) {
      progress('Your goal is here, but the selected person’s public profile changed. Choose someone from the current suggestions or search again.');
    } else if (new URLSearchParams(location.search).get('resume') === '1') {
      progress(run && selectedMatch() ? 'Your goal and selected person are here. Review the profile permission again before preparing a draft.' : 'Your goal is here. Search again when you’re ready to continue.');
    }
    persistResume();
  }
  await api.ready;
  if (!api.demo && !api.error && api.me) {
    const results = await Promise.allSettled([api.request('/agent/status'), api.request('/agent/workspace')]);
    if (results[0].status === 'fulfilled') status = results[0].value;
    if (results[1].status === 'fulfilled') workspace = { runs: Array.isArray(results[1].value.runs) ? results[1].value.runs : [], drafts: Array.isArray(results[1].value.drafts) ? results[1].value.drafts : [] };
    else showError(results[1].reason);
  }
  renderStatus(); renderHistory();
  $('#agent-use-profile').checked = false; $('#agent-draft-consent').checked = false;
  if (!api.demo) restoreResume();
})();
