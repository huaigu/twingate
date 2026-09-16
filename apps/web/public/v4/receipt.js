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
      '<label class="dialog-field" for="reply-context">Add the context they asked for</label><textarea class="dialog-input" id="reply-context" required maxlength="1000" rows="4" placeholder="A little more about what you have in mind…"></textarea><div class="dialog-actions"><button class="button primary" type="submit">Approve and add context</button></div>';
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
