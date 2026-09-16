/* SignalPass • Vanilla JavaScript • No build step, network calls or backend.
   Prototype state is stored only in this browser when localStorage is available. */
(() => {
  'use strict';
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];
  const page = document.body.dataset.page;
  const asset = path => window.SignalPassAssetMap?.[path] || path;
  const hydrateImages = root => $$('img[src^="assets/"]', root).forEach(img => { img.src = asset(img.getAttribute('src')); });
  const storageKey = 'signalpass-prototype-v2';
  const memoryStore = window.SignalPassMemoryStore ||= {};
  const store = {
    getItem(key) { try { const value = localStorage.getItem(key); if (value !== null) return value; } catch (_) {} return memoryStore[key] || null; },
    setItem(key, value) { memoryStore[key] = value; try { localStorage.setItem(key, value); } catch (_) {} },
    removeItem(key) { delete memoryStore[key]; try { localStorage.removeItem(key); } catch (_) {} }
  };
  const defaults = {
    profile: { name: 'Alex Chen', bio: 'Builds products at the intersection of people, internet, and creative tech.', interests: 'Onchain social, creator tools, open source, and human–AI collaboration.', offer: 'Product design, frontend development, community building, and feedback on early ideas.', meet: 'Founders, designers, and curious people exploring social, identity, and the future of the internet.' },
    sources: ['github'],
    agent: { visibility: 'private', matching: true, sources: ['github', 'x'], interests: ['Open source', 'Developer tools', 'Onchain UX', 'AI x crypto', 'Community building', 'Design systems', 'Public goods', 'Monadic culture'] },
    widget: { name: 'Alex Chen', bio: 'Building a more open internet with builders.', persona: 'alex', tags: ['Builders', 'Open Source', 'Monad', 'Product', 'Community'], cta: 'Meet me on SignalPass' },
    inbox: {},
  };
  let saved = {};
  try { saved = JSON.parse(store.getItem(storageKey) || '{}'); } catch (_) { /* Private/file mode can disallow storage. */ }
  const initial = JSON.parse(JSON.stringify(defaults));
  const state = { ...initial, ...saved, profile: { ...initial.profile, ...saved.profile }, agent: { ...initial.agent, ...saved.agent }, widget: { ...initial.widget, ...saved.widget }, inbox: saved.inbox || {} };
  const save = () => { try { store.setItem(storageKey, JSON.stringify(state)); } catch (_) { /* The UI still works without persistent storage. */ } };
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const iconPaths = { plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="m5 12 4 4L19 6"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>', arrow: '<path d="M4 12h15M13 5l7 7-7 7"/>' };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.arrow}</svg>`;
  const scaleScene = () => {
    const width = document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scale', width <= 1180 ? '1' : String(width / 1648));
  };
  scaleScene();
  window.addEventListener('resize', scaleScene, { passive: true });
  window.addEventListener('pageshow', scaleScene);
  let toastTimer;
  const toast = text => { const el = $('#toast'); el.textContent = text; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 4200); };
  const dialog = $('#app-dialog');
  let previousFocus;
  const openDialog = (title, content, onReady) => {
    if (dialog.open) dialog.close();
    previousFocus = document.activeElement;
    $('#dialog-content').innerHTML = `<h2 id="dialog-title">${escapeHTML(title)}</h2>${content}`;
    hydrateImages($('#dialog-content'));
    dialog.showModal();
    onReady?.($('#dialog-content'));
    requestAnimationFrame(() => { const el = $('[autofocus]', dialog); if (el) el.focus(); });
  };
  const closeDialog = () => dialog.close();
  dialog.addEventListener('close', () => { if (previousFocus?.isConnected) previousFocus.focus(); });
  dialog.addEventListener('click', e => { if (e.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog(); });
  const notice = text => `<p class="dialog-notice">${text}</p>`;
  const buttons = (label, id = 'dialog-confirm', other = 'Cancel') => `<div class="dialog-actions"><button type="button" class="button outline" data-close-dialog>${other}</button><button type="button" class="button primary" id="${id}">${label}</button></div>`;
  document.addEventListener('click', e => { if (e.target.closest('[data-close-dialog]')) closeDialog(); });
  const addTextDialog = (title, label, placeholder, callback) => openDialog(title, `<form id="add-text-form"><label class="dialog-field" for="add-text">${label}</label><input class="dialog-input" id="add-text" maxlength="38" required placeholder="${escapeHTML(placeholder)}" autofocus><div class="dialog-actions"><button type="button" class="button outline" data-close-dialog>Cancel</button><button type="submit" class="button primary">Add interest</button></div></form>`, root => $('#add-text-form', root).addEventListener('submit', e => { e.preventDefault(); const text = $('#add-text', root).value.trim(); if (!text) return; if (callback(text) !== false) closeDialog(); }));

  // 01 — All draft fields are live text, not part of an image.
  const updateProfile = () => { $$('[data-profile]').forEach(el => { const v = state.profile[el.dataset.profile]; if (v) el.textContent = v; }); };
  const editProfile = field => {
    const fields = field === 'profile' ? [['name', 'Name'], ['bio', 'Profile introduction']] : [[field, {interests:'Current interests',offer:'Can offer',meet:'Wants to meet'}[field] || field]];
    openDialog('Edit your draft', `<form id="edit-profile-form">${fields.map(([key,label]) => `<label class="dialog-field" for="edit-${key}">${label}</label>${key === 'name' ? `<input class="dialog-input" id="edit-${key}" name="${key}" maxlength="45" required value="${escapeHTML(state.profile[key] || '')}" autofocus>` : `<textarea class="dialog-input" id="edit-${key}" name="${key}" maxlength="240" required>${escapeHTML(state.profile[key] || '')}</textarea>`}`).join('')}${notice('You control what to share. Changes are saved in this browser only.')}<div class="dialog-actions"><button type="button" class="button outline" data-close-dialog>Cancel</button><button type="submit" class="button primary">Save changes</button></div></form>`, root => {
      $('#edit-profile-form', root).addEventListener('submit', e => { e.preventDefault(); fields.forEach(([key]) => state.profile[key] = $(`[name="${key}"]`, root).value.trim()); save(); updateProfile(); closeDialog(); toast('Profile draft updated locally.'); });
    });
  };
  if (page === 'sources') {
    if (saved.profile) updateProfile();
    const setSourceButton = el => { const selected = state.sources.includes(el.dataset.source); el.classList.toggle('selected', selected); el.setAttribute('aria-pressed', String(selected)); $('.source-check', el).innerHTML = icon(selected ? 'check' : 'plus'); const chip = $(`[data-source-chip="${el.dataset.source}"]`); if (chip) { chip.classList.toggle('is-selected', selected); chip.title = selected ? 'Selected for this local draft' : 'Not selected'; } };
    $$('[data-source]').forEach(el => { setSourceButton(el); el.addEventListener('click', () => { const source = el.dataset.source; state.sources = state.sources.includes(source) ? state.sources.filter(s => s !== source) : [...state.sources, source]; setSourceButton(el); save(); toast(state.sources.includes(source) ? 'Source selected for this demo. No external account has been connected.' : 'Source removed from this draft.'); }); });
    $$('[data-edit]').forEach(el => el.addEventListener('click', () => editProfile(el.dataset.edit)));
  }

  // 02 — Privacy and matching are local preference controls, not cryptography.
  const interestTag = text => `<span class="interest-tag">${escapeHTML(text)}<button type="button" data-remove-interest aria-label="Remove ${escapeHTML(text)}">${icon('close')}</button></span>`;
  const updateMiniProfile = () => {
    const mini=$('.mini-profile');if(!mini)return;
    $('h3',mini).textContent=state.profile.name;
    $('p',mini).textContent='Builder exploring '+state.agent.interests.slice(0,3).join(', ').toLowerCase()+'.';
    const tags=$(':scope > div > div',mini);if(tags)tags.innerHTML=state.agent.interests.slice(0,3).map(t=>`<span class="chip">${escapeHTML(t)}</span>`).join('');
  };
  const renderInterests = () => { updateMiniProfile();const list = $('[data-interest-list]'); if (!list) return; list.innerHTML = state.agent.interests.map(interestTag).join('') + `<button class="add-tag" data-add-interest type="button">${icon('plus')}Add interest</button>`; };
  if (page === 'agent') {
    renderInterests();
    $$('[name=visibility]').forEach(el => { el.checked = el.value === state.agent.visibility; el.closest('.visibility-card').classList.toggle('selected', el.checked); el.addEventListener('change', () => { state.agent.visibility = el.value; $$('.visibility-card').forEach(card => card.classList.toggle('selected', $('input', card).checked)); $('.public-profile-preview .section-heading p').textContent = el.value === 'private' ? 'This preview is hidden from the public. Private matching can stay on.' : el.value === 'limited' ? 'Visible only to people you match with or choose.' : 'This snapshot will be visible in the SignalPass community.'; }); });

    $('.public-profile-preview .section-heading p').textContent = state.agent.visibility === 'private'
      ? 'Only you can see this preview while your profile is private.'
      : state.agent.visibility === 'limited' ? 'Visible only to people you match with or choose.'
      : 'This snapshot is visible in the example community.';
    const toggle = $('#matching-toggle');
    toggle.checked = state.agent.matching;
    const setToggle = () => { $('[data-toggle-label]').textContent = toggle.checked ? 'On' : 'Off'; $('.matching-settings').classList.toggle('matching-paused', !toggle.checked); };
    setToggle();
    toggle.addEventListener('change', () => { state.agent.matching = toggle.checked; setToggle(); toast(toggle.checked ? 'Private matching enabled in this local demo.' : 'Matching paused. Your profile settings are unchanged.'); });
    $$('[name=data-source]').forEach(el => { el.checked = state.agent.sources.includes(el.value); el.addEventListener('change', () => { state.agent.sources = $$('[name=data-source]:checked').map(i => i.value); }); });
    document.addEventListener('click', e => {
      const remove = e.target.closest('[data-remove-interest]');
      if (remove) { const tag = remove.closest('.interest-tag'); const label = tag.firstChild.textContent.trim(); state.agent.interests = state.agent.interests.filter(s => s !== label); renderInterests(); }
      if (e.target.closest('[data-add-interest]')) {
        if (state.agent.interests.length >= 12) return toast('Keep up to 12 interests so the profile stays focused.');
        addTextDialog('Add a curiosity', 'What are you interested in?', 'e.g. Creative coding', value => { if (state.agent.interests.some(s => s.toLowerCase() === value.toLowerCase())) { toast('That interest is already in your profile.'); return false; } state.agent.interests.push(value); renderInterests(); });
      }
    });
  }

  // 03 — A small deterministic example directory. No model or API is called.
  const directory = [
    {name:'Maya',avatar:'maya',role:'Product designer & community builder',tags:['Design','Communities','Open Source'],description:'Interested in building more human social tools, with a complementary product and community perspective.'},
    {name:'Rohan',avatar:'rohan',role:'Protocol engineer & educator',tags:['Infrastructure','Education','Monad'],description:'Curious about open internet infrastructure, technical learning, and collaborating across product and protocol design.'},
    {name:'Leo',avatar:'leo',role:'Creator & researcher',tags:['Content','Research','Onchain Culture'],description:'Exploring creator economies, onchain culture, and the intersection of research and storytelling.'},
  ];
  const showPerson = name => {
    const p = directory.find(p => p.name === name); if (!p) return;
    openDialog(`Meet ${p.name}`, `<img class="avatar dialog-avatar" src="assets/avatar-${p.avatar}.webp" alt="${p.name} illustrated avatar"><p class="dialog-copy">${p.role}</p><div class="dialog-tags">${p.tags.map(t => `<span class="chip">${t}</span>`).join('')}</div><p class="dialog-copy">${p.description}</p>${notice('An example suggestion, not a ranking. No one has been contacted.')}<div class="dialog-actions"><button class="button outline" type="button" data-close-dialog>Keep exploring</button><a class="button primary" href="compose.html">Draft an introduction ${icon('arrow')}</a></div>`);
  };
  if (page === 'discover') {

    if (!state.agent.matching) {
      $('.discovery-private h3').textContent='Private matching is paused';
      $('.discovery-private p').textContent='You can still browse example profiles';
    }
    let goal = '';
    $$('[data-discovery-goal]').forEach(el => el.addEventListener('click', () => { goal = el.dataset.discoveryGoal; $$('[data-discovery-goal]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); }));
    $$('[data-person]').forEach(card => { card.addEventListener('click', () => showPerson(card.dataset.person)); card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showPerson(card.dataset.person); } }); });
    $('#discovery-form').addEventListener('submit', e => {
      e.preventDefault();
      const query = $('#curiosity').value.trim().toLowerCase();
      const synonyms = query.replace(/zk|blockchain/g,'infrastructure').replace(/partner|collaborat/g,'design').replace(/creators/g,'creator');
      const words = synonyms.split(/\s+/).filter(w => w.length > 2);
      const scores = directory.map(p => { const text = `${p.name} ${p.role} ${p.tags.join(' ')} ${p.description}`.toLowerCase(); let score = words.reduce((s,w) => s + Number(text.includes(w)), 0); if (goal === 'learn' && p.name === 'Rohan') score += 2; if (goal === 'collaborate' && p.name === 'Maya') score++; return { name:p.name, score }; }).sort((a,b) => b.score - a.score);
      scores.forEach((p,i) => { const card = $(`[data-person="${p.name}"]`); card.style.order = String(i); });
      $('.search-result-note').textContent = query || goal ? `Example results reordered${goal ? ` for ${goal}` : ''}. This prototype uses local sample profiles, not a live agent.` : 'Showing all three example profiles. Choose a goal or enter a curiosity to try the local demo.';
      toast('Example suggestions updated. No one has been contacted.');
    });
  }

  // 04 — Live widget editor + copyable, locally runnable embed.
  const tagColors = ['blue', 'lavender', 'purple', 'blue', 'peach'];
  const widgetAvatar = p => p === 'alex' ? 'widget' : p === 'none' ? null : p;
  const renderWidget = () => {
    const w = state.widget;
    $('[data-live-name]').textContent = w.name || 'Your name';
    $('[data-live-bio]').textContent = w.bio || 'A little about you.';
    $('[data-live-cta]').textContent = w.cta;
    $('[data-live-tags]').innerHTML = w.tags.map((t,i) => `<span class="chip ${i === 0 ? 'lavender' : i === 1 ? 'mint' : tagColors[i % 5]}">${escapeHTML(t)}</span>`).join('');
    $('[data-widget-tags]').innerHTML = w.tags.map((t,i) => `<span class="widget-tag ${tagColors[i % 5]}">${escapeHTML(t)}<button type="button" data-remove-widget-tag aria-label="Remove ${escapeHTML(t)}">${icon('close')}</button></span>`).join('') + `<button class="add-tag" type="button" data-add-widget-tag>${icon('plus')}Add interest</button>`;
    $$('[data-persona]').forEach(el => { const selected = el.dataset.persona === w.persona; el.classList.toggle('selected', selected); el.setAttribute('aria-pressed', String(selected)); });
    const img = $('.widget-profile-image .avatar');
    const avatar = widgetAvatar(w.persona);
    img.hidden = !avatar;
    $('.empty-persona').hidden = Boolean(avatar);
    if (avatar) img.src = asset(`assets/avatar-${avatar}.webp`);
    $('[data-live-name]').style.fontSize = w.name.length > 24 ? (innerWidth <= 1180 ? '25px' : '36px') : '';
    const isDefault = JSON.stringify(w) === JSON.stringify(defaults.widget);
    const attrs = isDefault ? 'data-username="alexchen"' : `data-profile='${JSON.stringify(w).replace(/&/g,'&amp;').replace(/'/g,'&#39;').replace(/</g,'&lt;')}'`;
    $('#embed-code').textContent = `<div id="signalpass-widget" ${attrs}></div>\n<script src="./embed/widget.js" defer><\/script>`;
    save();
  };
  if (page === 'widget') {
    $('#widget-name').value = state.widget.name;
    $('#widget-bio').value = state.widget.bio;
    $('#widget-cta').value = state.widget.cta;
    renderWidget();
    $('#widget-form').addEventListener('submit', e => e.preventDefault());
    $('#widget-name').addEventListener('input', e => { state.widget.name = e.target.value; renderWidget(); });
    $('#widget-bio').addEventListener('input', e => { state.widget.bio = e.target.value; renderWidget(); });
    $('#widget-cta').addEventListener('change', e => { state.widget.cta = e.target.value; renderWidget(); });
    $$('[data-persona]').forEach(el => el.addEventListener('click', () => { state.widget.persona = el.dataset.persona; renderWidget(); }));
    document.addEventListener('click', e => {
      const remove = e.target.closest('[data-remove-widget-tag]');
      if (remove) { const label = remove.closest('.widget-tag').firstChild.textContent.trim(); state.widget.tags = state.widget.tags.filter(t => t !== label); renderWidget(); }
      if (e.target.closest('[data-add-widget-tag]')) {
        if (state.widget.tags.length >= 5) return toast('Use up to five public interests. Remove one first to add another.');
        addTextDialog('Add a public interest', 'Interest shown on your widget', 'e.g. Creative coding', text => { if (state.widget.tags.some(t => t.toLowerCase() === text.toLowerCase())) { toast('That interest is already on your widget.'); return false; } if (text.length > 24) { toast('Use 24 characters or fewer for a widget tag.'); return false; } state.widget.tags.push(text); renderWidget(); });
      }
    });
  }
  const copyEmbed = async () => {
    const text = $('#embed-code')?.textContent; if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.append(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); if (!ok) throw new Error('clipboard unavailable');
      }
      toast('Embed copied. Deploy the included embed/ and assets/ folders with your site.');
    } catch (_) {
      openDialog('Copy your embed', `<p class="dialog-copy">Automatic clipboard access is unavailable. Select and copy this code.</p><textarea class="dialog-input" readonly id="manual-copy">${escapeHTML(text)}</textarea>${notice('The script is local to this package. Upload the embed and assets folders alongside your site.')}`, root => { $('#manual-copy', root).focus(); $('#manual-copy', root).select(); });
    }
  };

  // 05 — Draft / review / explicit demo confirmation. Never sends a request.
  if (page === 'compose') {
    $('#intro-form').addEventListener('submit', e => e.preventDefault());
    const setStep = n => $$('.compose-steps li').forEach((el,i) => el.classList.toggle('active', i === n - 1));
    $$('[name=intro-goal]').forEach(el => el.addEventListener('change', () => { $$('.compose-goal').forEach(goal => goal.classList.toggle('selected', $('input', goal).checked)); setStep(2); }));
    $$('.intro-field textarea').forEach(el => el.addEventListener('input', () => setStep(2)));
    if (saved.draft?.fields) {
      $$('.intro-field textarea').forEach((el,i) => { el.value = saved.draft.fields[i] || el.value; });
      if (saved.draft.goal) { const radio = $(`[name=intro-goal][value="${saved.draft.goal}"]`); if (radio) { radio.checked = true; $$('.compose-goal').forEach(g => g.classList.toggle('selected', $('input', g).checked)); } }
    }
  }
  const reviewIntroduction = () => {
    const fields = $$('.intro-field textarea').map(el => el.value.trim());
    if (fields.some(t => !t)) return toast('Complete all four introduction fields before reviewing.');
    const goal = $('[name=intro-goal]:checked').value;
    state.draft = { fields, goal, status: 'draft' }; save();
    $$('.compose-steps li').forEach((el,i) => el.classList.toggle('active', i === 2));
    openDialog('Review your introduction', `<p class="dialog-copy">Your goal: <strong>${escapeHTML(goal)}</strong>. Take a moment to review the message.</p><div class="draft-message">${escapeHTML(fields.join('\n\n'))}</div>${notice('<strong>Local prototype only.</strong> No message will be sent, no fee charged, and no account connected. Confirming only marks this example as approved.')} ${buttons('Confirm demo approval')}`, root => $('#dialog-confirm', root).addEventListener('click', () => {
      state.draft.status = 'approved'; save(); closeDialog(); const button = $('[data-action=approve-introduction]'); button.textContent = 'Approved in this demo'; $('.composer-top .status-pill').textContent = 'Approved · demo only'; $('.approve-actions>small').textContent = 'Saved locally. No introduction was sent.'; toast('Introduction approved locally. No message was sent and no payment occurred.');
    }));
  };

  // 06 — Recipient inbox, filtering, selection and local status changes.
  const contacts = {
    Alex: {avatar:'rohan',role:'Product builder',topic:'Curious about distributed teams',curiosity:'You’re both exploring how smaller, more open teams can build meaningful products.',practice:'Alex brings product experience; you bring a community lens. Different angles, shared goals.'},
    Sam: {avatar:'sam',role:'Researcher',topic:'Exploring onchain coordination',curiosity:'You’re both curious about how online communities coordinate and make decisions.',practice:'Sam brings a research perspective; you bring practical community experience.'},
    Jordan: {avatar:'jordan',role:'Developer',topic:'Interested in creator tools',curiosity:'You’re both exploring better tools for independent creators and collaborative teams.',practice:'Jordan brings development experience; you bring product and community insights.'},
    Taylor: {avatar:'taylor',role:'Designer',topic:'Shared event interest',curiosity:'You share an interest in thoughtful events and design-led online communities.',practice:'Taylor brings a visual design perspective; you bring community experience.'},
    Priya: {avatar:'priya',role:'Community builder',topic:'Exploring governance models',curiosity:'You’re both exploring participatory communities and open governance.',practice:'Priya brings governance experience; you bring a complementary product lens.'},
  };
  let selectedContact = 'Alex';
  const selectContact = name => {
    const c = contacts[name]; if (!c) return; selectedContact = name;
    $$('[data-contact]').forEach(el => { const selected = el.dataset.contact === name; el.classList.toggle('selected', selected); el.setAttribute('aria-pressed', String(selected)); });
    $('[data-contact-name]').textContent = name;
    $('[data-contact-role]').textContent = c.role;
    $('[data-contact-topic]').textContent = c.topic;
    $('[data-contact-curiosity]').textContent = c.curiosity;
    $('[data-contact-practice]').textContent = c.practice;
    $('.connection-person.sender .avatar').src = asset(`assets/avatar-${c.avatar}.webp`);
    $('.inbox-note-alex').style.visibility = name === 'Alex' ? 'visible' : 'hidden';
    const status = state.inbox[name]?.status;
    const statusEl = $('.inbox-action-status'); statusEl.hidden = !status;
    if (status) statusEl.textContent = `${status} · saved in this browser only`;
    $('[data-action=accept-introduction]').textContent = status === 'Accepted' ? 'Accepted ✓' : 'Accept introduction';
  };
  if (page === 'inbox') {
    $$('[data-contact]').forEach(el => el.addEventListener('click', () => selectContact(el.dataset.contact)));
    $$('[data-inbox-tab]').forEach(el => el.addEventListener('click', () => {
      const tab = el.dataset.inboxTab;
      $$('[data-inbox-tab]').forEach(b => { b.classList.toggle('active', b === el); b.setAttribute('aria-selected', String(b === el)); });
      $$('.inbox-rows>[data-group]').forEach(row => { row.hidden = tab !== 'needs' && row.dataset.group !== tab; });
      const first = $('.inbox-row:not([hidden])');
      $('.inbox-empty').hidden = Boolean(first); if (first) selectContact(first.dataset.contact);
    }));

    const tabs = $$('[data-inbox-tab]');
    tabs.forEach((tab,i) => tab.addEventListener('keydown',event=>{
      let next;
      if(event.key==='ArrowRight')next=(i+1)%tabs.length;
      else if(event.key==='ArrowLeft')next=(i-1+tabs.length)%tabs.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=tabs.length-1;
      else return;
      event.preventDefault();tabs[next].focus();tabs[next].click();
    }));
    if (state.inbox.Alex?.status) selectContact('Alex');
  }
  const saveInboxStatus = (status, extra = {}) => { state.inbox[selectedContact] = { ...state.inbox[selectedContact], status, ...extra }; save(); selectContact(selectedContact); };

  document.addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) {
      const fee = e.target.closest('[data-fee]');
      if (fee) openDialog(fee.dataset.fee === 'bond' ? 'Refundable attention bond' : 'Evaluation fee', `<p class="dialog-copy">This label is part of the supplied concept design. The prototype has no payment integration, fee schedule, wallet connection, or refund mechanism.</p>${notice('No money can be charged or transferred by this local prototype.')}<div class="dialog-actions"><button type="button" class="button primary" data-close-dialog>Understood</button></div>`);
      return;
    }
    if (action === 'start-manually') return editProfile('profile');
    if (action === 'review-draft') return openDialog('Review your profile draft', `<img class="avatar dialog-avatar" src="assets/avatar-alex.webp" alt="Illustrated profile avatar"><h3 style="font-size:26px">${escapeHTML(state.profile.name)}</h3><p class="dialog-copy">${escapeHTML(state.profile.bio)}</p><ul class="context-list"><li><strong>Current interests</strong><br>${escapeHTML(state.profile.interests)}</li><li><strong>Can offer</strong><br>${escapeHTML(state.profile.offer)}</li><li><strong>Wants to meet</strong><br>${escapeHTML(state.profile.meet)}</li></ul>${notice('These are user-provided examples, not verified facts. No public information has been fetched.')}<div class="dialog-actions"><button class="button outline" type="button" data-close-dialog>Keep editing</button><a class="button primary" href="agent.html">Approve draft ${icon('arrow')}</a></div>`);
    if (action === 'save-agent') { save(); return toast('Agent preferences saved in this browser. No backend is connected.'); }
    if (action === 'preview-profile') return openDialog('Your profile preview', `<img class="avatar dialog-avatar" src="assets/avatar-alex.webp" alt="Illustrated avatar"><h3 style="font-size:25px">${escapeHTML(state.profile.name)}</h3><p class="dialog-copy">Builder exploring ${escapeHTML(state.agent.interests.slice(0,3).join(', ').toLowerCase())}.</p><div class="dialog-tags">${state.agent.interests.slice(0,12).map(t => `<span class="chip">${escapeHTML(t)}</span>`).join('')}</div>${notice(`Current visibility: <strong>${escapeHTML(state.agent.visibility)}</strong>. ${state.agent.visibility === 'private' ? 'The public profile is hidden; this is a private preview for you.' : 'This example shows the fields you have chosen to share.'}`)}<div class="dialog-actions"><button class="button primary" type="button" data-close-dialog>Back to settings</button></div>`);
    if (action === 'browse-people') return openDialog('People worth knowing', `<p class="dialog-copy">Three example profiles from the supplied designs.</p>${directory.map(p => `<button class="directory-entry" type="button" data-directory-person="${p.name}" style="width:100%;text-align:left"><img class="avatar" src="assets/avatar-${p.avatar}.webp" alt=""><span><strong>${p.name}</strong><p>${p.role}</p></span>${icon('arrow')}</button>`).join('')}`, root => $$('[data-directory-person]', root).forEach(el => el.addEventListener('click', () => showPerson(el.dataset.directoryPerson))));
    if (action === 'copy-embed') return void copyEmbed();
    if (action === 'approve-introduction') return reviewIntroduction();
    if (action === 'toggle-context') return openDialog('Optional context', `<p class="dialog-copy">The source design proposes showing relevant public context here. This prototype uses illustrative data only.</p><ul class="context-list"><li><strong>Your example context</strong><br>Developer tools and public community projects.</li><li><strong>Alex’s example context</strong><br>Protocol development and work in the Monad ecosystem.</li></ul>${notice('Nothing has been verified. No blockchain, GitHub account, or external identity service is connected.')}<div class="dialog-actions"><button class="button outline" type="button" id="hide-context">Hide on this card</button><button class="button primary" type="button" data-close-dialog>Keep context</button></div>`, root => $('#hide-context', root).addEventListener('click', () => { $('.verified-context-inner>p').textContent = 'Optional context is hidden from this introduction.'; $('[data-action=toggle-context]').textContent = 'Show context'; closeDialog(); toast('Context hidden from this demo card.'); }));
    if (action === 'accept-introduction') return openDialog(`Accept ${selectedContact}’s introduction?`, `<p class="dialog-copy">A good conversation starts with mutual curiosity. You decide whether to take the next step.</p>${notice('Demo only: accepting records a local status. It does not contact the other person.')} ${buttons('Accept in this demo')}`, root => $('#dialog-confirm', root).addEventListener('click', () => { saveInboxStatus('Accepted'); closeDialog(); toast('Introduction accepted locally. No one has been contacted.'); }));
    if (action === 'ask-context') return openDialog(`Ask ${selectedContact} for context`, `<form id="context-request-form"><label class="dialog-field" for="context-question">What would help you decide?</label><textarea class="dialog-input" id="context-question" maxlength="500" required autofocus placeholder="Could you share more about what you’d like to explore together?"></textarea>${notice('This saves a local draft only. It will not send a message.')}<div class="dialog-actions"><button class="button outline" type="button" data-close-dialog>Cancel</button><button class="button primary" type="submit">Save context request</button></div></form>`, root => $('#context-request-form', root).addEventListener('submit', event => { event.preventDefault(); const question = $('#context-question', root).value.trim(); if (!question) return; saveInboxStatus('Context requested', { question }); closeDialog(); toast('Context request saved locally, not sent.'); }));
    if (action === 'decline-introduction') return openDialog(`Decline ${selectedContact}’s introduction?`, `<p class="dialog-copy">You do not need to meet everyone. The choice is always yours.</p>${notice('This changes the example’s local status only. The sender will not be notified.')} ${buttons('Decline in this demo')}`, root => $('#dialog-confirm', root).addEventListener('click', () => { saveInboxStatus('Declined'); closeDialog(); toast('Introduction declined in this local demo.'); }));
  });

  // Footer-only utilities never cover or substitute for the reconstructed UI.
  const footer = $('.prototype-nav');
  const utility = document.createElement('button');
  utility.type = 'button'; utility.textContent = 'Reset local demo'; utility.className = 'reset-demo';
  utility.addEventListener('click', () => openDialog('Reset this prototype?', `<p class="dialog-copy">Clear the profile edits, settings, widget changes and introduction statuses saved by this demo in this browser.</p>${buttons('Reset demo')}`, root => $('#dialog-confirm', root).addEventListener('click', () => { try { store.removeItem(storageKey); } catch (_) {} if (window.SignalPassNavigate) window.SignalPassNavigate(page === 'sources' ? 'index.html' : page + '.html'); else location.reload(); })));
  footer?.append(utility);
  document.addEventListener('click', event => { const link = event.target.closest('a[href]'); if (link && window.SignalPassNavigate && /(?:^|\/)[a-z-]+\.html(?:[?#].*)?$/.test(link.getAttribute('href'))) { event.preventDefault(); window.SignalPassNavigate(link.getAttribute('href')); } });

  const adjustStage = () => {
    const scene = $('.scene'); if (!scene) return;
    if (document.documentElement.clientWidth <= 1180) {
      document.documentElement.style.setProperty('--scene-height', '928px'); return;
    }
    const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale')) || 1;
    const origin = scene.getBoundingClientRect().top;
    const panels = $$('.source-workspace, .agent-workspace, .discovery-workspace, .widget-workspace, .compose-workspace, .inbox-workspace');
    const bottom = Math.max(895, ...panels.map(el => (el.getBoundingClientRect().bottom-origin)/scale));
    document.documentElement.style.setProperty('--scene-height', Math.max(928,Math.ceil(bottom+29))+'px');
  };
  let stageFrame;
  const requestLayout = () => { cancelAnimationFrame(stageFrame);stageFrame = requestAnimationFrame(adjustStage); };
  window.addEventListener('resize',requestLayout,{passive:true});
  window.addEventListener('load',requestLayout);
  const stageObserver = new ResizeObserver(requestLayout);
  $$('.source-workspace, .agent-workspace, .discovery-workspace, .widget-workspace, .compose-workspace, .inbox-workspace').forEach(el=>stageObserver.observe(el));
  requestLayout();
  window.SignalPassDemo = Object.freeze({ version:'2.0.0', page });
})();
