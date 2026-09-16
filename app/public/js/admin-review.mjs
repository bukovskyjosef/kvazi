const context = document.querySelector('#reviewContext');
const message = document.querySelector('#reviewMessage');
for (const form of document.querySelectorAll('.review-mutation')) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submitter = event.submitter;
    if (!submitter || form.dataset.busy) return;
    const payload = Object.fromEntries(new FormData(form));
    payload[submitter.name] = submitter.value;
    if (payload.expectedDecisionNo !== undefined) payload.expectedDecisionNo = Number(payload.expectedDecisionNo);
    if (payload.isApproved !== undefined) payload.isApproved = payload.isApproved === 'true';
    if ((payload.verdict === 'REJECTED' || ['return', 'reject'].includes(payload.action)) && !/[^\s\p{Z}]/u.test(payload.reason)) {
      message.textContent = 'Vrácení a zamítnutí vyžadují neprázdný důvod.';
      return;
    }
    Object.assign(payload, {revisionId: Number(context.dataset.revisionId), validationResultId: Number(context.dataset.resultId), csrf: document.querySelector('meta[name="csrf"]').content});
    form.dataset.busy = '1';
    const buttons = [...form.querySelectorAll('button')];
    const disabled = buttons.map(button => button.disabled);
    buttons.forEach(button => { button.disabled = true; });
    message.textContent = 'Ukládám rozhodnutí…';
    try {
      const response = await fetch(form.dataset.endpoint, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)});
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Rozhodnutí se nepodařilo uložit.');
      location.reload();
    } catch (error) {
      message.textContent = error.message || 'Rozhodnutí se nepodařilo uložit.';
      delete form.dataset.busy;
      buttons.forEach((button, i) => { button.disabled = disabled[i]; });
    }
  });
}
