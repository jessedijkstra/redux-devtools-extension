import { onMessage, sendToBg, sendToTab } from 'crossmessaging';
let options;

const save = (key, value) => {
  let obj = {};
  obj[key] = value;
  chrome.storage.sync.set(obj);
  options[key] = value;
  if (window.store.id) sendToTab(window.store.id, { options: options });
};

const get = callback => {
  if (options) callback(options);
  else {
    chrome.storage.sync.get({
      leftMonitor: 'LogMonitor',
      rightMonitor: 'LogMonitor',
      bottomMonitor: 'SliderMonitor',
      limit: 50,
      filter: false,
      whitelist: '',
      blacklist: '',
      serialize: true,
      notifyErrors: true,
      inject: true,
      urls: '^https?://localhost|0\\.0\\.0\\.0:\\d+\n^https?://.+\\.github\\.io'
    }, function(items) {
      options = items;
      callback(items);
    });
  }
};

const toReg = str => (
  str !== '' ? str.split('\n').join('|') : null
);

const injectOptions = newOptions => {
  if (!newOptions) return;
  if (newOptions.filter) {
    newOptions.whitelist = toReg(newOptions.whitelist);
    newOptions.blacklist = toReg(newOptions.blacklist);
  }

  options = newOptions;
  let s = document.createElement('script');
  s.type = 'text/javascript';
  s.appendChild(document.createTextNode('window.devToolsOptions=' + JSON.stringify(options)));
  s.onload = function() {
    this.parentNode.removeChild(this);
  };
  (document.head || document.documentElement).appendChild(s);
};

export const getOptionsFromBg = () => {
  sendToBg({ type: 'GET_OPTIONS' }, response => {
    injectOptions(response.options);
  });
  onMessage(message => { injectOptions(message.options); });
};

export const isAllowed = (localOptions = options) => (
  !localOptions || localOptions.inject || !localOptions.urls
    || location.href.match(toReg(localOptions.urls))
);

export default {
  save: save,
  get: get
};
