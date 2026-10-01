/* SignalPass's hosted agent: grounded suggestions and drafts, never delivery. */
(async () => {
  'use strict';
  const api = window.SignalPass;
  const $ = (query) => document.querySelector(query);
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = String(text);
    return element;
  };
  const link = (label, href, className = 'sp-text-link') => {
    const element = node('a', className, label); element.href = href; return element;
  };
  const action = (label, handler, className = 'button outline') => {
    const element = node('button', className, label); element.type = 'button'; element.addEventListener('click', handler); return element;
  };
  const text = (value) => typeof value === 'string' ? value : '';
  const validHandle = (handle) => typeof handle === 'string' && /^[a-z0-9_-]{3,32}$/.test(handle);
  const validId = (id) => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id);
  const dateLabel = (seconds) => new Date(Number(seconds) * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  let status = null;
  let workspace = { runs: [], drafts: [] };
  let busy = false;
  let currentRun = null;
  let currentDraft = null;
  const fieldLabels = { whoAmI: 'A little about me', whyYou: 'Why I’m reaching out', whatIOffer: 'What I can offer', nextStep: 'A useful next step' };
  const evidenceLabels = { building: 'Working on', canOffer: 'Can offer', wantsToMeet: 'Wants to meet', interests: 'Interests', displayName: 'Public profile', bio: 'Background' };
  const errorMessages = {
    agent_not_configured: 'Your agent isn’t available on this deployment yet. You can still browse public profiles and write an introduction.',
    agent_unavailable: 'Your agent couldn’t finish this request. Try again in a moment. Nothing has been sent.',
    agent_budget_exhausted: 'Today’s included AI usage is exhausted. Come back after the daily reset, or browse people and write an introduction yourself.',
    agent_busy: 'Your agent is already working on a request. Give it a moment, then try again.',
    agent_draft_not_found: 'This draft is no longer available. Prepare a fresh introduction from your search results.',
    agent_run_not_found: 'This saved search is no longer available. Submit your goal again to get current suggestions.',
    agent_history_cleared: 'Your history was cleared while this request was running. Submit a new goal when you’re ready.',
    agent_draft_stale: 'A profile changed or this draft expired. Search again and prepare a fresh introduction.',
    agent_candidate_unavailable: 'This person’s profile is no longer available for this search. Search again to see current profiles.',
    agent_profile_consent_required: 'Allow your agent to use your approved profile to prepare a personal introduction. Review the checkbox above.',
    profile_required: 'Review and save your profile first so your agent has approved details to work with.',
    authentication_required: 'Connect your wallet to keep your goals and drafts in your private workspace.',
  };
  const progress = (message = '') => { $('#agent-progress').textContent = message; };
  const clearError = () => { $('#agent-error').replaceChildren(); $('#agent-error').hidden = true; };
  const showError = (error) => {
    const box = $('#agent-error'); box.replaceChildren(node('span', '', errorMessages[error.code] || 'This request could not be completed. Your existing work is still here. Try again.'));
    if (error.code === 'profile_required') box.append(document.createTextNode(' '), link('Review your profile →', '/profile/import'));
    if (error.code === 'authentication_required') box.append(document.createTextNode(' '), link('Refresh sign-in →', '/assistant'));
    if (error.code === 'agent_profile_consent_required') $('#agent-use-profile').focus();
    if (error.code === 'agent_budget_exhausted' && status) { status.remainingToday = 0; renderBudget(); }
    box.hidden = false;
  };
  const canRequest = () => Boolean(status?.enabled && api.me && !api.demo && !api.error && status.remainingToday !== 0);
  const updateControls = () => {
    $('#agent-submit').disabled = busy || !canRequest();
    $('#agent-submit').textContent = busy ? 'Working on your request…' : 'Find relevant people →';
    $('#agent-goal-form').setAttribute('aria-busy', String(busy));
    $('#agent-goal').disabled = busy;
    $('#agent-use-profile').disabled = busy;
    document.querySelectorAll('[data-example],.assistant-prepare-draft,#agent-confirm-clear,#agent-clear-history,.assistant-history-entry button').forEach((button) => {
      button.disabled = busy || (button.classList.contains('assistant-prepare-draft') && !canRequest());
    });
  };
  const renderBudget = () => {
    const budget = $('#agent-budget');
    if (api.demo) budget.textContent = 'Live AI is off in sample mode.';
    else if (!api.me) budget.textContent = 'Included daily usage after sign-in.';
    else if (!status?.enabled) budget.textContent = 'AI availability depends on this deployment.';
    else if (Number.isFinite(status.remainingToday) && Number.isFinite(status.limit)) budget.textContent = `${status.remainingToday} of ${status.limit} AI requests left today · covered by SignalPass`;
    else budget.textContent = 'SignalPass covers a limited number of AI requests each day.';
    updateControls();
  };
  const notice = (message, actions = []) => {
    $('#agent-notice-text').textContent = message;
    $('#agent-notice-actions').replaceChildren(...actions);
    $('#agent-notice').hidden = !message;
  };
  const connect = async () => {
    clearError(); busy = true; updateControls();
    try { await api.connect(); } catch (error) {
      const box = $('#agent-error'); box.textContent = error.message || 'Sign-in could not be completed.'; box.hidden = false;
    } finally { busy = false; updateControls(); }
  };
  const renderStatus = () => {
    const badge = $('#agent-state'); badge.dataset.state = '';
    if (api.demo) {
      badge.textContent = 'Sample mode';
      notice('This page shows how your hosted agent works. Sample mode does not generate AI recommendations or drafts. Open the live workspace to use your agent.', [link('Open live agent →', '/assistant?demo=0', 'button outline'), link('Browse sample people', '/discover?demo=1')]);
    } else if (api.error) {
      badge.textContent = 'Connection unavailable';
      notice('We couldn’t load your workspace. Reconnect to try again. Nothing has been sent.', [action('Try again', () => location.reload())]);
    } else if (!api.me) {
      badge.textContent = 'Ready when you are';
      notice('Connect your wallet to start your private agent workspace. Sign-in is free and does not request a payment.', [action('Connect wallet', connect)]);
    } else if (!status) {
      badge.textContent = 'Availability unknown';
      notice('We couldn’t check your agent’s availability. Try again, or browse the public directory.', [action('Try again', () => location.reload()), link('Browse people →', '/discover')]);
    } else if (!status.enabled) {
      badge.textContent = 'Not available yet';
      notice('Your agent isn’t available on this deployment yet. You can still browse people and prepare an introduction yourself.', [link('Browse people →', '/discover', 'button outline')]);
    } else {
      badge.textContent = 'Live agent'; badge.dataset.state = 'ready'; notice('');
    }
    const provider = [text(status?.provider), text(status?.model)].filter(Boolean).join(' · ');
    $('#agent-disclosure').textContent = `Your goal and selected public profiles are sent to ${provider ? `the configured AI provider (${provider})` : 'SignalPass’s AI provider'}. Your approved profile is included only when you check the box. This does not share your profile with another person.`;
    renderBudget();
  };
  const updateUsage = (result) => {
    if (status && Number.isFinite(result.usage?.remainingToday)) status.remainingToday = result.usage.remainingToday;
    renderBudget();
  };
  const refreshUsage = async () => {
    // Provider failures can consume an included attempt; keep the budget honest.
    try { status = await api.request('/agent/status'); renderBudget(); } catch {}
  };
  const focusSection = (section) => { section.focus({ preventScroll: true }); section.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); };
  const renderRun = (run, focus = false) => {
    currentRun = run; currentDraft = null; $('#agent-draft-panel').hidden = true; $('#agent-results').hidden = false;
    $('#results-goal').textContent = text(run.goal);
    const scope = Number.isFinite(run.consideredCandidates) && Number.isFinite(run.eligibleCandidates)
      ? ` Reviewed ${run.consideredCandidates} of ${run.eligibleCandidates} eligible public profiles.` : '';
    $('#results-context').textContent = (run.usedProfile ? 'This search used your goal and approved profile.' : 'This search used your goal only.') + scope + ' Recommendations are based on people’s public profile details.';
    const container = $('#agent-matches'); container.replaceChildren();
    const matches = Array.isArray(run.matches) ? run.matches.filter((match) => validHandle(match.handle)).slice(0, 3) : [];
    if (!matches.length) {
      const empty = node('article', 'paper assistant-match');
      empty.append(node('h3', '', 'No clear match yet.'), node('p', 'assistant-reason', 'There may not be someone with the right context in the public directory yet. Try a more specific goal, or explore the people available.'), link('Browse people →', '/discover')); container.append(empty);
    }
    matches.forEach((match) => {
      const card = node('article', 'paper assistant-match');
      const header = node('div', 'assistant-match-header');
      const name = text(match.displayName) || match.handle;
      const monogram = node('span', 'assistant-monogram', Array.from(name)[0]?.toUpperCase() || ''); monogram.setAttribute('aria-hidden', 'true');
      const heading = node('div'); heading.append(node('h3', '', name), node('p', 'assistant-match-role', text(match.building)));
      header.append(monogram, heading); card.append(header, node('p', 'assistant-reason', text(match.reason)));
      const evidence = node('div', 'assistant-evidence'); evidence.append(node('p', 'assistant-evidence-title', 'From their public profile'));
      (Array.isArray(match.evidence) ? match.evidence : []).slice(0, 3).forEach((source) => {
        const quote = node('blockquote', '', `“${text(source.quote)}”`); quote.append(node('cite', '', evidenceLabels[source.field] || 'Public profile')); evidence.append(quote);
      }); card.append(evidence);
      card.append(node('p', 'assistant-caveat', text(match.caveat) || 'A profile can suggest a fit; their interest and availability still need a conversation.'));
      const actions = node('div', 'assistant-match-actions');
      const prepare = action('Prepare introduction →', () => prepareDraft(run, match.handle), 'button primary assistant-prepare-draft');
      prepare.dataset.handle = match.handle;
      actions.append(prepare, link('View profile ↗', '/discover/' + encodeURIComponent(match.handle))); card.append(actions); container.append(card);
    });
    const question = text(run.nextQuestion); $('#agent-next-question').hidden = !question; $('#agent-next-question').textContent = question ? 'To make this more useful: ' + question : '';
    updateControls(); if (focus) focusSection($('#agent-results'));
  };
  const renderDraft = (draft, focus = false) => {
    if (!validId(draft.id) || !validHandle(draft.recipientHandle)) throw new Error('Invalid draft');
    currentDraft = draft; $('#agent-draft-panel').hidden = false;
    $('#draft-heading').textContent = 'A hello to ' + (text(draft.recipientName) || draft.recipientHandle) + '.';
    const fields = $('#agent-draft-fields'); fields.replaceChildren();
    Object.entries(fieldLabels).forEach(([key, label]) => {
      const field = node('div', 'assistant-draft-field'); field.append(node('h3', '', label), node('p', '', text(draft.intent?.[key]))); fields.append(field);
    });
    $('#agent-draft-notes').textContent = Array.isArray(draft.notes) ? draft.notes.filter((note) => typeof note === 'string').join(' ') : text(draft.notes);
    $('#agent-draft-expiry').textContent = 'Available to review until ' + dateLabel(draft.expiresAt) + '. Profile changes may require a fresh draft.';
    $('#agent-draft-handoff').href = '/introductions/new/' + encodeURIComponent(draft.recipientHandle) + '?agentDraft=' + encodeURIComponent(draft.id);
    if (focus) focusSection($('#agent-draft-panel'));
  };
  const renderHistory = () => {
    const box = $('#agent-history'); box.replaceChildren();
    const runs = workspace.runs.map((run) => ({ kind: 'goal', record: run }));
    const drafts = workspace.drafts.map((draft) => ({ kind: 'draft', record: draft }));
    const entries = [...runs, ...drafts].sort((a, b) => b.record.createdAt - a.record.createdAt).slice(0, 8);
    if (!entries.length) box.append(node('p', 'assistant-history-empty', api.me ? 'Your next connection starts with a goal.' : 'Sign in to keep your goals and drafts here.'));
    entries.forEach(({ kind, record }) => {
      const row = node('div', 'assistant-history-entry');
      const label = kind === 'goal' ? text(record.goal) : 'Draft for ' + (text(record.recipientName) || text(record.recipientHandle));
      const button = action(label, async () => {
        clearError();
        if (kind === 'goal') { $('#agent-goal').value = text(record.goal); renderRun(record, true); return; }
        busy = true; updateControls(); progress('Checking your saved draft…'); $('#agent-draft-panel').hidden = true;
        try { const result = await api.request('/agent/drafts/' + encodeURIComponent(record.id)); renderDraft(result.draft, true); progress('Saved draft ready to review.'); }
        catch (error) { showError(error); progress(); }
        finally { busy = false; updateControls(); }
      }, '');
      const expired = kind === 'draft' && record.expiresAt <= Date.now() / 1000;
      row.append(button, node('small', '', (kind === 'goal' ? 'Goal' : expired ? 'Expired draft' : 'Unsent draft') + ' · ' + dateLabel(record.createdAt))); box.append(row);
    });
    $('#agent-clear-history').hidden = !entries.length; updateControls();
  };
  async function prepareDraft(run, handle) {
    if (busy || !canRequest()) return;
    clearError();
    if (!api.me?.profile || !api.me?.settings) { showError({ code: 'profile_required' }); return; }
    if (!$('#agent-use-profile').checked) { showError({ code: 'agent_profile_consent_required' }); return; }
    busy = true; currentDraft = null; $('#agent-draft-panel').hidden = true; updateControls(); progress('Preparing a draft from your approved profile and this person’s context…');
    try {
      const result = await api.request('/agent/draft', { runId: run.id, recipientHandle: handle, useProfile: $('#agent-use-profile').checked });
      updateUsage(result); workspace.drafts = [result.draft, ...workspace.drafts.filter((draft) => draft.id !== result.draft.id)];
      renderDraft(result.draft, true); renderHistory(); progress('Your draft is ready. Review and edit it before choosing to send.');
    } catch (error) { showError(error); progress(); await refreshUsage(); }
    finally { busy = false; updateControls(); }
  }
  $('#agent-goal-form').addEventListener('submit', async (event) => {
    event.preventDefault(); if (busy || !canRequest()) return;
    const goal = $('#agent-goal').value.trim(); if (goal.length < 10) { $('#agent-goal').setCustomValidity('Tell your agent a little more—at least 10 characters.'); $('#agent-goal').reportValidity(); return; }
    clearError();
    if ($('#agent-use-profile').checked && (!api.me?.profile || !api.me?.settings)) { showError({ code: 'profile_required' }); return; }
    busy = true; updateControls(); progress('Reading public profiles and looking for a useful connection…');
    try {
      const result = await api.request('/agent/discover', { goal, useProfile: $('#agent-use-profile').checked }); updateUsage(result);
      workspace.runs = [result.run, ...workspace.runs.filter((run) => run.id !== result.run.id)];
      $('#agent-draft-panel').hidden = true; currentDraft = null;
      renderRun(result.run, true); renderHistory(); progress(result.run.matches?.length ? 'Suggestions ready. Take a look at the evidence and what’s still uncertain.' : 'Search complete. There isn’t a clear match in the current public profiles.');
    } catch (error) { showError(error); progress(); await refreshUsage(); }
    finally { busy = false; updateControls(); }
  });
  $('#agent-goal').addEventListener('input', () => $('#agent-goal').setCustomValidity(''));
  document.querySelectorAll('[data-example]').forEach((button) => button.addEventListener('click', () => { $('#agent-goal').value = button.dataset.example; $('#agent-goal').setCustomValidity(''); $('#agent-goal').focus(); }));
  $('#agent-clear-history').addEventListener('click', () => { $('#agent-clear-confirm').hidden = false; $('#agent-confirm-clear').focus(); });
  $('#agent-cancel-clear').addEventListener('click', () => { $('#agent-clear-confirm').hidden = true; $('#agent-clear-history').focus(); });
  $('#agent-confirm-clear').addEventListener('click', async () => {
    if (busy) return; clearError(); busy = true; updateControls(); progress('Clearing your private history…');
    try {
      await api.request('/agent/history/clear', {});
      workspace = { runs: [], drafts: [] }; currentRun = null; currentDraft = null;
      $('#agent-results').hidden = true; $('#agent-draft-panel').hidden = true; $('#agent-clear-confirm').hidden = true;
      $('#agent-goal').value = ''; $('#agent-use-profile').checked = false;
      // Clear only agent-derived local drafts for this signed-in account.
      const key = 'signalpass-v4-draft-' + api.me.session.address;
      try { const local = JSON.parse(localStorage.getItem(key) || '{}'); if (local.draft?.agentDraftId) { delete local.draft; localStorage.setItem(key, JSON.stringify(local)); } } catch {}
      const memory = window.SignalPassMemoryStore;
      try { const local = JSON.parse(memory?.[key] || '{}'); if (local.draft?.agentDraftId) { delete local.draft; memory[key] = JSON.stringify(local); } } catch {}
      renderHistory(); progress('Your goals and drafts have been cleared. Today’s usage is unchanged.'); $('#agent-goal').focus();
    } catch (error) { showError(error); progress(); }
    finally { busy = false; updateControls(); }
  });
  await api.ready;
  if (!api.demo && !api.error && api.me) {
    const results = await Promise.allSettled([api.request('/agent/status'), api.me ? api.request('/agent/workspace') : Promise.resolve({ runs: [], drafts: [] })]);
    if (results[0].status === 'fulfilled') status = results[0].value;
    if (results[1].status === 'fulfilled') workspace = { runs: Array.isArray(results[1].value.runs) ? results[1].value.runs : [], drafts: Array.isArray(results[1].value.drafts) ? results[1].value.drafts : [] };
    else showError(results[1].reason);
  }
  renderStatus(); renderHistory();
  // Opening this page never carries forward profile-sharing consent.
  $('#agent-use-profile').checked = false;
})();
