/* ============================================================
   Medical Quality × כלל — landing-page interactivity shim
   Restores behaviour that was lost when the React bundle was
   removed from the saved page. Pure vanilla JS, no dependencies.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. WHERE LEADS GO -------------------------------
     Set this to your endpoint (Trackbox webhook / CRM / Apps
     Script URL). Leave '' to just show a success message.
     ---------------------------------------------------------- */
  var FORM_ENDPOINT = 'https://hooks.zapier.com/hooks/catch/14279784/42p5e2j/'; // Zapier Catch Hook -> bmby CRM

  var ready = function (fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  };

  ready(function () {

    /* ---------- 2. REVEAL ON SCROLL ------------------------- */
    var reveals = document.querySelectorAll('.reveal:not(.is-visible)');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var d = parseInt(e.target.getAttribute('data-reveal-delay') || '0', 10);
            setTimeout(function () { e.target.classList.add('is-visible'); }, d);
            io.unobserve(e.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    }
    // Safety net: anything still hidden after 2.5s gets shown.
    setTimeout(function () {
      document.querySelectorAll('.reveal:not(.is-visible)').forEach(function (el) {
        el.classList.add('is-visible');
      });
    }, 2500);

    /* ---------- 3. COUNT-UP STATS --------------------------- */
    function animateCounter(el) {
      var to = parseFloat(el.getAttribute('data-to')) || 0;
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var suffix = el.getAttribute('data-suffix') || '';
      var dur = 1400, start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.innerHTML = (to * eased).toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.innerHTML = to.toFixed(dec) + suffix;
      }
      requestAnimationFrame(step);
    }
    var counters = document.querySelectorAll('.counter');
    if ('IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { animateCounter(e.target); cio.unobserve(e.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cio.observe(el); });
    } else {
      counters.forEach(animateCounter);
    }

    /* ---------- 4. FAQ ACCORDION ---------------------------- */
    document.querySelectorAll('[aria-expanded]').forEach(function (btn) {
      if (!btn.querySelector('.chev')) return; // only FAQ buttons
      var panel = btn.nextElementSibling;
      var li = btn.closest('li') || btn.parentElement;
      function setOpen(open) {
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        li.classList.toggle('faq-open', open);
        if (panel) {
          panel.style.opacity = open ? '1' : '0';
          panel.style.maxHeight = open ? (panel.scrollHeight + 40) + 'px' : '0px';
        }
      }
      // initialise from current state
      setOpen(btn.getAttribute('aria-expanded') === 'true');
      btn.addEventListener('click', function () {
        setOpen(btn.getAttribute('aria-expanded') !== 'true');
      });
    });

    /* ---------- 5. STICKY HEADER BACKGROUND ----------------- */
    var header = document.querySelector('header');
    if (header) {
      var onScroll = function () {
        if (window.scrollY > 40) {
          header.classList.remove('bg-transparent');
          header.style.background = 'rgba(14,21,48,0.92)';
          header.style.backdropFilter = 'blur(10px)';
        } else {
          header.style.background = '';
          header.style.backdropFilter = '';
          header.classList.add('bg-transparent');
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* ---------- 6. LEAD FORMS ------------------------------- */
    function handleForm(form) {
      if (!form) return;
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var data = {};
        form.querySelectorAll('input,select,textarea').forEach(function (f) {
          if (f.name) data[f.name] = f.value.trim();
        });
        // minimal validation
        if (!data.name || !data.phone || !data.email) {
          alert('נא למלא שם, טלפון ואימייל');
          return;
        }
        data.source = 'clal-benefit-lp';
        var btn = form.querySelector('button[type="submit"], button:not([type])');
        var label = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.innerHTML = 'שולח…'; }

        var done = function (ok) {
          if (ok) {
            form.innerHTML =
              '<div style="text-align:center;padding:28px 12px">' +
              '<div style="font-size:42px;line-height:1">✓</div>' +
              '<div style="font-size:20px;font-weight:700;margin-top:10px">תודה! קיבלנו את הפרטים</div>' +
              '<div style="opacity:.75;margin-top:6px">נציגה מטעם שיתוף הפעולה עם כלל תחזור אלייך בהקדם.</div>' +
              '</div>';
          } else {
            if (btn) { btn.disabled = false; btn.innerHTML = label; }
            alert('אירעה שגיאה בשליחה. נסי שוב או התקשרי 053-461-3514');
          }
        };

        if (FORM_ENDPOINT) {
          // Sent as form-urlencoded: a CORS "simple request" (no preflight),
          // and Zapier's Catch Hook maps each field automatically.
          fetch(FORM_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: new URLSearchParams(data).toString()
          }).then(function (r) { done(r.ok); }).catch(function () { done(false); });
        } else {
          // no endpoint configured yet — simulate success
          console.log('[lead captured — no endpoint set]', data);
          setTimeout(function () { done(true); }, 500);
        }
      });
    }
    handleForm(document.getElementById('hero-form'));
    handleForm(document.getElementById('final-form'));

    /* ---------- 7. "השאירי פרטים" buttons scroll to form ---- */
    document.querySelectorAll('button').forEach(function (b) {
      if (/השאיר/.test(b.textContent) && !b.closest('form')) {
        b.addEventListener('click', function () {
          var t = document.getElementById('hero-form') || document.getElementById('top');
          if (t) t.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }
    });

  });
})();
