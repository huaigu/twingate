/* Same-origin live API. Authentication tokens remain in HttpOnly cookies. */
(() => {
  'use strict';
  const query = new URLSearchParams(location.search);
  try {
    if (query.has('demo')) sessionStorage.setItem('signalpass-demo', query.get('demo') === '1' ? '1' : '0');
  } catch {}
  let demo = query.get('demo') === '1';
  try { demo ||= sessionStorage.getItem('signalpass-demo') === '1'; } catch {}
  const api = window.SignalPass = { demo, live: !demo, me: null, directory: [], inbox: [], outbox: [], error: null };
  const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const messages = {
    authentication_required: 'Connect your wallet to continue.',
    profile_required: 'Review and save your profile before sending an introduction.',
    profile_changed_review_again: 'Your shared profile changed. Reload and review the introduction again.',
    state_changed_refresh: 'This introduction changed. Refresh to see its latest state.',
    idempotency_conflict: 'This draft was already sent with different content. Start a new introduction.',
    handle_taken: 'That public handle is already in use. Choose another.',
    recipient_not_found: 'This person is not accepting introductions through this profile.',
    introduction_limit_reached: 'You already have too many open introductions to this person.',
    origin_not_allowed: 'This site address is not configured for sign-in. Check APP_ORIGIN.',
    recipient_profile_not_synced: 'The recipient needs to sync their approved profile in Agent settings before receiving a wallet bond. You can also start a new introduction without a bond.',
    chain_unavailable: 'The chain connection is unavailable. Your last confirmed state is preserved. Please retry.',
    chain_not_configured: 'Wallet bonds are not enabled on this deployment.',
    nonce_changed_sync_or_start_new: 'Your wallet used this quote nonce. Refresh to recover a confirmed payment, or start a new introduction.',
    recipient_policy_changed_start_new: 'The recipient changed their policy. Start a new introduction to review the updated terms.',
    action_not_allowed: 'Only the appropriate participant can confirm this action in their wallet.',
    not_expired: 'The contract deadline has not passed yet. Wait for the next block and retry.',
    transaction_reverted: 'The transaction did not succeed. No bond was locked by this transaction; network gas may still apply.',
    transaction_does_not_match_approval: 'That transaction does not match this approved introduction.',
    funding_already_confirmed: 'This introduction is already funded. Refresh to see its confirmed receipt.',
  };
  api.request = async (path, body, allowAnonymous = false) => {
    const response = await fetch('/api' + path, {
      method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json', ...(api.me?.session ? { 'X-SignalPass-CSRF': api.me.session.csrf } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(18000),
    });
    const data = await response.json().catch(() => ({ error: 'service_unavailable' }));
    if (response.status === 401 && allowAnonymous) return null;
    if (!response.ok) {
      const error = new Error(messages[data.error] || (data.issues ? 'Please check the profile fields and their lengths.' : 'Could not complete this action. Please try again.'));
      error.status = response.status; error.code = data.error; throw error;
    }
    return data;
  };
  api.toRecord = (r) => ({
    id: r.id, revision: r.revision, role: r.role, recipient: r.recipientName, recipientHandle: r.recipientHandle,
    sender: r.senderName, recipientAvatar: 'alex', senderBio: r.sharedProfile?.bio || '',
    fields: [r.intent.whoAmI, r.intent.whyYou, r.intent.whatIOffer, r.intent.nextStep],
    interests: r.sharedProfile?.interests || [], sharedContext: Boolean(r.sharedProfile),
    goal: r.intent.nextStep, status: r.state === 'ready_for_review' && r.question && !r.reply ? 'context_requested' : ({ submitted: 'pending', ready_for_review: 'pending', evaluating: 'evaluating', needs_context: 'context_requested' })[r.state] || r.state,
    settlement: r.settlement, chain: r.chain, payment: r.payment,
    createdAt: new Date(r.createdAt * 1000).toISOString(), question: r.question, reply: r.reply,
    evaluation: r.evaluationOutcome, evaluationProvider: r.evaluationProvider, payloadHash: r.payloadHash,
  });
  api.load = async () => {
    api.chain = await api.request('/chain/config').catch(error => { if (error.status === 404) return { enabled: false }; throw error; });
    api.me = await api.request('/me', undefined, true);
    const list = await api.request('/profiles');
    api.directory = list.profiles.filter((p) => p.owner.toLowerCase() !== api.me?.session?.address).map((p) => ({
      name: p.handle, displayName: p.displayName, handle: p.handle, avatar: p.avatar === 'none' ? 'alex' : p.avatar,
      role: p.building, tags: p.interests.length ? p.interests : ['Builder', 'Collaboration'],
      description: 'Can offer: ' + p.canOffer + ' Wants to meet: ' + p.wantsToMeet,
    }));
    const parts = location.pathname.split('/');
    const directHandle = parts[1] === 'introductions' && parts[2] === 'new' ? parts[3] : parts[1] === 'discover' && parts[2] !== 'settings' ? parts[2] : null;
    if (directHandle && /^[a-z0-9_-]{3,32}$/.test(directHandle) && !api.directory.some(p => p.handle === directHandle)) {
      try {
        const p = (await api.request('/profiles/' + directHandle)).profile;
        if (p.owner.toLowerCase() !== api.me?.session?.address) api.directory.push({ name: p.handle, displayName: p.displayName, handle: p.handle, avatar: p.avatar === 'none' ? 'alex' : p.avatar, role: p.building, tags: p.interests.length ? p.interests : ['Builder', 'Collaboration'], description: 'Can offer: ' + p.canOffer + ' Wants to meet: ' + p.wantsToMeet });
      } catch (error) { if (error.status !== 404) throw error; }
    }
    if (api.me && document.body.dataset.page === 'inbox') {
      const [inbox, outbox] = await Promise.all([api.request('/introductions?box=inbox'), api.request('/introductions?box=outbox')]);
      api.inbox = inbox.introductions.map(api.toRecord); api.outbox = outbox.introductions.map(api.toRecord);
    }
  };
  api.accountDialog = () => {
    let dialog = document.getElementById('account-dialog');
    if (!dialog) { dialog = document.createElement('dialog'); dialog.id = 'account-dialog'; dialog.className = 'v4-account-dialog'; document.body.append(dialog); }
    return dialog;
  };
  api.chooseHandle = (suggested) => new Promise((resolve, reject) => {
    const dialog = api.accountDialog();
    dialog.innerHTML = '<form><h2>Your public handle</h2><p>Choose the address of your approved profile. Visibility stays under your control.</p><label for="account-handle">Handle</label><input id="account-handle" class="dialog-input" pattern="[a-z0-9_-]{3,32}" minlength="3" maxlength="32" required value="' + escape(suggested) + '"><div class="dialog-actions"><button type="button" class="button outline" id="cancel-handle">Cancel</button><button class="button primary">Save profile</button></div></form>';
    let done = false;
    dialog.querySelector('form').onsubmit = (e) => { e.preventDefault(); done = true; const handle = dialog.querySelector('input').value; dialog.close(); resolve(handle); };
    dialog.querySelector('#cancel-handle').onclick = () => dialog.close();
    dialog.onclose = () => { if (!done) reject(new Error('Profile was not saved.')); };
    dialog.showModal(); dialog.querySelector('input').focus();
  });
  api.saveProfile = async (state) => {
    if (!api.me) throw new Error(messages.authentication_required);
    const handle = api.me.profile?.handle || await api.chooseHandle('builder-' + api.me.session.address.slice(2, 8));
    const saved = await api.request('/me/profile', { handle, profile: state.profile, agent: state.agent, sourceLinks: state.sourceLinks, avatar: ['alex', 'maya', 'rohan', 'leo', 'beanie', 'none'].includes(state.widget.persona) ? state.widget.persona : 'alex' });
    api.me = { ...api.me, ...saved }; return saved;
  };
  api.send = async (candidate, state, fields, idempotencyKey, settlement = 'offchain') => {
    if (!api.me) throw new Error(messages.authentication_required);
    if (!api.me.profile) throw new Error(messages.profile_required);
    if (state.sharedContext && !state.profileApproved) throw new Error('Review and save your profile before sharing its context.');
    const sent = await api.request('/introductions', {
      recipientHandle: candidate.handle, intent: { whoAmI: fields[0], whyYou: fields[1], whatIOffer: fields[2], nextStep: fields[3] },
      idempotencyKey, sharedContext: state.sharedContext, profileVersion: api.me.settings?.version, settlement,
    });
    return api.toRecord(sent.introduction);
  };
  api.decide = async (record, status, text) => {
    if (record.settlement === 'onchain' && status !== 'Context requested') return api.settle(record, status.toLowerCase());
    const action = status === 'Context requested' ? 'context' : 'transition';
    const payload = action === 'context' ? { revision: record.revision, text } : { revision: record.revision, to: status.toLowerCase() };
    return api.toRecord((await api.request('/introductions/' + record.id + '/' + action, payload)).introduction);
  };
  api.connect = async () => {
    if (!window.ethereum?.request) throw new Error('Open SignalPass in a browser with an Ethereum wallet to sign in. No payment is requested.');
    const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const chainId = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);
    const challenge = await api.request('/auth/challenge', { address, chainId });
    const hex = '0x' + [...new TextEncoder().encode(challenge.message)].map((b) => b.toString(16).padStart(2, '0')).join('');
    const signature = await window.ethereum.request({ method: 'personal_sign', params: [hex, address] });
    await api.request('/auth/verify', { nonce: challenge.nonce, signature }); location.reload();
  };
  api.emptyState = (container, { title, description, action, href, onAction, eyebrow = 'A thoughtful beginning' }) => {
    container.replaceChildren(); container.classList.add('v4-empty-state');
    const art = document.createElement('img'); art.className = 'v4-empty-art'; art.src = '/v4/assets/connection-paper.webp'; art.alt = ''; art.width = 176; art.height = 176;
    const copy = document.createElement('div'); copy.className = 'v4-empty-copy';
    const overline = document.createElement('span'); overline.className = 'v4-empty-eyebrow'; overline.textContent = eyebrow;
    const heading = document.createElement('h2'); heading.textContent = title;
    const body = document.createElement('p'); body.textContent = description;
    const cta = document.createElement(href ? 'a' : 'button'); cta.className = 'button outline'; cta.textContent = action;
    if (href) cta.href = href; else { cta.type = 'button'; cta.onclick = onAction; }
    copy.append(overline, heading, body, cta); container.append(art, copy);
  };
  const mount = () => {
    const header = document.querySelector('.site-header') || document.querySelector('header');
    if (!header) return;
    const bar = document.createElement('div'); bar.className = 'v4-session-bar';
    const label = document.createElement('span'); label.className = 'v4-session-copy'; label.setAttribute('role', 'status');
    const title = document.createElement('strong'), detail = document.createElement('small');
    const button = document.createElement('button'); button.type = 'button'; button.className = 'button outline'; button.id = 'session-action';
    title.textContent = demo ? 'You’re exploring a sample.' : api.error ? 'Let’s reconnect.' : api.me ? (api.me.profile?.displayName || api.me.session.address.slice(0, 8)) : 'Your next connection starts here.';
    detail.textContent = demo ? 'Sample people · no messages or payments' : api.error ? 'Connection unavailable. No new action was sent.' : api.me ? (api.chain?.enabled ? (api.chain.local ? 'Local EVM · DEV' : api.chain.name) + ' · manual review · AI fee 0' : 'Live introductions · no payments') : 'Free wallet sign-in · no payment';
    label.append(title, detail); bar.dataset.sessionState = demo ? 'demo' : api.me ? 'connected' : 'guest';
    button.textContent = demo ? 'Open live product' : api.me ? 'Sign out' : 'Connect wallet';
    button.onclick = async () => { button.disabled = true; try { if (demo) { location.href = '/?demo=0'; return; } if (api.me) { await api.request('/auth/logout', {}); location.reload(); } else await api.connect(); } catch (error) { label.textContent = error.message; button.disabled = false; } };
    bar.append(label, button);
    const slot = document.getElementById('session-slot');
    if (slot) { slot.replaceChildren(bar); slot.setAttribute('aria-busy', 'false'); }
    else (header.closest('.viewport') || header.closest('.hero-page') || header).before(bar);
    document.querySelectorAll('.v4-footer small, .v4-demo-chip').forEach((el) => { if (!demo) el.textContent = api.chain?.enabled ? api.chain.name + ' · optional refundable bond · manual review, AI fee 0' : 'Live introductions · payments and AI matching not connected'; });
    if (api.live) window.ethereum?.on?.('accountsChanged', async () => { if (api.me) await api.request('/auth/logout', {}).catch(() => {}); location.reload(); });
  };
  api.ready = (async () => {
    if (!demo) { try { await api.load(); } catch (error) { api.error = error; } }
    mount();
    if (api.error) document.querySelectorAll('.source-workspace,.agent-workspace,.discovery-workspace,.compose-workspace,.inbox-workspace,.widget-workspace').forEach(el => {
      el.replaceChildren(); const p = document.createElement('div'); p.className = 'v4-live-empty'; el.append(p);
      api.emptyState(p, { title: 'A moment to reconnect.', description: 'The service is unavailable. Reconnect to continue; no new introduction has been sent.', action: 'Try again', onAction: () => location.reload() });
    });
  })();
})();
