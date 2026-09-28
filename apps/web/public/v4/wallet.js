/* Wallet transactions are always approved by the participant in their own wallet. */
(() => {
  'use strict';
  const api = window.SignalPass;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  api.money = value => {
    const n = BigInt(value || '0'), fraction = (n % 10n ** 18n).toString().padStart(18, '0').replace(/0+$/, '');
    return (n / 10n ** 18n).toString() + (fraction ? '.' + fraction : '') + ' ' + (api.chain?.currency || 'MON');
  };
  api.walletTransaction = async transaction => {
    if (!api.chain?.enabled || ![31337, 10143].includes(api.chain.chainId)) throw new Error('Unsupported settlement network.');
    if (!window.ethereum?.request) throw new Error('Open SignalPass in a browser with an Ethereum wallet.');
    const provider = window.ethereum;
    const [address] = await provider.request({ method: 'eth_requestAccounts' });
    if (address?.toLowerCase() !== api.me?.session.address || address?.toLowerCase() !== transaction.from.toLowerCase()) throw new Error('Switch to the wallet you used to sign in.');
    const chainId = '0x' + api.chain.chainId.toString(16);
    if (transaction.chainId !== chainId) throw new Error('The transaction network does not match this deployment.');
    if (await provider.request({ method: 'eth_chainId' }) !== chainId) {
      try { await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] }); }
      catch (error) {
        if (error.code !== 4902 || !api.chain.walletRpcUrl) throw error;
        await provider.request({ method: 'wallet_addEthereumChain', params: [{ chainId, chainName: api.chain.name, nativeCurrency: { name: api.chain.currency, symbol: api.chain.currency, decimals: 18 }, rpcUrls: [api.chain.walletRpcUrl], ...(api.chain.explorerUrl ? { blockExplorerUrls: [api.chain.explorerUrl] } : {}) }] });
        await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
      }
    }
    if (await provider.request({ method: 'eth_chainId' }) !== chainId) throw new Error('Switch your wallet to ' + api.chain.name + '.');
    const { from, to, data, value } = transaction;
    return provider.request({ method: 'eth_sendTransaction', params: [{ from, to, data, value }] });
  };
  api.waitWalletReceipt = async hash => {
    for (let i = 0; i < 90; i++) {
      const receipt = await window.ethereum.request({ method: 'eth_getTransactionReceipt', params: [hash] });
      if (receipt) { if (receipt.status !== '0x1') throw new Error('Transaction reverted. The bond was not transferred; network gas may apply.'); return receipt; }
      await sleep(1000);
    }
    throw new Error('Transaction submitted; still awaiting confirmation. Refresh to recover its result before trying again.');
  };
  api.settle = async (record, action) => {
    if (api.walletBusy) throw new Error('Finish the current wallet request first.');
    api.walletBusy = true;
    try {
      const prepared = await api.request('/introductions/' + record.id + '/settlement/prepare', { action });
      const hash = await api.walletTransaction(prepared.transaction);
      await api.waitWalletReceipt(hash);
      for (let i = 0; i < 40; i++) {
        const response = await api.request('/introductions/' + record.id + '/settlement/confirm', { action, transactionHash: hash });
        if (response.confirmed) return api.toRecord((await api.request('/introductions/' + record.id)).introduction);
        await sleep(1500);
      }
      throw new Error('Transaction submitted. Waiting for the configured confirmations; refresh to recover its result.');
    } finally { api.walletBusy = false; }
  };
  api.chainReceipt = async record => {
    if (record.settlement !== 'onchain') return;
    const panel = document.createElement('section'); panel.className = 'v4-chain-card'; panel.id = 'chain-receipt';
    const eyebrow = document.createElement('p'); eyebrow.className = 'v4-chain-eyebrow'; eyebrow.textContent = api.chain.name;
    const title = document.createElement('h2'); title.textContent = record.payment.status === 'refunded' ? 'Your attention bond is back.' : record.payment.status === 'locked' ? 'A hello, backed by a bond.' : 'Review your wallet bond.';
    const facts = document.createElement('dl');
    const add = (label, value) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = label; dd.textContent = value; facts.append(dt, dd); };
    add('Refundable bond', api.money(record.payment.attentionBond)); add('AI evaluation fee', '0 · manual review'); add('Network gas', 'Paid separately · not refunded');
    if (record.chain?.expiresAt) add('Response deadline', new Date(record.chain.expiresAt * 1000).toLocaleString());
    const terms = document.createElement('p'); terms.textContent = 'The full bond returns to the sender when the recipient accepts or declines, or when a participant claims it after the deadline. Until the lock is confirmed, this introduction is not delivered.';
    const proof = document.createElement('div'); proof.className = 'v4-chain-proof';
    const transaction = (label, hash) => {
      if (!hash) return; const line = document.createElement('p'); line.textContent = label + ': ';
      const code = document.createElement(api.chain.explorerUrl ? 'a' : 'code'); code.textContent = hash;
      if (api.chain.explorerUrl) { code.href = api.chain.explorerUrl.replace(/\/$/, '') + '/tx/' + hash; code.target = '_blank'; code.rel = 'noopener noreferrer'; }
      line.append(code); proof.append(line);
    };
    transaction('Lock transaction', record.chain?.lockTransactionHash); transaction('Refund transaction', record.chain?.refund?.transactionHash);
    if (record.chain?.confirmedBlock) add('Lock confirmed in block', record.chain.confirmedBlock);
    if (record.chain?.refund) add('Confirmed refund', api.money(record.chain.refund.amount));
    const message = document.createElement('p'); message.setAttribute('role', 'status'); message.id = 'chain-feedback';
    const actions = document.createElement('div'); actions.className = 'v4-chain-actions';
    panel.append(eyebrow, title, facts, terms, proof, actions, message); document.getElementById('receipt-body').prepend(panel);
    const button = (label, action) => { const el = document.createElement('button'); el.type = 'button'; el.className = 'button primary'; el.textContent = label; el.onclick = async () => { el.disabled = true; try { await action(); } catch (error) { message.textContent = error.code === 4001 ? 'Wallet request cancelled. Nothing new was approved.' : error.message; } finally { el.disabled = el.dataset.submitted === 'true'; } }; actions.append(el); return el; };
    if (record.payment.status === 'awaiting_wallet' && record.role === 'sender') {
      let quote;
      const fund = button('Reviewing quote…', async () => {
        if (api.walletBusy || !quote) return;
        api.walletBusy = true;
        try {
          message.textContent = 'Confirm the bond and network gas in your wallet.';
          const hash = await api.walletTransaction(quote.transaction);
          fund.dataset.submitted = 'true';
          fund.disabled = true; message.textContent = 'Transaction submitted. Waiting for chain confirmation…';
          transaction('Submitted transaction', hash);
          await api.request('/introductions/' + record.id + '/funding', { transactionHash: hash });
          await api.waitWalletReceipt(hash);
          await api.request('/introductions/' + record.id + '/funding', { transactionHash: hash });
          location.reload();
        } finally { api.walletBusy = false; }
      });
      fund.id = 'fund-introduction'; fund.disabled = true;
      try {
        quote = await api.request('/introductions/' + record.id + '/funding-quote', {});
        add('Response window', quote.summary.timeoutSeconds < 3600 ? quote.summary.timeoutSeconds + ' seconds after lock' : Math.round(quote.summary.timeoutSeconds / 3600) + ' hours after lock');
        add('Quote valid until', new Date(quote.summary.expiresAt * 1000).toLocaleTimeString());
        record.revision = (await api.request('/introductions/' + record.id)).introduction.revision;
        fund.textContent = 'Lock ' + api.money(quote.summary.attentionBond) + ' in wallet'; fund.disabled = false;
      } catch (error) { fund.textContent = 'Wallet bond unavailable'; message.textContent = error.message; }
    }
    if (record.payment.status === 'pending') message.textContent = 'Your transaction was submitted. This page checks for confirmation automatically. Please do not send another payment.';
    if (record.payment.status === 'locked') {
      const expire = button('Claim expired bond', async () => { message.textContent = 'Confirm the refund claim in your wallet.'; await api.settle(record, 'expired'); location.reload(); });
      expire.id = 'claim-bond';
      const update = () => { expire.disabled = Date.now() < record.chain.expiresAt * 1000 || Boolean(api.walletBusy); };
      update(); const timer = setInterval(update, 1000); window.addEventListener('pagehide', () => clearInterval(timer));
    }
  };
  const mount = async () => {
    await api.ready;
    if (api.demo || api.error || !api.chain?.enabled || !api.me || document.body.dataset.page !== 'agent') return;
    const panel = document.createElement('section'); panel.className = 'v4-chain-card v4-chain-settings';
    panel.innerHTML = '<p class="v4-chain-eyebrow"></p><h2>Make your inbox bond-ready.</h2><p>Save your profile first, then sync its approved hash and introduction policy. Each update requires your wallet. Your profile text stays offchain.</p><p id="profile-chain-status" role="status">Checking your profile…</p><div class="v4-chain-actions"><button class="button primary" id="sync-chain-profile" type="button">Review profile sync</button></div>';
    panel.querySelector('.v4-chain-eyebrow').textContent = api.chain.name;
    document.querySelector('.agent-workspace').append(panel);
    const status = panel.querySelector('#profile-chain-status'), sync = panel.querySelector('#sync-chain-profile');
    const refresh = async () => { try { const state = await api.request('/chain/profile'); status.textContent = state.synced ? 'Profile and policy confirmed on chain. Your inbox can receive bonded introductions.' : state.reason === 'publish_before_registering' ? 'Set your approved profile to public or limited before registering.' : 'Your approved profile needs ' + state.transactions.length + ' wallet transaction(s).'; sync.disabled = state.synced || state.reason === 'publish_before_registering'; } catch (error) { status.textContent = error.message; } };
    sync.onclick = async () => {
      if (api.walletBusy) return; sync.disabled = true;
      try {
        const plan = await api.request('/chain/profile/prepare', {});
        if (!plan.transactions.length) { await refresh(); return; }
        const dialog = api.accountDialog(); dialog.replaceChildren();
        const h = document.createElement('h2'); h.textContent = 'Confirm your profile sync';
        const p = document.createElement('p'); p.textContent = plan.transactions.map(tx => tx.label).join(' → ') + '. No AI fee. Each transaction costs network gas.';
        const actions = document.createElement('div'); actions.className = 'dialog-actions';
        const cancel = document.createElement('button'); cancel.className = 'button outline'; cancel.textContent = 'Cancel'; cancel.onclick = () => dialog.close();
        const confirm = document.createElement('button'); confirm.className = 'button primary'; confirm.textContent = 'Continue in wallet'; confirm.id = 'confirm-profile-sync';
        confirm.onclick = async () => { confirm.disabled = true; api.walletBusy = true; try { for (const tx of (await api.request('/chain/profile/prepare', {})).transactions) { p.textContent = tx.label + ' — confirm in your wallet.'; await api.waitWalletReceipt(await api.walletTransaction(tx)); } dialog.close(); await refresh(); } catch (error) { p.textContent = error.message; confirm.disabled = false; } finally { api.walletBusy = false; } };
        actions.append(cancel, confirm); dialog.append(h, p, actions); dialog.showModal();
      } catch (error) { status.textContent = error.message; } finally { sync.disabled = false; }
    };
    if (api.chain.local) {
      const faucet = document.createElement('button'); faucet.type = 'button'; faucet.className = 'button outline'; faucet.id = 'local-test-balance'; faucet.textContent = 'Add local test balance';
      faucet.onclick = async () => { faucet.disabled = true; try { await api.request('/chain/faucet', {}); status.textContent = 'Your local wallet has at least 1 DEV for testing. DEV has no monetary value.'; } catch (error) { status.textContent = error.message; } finally { faucet.disabled = false; } };
      panel.querySelector('.v4-chain-actions').append(faucet);
    }
    await refresh();
  };
  void mount();
})();
