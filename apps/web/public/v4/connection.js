/* Accepted introductions: one explicitly approved contact option per participant. */
(() => {
  'use strict';
  const api = window.SignalPass;
  const titles = { email: 'Email', contact_url: 'Contact page', scheduling_url: 'Scheduling page' };
  const hasControls = value => /[\p{Cc}\p{Cf}]/u.test(value);
  const encodedControls = /%(?:0[0-9a-f]|1[0-9a-f]|7f|8[0-9a-f]|9[0-9a-f])/i;
  function contactLink(contact) {
    if (!contact || typeof contact.value !== 'string' || typeof contact.label !== 'string' || !titles[contact.type] || hasControls(contact.value)) return null;
    const value = contact.value.trim();
    if (contact.type === 'email' && encodedControls.test(value)) return null;
    if (contact.type === 'email') return value.length <= 254 && /^[^\s@<>?,;:"\\]+@[^\s@<>?,;:"\\]+\.[^\s@<>?,;:"\\]+$/.test(value) ? 'mailto:' + encodeURIComponent(value) : null;
    if (/\s|\\/.test(value)) return null;
    try {
      if (hasControls(decodeURIComponent(value))) return null;
      const url = new URL(value);
      return value.length <= 1200 && url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
    } catch { return null; }
  }
  api.connectionReceipt = async (record, unavailable) => {
    if (api.demo || !api.me?.session || record.status !== 'accepted' || !['sender', 'recipient'].includes(record.role)) return;
    const otherName = record.role === 'sender' ? record.recipient : record.sender;
    const section = document.createElement('section');
    section.id = 'connection-panel'; section.className = 'sp-connection';
    section.setAttribute('aria-labelledby', 'connection-title');
    section.innerHTML = `
      <p class="connection-eyebrow">ACCEPTED INTRODUCTION</p>
      <h2 id="connection-title">Continue conversation</h2>
      <p id="connection-intro"></p>
      <p class="connection-note">Choose one contact option to share here. Your profile and wallet never supply contact details automatically.</p>
      <p id="connection-feedback" role="status" aria-live="polite"></p>
      <div id="connection-details" hidden>
        <div class="connection-columns">
          <div class="connection-card"><h3>Your contact option</h3><div id="connection-own"></div><button type="button" class="button outline btn btn-outline" id="connection-edit">Share a contact option</button><button type="button" class="connection-remove btn btn-ghost btn-sm" id="connection-remove" hidden>Remove my contact</button></div>
          <div class="connection-card"><h3 id="connection-other-title">Their contact option</h3><div id="connection-other"></div></div>
        </div>
        <p class="connection-note">Removing a contact hides it on this introduction. It cannot erase a copy the other person has already saved.</p>
      </div>
      <button type="button" class="button outline btn btn-outline" id="connection-refresh">Refresh contact details</button>
      <form id="connection-form" hidden autocomplete="off">
        <h3>Choose what to share</h3>
        <label for="connection-type">Contact option</label>
        <select class="dialog-input select" id="connection-type" required><option value="">Choose an option</option><option value="email">Email</option><option value="scheduling_url">HTTPS scheduling page</option><option value="contact_url">HTTPS contact page</option></select>
        <label for="connection-label">Label the other person will see</label>
        <input class="dialog-input input" id="connection-label" required maxlength="60" placeholder="For example, my work email" autocomplete="off">
        <label id="connection-value-label" for="connection-value">Email address or HTTPS link</label>
        <input class="dialog-input input" id="connection-value" required maxlength="1200" spellcheck="false" autocomplete="off" aria-describedby="connection-value-help">
        <p class="connection-note" id="connection-value-help">Enter only a contact option you want this person to receive.</p>
        <p id="connection-form-error" role="alert"></p>
        <div class="dialog-actions"><button type="submit" class="button primary btn btn-primary" id="connection-review">Review what will be shared</button><button type="button" class="button outline btn btn-outline" id="connection-cancel">Cancel</button></div>
      </form>
      <div id="connection-preview" class="connection-preview" hidden>
        <h3>Review before sharing</h3>
        <p id="connection-audience"></p>
        <dl><dt>Contact option</dt><dd id="connection-preview-type"></dd><dt>Label</dt><dd id="connection-preview-label"></dd><dt>Value</dt><dd id="connection-preview-value"></dd></dl>
        <p class="connection-note">Only this contact option is added to this introduction. It stays out of public profiles and agent prompts. Sharing does not send a message or open a website.</p>
        <p id="connection-share-error" role="alert"></p>
        <div class="dialog-actions"><button type="button" class="button primary btn btn-primary" id="connection-share">Share contact</button><button type="button" class="button outline btn btn-outline" id="connection-back">Edit details</button><button type="button" class="button outline btn btn-outline" id="connection-preview-cancel">Cancel</button></div>
      </div>`;
    document.getElementById('receipt-body').append(section);
    const get = name => section.querySelector('#connection-' + name);
    const endpoint = '/introductions/' + encodeURIComponent(record.id) + '/connection';
    let current = null, pendingContact = null, busy = false, destroyed = false;
    get('intro').textContent = 'You and ' + otherName + ' have agreed to connect. Each person decides whether to share a contact option.';
    get('other-title').textContent = otherName + '’s contact option';
    get('audience').textContent = 'Audience: you and ' + otherName + ', the other participant in this introduction.';
    get('share').textContent = 'Share with ' + otherName;
    const setBusy = value => {
      busy = value; api.connectionBusy = value;
      section.setAttribute('aria-busy', String(value));
      section.querySelectorAll('button, input, select').forEach(control => { control.disabled = value; });
    };
    const destroy = () => { destroyed = true; api.connectionBusy = false; section.replaceChildren(); section.hidden = true; };
    const noAccess = error => {
      if ([401, 403, 404, 409].includes(error.status)) { destroy(); unavailable?.(error); return true; }
      return false;
    };
    const closeEditor = () => {
      get('form').hidden = true; get('preview').hidden = true; get('form').reset(); pendingContact = null;
      get('form-error').textContent = ''; get('share-error').textContent = '';
    };
    const paragraph = (container, text) => { const p = document.createElement('p'); p.textContent = text; container.append(p); return p; };
    const render = connection => {
      current = connection;
      const own = get('own'), other = get('other'); own.replaceChildren(); other.replaceChildren();
      if (connection.ownContact) {
        paragraph(own, connection.ownContact.label + ' · ' + titles[connection.ownContact.type]);
        paragraph(own, connection.ownContact.value).className = 'connection-value';
        paragraph(own, 'Shared with ' + otherName + ' on this introduction.').className = 'connection-note';
      } else paragraph(own, 'You have not shared a contact option.');
      get('edit').textContent = connection.ownContact ? 'Change my contact' : 'Share a contact option';
      get('remove').hidden = !connection.ownContact;
      if (connection.otherContact) {
        const contact = connection.otherContact;
        paragraph(other, contact.label + ' · ' + (titles[contact.type] || 'Contact option'));
        paragraph(other, contact.value).className = 'connection-value';
        const href = contactLink(contact);
        if (href) {
          const link = document.createElement('a'); link.id = 'connection-other-link'; link.className = 'button outline btn btn-outline'; link.href = href;
          link.textContent = contact.type === 'email' ? 'Open email app ↗' : 'Open ' + titles[contact.type].toLowerCase() + ' ↗';
          link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer';
          if (contact.type !== 'email') link.target = '_blank';
          other.append(link);
          paragraph(other, contact.type === 'email' ? 'Opens your email app. You choose what to write and send.' : 'Opens the page they chose in a new tab.').className = 'connection-note';
        } else paragraph(other, 'This contact option cannot be opened safely. Ask the other person to update it.');
      } else paragraph(other, otherName + ' has not shared a contact option yet. Check back here when they do.');
      get('details').hidden = false;
    };
    const load = async () => {
      if (busy || destroyed) return;
      setBusy(true); get('feedback').textContent = 'Checking shared contact options…';
      try {
        const data = await api.request(endpoint);
        if (destroyed) return;
        render(data.connection); get('feedback').textContent = 'Contact options are up to date.';
        get('refresh').textContent = 'Refresh contact details';
      } catch (error) {
        if (destroyed || noAccess(error)) return;
        // Contact removal may have happened elsewhere. Do not leave a stale link active.
        get('details').hidden = true; get('other').replaceChildren(); get('own').replaceChildren();
        get('feedback').textContent = 'Could not check contact options. Refresh to see what is currently shared.';
        get('refresh').textContent = 'Try again';
      } finally { if (!destroyed) setBusy(false); }
    };
    get('refresh').onclick = load;
    get('edit').onclick = () => {
      if (busy) return;
      closeEditor();
      const contact = current?.ownContact;
      if (contact) { get('type').value = contact.type; get('label').value = contact.label; get('value').value = contact.value; }
      get('form').hidden = false; get('type').dispatchEvent(new Event('change')); get('type').focus();
    };
    get('type').onchange = () => {
      const type = get('type').value;
      get('value').type = type === 'email' ? 'email' : type ? 'url' : 'text';
      get('value').maxLength = type === 'email' ? 254 : 1200;
      get('value-label').textContent = type === 'email' ? 'Email address' : type ? 'HTTPS link' : 'Email address or HTTPS link';
      get('value').placeholder = type === 'email' ? 'you@example.com' : type ? 'https://…' : '';
    };
    get('cancel').onclick = get('preview-cancel').onclick = () => { closeEditor(); get('edit').focus(); };
    get('back').onclick = () => { pendingContact = null; get('preview').hidden = true; get('form').hidden = false; get('value').focus(); };
    get('form').onsubmit = event => {
      event.preventDefault();
      if (busy) return;
      const contact = { type: get('type').value, label: get('label').value.trim(), value: get('value').value.trim() };
      if (!contact.label || contact.label.length > 60 || hasControls(contact.label) || !contactLink(contact)) {
        get('form-error').textContent = 'Add a label and a valid email address or HTTPS link without sign-in credentials.'; return;
      }
      if (contact.type !== 'email') contact.value = new URL(contact.value).href;
      pendingContact = contact;
      get('preview-type').textContent = titles[contact.type]; get('preview-label').textContent = contact.label; get('preview-value').textContent = contact.value;
      get('form').hidden = true; get('preview').hidden = false; get('share-error').textContent = ''; get('share').focus();
    };
    get('share').onclick = async () => {
      if (busy || !pendingContact) return;
      let shared = false;
      setBusy(true); get('share-error').textContent = ''; get('feedback').textContent = 'Saving the contact option you approved…';
      try {
        const data = await api.request(endpoint, pendingContact);
        if (destroyed) return;
        render(data.connection); closeEditor(); get('feedback').textContent = 'Your contact option is now shared with ' + otherName + '.'; shared = true;
      } catch (error) {
        if (destroyed || noAccess(error)) return;
        get('feedback').textContent = '';
        get('share-error').textContent = error.code === 'invalid_contact' ? 'Check the email address or HTTPS link, then review it again.' : 'We could not confirm whether your contact was saved. Refresh contact details to check, or retry sharing the same option.';
      } finally { if (!destroyed) { setBusy(false); if (shared) get('edit').focus(); } }
    };
    get('remove').onclick = async () => {
      if (busy || !current?.ownContact) return;
      setBusy(true); get('feedback').textContent = 'Removing your contact option…';
      try {
        const data = await api.request(endpoint + '/remove', {});
        if (destroyed) return;
        render(data.connection); closeEditor(); get('feedback').textContent = 'Your contact option has been removed from this introduction.';
      } catch (error) {
        if (destroyed || noAccess(error)) return;
        get('feedback').textContent = 'We could not confirm removal. Refresh contact details to check, or try removing it again.';
      } finally { if (!destroyed) setBusy(false); }
    };
    await load();
    return { destroy };
  };
})();
