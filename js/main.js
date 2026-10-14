/* VA Ar-Condicionados - comportamento do site (sem dependências) */
(function () {
  'use strict';

  // ---- Configuração fácil de editar ----
  var WHATSAPP = '555180200593';
  var TAMANHOS = [7500, 9000, 12000, 18000, 24000, 30000, 36000, 48000, 60000];

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var fmt = function (n) { return n.toLocaleString('pt-BR'); };

  // Catálogo lido dos cards de produto (data-btu e data-price): editar o preço no HTML atualiza a calculadora
  var CATALOGO = {};
  $$('[data-btu][data-price]').forEach(function (el) {
    CATALOGO[el.getAttribute('data-btu')] = el.getAttribute('data-price');
  });

  // ---- Ano do rodapé ----
  var ano = $('#ano');
  if (ano) ano.textContent = new Date().getFullYear();

  // ---- Menu mobile ----
  var toggle = $('.nav-toggle');
  var menu = $('#menu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 900px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  // ---- Animação de entrada e item de menu ativo ----
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  var links = $$('.nav-list a');
  var sections = links.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + en.target.id;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  // =========================================================
  // Calculadora de BTUs
  // =========================================================
  var form = $('#calc-form');
  if (form) {
    var area = $('#area');
    var elPessoas = $('#pessoas');
    var elEquip = $('#equip');
    var resBtu = $('#res-btu');
    var resModel = $('#res-model');
    var resNote = $('#res-note');
    var resCta = $('#res-cta');

    var num = function (el) { return parseInt(el.textContent, 10) || 0; };

    function calcular() {
      var m2 = parseFloat(String(area.value).replace(',', '.'));
      if (!isFinite(m2) || m2 <= 0) m2 = 0;
      m2 = Math.min(m2, 300);
      var pessoas = num(elPessoas);
      var equip = num(elEquip);
      var solEl = $('input[name="sol"]:checked', form);
      var sol = solEl ? parseFloat(solEl.value) : 1;

      // 600 BTUs/m² (até 2 pessoas) + 600 BTUs por pessoa extra e por aparelho que emite calor
      var pessoasExtras = Math.max(0, pessoas - 2);
      var base = m2 * 600 + (pessoasExtras + equip) * 600;
      var total = Math.round((base * sol) / 100) * 100;

      var recomendado = null;
      for (var i = 0; i < TAMANHOS.length; i++) { if (TAMANHOS[i] >= total) { recomendado = TAMANHOS[i]; break; } }

      resBtu.textContent = m2 > 0 ? fmt(total) : '0';

      var msg;
      if (m2 <= 0) {
        resModel.textContent = 'informe a área';
        resNote.textContent = 'Digite a área do ambiente para calcular.';
        msg = 'Olá, gostaria de ajuda para escolher o ar-condicionado ideal.';
      } else if (recomendado === null) {
        resModel.textContent = 'projeto especial';
        resNote.textContent = 'Esse espaço precisa de mais de ' + fmt(TAMANHOS[TAMANHOS.length - 1]) + ' BTUs. Fale com a gente para um projeto sob medida.';
        msg = 'Olá, tenho um ambiente de ' + m2 + ' m² e gostaria de um orçamento para um projeto especial.';
      } else {
        resModel.textContent = fmt(recomendado) + ' BTUs';
        if (CATALOGO[recomendado]) {
          resNote.textContent = 'Temos esse modelo por ' + CATALOGO[recomendado] + ', com instalação incluída.';
        } else {
          resNote.textContent = 'Fale com a gente para consultar disponibilidade e valor desse modelo.';
        }
        msg = 'Olá, vim pelo site. Meu ambiente tem ' + m2 + ' m², com ' + pessoas + ' pessoa' + (pessoas === 1 ? '' : 's') +
              ' e ' + equip + ' aparelho' + (equip === 1 ? '' : 's') + ' que emite' + (equip === 1 ? '' : 'm') +
              ' calor. A calculadora recomendou ' + fmt(recomendado) + ' BTUs. Gostaria de um orçamento.';
      }
      resCta.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
    }

    $$('.step', form).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var out = document.getElementById(btn.getAttribute('data-target'));
        var min = parseInt(out.getAttribute('data-min'), 10);
        var max = parseInt(out.getAttribute('data-max'), 10);
        var v = Math.min(max, Math.max(min, num(out) + parseInt(btn.getAttribute('data-step'), 10)));
        out.textContent = v;
        calcular();
      });
    });
    form.addEventListener('input', calcular);
    form.addEventListener('change', calcular);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    calcular();
  }

  // =========================================================
  // Guia do controle remoto
  // =========================================================
  var remote = $('#remote');
  if (remote) {
    var INFO = {
      ligar: { t: 'Ligar / Desligar', d: 'A principal função de um ar-condicionado: com este botão você inicia e encerra o funcionamento do aparelho.', tip: 'Teste: clique para ligar e desligar e veja o visor reagir.' },
      funcao: { t: 'Função', d: 'É o botão mais importante do aparelho. Com ele você muda o modo de funcionamento: Frio, Quente, FAN e Seco (usado para desumidificar o ambiente).', tip: 'Teste: clique várias vezes e veja o ícone do visor mudar.' },
      memoria: { t: 'Memória', d: 'Ajusta o aparelho para 26°C e velocidade automática de ventilação, uma configuração equilibrada para o dia a dia.', tip: 'Ótimo para voltar rápido a um ajuste confortável.' },
      setas: { t: 'Setas (Temp + / Temp −)', d: 'Servem para aumentar ou diminuir a temperatura do aparelho, ou o tempo do Timer quando ele está sendo ajustado.', tip: 'Cada grau a menos aumenta o consumo de energia.' },
      timer: { t: 'Timer', d: 'Super útil: com ele você programa um horário para o ar-condicionado se desligar sozinho.', tip: 'Perfeito para dormir sem deixar o aparelho ligado a noite toda.' },
      turbo: { t: 'Turbo', d: 'Faz o aparelho resfriar o ambiente rapidamente: a temperatura é ajustada automaticamente para 18°C durante 30 minutos.', tip: 'Ideal para quando você chega em casa e o ambiente está muito quente.' },
      oscilar: { t: 'Oscilar', d: 'Faz as palhetas do aparelho se movimentarem, para que o ar se espalhe por todo o ambiente.', tip: 'Evita que o ar gelado fique direcionado a uma pessoa só.' },
      velocidade: { t: 'Velocidade', d: 'É o botão responsável pela frequência em que os modos Oscilar e FAN se movimentam.', tip: 'Teste: clique para alternar entre Auto, Baixa, Média e Alta.' },
      sonobom: { t: 'Sono Bom', d: 'Melhora a sua noite de sono: o ar-condicionado abaixa a temperatura até ficar confortável para dormir e depois ela aumenta gradualmente.', tip: 'Combine com o Timer para uma noite tranquila e econômica.' },
      visor: { t: 'Visor', d: 'Os números do visor informam a temperatura atual, que pode ser modificada, e o tempo do Timer, que também pode ser ajustado usando as setas.', tip: 'Repare como o visor mostra o que você acabou de acionar.' },
      'icone-modo': { t: 'Ícone do modo', d: 'Representa a função em que o ar-condicionado se encontra, podendo ter até 4 ícones diferentes.', tip: 'Floco de neve, sol, ventilador ou gota: cada um é um modo.' },
      fan: { t: 'Ícone FAN', d: 'Mostra quando o modo FAN está ativado. Esse modo refresca o ambiente como um ventilador, sem modificar a temperatura.', tip: 'Útil em dias amenos, quando você só quer o ar circulando.' }
    };

    var MODOS = [
      { nome: 'Frio', icone: 'i-snow' },
      { nome: 'Quente', icone: 'i-sun' },
      { nome: 'FAN', icone: 'i-fan' },
      { nome: 'Seco', icone: 'i-drop' }
    ];
    var VELOCIDADES = ['AUTO', 'BAIXA', 'MÉDIA', 'ALTA'];
    var TIMERS = [0, 1, 2, 4, 8];

    var st = { on: true, temp: 24, modo: 0, turbo: false, sono: false, oscilar: false, vel: 0, timer: 0 };

    var elTemp = $('#s-temp');
    var elFlags = $('#s-flags');
    var elMode = $('#s-mode use');
    var elFan = $('#s-fan');
    var gTitle = $('#g-title');
    var gDesc = $('#g-desc');
    var gTip = $('#g-tip');

    function render() {
      remote.classList.toggle('off', !st.on);
      elTemp.textContent = st.on ? st.temp : '--';
      elMode.setAttribute('href', '#' + MODOS[st.modo].icone);
      elFan.classList.toggle('on', st.on && st.modo === 2);

      var flags = [];
      if (st.on) {
        flags.push(MODOS[st.modo].nome.toUpperCase());
        if (st.turbo) flags.push('TURBO');
        if (st.sono) flags.push('SONO');
        if (st.oscilar) flags.push('OSCILAR');
        flags.push(VELOCIDADES[st.vel]);
        if (st.timer) flags.push('TIMER ' + st.timer + 'H');
      } else {
        flags.push('DESLIGADO');
      }
      while (elFlags.firstChild) elFlags.removeChild(elFlags.firstChild);
      flags.forEach(function (f) {
        var b = document.createElement('b');
        b.textContent = f;
        elFlags.appendChild(b);
      });
    }

    function agir(fn, dir) {
      if (fn === 'ligar') { st.on = !st.on; if (!st.on) { st.turbo = false; } return; }
      if (!st.on) return;
      switch (fn) {
        case 'funcao': st.modo = (st.modo + 1) % MODOS.length; st.turbo = false; break;
        case 'memoria': st.temp = 26; st.vel = 0; st.turbo = false; break;
        case 'setas': st.temp = Math.min(30, Math.max(16, st.temp + dir)); st.turbo = false; break;
        case 'timer': st.timer = TIMERS[(TIMERS.indexOf(st.timer) + 1) % TIMERS.length]; break;
        case 'turbo': st.turbo = !st.turbo; if (st.turbo) { st.temp = 18; st.modo = 0; } break;
        case 'oscilar': st.oscilar = !st.oscilar; break;
        case 'velocidade': st.vel = (st.vel + 1) % VELOCIDADES.length; break;
        case 'sonobom': st.sono = !st.sono; break;
      }
    }

    function selecionar(fn, el) {
      var info = INFO[fn];
      if (!info) return;
      $$('.rbtn, .remote-screen', remote).forEach(function (b) { b.classList.remove('is-selected'); });
      if (el) el.classList.add('is-selected');
      gTitle.textContent = info.t;
      gDesc.textContent = info.d;
      gTip.textContent = info.tip;
    }

    remote.addEventListener('click', function (e) {
      var el = e.target.closest('[data-fn]');
      if (!el || !remote.contains(el)) return;
      var fn = el.getAttribute('data-fn');
      var dir = parseInt(el.getAttribute('data-dir') || '0', 10);
      agir(fn, dir);
      render();
      selecionar(fn, el.classList.contains('rbtn') || el.classList.contains('remote-screen') ? el : null);
    });
    $('#screen').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selecionar('visor', e.currentTarget); }
    });

    render();
    selecionar('ligar', $('[data-fn="ligar"]', remote));
  }
})();
