/* =========================================================
 * ads.js — مركز حقن الإعلانات لمنصة Madame Aya
 * يحقن: Popunder + Social Bar (مرة واحدة فقط لكل صفحة)
 * + كل أنواع البانرات (728x90, 468x60, 300x250, 160x600, 160x300, 320x50)
 * + Native Banner
 * الاستخدام:
 *   <div data-ad="728x90"></div>        ← بانر بعرض 728
 *   <div data-ad="300x250"></div>       ← بانر متوسط
 *   <div data-ad="native"></div>        ← إعلان Native
 * ثم استدعاء: AdsBoot.init();
 * ========================================================= */

window.AdsBoot = (function () {
  // مفاتيح الشبكة الإعلانية (مثبتة من العميل)
  var AD_KEYS = {
    "728x90":  "043ef9434cb6169bc9229a82834dc223",
    "468x60":  "06d472c484d7d83166f4885b8e901f04",
    "300x250": "8b2d029824c0d840cbab33c759e2f1cb",
    "160x300": "e84c12ecedaaffe05ca1347eb9ab18aa",
    "160x600": "0203749e75ce7998ff813f5713d91efa",
    "320x50":  "14920f6e9e6072a4d8e421f0d0f618fc"
  };

  var AD_SIZES = {
    "728x90":  { w: 728, h: 90 },
    "468x60":  { w: 468, h: 60 },
    "300x250": { w: 300, h: 250 },
    "160x300": { w: 160, h: 300 },
    "160x600": { w: 160, h: 600 },
    "320x50":  { w: 320, h: 50 }
  };

  var AD_SERVER = "https://bicea.org/22/";
  var POPUNDER_SRC  = "https://afders.org/1/7493d0f1fb2c7002fd880e636e199c02";
  var SOCIALBAR_SRC = "https://bicea.org/14/875d11bb05213ca61f35875666144499";
  var NATIVE_SRC    = "https://bicea.org/21/61b243a263f148ac11e0d6b7a0507e9d";
  var NATIVE_DIV_ID = "container-61b243a263f148ac11e0d6b7a0507e9d";

  var globalOnceLoaded = false;

  /* --- حقن الإعلانات الشاملة مرة واحدة (Popunder + Social Bar) --- */
  function loadGlobalOnce() {
    if (globalOnceLoaded) return;
    globalOnceLoaded = true;

    // Popunder
    var popScript = document.createElement("script");
    popScript.async = true;
    popScript.setAttribute("data-cfasync", "false");
    popScript.src = POPUNDER_SRC;
    document.body.appendChild(popScript);

    // Social Bar
    var socialScript = document.createElement("script");
    socialScript.async = true;
    socialScript.setAttribute("data-cfasync", "false");
    socialScript.src = SOCIALBAR_SRC;
    document.body.appendChild(socialScript);
  }

  /* --- بانر atOptions: نحقنه داخل iframe منعزل لتفادي تعارض المتغير atOptions --- */
  function buildBannerIframe(sizeKey) {
    var key = AD_KEYS[sizeKey];
    var size = AD_SIZES[sizeKey];
    if (!key || !size) return null;

    var inner = ''
      + '<!DOCTYPE html><html><head><meta charset="UTF-8">'
      + '<style>html,body{margin:0;padding:0;overflow:hidden;background:transparent;}'
      + '</style></head><body>'
      + '<script type="text/javascript">'
      + 'atOptions = {'
      + "  'key' : '" + key + "',"
      + "  'format' : 'iframe',"
      + "  'height' : " + size.h + ","
      + "  'width' : " + size.w + ","
      + "  'params' : {}"
      + '};'
      + '<\/script>'
      + '<script type="text/javascript" src="' + AD_SERVER + key + '"><\/script>'
      + '</body></html>';

    var wrap = document.createElement("div");
    wrap.className = "ad-slot ad-" + sizeKey;
    wrap.style.cssText =
      "display:flex;justify-content:center;align-items:center;margin:0 auto;" +
      "max-width:" + size.w + "px;width:100%;min-height:" + size.h + "px;";

    var iframe = document.createElement("iframe");
    iframe.width = size.w;
    iframe.height = size.h;
    iframe.style.cssText = "border:0;margin:0;padding:0;display:block;";
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("frameborder", "0");
    iframe.srcdoc = inner;
    wrap.appendChild(iframe);
    return wrap;
  }

  /* --- Native Banner: يحتاج div بـ id ثابت + سكربت خارجي --- */
  function buildNativeAd() {
    var wrap = document.createElement("div");
    wrap.className = "ad-slot ad-native";
    wrap.style.cssText = "width:100%;max-width:728px;margin:0 auto;";

    var innerDiv = document.createElement("div");
    innerDiv.id = NATIVE_DIV_ID;
    innerDiv.style.cssText = "width:100%;min-height:120px;";
    wrap.appendChild(innerDiv);

    var s = document.createElement("script");
    s.async = true;
    s.setAttribute("data-cfasync", "false");
    s.src = NATIVE_SRC;
    wrap.appendChild(s);
    return wrap;
  }

  /* --- إعلان متجاوب ذكي: 728x90 على الديسكتوب، 320x50 على الموبايل --- */
  function buildResponsiveTop() {
    var wrap = document.createElement("div");
    wrap.className = "ad-slot ad-responsive-top";
    wrap.style.cssText = "width:100%;display:flex;justify-content:center;align-items:center;padding:8px 4px;";
    var w = window.innerWidth || document.documentElement.clientWidth || 768;
    if (w >= 700) wrap.appendChild(buildBannerIframe("728x90"));
    else wrap.appendChild(buildBannerIframe("320x50"));
    return wrap;
  }

  /* --- يقوم بتمرير كل العناصر data-ad="..." وحقنها --- */
  function injectAllPlaceholders(root) {
    var nodes = (root || document).querySelectorAll("[data-ad]");
    nodes.forEach(function (node) {
      var type = node.getAttribute("data-ad");
      if (!type) return;
      if (node.getAttribute("data-ad-injected") === "1") return;
      node.setAttribute("data-ad-injected", "1");

      var el;
      if (type === "responsive-top") el = buildResponsiveTop();
      else if (type === "native")    el = buildNativeAd();
      else if (AD_SIZES[type])       el = buildBannerIframe(type);
      else return;

      if (el) node.appendChild(el);
    });
  }

  function init() {
    loadGlobalOnce();
    injectAllPlaceholders(document);
    // إعادة الحقن بعد تحميل الصفحة بالكامل (تأمين للعناصر الديناميكية)
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        injectAllPlaceholders(document);
      });
    }
    // إعادة فحص كل ثانيتين للعناصر الجديدة (مثل دروس تُحمَّل ديناميكياً)
    if (!window.__adsBootInterval) {
      window.__adsBootInterval = setInterval(function () {
        injectAllPlaceholders(document);
      }, 2000);
    }
  }

  return {
    init: init,
    inject: injectAllPlaceholders,
    banner: buildBannerIframe,
    native: buildNativeAd,
    responsiveTop: buildResponsiveTop
  };
})();
