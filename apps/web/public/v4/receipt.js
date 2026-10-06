(async () => {
const api = window.SignalPass;
await api.ready;
if (api.demo) {
(() => {
  let state = {};
  try {
    state = JSON.parse(localStorage.getItem("signalpass-v4") || "{}") || {};
  } catch {}
  const id =
    location.pathname.split("/")[2] ||
    new URLSearchParams(location.search).get("id");
  const record = Array.isArray(state.introductions)
    ? state.introductions.find((r) => r && r.id === id)
    : null;
  const set = (selector, value) => {
    document.getElementById(selector).textContent = value;
  };
  if (!record) {
    set("receipt-title", "This introduction isn’t here yet.");
    set(
      "receipt-description",
      "It may belong to a different browser. Explore the community to start a new conversation.",
    );
    return;
  }
  const statuses = {
    pending: [
      "Your hello is ready.",
      "Awaiting a response",
      "You approved the introduction. Try the recipient’s view to complete the local demo.",
    ],
    accepted: [
      "A connection, made.",
      "Accepted",
      "Both sides have said yes. The next conversation is yours to have.",
    ],
    context_requested: [
      "A little more context.",
      "Context requested",
      "The recipient would like to learn more before deciding.",
    ],
    declined: [
      "Not this time.",
      "Declined",
      "This introduction is closed. There are more people worth knowing.",
    ],
  };
  const [title, status, description] =
    statuses[record.status] || statuses.pending;
  document.body.dataset.receiptState = record.status;
  set("receipt-title", title);
  set("receipt-status", status);
  set("receipt-description", description);
  set("receipt-people", `${record.sender} → ${record.recipient}`);
  set(
    "receipt-message",
    Array.isArray(record.fields) ? record.fields.join("\n\n") : "",
  );
  set(
    "receipt-context",
    record.sharedContext
      ? "Shared: the approved introduction and selected profile context."
      : "Shared: the approved introduction message only.",
  );
  set(
    "receipt-question",
    record.question ? `Their question: ${record.question}` : "",
  );
  set("receipt-date", `Created ${new Date(record.createdAt).toLocaleString()}`);
  document.getElementById("receipt-body").hidden = false;
  const link = document.getElementById("recipient-link");
  link.href = `/inbox/${encodeURIComponent(record.id)}`;
  link.textContent = "Open recipient preview →";
  if (record.status === "context_requested") {
    const form = document.createElement("form");
    form.id = "reply-form";
    form.innerHTML =
      '<label class="dialog-field" for="reply-context">Add the context they asked for</label><textarea class="dialog-input textarea" id="reply-context" required maxlength="1000" rows="4" placeholder="A little more about what you have in mind…"></textarea><div class="dialog-actions"><button class="button primary btn btn-primary" type="submit">Approve and add context</button></div>';
    document.getElementById("receipt-body").append(form);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const reply = document.getElementById("reply-context").value.trim();
      if (!reply) return;
      record.reply = reply;
      record.status = "pending";
      record.updatedAt = new Date().toISOString();
      if (state.inbox) delete state.inbox["sent-" + record.id];
      try {
        localStorage.setItem("signalpass-v4", JSON.stringify(state));
        location.reload();
      } catch {
        set(
          "receipt-description",
          "Your browser could not save the reply. Please enable local storage and try again.",
        );
      }
    });
  }
  if (record.reply) {
    const p = document.createElement("p");
    p.className = "v4-result-message";
    p.textContent = `Additional context: ${record.reply}`;
    document.getElementById("receipt-body").append(p);
  }
})();

return;
}
const set = (id, text) => { document.getElementById(id).textContent = text; };
const id = location.pathname.split('/')[2];
let connection;
const showUnavailable = error => {
  connection?.destroy();
  const signedOut = error.status === 401 || !api.me?.session;
  set('receipt-title', signedOut ? 'Sign in to read your introduction.' : error.status === 409 ? 'This introduction is not accepted.' : 'This introduction is not available to this account.');
  set('receipt-description', signedOut ? 'Connect the wallet you used for this introduction. You will return to this same receipt after signing in.' : error.message || 'Check the account you used, then try again.');
  document.getElementById('receipt-body').hidden = true;
  const access = document.getElementById('receipt-access'), button = document.getElementById('receipt-reconnect');
  access.hidden = false;
  set('receipt-access-description', signedOut ? 'Only the two participants can open this private receipt. Sign-in does not make a payment or share contact details.' : 'Your introduction stays private. If you are signed in with another wallet, sign out above and connect the wallet you used.');
  button.textContent = signedOut ? 'Connect wallet to continue' : 'Try again';
  button.disabled = false;
  button.onclick = async () => {
    button.disabled = true; set('receipt-access-error', '');
    try { if (signedOut) await api.connect(); else location.reload(); }
    catch (failure) { set('receipt-access-error', failure.message || 'Sign-in did not complete. Try again.'); button.disabled = false; }
  };
  document.getElementById('recipient-link').textContent = 'My inbox →';
};
try {
  if (api.error) throw api.error;
  const record = api.toRecord((await api.request('/introductions/' + encodeURIComponent(id))).introduction);
  const labels = { quoted: ['Your hello is awaiting its bond.', 'Awaiting wallet payment'], expired: ['The response window has closed.', 'Expired · bond returned'], pending: ['Your hello has arrived.', 'Awaiting a response'], accepted: ['A connection, made.', 'Accepted'], declined: ['Not this time.', 'Declined'], context_requested: ['A little more context.', 'Context requested'], withdrawn: ['Introduction withdrawn.', 'Withdrawn'], evaluating: ['Your introduction is being reviewed.', 'Evaluating'] };
  const [title, status] = labels[record.status] || ['Your introduction.', record.status];
  document.body.dataset.receiptState = record.status;
  set('receipt-title', title); set('receipt-status', status);
  set('receipt-description', record.settlement === 'onchain' ? 'Only confirmed chain events change your payment status. Additional context is shared offchain and does not change the original signed message.' : 'Only you and the other participant can read this introduction. No payment has been requested or transferred.');
  set('receipt-people', record.sender + ' → ' + record.recipient);
  document.querySelector('.v4-timeline span:nth-child(2)').textContent = record.role === 'recipient' ? 'Approved by sender' : 'Approved by you';
  set('receipt-message', record.fields.join('\n\n'));
  set('receipt-context', record.sharedContext ? 'Shared: the approved message, profile summary and interests.' : 'Shared: the approved introduction message only.');
  set('receipt-question', record.question ? 'Requested context: ' + record.question : '');
  set('receipt-date', 'Created ' + new Date(record.createdAt).toLocaleString());
  document.getElementById('receipt-body').hidden = false;
  const link = document.getElementById('recipient-link');
  link.href = record.role === 'recipient' ? '/inbox/' + encodeURIComponent(id) : '/inbox';
  link.textContent = record.role === 'recipient' ? 'Review in my inbox →' : 'My introductions →';
  if (record.reply) { const p = document.createElement('p'); p.className = 'v4-result-message'; p.textContent = 'Additional context: ' + record.reply; document.getElementById('receipt-body').append(p); }
  if (record.status === 'accepted') { const p = document.createElement('p'); p.className = 'v4-result-message'; p.textContent = 'Agreed starting point: ' + record.fields[3]; document.getElementById('receipt-body').append(p); }
  if (record.status === 'context_requested' && record.role === 'sender') {
    const form = document.createElement('form'); form.id = 'reply-form';
    form.innerHTML = '<label class="dialog-field" for="reply-context">Add the context they asked for</label><textarea class="dialog-input textarea" id="reply-context" required maxlength="1000" rows="4"></textarea><p id="reply-error" role="alert"></p><div class="dialog-actions"><button class="button primary btn btn-primary" type="submit">Approve and add context</button></div>';
    document.getElementById('receipt-body').append(form);
    form.onsubmit = async (event) => { event.preventDefault(); const button = form.querySelector('button'); button.disabled = true; try { await api.request('/introductions/' + id + '/reply', { text: form.querySelector('textarea').value.trim(), revision: record.revision }); location.reload(); } catch (error) { form.querySelector('#reply-error').textContent = error.message; button.disabled = false; } };
  }
  connection = await api.connectionReceipt?.(record, showUnavailable);
  await api.chainReceipt?.(record);
  const timer = setInterval(async () => {
    if (document.hidden || api.walletBusy || api.connectionBusy || document.activeElement?.closest('#reply-form, #connection-panel') || document.querySelector('#connection-form:not([hidden]), #connection-preview:not([hidden])')) return;
    try { const latest = await api.request('/introductions/' + id); if (latest.introduction.revision !== record.revision) location.reload(); }
    catch (error) { if ([401, 404].includes(error.status)) { clearInterval(timer); showUnavailable(error); } else set('receipt-description', error.message + ' Last confirmed information is preserved.'); }
  }, 5000);
  window.addEventListener('pagehide', () => { clearInterval(timer); connection?.destroy(); });
} catch (error) {
  showUnavailable(error);
}
})();
