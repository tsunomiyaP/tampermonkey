// ==UserScript==
// @name         Youtube QualityFix
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  try to take over the world!
// @author       You
// @match        https://*.youtube.com/*
// @exclude      https://music.youtube.com/*
// @exclude      https://studio.youtube.com/*
// @grant        none
// @icon         https://www.google.com/s2/favicons?domain=youtube.com
// @run-at       document-body
// @noframes
// ==/UserScript==

(function() {
  'use strict';

  // ==========================================================
  // 変数宣言
  const player = 'div#movie_player.html5-video-player';
  // youtube 画質 [0 : 1080, 1 : 720, 2 : 480, 3 : 360, 4 : 240, 5 : 144, 6 : auto]
  const qualitys = ['hd1080', 'hd720', 'large', 'medium', 'small', 'tiny', 'auto'];
  const target = 2;
  const itemsArray = [
    { device: 'www.youtube.com', path: '/watch|/live' },
    { device: 'm.youtube.com', path: '/watch|/live' },
  ];
  // 可変数
  // ==========================================================

  // eslint-disable-next-line no-unused-vars
  const isNuN = (selector) => {
    if (selector === null || selector === undefined || selector === '') { return true; } else { return false; }
  };
  // eslint-disable-next-line no-unused-vars
  const waitQuerySelector = async (selector, node = document) => {
    let obj = null;
    while (!obj) {
      await new Promise(resolve => setTimeout(resolve, 100));
      obj = node.querySelector(selector);
    }
    return obj;
  };
  // eslint-disable-next-line no-unused-vars
  const waitQuerySelectorCount = async (cnt, selector, node = document) => {
    await new Promise(resolve => setTimeout(resolve, 1000 * cnt));
    return node.querySelector(selector);
  };
  // eslint-disable-next-line no-unused-vars
  const waitQuerySelectorIframe = async (selector1, selector2, node = document) => {
    let obj = null;
    while (!obj) {
      // iframe.contentWindow.document === iframe.contentDocument
      await new Promise(resolve => setTimeout(resolve, 500));
      obj = node.querySelector(selector1).contentDocument.querySelector(selector2);
    }
    return obj;
  };
  // eslint-disable-next-line no-unused-vars
  const deleteParam = (searchUrl, param) => {
    const base = new URL(location.protocol + '//' + location.hostname);
    const url = new URL(searchUrl, base);
    // URLSearchParamsオブジェクトを取得
    const params = url.searchParams;
    params.delete(param);

    return url;
  };
  // eslint-disable-next-line no-unused-vars
  const searchParams = (searchUrl, param) => {
    const base = new URL(location.protocol + '//' + location.hostname);
    const url = new URL(searchUrl, base);
    console.log('url section', url);
    // URLSearchParamsオブジェクトを取得
    const params = url.searchParams;

    return params.get(param);
  };
  // eslint-disable-next-line no-unused-vars
  const getParam = (name, url) => {
    if (!url) url = window.location.href;
    name = name.replace(/[\\[\]]/g, '\\$&');
    let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    let results = regex.exec(url);

    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  };
  // eslint-disable-next-line no-unused-vars
  const userAgent = () => {
    const userDevice = navigator.userAgent;
    if (userDevice.indexOf('iPhone') > 0 || userDevice.indexOf('iPod') > 0 || userDevice.indexOf('Android') > 0 && userDevice.indexOf('Mobile') > 0) {
      return false;
    } else if (userDevice.indexOf('iPad') > 0 || userDevice.indexOf('Android') > 0) {
      return false;
    } else {
      // pc
      return true;
    }
  };

  const qualityFix = async () => {
    let q = qualitys[target];

    // 初期処理
    await waitQuerySelector(player);
    const ytPlayer = document.querySelector(player);
    await waitQuerySelector('div.ytp-left-controls, player-bottom-controls');

    if (typeof ytPlayer.getAvailableQualityLevels() === 'undefined') { return qualityFix(); }
    if (ytPlayer.getPlaybackQuality().toLowerCase() === 'unknown') { return qualityFix(); }
    console.log('> youtube quality list : ', ytPlayer.getAvailableQualityLevels());
    if (!ytPlayer.getAvailableQualityLevels().includes(q)) {
      q = qualitys[target + 1];
    }
    console.log('> youtube quality : ' + q);
    ytPlayer.setPlaybackQualityRange(q);
    ytPlayer.setPlaybackQuality(q);

    // ライブ配信か否か pc, mobile
    // const badge = await waitQuerySelectorCount(1, 'button.ytp-live-badge-is-livehead, span.ytwPlayerTimeDisplayTime');
    const stats = ytPlayer.getVideoStats() || {};
    console.log('> youtube Live status : ' + stats.live);
    if (stats.live === 'live' || stats.live === 'dvr' || stats.live === 'lp') {
      // 最低画質
      q = qualitys[qualitys.length - 2];
      console.log('> youtube Live... change : ' + q);
      ytPlayer.setPlaybackQualityRange(q);
      ytPlayer.setPlaybackQuality(q);
    } else {
      console.log('> youtube not Live... movie watch : ' + q);
    }
  };
  const initial = async (ytArray) => {
    for await (const yt of ytArray) {
      const path = new RegExp(yt.path, 'gis');
      const isPath = path.test(location.pathname);

      if (isPath) {
        qualityFix();
      }
    }
  };
  const changeUrl = async () => {
    let href;

    const url_config = { 'attributes': false, 'childList': true, 'subtree': true };
    const url_obs = new MutationObserver(async () => {
      if (href != location.pathname + location.search) {
        // console.log('Before:', href);
        // console.log('After:', location.href);
        href = location.pathname + location.search;

        const ytArray = itemsArray.filter((yt) => location.hostname === yt.device);

        initial(ytArray);
      }
    });
    url_obs.observe(document, url_config);
  };

  // URLが変更されたとき
  changeUrl();
})();
