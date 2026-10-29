/* =========================================================
 * comments.js — نظام تعليقات لمنصة Madame Aya
 * يعتمد على Firestore collection اسمها: lesson_comments
 * بنية المستند: { lessonId, name, text, createdAt }
 * الاستخدام:
 *   <div id="commentsBox" data-lesson-id="DOC_ID"></div>
 *   CommentsBoot.mount(document.getElementById("commentsBox"));
 * ========================================================= */

window.CommentsBoot = (function () {
  // نستورد ما نحتاجه من firebase-config.js ديناميكياً
  var db, collection, addDoc, getDocs, query, where, orderBy;

  function ensureFirebase() {
    if (db) return Promise.resolve(db);
    return import("../firebase-config.js").then(function (mod) {
      db = mod.db;
      collection = mod.collection;
      addDoc = mod.addDoc;
      getDocs = mod.getDocs;
      query = mod.query;
      where = mod.where;
      orderBy = mod.orderBy;
      return db;
    });
  }

  // تعداد التعليقات في الذاكرة حتى لا نعيد الطلب
  var cache = {};

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function timeAgo(iso) {
    try {
      var d = new Date(iso);
      var sec = Math.floor((Date.now() - d.getTime()) / 1000);
      if (sec < 60) return "الآن";
      if (sec < 3600) return Math.floor(sec / 60) + " دقيقة";
      if (sec < 86400) return Math.floor(sec / 3600) + " ساعة";
      if (sec < 604800) return Math.floor(sec / 86400) + " يوم";
      return d.toLocaleDateString("ar-EG");
    } catch (e) { return ""; }
  }

  function avatarColor(name) {
    var colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22"];
    var n = 0;
    for (var i = 0; i < (name || "").length; i++) n += name.charCodeAt(i);
    return colors[n % colors.length];
  }

  function initial(name) {
    return (name || "؟").trim().charAt(0).toUpperCase();
  }

  function renderList(box, lessonId, docs) {
    var list = box.querySelector(".comments-list");
    if (!list) return;

    if (!docs.length) {
      list.innerHTML = ''
        + '<div class="comment-empty">'
        + '  <div class="comment-empty-icon">💬</div>'
        + '  <p>لا توجد تعليقات بعد. كن أول من يعلق على هذا الدرس!</p>'
        + '</div>';
      return;
    }

    list.innerHTML = docs.map(function (d) {
      var data = d.data ? d.data() : d;
      var name = data.name || "طالب";
      var text = data.text || "";
      var when = timeAgo(data.createdAt);
      var col = avatarColor(name);
      var init = initial(name);
      return ''
        + '<div class="comment-item">'
        + '  <div class="comment-avatar" style="background:' + col + '">' + esc(init) + '</div>'
        + '  <div class="comment-body">'
        + '    <div class="comment-head">'
        + '      <span class="comment-name">' + esc(name) + '</span>'
        + '      <span class="comment-time">' + esc(when) + '</span>'
        + '    </div>'
        + '    <div class="comment-text">' + esc(text) + '</div>'
        + '  </div>'
        + '</div>';
    }).join("");
  }

  function load(box, lessonId) {
    ensureFirebase().then(function () {
      var list = box.querySelector(".comments-list");
      if (list) list.innerHTML = '<div class="comments-loading">⏳ جاري تحميل التعليقات...</div>';

      // orderBy يحتاج index، نتجنبه ونرتب يدوياً
      var q = query(collection(db, "lesson_comments"), where("lessonId", "==", lessonId));
      getDocs(q).then(function (snap) {
        var arr = [];
        snap.forEach(function (d) { arr.push(d); });
        arr.sort(function (a, b) {
          var ta = (a.data().createdAt || "");
          var tb = (b.data().createdAt || "");
          // الأحدث أولاً
          return tb < ta ? -1 : (tb > ta ? 1 : 0);
        });
        cache[lessonId] = arr;
        renderList(box, lessonId, arr);
      }).catch(function (err) {
        console.error("comments load err:", err);
        if (list) list.innerHTML = '<div class="comments-error">⚠️ تعذّر تحميل التعليقات.</div>';
      });
    });
  }

  function mount(box) {
    if (!box) return;
    var lessonId = box.getAttribute("data-lesson-id");
    if (!lessonId) return;

    // بناء الـ DOM مرة واحدة
    if (!box.querySelector(".comments-header")) {
      box.innerHTML = ''
        + '<div class="comments-header">'
        + '  <h3>💬 تعليقات الطلاب</h3>'
        + '  <span class="comments-count" id="commentsCount_' + cssSafe(lessonId) + '">0 تعليق</span>'
        + '</div>'
        + '<div class="comments-list"></div>'
        + '<div class="comments-form">'
        + '  <h4>أضف تعليقك</h4>'
        + '  <input type="text" class="comment-name-input" placeholder="الاسم" maxlength="40">'
        + '  <textarea class="comment-text-input" placeholder="اكتب تعليقك هنا..." maxlength="600"></textarea>'
        + '  <div class="comment-form-actions">'
        + '    <button class="comment-submit-btn">إرسال التعليق 📤</button>'
        + '  </div>'
        + '</div>';
    }

    load(box, lessonId);

    var btn = box.querySelector(".comment-submit-btn");
    if (btn) {
      btn.addEventListener("click", function () {
        var nameEl = box.querySelector(".comment-name-input");
        var textEl = box.querySelector(".comment-text-input");
        var name = (nameEl.value || "").trim();
        var text = (textEl.value || "").trim();
        if (!name) { alert("من فضلك اكتب اسمك."); nameEl.focus(); return; }
        if (!text) { alert("من فضلك اكتب نص التعليق."); textEl.focus(); return; }
        if (text.length < 2) { alert("التعليق قصير جداً."); return; }

        btn.disabled = true;
        btn.textContent = "جاري الإرسال... ⏳";

        ensureFirebase().then(function () {
          addDoc(collection(db, "lesson_comments"), {
            lessonId: lessonId,
            name: name,
            text: text,
            createdAt: new Date().toISOString()
          }).then(function () {
            textEl.value = "";
            btn.disabled = false;
            btn.textContent = "إرسال التعليق 📤";
            load(box, lessonId);
          }).catch(function (err) {
            console.error("comment post err:", err);
            alert("تعذّر إرسال التعليق. حاول مرة أخرى.");
            btn.disabled = false;
            btn.textContent = "إرسال التعليق 📤";
          });
        });
      });
    }
  }

  function cssSafe(s) {
    return String(s).replace(/[^a-zA-Z0-9_]/g, "_");
  }

  return { mount: mount };
})();
