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
  save() { saveState(this.state); },
  navigate(tab) { switchTo(tab); },
};

setMuted(ctx.state.muted);
ctx.save(); // persist any tick that happened on load

function switchTo(tab) {
  if (!views[tab]) return;
  for (const btn of tabbarEl.querySelectorAll('button')) {
    if (btn.dataset.tab === tab) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  }
  appEl.innerHTML = '';
  views[tab].mount(appEl, ctx);
}

tabbarEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tab]');
  if (btn) switchTo(btn.dataset.tab);
});

tabbarEl.hidden = false;
switchTo('home');
