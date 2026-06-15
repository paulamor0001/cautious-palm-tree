// js/app.js
import { loadState, saveState } from './state.js';
import { setMuted } from './audio.js';
import * as home from './views/home.js';
import * as dig from './views/dig.js';
import * as museum from './views/museum.js';
import * as sanctuary from './views/sanctuary.js';

const views = { home, dig, museum, sanctuary };

const appEl = document.getElementById('app');
const tabbarEl = document.getElementById('tabbar');

const ctx = {
  state: loadState(new Date()),
  species: null,
  save() { saveState(this.state); },
  navigate(tab) { switchTo(tab); },
};

setMuted(ctx.state.muted);
ctx.save(); // persist any tick that happened on load

// Preload species data so every view's mount is synchronous and unmount-safe.
ctx.species = await fetch('./data/species.json').then(r => r.json());

let currentUnmount = null;

function switchTo(tab) {
  if (!views[tab]) return;
  if (typeof currentUnmount === 'function') currentUnmount();
  currentUnmount = null;
  for (const btn of tabbarEl.querySelectorAll('button')) {
    if (btn.dataset.tab === tab) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  }
  appEl.innerHTML = '';
  const result = views[tab].mount(appEl, ctx);
  if (typeof result === 'function') currentUnmount = result;
}

tabbarEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tab]');
  if (btn) switchTo(btn.dataset.tab);
});

tabbarEl.hidden = false;
switchTo('home');

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(err => {
      console.warn('SW registration failed', err);
    });
  });
}
