// ==UserScript==
// @name         Youtube PageManager
// @namespace    http://tampermonkey.net/
// @version      3.2
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
  const isDebugMode = false;
  const isChatMode = false;
  const scale = 'scale(0.8)';
  const waitTime = 500;
  const player = 'div#movie_player.html5-video-player';
  const manager = 'ytd-app, ytm-app[id="app"]';
  const itemsArray = [
    { device: 'www.youtube.com', path: '^/$', area: '[page-subtype="home"] div#primary > ytd-rich-grid-renderer > div#contents' },
    { device: 'www.youtube.com', path: '^/feed/subscriptions', area: '[page-subtype="subscriptions"] div#primary > ytd-rich-grid-renderer > div#contents' },
    { device: 'www.youtube.com', path: '^/watch|^/live', area: 'ytd-watch-flexy div#related div#items' },
    { device: 'www.youtube.com', path: '^/@.+/(videos|streams)|^/channel/.+/(videos|streams)|^/c/.+/(videos|streams)|^/user/.+/(videos|streams)|^/u/.+/(videos|streams)', area: '[page-subtype="channels"] div#primary > ytd-rich-grid-renderer > div#contents' },
    { device: 'www.youtube.com', path: '^/results', area: 'ytd-two-column-search-results-renderer > div#primary > ytd-section-list-renderer > div#contents' },
    { device: 'm.youtube.com', path: '^/$', area: 'div.tab-content[tab-identifier="FEwhat_to_watch"] div.rich-grid-renderer-contents' },
    { device: 'm.youtube.com', path: '^/feed/subscriptions', area: 'div.tab-content[tab-identifier="FEsubscriptions"] lazy-list' },
    { device: 'm.youtube.com', path: '^/watch|^/live', area: 'div.related-items-container lazy-list' },
    { device: 'm.youtube.com', path: '^/@.+/(videos|streams)|^/channel/.+/(videos|streams)|^/c/.+/(videos|streams)|^/user/.+/(videos|streams)|^/u/.+/(videos|streams)', area: 'ytm-tab-renderer div.rich-grid-renderer-contents' },
    { device: 'm.youtube.com', path: '^/results', area: 'ytm-search > ytm-section-list-renderer > lazy-list' },
  ];
  const regWatch = '^/watch|^/live';
  const regSearch = '^/results';
  const regChannel = '^/@.+|^/channel/|^/c/|^/user/|^/u/';
  const abc = JSON.parse(window.sessionStorage.getItem('ABC')) || null;
  // 可変数
  let userName = window.sessionStorage.getItem('channel') || '';
  let moScal, moYt;
  // ==========================================================
  // 静的style適用エリア
  const elemStyle = document.createElement('style');
  elemStyle.id = 'ytStylusManager';
  document.head.insertAdjacentElement('beforeend', elemStyle);

  // 可変style適用エリア
  const elemDom = document.createElement('style');
  elemDom.id = 'ytStylusManagerDom';
  document.head.insertAdjacentElement('beforeend', elemDom);

  // 可変style適用エリア
  const elemMov = document.createElement('style');
  elemMov.id = 'ytStylusManagerMovie';
  document.head.insertAdjacentElement('beforeend', elemMov);

  elemStyle.textContent += ' .remove_item { display: none !important; } ';
  // [ショート]動画 削除
  elemStyle.textContent += 'ytd-rich-shelf-renderer:has([href*="/shorts/"]), grid-shelf-view-model { display: none !important; } ';
  // [ショート]タブ 削除
  elemStyle.textContent += 'ytd-guide-section-renderer > div#items.ytd-guide-section-renderer > ytd-guide-entry-renderer > a#endpoint[title="ショート"], ytd-mini-guide-renderer > div#items.ytd-mini-guide-renderer > ytd-mini-guide-entry-renderer > a#endpoint[title="ショート"], ytm-pivot-bar-renderer[role="tablist"] > ytm-pivot-bar-item-renderer:has(div.pivot-shorts[role="tab"]) { display: none !important; } ';
  // バナー削除
  elemStyle.textContent += 'ytd-rich-section-renderer:has([class*="banner-renderer"]) { display: none !important; } ';
  // サイドバー 削除
  elemStyle.textContent += 'ytd-guide-renderer > div#sections > *:nth-child(n+2) { display: none !important; } ';
  elemStyle.textContent += 'ytd-guide-renderer > div#footer { display: none !important; } ';
  // 任意チャンネルエリア 削除
  elemStyle.textContent += 'div[role="tablist"] > yt-tab-shape[tab-title="ホーム"], div[role="tablist"] > yt-tab-shape[tab-title="ショート"], div.yt-tab-group-shape-wiz__slider, div.tabGroupShapeSlider { display: none !important; } ';
  // 動画再生後の動画一覧非表示
  elemStyle.textContent += 'div[class="html5-endscreen ytp-player-content videowall-endscreen"], div[class*="ytp-ce-element"], div[class="ytp-endscreen-content"] { display: none !important; } ';
  // 動画表示切り替えボタン削除
  elemStyle.textContent += 'button.ytp-size-button { display: none !important; } ';
  // チャンネル動画、チャンネル削除 (pc)
  elemStyle.textContent += 'ytd-shelf-renderer:has(ytd-vertical-list-renderer), ytd-search ytd-channel-renderer { display: none !important; } ';
  // プレビュー動画、チャンネル削除 (mobile)
  elemStyle.textContent += 'ytm-video-preview, ytm-search ytm-compact-channel-renderer { display: none !important; } ';
  // コメント
  elemStyle.textContent += 'ytm-watch div.ytVideoMetadataCarouselViewModelCarouselContainer:has(yt-carousel-item-view-model[aria-label="コメント"i]) { display: none !important; } ';

  // ホーム
  elemStyle.textContent += '[page-subtype="home"] div[id="contents"] > ytd-rich-section-renderer:has(ytd-rich-shelf-renderer) { display: none; } ';
  elemStyle.textContent += 'div[tab-title="ホーム"] ytm-rich-grid-renderer > div > ytm-rich-section-renderer { display: none; } ';
  // 広告系
  elemStyle.textContent += '[page-subtype="home"] div[id="primary"] > ytd-rich-grid-renderer ytd-statement-banner-renderer { display: none; } ';
  elemStyle.textContent += '[page-subtype="home"] div[id="primary"] div[id="masthead-ad"]:has(ytd-ad-slot-renderer) { display: none; } ';
  elemStyle.textContent += '[page-subtype="home"] div[id="contents"] > ytd-rich-item-renderer:has(ytd-ad-slot-renderer) { display: none; } ';
  elemStyle.textContent += 'div[tab-title="ホーム"] ytm-rich-grid-renderer > div > ytm-statement-banner-renderer { display: none; } ';
  elemStyle.textContent += 'div[tab-title="ホーム"] ytm-rich-grid-renderer > div > ytm-rich-item-renderer.is-in-first-col:has(ad-slot-renderer) { display: none; } ';

  if (!isChatMode) { elemStyle.textContent += 'div#chat-container { display: none !important; } '; }
  // 動画要素非表示
  if (!isDebugMode) {
    // pc
    elemStyle.textContent += 'div#secondary { visibility: hidden !important; } div#related.ytd-watch-flexy { display: none !important; } ';
    // mobile
    //elemStyle.textContent += 'ytm-watch div.related-items-container { display: none; } ';
  }

  // [ショート]動画 削除
  elemStyle.textContent += '.target:has(a[href*="/shorts"]) { display: none; } ';
  // [Mix & playlist] [他(headline)]動画 削除
  elemStyle.textContent += '.target:has(a[href*="&list="], #rich-shelf-header-container, .rich-shelf-header, chips-shelf-with-video-shelf-renderer, ytd-brand-video-singleton-renderer) { display: none; } ';
  // 初期表示
  elemStyle.textContent += '.target:not(.show) { display: none !important; visibility: hidden !important; } ';
  elemStyle.textContent += '.target.minScale:not(:has(div[class*="subheader"])) > * { display: block; transform: ' + scale + ' !important; pointer-events: none !important; } ';

  // Modal画面
  const modal = document.createElement('div');
  modal.id = 'ytLoader';
  const loader = document.createElement('div');
  modal.appendChild(loader);
  document.body.insertAdjacentElement('beforeend', modal);
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

  const channelManager = async (name) => {
    // youtube Area Manager
    // console.log(pathChannelEtc.length);
    window.sessionStorage.setItem('channel', name);
    const pathChannelEtc = location.pathname.split(/@|\/channel\/|\/c\/|\/user\/|\/u\//)[1].split('/');

    if (1 === pathChannelEtc.length) {
      if (!isNuN(document.querySelector('div[role="tablist"] > yt-tab-shape[tab-title="ホーム"]'))) { document.querySelector('div[role="tablist"] > yt-tab-shape[tab-title="ホーム"]').ariaSelected = false; }

      await waitQuerySelector('div[role="tablist"] > yt-tab-shape[role="tab"][tab-title="ライブ"], div[role="tablist"] > yt-tab-shape[role="tab"][tab-title="動画"]');
      if (!isNuN(document.querySelector('div[role="tablist"] > yt-tab-shape[role="tab"][tab-title="ライブ"]'))) {
        // document.querySelector('div[role="tablist"] > yt-tab-shape[role="tab"][tab-title="ライブ"]').click();
        location.replace(location.pathname + '/streams');
      } else if (!isNuN(document.querySelector('div[role="tablist"] > yt-tab-shape[role="tab"][tab-title="動画"]'))) {
        // document.querySelector('div[role="tablist"] > yt-tab-shape[role="tab"][tab-title="動画"]').click();
        location.replace(location.pathname + '/videos');
      } else {
        location.replace(location.pathname.replace(/\/streams|\/videos/, '/'));
      }
    }
  };
  const ytChatArea = async () => {
    if ('www.youtube.com' !== location.hostname) { return false; }
    const watcher = new RegExp(regWatch, 'gis');
    if (!watcher.test(location.pathname)) { return false; }
    console.log('> chat area create...');
    const chat = await waitQuerySelectorCount(5, 'div#chat-container');

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

      if (num + 'px' !== primary.style.width) { console.log('> chat size get retry...'); return ytChatArea(); }

      const config = { 'attributes': true, 'childList': false, 'subtree': false };
      moYt = new MutationObserver(async () => {
        const columns = await waitQuerySelector('div#columns.ytd-watch-flexy');
        const primary = await waitQuerySelector('div#primary.ytd-watch-flexy');
        const ytVid = await waitQuerySelector(player + ' video');
        columns.style.display = 'grid';
        // 動画要素位置設定
        const num = parseInt(ytVid.style.width) + parseInt(ytVid.style.left) * 2;
        primary.style.width = num + 'px';
        // console.log('> chat reload... resize... moYt');
      });
      moYt.observe(document.querySelector(player), config);
    }
    if (!isNuN(chat)) { chat.remove(); }
  };
  const removeMovieInformation = async (item) => {
    const mode = {'pc': {}, 'mobile': {}};
    // pc
    mode.pc.ytTitle = isNuN(item.querySelector('div#meta a #video-title, yt-lockup-view-model a span[role="text"]')) ? '' : item.querySelector('div#meta a #video-title, yt-lockup-view-model a span[role="text"]').textContent;
    mode.pc.userNam = isNuN(item.querySelector('div#meta #channel-name a, yt-lockup-view-model span > a')) ? '' : item.querySelector('div#meta #channel-name a, yt-lockup-view-model span > a').textContent;
    mode.pc.channel = isNuN(item.querySelector('div#meta #channel-name a[href], yt-lockup-view-model span > a[href]')) ? '' : item.querySelector('div#meta #channel-name a[href], yt-lockup-view-model span > a[href]').href;
    // mobile
    mode.mobile.ytTitle = isNuN(item.querySelector('ytm-media-item div.media-item-info .media-item-headline > span[role="text"]')) ? '' : item.querySelector('ytm-media-item div.media-item-info .media-item-headline > span[role="text"]').textContent;
    mode.mobile.userNam = isNuN(item.querySelector('ytm-media-item div.media-item-info ytm-badge-and-byline-renderer > span > span')) ? '' : item.querySelector('ytm-media-item div.media-item-info ytm-badge-and-byline-renderer > span > span').textContent;
    mode.mobile.channel = isNuN(item.querySelector('ytm-media-item div.media-channel a[href]')) ? '' : item.querySelector('ytm-media-item div.media-channel a[href]').href;

    const watcher = new RegExp(regWatch, 'gis');
    const isMobile = 'm.youtube.com' === location.hostname ? true : false;

    const device = 'www.youtube.com' !== location.hostname ? mode.mobile : mode.pc;
    const strData = device;

    const youtubeItem = {};
    youtubeItem.ytTitle = strData.ytTitle;
    youtubeItem.userNam = strData.userNam;
    youtubeItem.channel = strData.channel.split('/@')[1];

    if (isMobile) {
      if (watcher.test(location.pathname)) {
        const user = await waitQuerySelector('ytm-slim-owner-renderer a[href]');
        const userCh = user.href.split('/@')[1];
        console.log(userCh, youtubeItem.channel);
        if (userCh !== youtubeItem.channel) { item.classList.add('remove_item'); }
      }
    }

    if (isNuN(youtubeItem.ytTitle)) { return false; }
    if (isNuN(youtubeItem.userNam)) { return false; }
    if (isNuN(youtubeItem.channel)) { return false; }
    const words = isNuN(abc) ? [] : abc.hideword;
    const excludes = isNuN(abc) ? [] : abc.execludeWords;

    for (const word of words) {
      const regw = new RegExp(word, 'gis');
      if (regw.test(youtubeItem.ytTitle) || regw.test(youtubeItem.userNam) || regw.test(youtubeItem.channel)) {
        item.classList.add('remove_item');
        youtubeItem.word = word;
        console.log('> hide all words : ', youtubeItem);
        break;
      }
    }
    for (const word of excludes) {
      const regw = new RegExp(word, 'gis');
      if (regw.test(youtubeItem.ytTitle) || regw.test(youtubeItem.userNam) || regw.test(youtubeItem.channel)) {
        item.classList.remove('remove_item');
        // console.log('> un hide words : ', youtubeItem);
        break;
      }
    }
  };
  const scaleShowMovie = async (area, item) => {
    if (!item.classList.contains('target')) {
      item.classList.add('target');
      // console.log('test2 1件ずつ', item);
      await removeMovieInformation(item);

      item.classList.add('show');
      item.classList.add('minScale');

      document.addEventListener('click', async (e) => {
        const ytArea = await waitQuerySelector(area);
        if (e.target.classList.contains('target')) {

          const device = 'www.youtube.com' === location.hostname || 'm.youtube.com' === location.hostname ? true : false;
          const searcher = new RegExp(regSearch, 'gis');
          if (device && searcher.test(location.pathname)) {
            for (const result of ytArea.querySelectorAll('ytd-item-section-renderer > div#contents, ytm-item-section-renderer > lazy-list')) {
              for (const ytItem of result.children) {
                ytItem.classList.add('minScale');
              }
            }
          }

          for (const ytItem of ytArea.children) {
            ytItem.classList.add('minScale');
          }
          e.target.classList.remove('minScale');
        }
      });
    }
  };
  const initial = async (area) => {
    if (!isNuN(moScal)) { moScal.disconnect(); }

    let ytArea = await waitQuerySelector(area);

    const watcher = new RegExp(regWatch, 'gis');
    const searcher = new RegExp(regSearch, 'gis');
    const device = 'www.youtube.com' === location.hostname || 'm.youtube.com' === location.hostname ? true : false;
    if (device && searcher.test(location.pathname)) {
      console.log('> ytMovie search result');

      for (const result of ytArea.querySelectorAll('ytd-item-section-renderer > div#contents, ytm-item-section-renderer > lazy-list')) {
        for (const ytItem of result.children) {
          ytItem.classList.remove('target');
          ytItem.classList.remove('show');

          scaleShowMovie(area, ytItem);
        }
      }

      const config = { 'attributes': false, 'childList': true, 'subtree': true };
      moScal = new MutationObserver(async () => {
        ytArea = await waitQuerySelector(area);
        for (const result of ytArea.querySelectorAll('ytd-item-section-renderer > div#contents, ytm-item-section-renderer > lazy-list')) {
          for (const ytItem of result.children) {
            scaleShowMovie(area, ytItem);
          }
        }
      });
      moScal.observe(ytArea, config);
    } else {
      console.log('> ytMovie checker...');
      if (watcher.test(location.pathname)) {
        ytChatArea();
      }
      for (const ytItem of ytArea.children) {
        ytItem.classList.remove('target');
        ytItem.classList.remove('show');

        scaleShowMovie(area, ytItem);
      }

      const config = { 'attributes': false, 'childList': true, 'subtree': true };
      moScal = new MutationObserver(async () => {
        ytArea = await waitQuerySelector(area);
        for (const ytItem of ytArea.children) {
          scaleShowMovie(area, ytItem);
        }
      });
      moScal.observe(ytArea, config);
    }
  };
  const changeUrl = async () => {
    let href;

    const url_config = { 'attributes': false, 'childList': true, 'subtree': true };
    const url_obs = new MutationObserver(async () => {
      // const href_path = location.pathname;
      const href_path = location.pathname + '/' + location.search;
      if (href !== href_path) {
        // console.log('Before:', href);
        // console.log('After:', location.href);
        href = href_path;
        // 動画エリア初期非表示
        for (const yt of itemsArray) {
          elemMov.textContent += yt.area + ' { display: none; } ';
        }

        // 動画URLから「t=」パラメータを排除
        const pathTime = new RegExp('&t=.+', 'gis');
        if (pathTime.test(location.href)) {
          const replaceURL = deleteParam(location.href, 't').href;
          location.replace(replaceURL);
        }

        // watch
        const watcher = new RegExp(regWatch, 'gis');
        if (!watcher.test(location.pathname)) {
          // Modal Loading... style 初期化
          elemDom.textContent = '';
          elemDom.textContent += 'body { overflow-y: hidden !important; } ';
          elemDom.textContent += '#ytLoader { position: fixed !important; z-index: 9999 !important; width: 100%; height: 100%; bottom: 0px; right: 0px; overflow: hidden; color: white; background-color: #000; display: block; } ';
          elemDom.textContent += '#ytLoader > div { display: block; position: absolute; top: 50%; left: 50%; width: 50px; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(farthest-side, #ffa516 94%, #0000) top / 8px 8px no-repeat, conic-gradient(#0000 30%, #ffa516); -webkit-mask: radial-gradient(farthest-side, #0000 calc(100% - 8px), #000 0); animation: l13 1s infinite linear; } @keyframes l13{ 100% { transform: rotate(1turn) } } ';
        }

        // youtube Area Manager
        await waitQuerySelector(manager);
        if (!isNuN(moScal)) { moScal.disconnect(); }
        if (!isNuN(moYt)) { moYt.disconnect(); }

        // channel replace
        const channel = new RegExp(regChannel, 'gis');
        if (channel.test(location.pathname)) {
          const pathChannel = location.pathname.split(/@|\/channel\/|\/c\/|\/user\/|\/u\//)[1].split('/')[0];
          if (userName !== pathChannel) {
            userName = pathChannel;
            console.log('> youtube channel name...', userName);
            channelManager(userName);
          }
        } else {
          // チャンネルではなくなったら、ユーザー開放
          userName = '';
        }

        // movie contents
        const ytArray = itemsArray.filter((yt) => location.hostname === yt.device);
        for await (const yt of ytArray) {
          const path = new RegExp(yt.path, 'gis');
          // console.log(path, location.pathname);
          if (path.test(location.pathname)) {
            console.log('> youtube get ...', path, yt.area);
            await initial(yt.area);
          }
        }
        await new Promise(resolve => setTimeout(resolve, waitTime * 10));

        // style 無効化
        elemDom.textContent = '';
        elemMov.textContent = '';
      }
    });
    url_obs.observe(document, url_config);
  };

  // URLが変更されたとき
  changeUrl();
})();
