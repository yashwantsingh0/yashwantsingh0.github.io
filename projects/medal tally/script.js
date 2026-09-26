/*
============================================================
BCAS MEDAL TALLY — JAVASCRIPT
============================================================
Edit this file for:
- department data
- ranking rules
- saving/loading data
- timestamp behaviour
- screenshot/download behaviour

Visual styling is in styles.css.
Page structure is in index.html.
============================================================
*/

(function(){

  /* ---------- Storage Configuration ---------- */

  var STORAGE_KEY = 'bcas_medal_tally_v1';

  /* ---------- Department Medal Data ---------- */

  var departments = [
    {id:0, name:'Microbiology', gold:5, silver:3, bronze:1, prevRank:7},
    {id:1, name:'Computer Science', gold:3, silver:5, bronze:1, prevRank:1},
    {id:2, name:'Food technology', gold:6, silver:0, bronze:1, prevRank:2},
    {id:3, name:'Instrumentation', gold:4, silver:1, bronze:1, prevRank:3},
    {id:4, name:'Electronics', gold:2, silver:2, bronze:3, prevRank:4},
    {id:5, name:'Biomedical Science', gold:0, silver:4, bronze:3, prevRank:5},
    {id:6, name:'Botany', gold:0, silver:2, bronze:4, prevRank:6},
    {id:7, name:'Chemistry', gold:0, silver:2, bronze:0, prevRank:8},
    {id:8, name:'Polymer Science', gold:0, silver:0, bronze:1, prevRank:9},
    {id:9, name:'Zoology', gold:0, silver:0, bronze:1, prevRank:10},
    {id:10, name:'Physics', gold:0, silver:0, bronze:0, prevRank:11}
  ];

  /* Stores the last successful ranking update time. */

  var lastUpdated = null;


  /* ---------- Load saved data from the browser ---------- */

  function load(){

    try {

      var raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {

        var parsed = JSON.parse(raw);

        if (parsed.departments) {
          departments = parsed.departments;
        }

        if (parsed.lastUpdated) {
          lastUpdated = parsed.lastUpdated;
        }

      }

    } catch(e) {
      // Ignore localStorage errors.
    }

  }


  /* ---------- Save current data to localStorage ---------- */

  function persist(){

    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          departments: departments,
          lastUpdated: lastUpdated
        })
      );

    } catch(e) {
      // Ignore localStorage errors.
    }

  }


  /* ---------- Calculate points and sort departments ---------- */

  function getRanked(){

    return departments
      .map(function(d){

        return Object.assign({}, d, {
          total:
            d.gold * 30 +
            d.silver * 20 +
            d.bronze * 10
        });

      })
      .sort(function(a, b){

        /*
        Ranking priority:
        1. Total points
        2. Gold medals
        3. Silver medals
        */

        return (
          b.total - a.total ||
          b.gold - a.gold ||
          b.silver - a.silver
        );

      });

  }


  /* ---------- Table Rendering ---------- */

  var tbody = document.getElementById('tbody');


  /*
  Rebuild table rows while preserving
  the active input and cursor position.
  */

  function renderRows(){

    var active = document.activeElement;

    var restoreId = null;
    var restoreField = null;
    var restoreSel = null;


    /*
    Check whether the user is currently
    editing one of the medal input fields.
    */

    if (
      active &&
      active.classList &&
      active.classList.contains('medal-input')
    ) {

      restoreId = active.dataset.id;
      restoreField = active.dataset.field;
      restoreSel = active.selectionStart;

    }


    /* Get departments in ranked order */

    var ranked = getRanked();


    /* Generate HTML for every department */

    var html = ranked.map(function(d, i){

      var rank = i + 1;


      /*
      Calculate change from previous rank.

      Example:
      Previous rank = 7
      Current rank = 4
      Result = ↑3
      */

      var diff = d.prevRank - rank;

      var changeHtml;
      var changeClass;


      if (diff > 0) {

        changeHtml = '\u2191' + diff;
        changeClass = 'up';

      }

      else if (diff < 0) {

        changeHtml = '\u2193' + Math.abs(diff);
        changeClass = 'down';

      }

      else {

        changeHtml = 'Same';
        changeClass = 'same';

      }


      /*
      Highlight:
      Rank 1 = leader
      Rank 3 = third place
      */

      var rowClass =
        rank === 1
          ? 'leader'
          : (rank === 3 ? 'rank-third' : '');


      return (
        '<tr class="' + rowClass + '">' +

          /* Rank */

          '<td>' +
            rank +
          '</td>' +

          /* Rank change */

          '<td class="' + changeClass + '">' +
            changeHtml +
          '</td>' +

          /* Department name */

          '<td class="dept">' +
            d.name +
          '</td>' +

          /* Gold medals */

          '<td>' +
            '<input ' +
              'type="number" ' +
              'min="0" ' +
              'class="medal-input" ' +
              'data-id="' + d.id + '" ' +
              'data-field="gold" ' +
              'value="' + d.gold + '">' +
          '</td>' +

          /* Silver medals */

          '<td>' +
            '<input ' +
              'type="number" ' +
              'min="0" ' +
              'class="medal-input" ' +
              'data-id="' + d.id + '" ' +
              'data-field="silver" ' +
              'value="' + d.silver + '">' +
          '</td>' +

          /* Bronze medals */

          '<td>' +
            '<input ' +
              'type="number" ' +
              'min="0" ' +
              'class="medal-input" ' +
              'data-id="' + d.id + '" ' +
              'data-field="bronze" ' +
              'value="' + d.bronze + '">' +
          '</td>' +

          /* Total points */

          '<td class="total">' +
            d.total +
          '</td>' +

        '</tr>';

    }).join('');


    /* Insert generated rows into table */

    tbody.innerHTML = html;


    /*
    Restore focus to the input that was
    being edited before the table refreshed.
    */

    if (restoreId !== null) {

      var el = tbody.querySelector(
        '.medal-input[data-id="' +
        restoreId +
        '"][data-field="' +
        restoreField +
        '"]'
      );


      if (el) {

        el.focus();

        try {

          el.setSelectionRange(
            restoreSel,
            restoreSel
          );

        } catch(e) {
          // Some input types may not support selection ranges.
        }

      }

    }

  }


  /* ---------- Timestamp Display ---------- */

  function updateTimestamp(){

    var span = document.getElementById('updated-time');


    if (lastUpdated) {

      var d = new Date(lastUpdated);

      span.textContent = d.toLocaleString();

    }

    else {

      span.textContent = 'Not yet saved';

    }

  }


  /* ---------- Live Medal Editing ---------- */

  tbody.addEventListener('input', function(e){

    var t = e.target;


    /*
    Ignore anything that is not
    a medal input field.
    */

    if (!t.classList.contains('medal-input')) {
      return;
    }


    /* Get department ID */

    var id = Number(t.dataset.id);


    /* Get medal type */

    var field = t.dataset.field;


    /*
    Make sure medal count cannot be negative.
    Invalid/empty values become 0.
    */

    var val = Math.max(
      0,
      parseInt(t.value, 10) || 0
    );


    /* Find matching department */

    var dept = departments.filter(
      function(d){
        return d.id === id;
      }
    )[0];


    /* Update medal count */

    dept[field] = val;


    /*
    Recalculate rankings immediately.
    */

    renderRows();


    /*
    Save the updated medal count
    to browser localStorage.
    */

    persist();

  });


  /* ---------- Save & Update Rankings ---------- */

  document
    .getElementById('saveBtn')
    .addEventListener('click', function(){

      var btn = this;


      /*
      Get departments in their current
      ranking order.
      */

      var ranked = getRanked();


      /*
      Store current rankings as the
      "previous ranking".

      This is used later to display
      ↑ / ↓ / Same.
      */

      ranked.forEach(function(d, i){

        var orig = departments.filter(
          function(o){
            return o.id === d.id;
          }
        )[0];


        orig.prevRank = i + 1;

      });


      /*
      Store the exact time when
      rankings were saved.
      */

      lastUpdated = new Date().toISOString();


      /* Save everything */

      persist();


      /* Refresh table */

      renderRows();


      /* Refresh timestamp */

      updateTimestamp();


      /*
      Temporarily change button text
      to confirm successful save.
      */

      var original = btn.textContent;

      btn.textContent = 'Saved!';

      btn.disabled = true;


      setTimeout(function(){

        btn.textContent = original;
        btn.disabled = false;

      }, 1500);

    });


  /* ---------- Download Table as PNG ---------- */

  document
    .getElementById('downloadBtn')
    .addEventListener('click', function(){

      var btn = this;

      var original = btn.textContent;


      /* Disable button while image is generated */

      btn.disabled = true;

      btn.textContent = 'Preparing image...';


      /*
      html2canvas converts the table-card
      HTML element into a PNG image.

      scale: 2 gives a higher-resolution image.
      */

      html2canvas(
        document.querySelector('.table-card'),
        {
          scale: 2,
          backgroundColor: '#ffffff'
        }
      )
      .then(function(canvas){

        /*
        Create a temporary download link.
        */

        var link = document.createElement('a');


        /*
        Generate filename using current date.
        */

        var dateStr =
          new Date()
            .toISOString()
            .slice(0, 10);


        link.download =
          'medal-tally-' +
          dateStr +
          '.png';


        /*
        Convert canvas to PNG.
        */

        link.href =
          canvas.toDataURL('image/png');


        /*
        Trigger download.
        */

        link.click();

      })
      .catch(function(){

        /*
        Show an error if image generation fails.
        */

        alert(
          'Could not generate the image. Please try again.'
        );

      })
      .finally(function(){

        /*
        Restore button after generation
        succeeds or fails.
        */

        btn.disabled = false;

        btn.textContent = original;

      });

    });


  /* ---------- Initial Page Setup ---------- */

  /*
  1. Load previously saved data.
  2. Generate the table.
  3. Display the saved timestamp.
  */

  load();

  renderRows();

  updateTimestamp();

})();
