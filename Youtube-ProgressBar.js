// ==UserScript==
// @name         Youtube ProgressBar
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  try to take over the world!
// @author       You
// @match        https://www.youtube.com/*
// @exclude      https://music.youtube.com/*
// @exclude      https://studio.youtube.com/*
// @grant        none
// @icon         https://www.google.com/s2/favicons?domain=youtube.com
// @run-at       document-body
// @noframes
// ==/UserScript==

/** https://gist.github.com/vogler/f0bba0a52a6fed61afab19245e72b5d4 */

(function() {
  'use strict';

  // ==========================================================
  // 変数宣言
  const waitTime = 500;
  const alsoInFullscreen = true;
  const isDebugMode = true;
  const player = 'div#movie_player.html5-video-player';
  const regWatch = '/watch|/live';
  // 可変数
  let moYt;
  // ==========================================================
  // 静的style適用エリア
  const elemStyle = document.createElement('style');
  elemStyle.id = 'ytStylusProgress';
  document.head.insertAdjacentElement('beforeend', elemStyle);

  elemStyle.textContent += 'div.ytp-gradient-bottom { background-image: none !important; } ';
  elemStyle.textContent += 'div.html5-video-player { background-color: #000; } ';
  elemStyle.textContent += 'div.annotation.annotation-type-custom.iv-branding { display: none; } ';
  elemStyle.textContent += 'button.ytp-suggested-action-badge-content-forward { display: none; } ';
  // 常時表示
  elemStyle.textContent += '#player-container-inner, #full-bleed-container { padding-bottom: 55px !important; } #full-bleed-container div#container { height: calc(100% + 55px) !important; } #full-bleed-container div#container video { top: 0 !important; } div#movie_player.ended-mode:has(video) video { display: none !important; } ';
  elemStyle.textContent += 'div.ytp-chrome-bottom { z-index: 999; bottom: auto; top: calc(100% - 55px); opacity: 1 !important; background: #000; } ';
  // 動画要素非表示
  if (!isDebugMode) {
    // pc
    elemStyle.textContent += 'div#secondary { visibility: hidden !important; } div#related.ytd-watch-flexy { display: none !important; } ';
  }

  // .ytp-scrubber-container
  elemStyle.textContent += 'div.ytp-chrome-bottom .ytp-progress-bar[role="slider"] > * { display: none !important; } ';
  elemStyle.textContent += 'div.ytp-gradient-bottom { display: none !important; } ';
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

  // style progress bar
  const bar = document.createElement('div');
  bar.style.backgroundColor = '#FF1600'; // gray instead of red to avoid confusion with original progress bar
  bar.style.height = '4px';
  if (alsoInFullscreen) {
    bar.style.position = 'absolute';
    bar.style.top = '0px';
    bar.style.zIndex = 0;
    // TODO align with original progress bar? hard since it has some relative margins.
  }

  // 小数点以下切り捨て
  const mathFloor = (floor) => {
    return floor | 0;
  };
  const videoTime = (video) => {
    // const MS = 1;
    // const SECOND = 1000 * MS;
    // const MINUTE = 60 * SECOND;
    // const HOUR = 60 * MINUTE;
    // const DAY = 24 * HOUR;
    // const WEEK = 7 * DAY;
    // const MONTH = 30 * DAY;
    // const YEAR = 365 * DAY;

    const seconds = String(mathFloor(video.currentTime % 60));
    const minutes = String(mathFloor((video.currentTime % 3600) / 60));
    const hours = String(mathFloor(video.currentTime / 3600));
    if (video.currentTime / 60 > 60) {
      return hours + ':' + minutes.padStart(2, 0) + ':' + seconds.padStart(2, 0);
    } else {
      return minutes + ':' + seconds.padStart(2, 0);
    }
  };
  const isProgressBar = async (isFlag) => {
    // update its width on video progress
    // the surrounding MutationObserver is needed for when navigating from youtube.com to a video instead of opening it in a new tab
    // could also try https://www.tampermonkey.net/documentation.php?locale=en#api:window.onurlchange

    if (!isFlag) return false;
    const ytVideo = await waitQuerySelector('#movie_player video');
    const ytPlayer = await waitQuerySelector('#ytd-player');
    const ytChrome = await waitQuerySelector('.ytp-chrome-bottom');
    await waitQuerySelector('span.ytp-clip-watch-full-video-button');

    let isLive = document.querySelector('span.ytp-clip-watch-full-video-button').textContent.indexOf('ライブ') != -1 ? true : false;
    ytChrome.insertAdjacentElement('afterbegin', bar);

    ytVideo.addEventListener('timeupdate', async () => {
      // youtube live か判定
      isLive = document.querySelector('span.ytp-clip-watch-full-video-button').textContent.indexOf('ライブ') != -1 ? true : false;
      if (isLive) { bar.style.width = '0'; return false; }

      await waitQuerySelector('.ytp-time-current');
      // Math.round to smooth progress movement a bit; could also round to percentage for fewer/coarser visual updates
      const math = mathFloor(ytVideo.currentTime) / ytVideo.duration * 100 + '%';
      bar.style.width = math;
      const currentTime = ytPlayer.querySelector('.ytp-time-current');
      if (!currentTime) return false;
      currentTime.innerText = videoTime(ytVideo);
    });
  };

  const reWatch = async () => {
    const watch = new RegExp(regWatch, 'gis');
    const isWatch = watch.test(location.pathname);

    isProgressBar(isWatch);

    if (!isDebugMode) {
      if (!isNuN(moYt)) { moYt.disconnect(); }

      const columns = await waitQuerySelector('div#columns.ytd-watch-flexy');
      // console.log('> chat columns', columns);
      const primary = await waitQuerySelector('div#primary.ytd-watch-flexy');
      // console.log('> chat primary', primary);
      const ytVid = await waitQuerySelector(player + ' video');
      // console.log('> chat video', ytVid);
      primary.style.width = '';
      columns.style.display = 'grid';
      // 動画要素位置設定
      const num = parseInt(ytVid.style.width) + parseInt(ytVid.style.left) * 2;
      primary.style.width = num + 'px';

      if (num + 'px' !== primary.style.width) { console.log('> yt retry...'); return reWatch(); }

      const config = { 'attributes': true, 'childList': false, 'subtree': false };
      moYt = new MutationObserver(async () => {
        const columns = await waitQuerySelector('div#columns.ytd-watch-flexy');
        const primary = await waitQuerySelector('div#primary.ytd-watch-flexy');
        const ytVid = await waitQuerySelector(player + ' video');
        columns.style.display = 'grid';
        // 動画要素位置設定
        const num = parseInt(ytVid.style.width) + parseInt(ytVid.style.left) * 2;
        primary.style.width = num + 'px';
        // console.log('> yt reload... resize... moYt');
      });
      moYt.observe(document.querySelector(player), config);
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
        if (!isNuN(moYt)) { moYt.disconnect(); }

        await new Promise(resolve => setTimeout(resolve, waitTime * 10));
        reWatch();
      }
    });
    url_obs.observe(document, url_config);
  };

  // URLが変更されたとき
  changeUrl();
})();
