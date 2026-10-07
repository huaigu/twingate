/* A deterministic, fictional walkthrough. Deliberately no app session, storage,
   fetch, wallet, analytics, API or transaction calls. All state is in memory. */
(() => {
  'use strict';
  const INITIAL = Object.freeze({
    draft: 'Hi Bob — I’m building a wallet prototype and would love your feedback on the connection and approval screens. Your offer to review wallet onboarding looks like a good fit. Would you be open to a 15-minute review? I can share a clickable prototype and offer product feedback in return.',
    question: 'Happy to take a look. Is this a clickable prototype or a live app, and which part should I focus on?',
    answer: 'It’s a clickable prototype. Please focus on connecting a wallet and understanding the first token approval. I’d value your feedback in a 15-minute review.'
  });
  const GROUPS = ['The goal', 'The fit', 'The draft', 'The send', 'The reply', 'The choice', 'The contact'];
  const GROUP_AT = [0, 1, 2, 3, 4, 4, 5, 6, 6, 6];
  const TITLES = ['Alice has a specific need.', 'A shared interest isn’t enough.', 'A first hello, in Alice’s words.', 'Alice decides whether to send.', 'Bob can ask before he decides.', 'Alice adds the missing context.', 'Bob has enough context to decide.', 'Acceptance isn’t contact sharing.', 'Bob makes his own choice.', 'A connection, with both people in control.'];
  const root = document.getElementById('walk-scene');
  const back = document.getElementById('walk-back');
  const announcement = document.getElementById('walk-announcement');
  let state = initialState();

  function initialState() {
    return {step: 0, selected: false, reviewed: false, sent: false, asked: false, answered: false, accepted: false, aliceShared: false, bobShared: false, ...INITIAL};
  }
  function escape(value) {
    return String(value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
  }
  function heading(description) {
    return `<div class="walk-scene-header"><h2 id="step-title" tabindex="-1">${TITLES[state.step]}</h2><p>${description}</p></div>`;
  }
  function primary(label, disabled = false) {
    return `<button class="btn btn-primary" type="button" data-action="next" ${disabled ? 'disabled' : ''}>${label} <span aria-hidden="true">→</span></button>`;
  }
  function message(from, to, text, received = false) {
    return `<div class="walk-message${received ? ' walk-received' : ''}"><div class="walk-message-meta"><strong>${from} → ${to}</strong><span>Sample message</span></div><p>${escape(text)}</p></div>`;
  }
  function textField(key, label, hint, short = false) {
    return `<label class="walk-field-label" for="sample-${key}">${label}</label><textarea class="textarea${short ? ' walk-short-field' : ''}" id="sample-${key}" data-field="${key}" rows="${short ? 3 : 5}" minlength="${key === 'draft' ? 20 : 1}" maxlength="1200" aria-describedby="${key}-hint ${key}-counter">${escape(state[key])}</textarea><div class="walk-counter"><span id="${key}-hint">${hint}</span><span id="${key}-counter">${state[key].length} / 1200</span></div>`;
  }
  function valid(key) { return state[key].trim().length >= (key === 'draft' ? 20 : 1) && state[key].length <= 1200; }
  function sharePreview(person) {
    return `<div class="walk-share-preview"><p class="walk-label">${person}’s own contact preview</p><strong>${person.toLowerCase()}@example.test</strong><p>Fictional address. ${person} can choose to share it with ${person === 'Alice' ? 'Bob' : 'Alice'}.</p></div>`;
  }
  function contactResult(person, shared) {
    return `<div><strong>${person}’s contact</strong>${shared ? `<p class="walk-contact-email">${person.toLowerCase()}@example.test</p><p>Shared by ${person} in this sample.</p>` : '<p>Not shared. The introduction is still accepted.</p>'}</div>`;
  }
  function content() {
    switch (state.step) {
      case 0: return `${heading('She knows what help she needs. She doesn’t yet know who to ask.')}<p class="walk-label">ALICE’S GOAL</p><blockquote class="walk-goal">“I need feedback on my wallet onboarding prototype, especially the connection and approval screens.”</blockquote><div class="walk-specifics"><span>Specific need</span><span>Relevant experience</span><span>A small, clear request</span></div><p class="walk-help">In the live app, Alice describes her goal. SignalPass searches only profiles people have made available in its directory.</p><div class="walk-actions">${primary('See the sample matches')}</div>`;
      case 1: return `${heading('SignalPass should explain a useful connection with profile evidence. Compare these fictional profiles, then choose Bob.')}<div class="walk-match-grid"><article class="walk-candidate" data-fit="weak"><span class="walk-fit-label">INTEREST ONLY</span><h3>Chris · Crypto enthusiast</h3><blockquote>“I follow crypto news and enjoy discussing new tokens.”</blockquote><small>Source: public interests</small><div class="walk-evidence"><p><strong>Why this is not enough</strong></p><p>Nothing here establishes experience reviewing wallet onboarding.</p></div></article><article class="walk-candidate" data-fit="strong"><span class="walk-fit-label">RELEVANT OFFER</span><h3>Bob · Product designer</h3><blockquote>“I offer usability reviews of wallet connection and token approval screens.”</blockquote><small>Source: public offer · exact sample quote</small><div class="walk-evidence"><p><strong>Why you two</strong></p><p>Alice’s request directly matches what Bob says he can review. His availability is still unknown.</p></div><label class="walk-select"><input class="radio radio-primary" type="radio" name="candidate" id="sample-select-bob" ${state.selected ? 'checked' : ''} /> Choose Bob</label></article></div><details class="walk-example-detail"><summary>What if neither profile fits?</summary><p>The right answer is no suitable match in the reviewed directory. Alice can add useful context or return later; the assistant should not invent expertise or imply it searched elsewhere.</p></details><div class="walk-actions">${primary('Prepare sample introduction', !state.selected)}</div><p class="walk-help">This prepared comparison illustrates the evidence-first approach. It is not a live model result.</p>`;
      case 2: return `${heading('A suggested introduction is a starting point. Edit this sample, then check it before continuing. Nothing has been sent.')} ${textField('draft', 'Alice’s introduction to Bob', '20–1,200 characters. Try making it sound like you.')}<label class="walk-review-check"><input type="checkbox" class="checkbox checkbox-primary" id="sample-reviewed" ${state.reviewed ? 'checked' : ''} /><span>I reviewed this message.<small>The request is accurate and I’m comfortable sending it as Alice in the sample.</small></span></label><div class="walk-actions">${primary('Review sample delivery', !state.reviewed || !valid('draft'))}</div>`;
      case 3: return `${heading('Preparing a draft never sends it. This separate step is Alice’s final approval.')} ${message('Alice', 'Bob', state.draft)}<div class="walk-fact-row"><span>Delivery</span><strong>Fictional sample inbox</strong></div><div class="walk-fact-row"><span>Bond</span><strong>No bond · no transaction</strong></div><div class="walk-fact-row"><span>Profile contacts</span><strong>Not automatically shared</strong></div><div class="walk-reassurance"><strong>Ready when Alice is.</strong> Sending here advances only this sample. No real person is contacted.</div><div class="walk-actions">${primary('Send sample introduction')}</div>`;
      case 4: return `${heading('We’ve switched to Bob’s inbox. The introduction makes a specific request, but he wants one detail first.')}<div class="walk-receipt">Sample introduction delivered</div>${message('Alice', 'Bob', state.draft, true)}${textField('question', 'Bob’s question to Alice', 'Write a question for Alice. Up to 1,200 characters.', true)}<div class="walk-actions">${primary('Send sample question', !valid('question'))}</div>`;
      case 5: return `${heading('Alice receives Bob’s question. A short answer helps him decide whether this is something he can help with.')} ${message('Bob', 'Alice', state.question, true)}${textField('answer', 'Alice’s answer to Bob', 'Write an answer for Bob. Up to 1,200 characters.', true)}<div class="walk-actions">${primary('Send sample answer', !valid('answer'))}</div>`;
      case 6: return `${heading('Bob now understands the format, the focus and the size of the request. He chooses to accept this sample introduction.')} ${message('Alice', 'Bob', state.answer, true)}<div class="walk-reassurance"><strong>The recipient decides.</strong> In the live app, Bob can accept, decline or ask for context. This story follows acceptance.</div><div class="walk-actions">${primary('Accept sample introduction')}</div><p class="walk-help">Acceptance doesn’t automatically reveal either person’s contact details.</p>`;
      case 7: return `${heading('The introduction is accepted. Alice still chooses whether to reveal a contact address to Bob.')}<div class="walk-receipt">Bob accepted the sample introduction</div>${sharePreview('Alice')}<p class="walk-locked">Bob’s contact is still private.</p><div class="walk-actions"><button class="btn btn-primary" data-action="share" type="button">Share Alice’s sample contact <span aria-hidden="true">→</span></button><button class="btn btn-outline" data-action="skip" type="button">Keep Alice’s contact private</button></div>`;
      case 8: return `${heading('Alice’s decision does not grant permission for Bob. He makes his own contact-sharing choice.')}<div class="walk-reassurance">${state.aliceShared ? '<strong>Alice chose to share:</strong> <span class="walk-contact-email">alice@example.test</span>' : '<strong>Alice kept her contact private.</strong> Bob can still decide what to share.'}</div>${sharePreview('Bob')}<div class="walk-actions"><button class="btn btn-primary" data-action="share" type="button">Share Bob’s sample contact <span aria-hidden="true">→</span></button><button class="btn btn-outline" data-action="skip" type="button">Keep Bob’s contact private</button></div>`;
      case 9: return `<div class="walk-success" aria-hidden="true">✓</div>${heading('Alice found a relevant offer. Bob got a clear request and the context to decide. Each person controlled their own contact details.')}<div class="walk-receipt">Sample introduction accepted</div><div class="walk-outcome">${contactResult('Alice', state.aliceShared)}${contactResult('Bob', state.bobShared)}</div><p class="walk-complete-note"><strong>What’s real in SignalPass:</strong> approved profiles, AI-assisted discovery and drafts, reviewed delivery, recipient decisions and separate contact sharing.<br /><br />This walkthrough used prepared fictional content, with no wallet or AI requests. The live app requires sign-in for personal actions; matches depend on the available directory.</p><div class="walk-actions"><a href="/assistant?demo=0" class="btn btn-primary">Try your own goal <span aria-hidden="true">↗</span></a><button type="button" class="btn btn-outline" data-action="restart">Try the story again</button></div><details class="walk-example-detail"><summary>Where does Monad fit?</summary><p>The live product also offers an optional commitment bond with on-chain settlement. This sample used no bond. It does not demonstrate a transaction or prove that bonds improve replies. <a href="/v4/evidence.html">See verified product evidence and historical receipts →</a></p></details>`;
      default: return '';
    }
  }
  function render(moveFocus = false) {
    const role = [4, 6, 8].includes(state.step) ? 'bob' : state.step === 9 ? 'both' : 'alice';
    const roleNode = document.getElementById('walk-role');
    roleNode.textContent = role === 'both' ? 'BOTH PEOPLE’S CHOICES' : `${role.toUpperCase()}’S VIEW`;
    roleNode.dataset.role = role;
    document.getElementById('walk-count').textContent = `Step ${state.step + 1} of 10`;
    const group = GROUP_AT[state.step];
    document.getElementById('walk-progress').innerHTML = GROUPS.map((label, index) => `<li ${index === group ? 'aria-current="step"' : ''} data-complete="${index < group || state.step === 9}"><span aria-hidden="true">${index < group || state.step === 9 ? '✓' : index + 1}</span>${label}</li>`).join('');
    root.innerHTML = content();
    root.dataset.step = String(state.step);
    back.disabled = state.step === 0;
    announcement.textContent = `Step ${state.step + 1} of 10. ${role === 'both' ? 'Both people’s choices.' : `${role === 'bob' ? 'Bob' : 'Alice'}’s view.`} ${TITLES[state.step]}`;
    if (moveFocus) {
      document.getElementById('step-title').focus({preventScroll: true});
      // Keep the role and heading visible after deliberate navigation on phones.
      if (window.matchMedia('(max-width: 620px)').matches) document.getElementById('story').scrollIntoView({block: 'start', behavior: 'instant'});
    }
  }
  function next() {
    if (state.step === 1 && !state.selected) return;
    if (state.step === 2 && (!state.reviewed || !valid('draft'))) return;
    if (state.step === 4 && !valid('question')) return;
    if (state.step === 5 && !valid('answer')) return;
    if (state.step === 3) state.sent = true;
    if (state.step === 4) state.asked = true;
    if (state.step === 5) state.answered = true;
    if (state.step === 6) state.accepted = true;
    if (state.step < 9) state.step += 1;
    render(true);
  }
  function restart() { state = initialState(); render(true); }
  function rewind() {
    if (state.step === 0) return;
    state.step -= 1;
    if (state.step <= 8) state.bobShared = false;
    if (state.step <= 7) state.aliceShared = false;
    if (state.step <= 6) state.accepted = false;
    if (state.step <= 5) state.answered = false;
    if (state.step <= 4) state.asked = false;
    if (state.step <= 3) state.sent = false;
    if (state.step <= 2) state.reviewed = false;
    render(true);
  }
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    if (button.dataset.action === 'next') next();
    if (button.dataset.action === 'restart') restart();
    if (['share', 'skip'].includes(button.dataset.action) && [7, 8].includes(state.step)) {
      state[state.step === 7 ? 'aliceShared' : 'bobShared'] = button.dataset.action === 'share';
      next();
    }
  });
  root.addEventListener('change', event => {
    if (event.target.id === 'sample-select-bob') state.selected = event.target.checked;
    if (event.target.id === 'sample-reviewed') state.reviewed = event.target.checked;
    updateEnabled();
  });
  root.addEventListener('input', event => {
    const key = event.target.dataset.field;
    if (!['draft', 'question', 'answer'].includes(key)) return;
    state[key] = event.target.value;
    document.getElementById(`${key}-counter`).textContent = `${state[key].length} / 1200`;
    if (key === 'draft') {
      state.reviewed = false;
      document.getElementById('sample-reviewed').checked = false;
    }
    updateEnabled();
  });
  function updateEnabled() {
    const button = root.querySelector('[data-action="next"]');
    if (!button) return;
    button.disabled = (state.step === 1 && !state.selected) || (state.step === 2 && (!state.reviewed || !valid('draft'))) || (state.step === 4 && !valid('question')) || (state.step === 5 && !valid('answer'));
  }
  back.addEventListener('click', rewind);
  document.getElementById('walk-restart').addEventListener('click', restart);
  render();
})();
