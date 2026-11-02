// Fond des pages statiques (règles, à propos...) : le même mur d'affiches que
// dans l'app (composant PosterWall), construit à partir de
// /images/animes/list.json (généré par scripts/fetch-images.mjs).
(function () {
  var main = document.querySelector('.ou-main');
  if (!main || main.querySelector('.ou-home-wall')) return;
  fetch('/images/animes/list.json')
    .then(function (res) { return res.ok ? res.json() : []; })
    .then(function (list) {
      if (!list.length) return;
      for (var i = list.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = list[i]; list[i] = list[j]; list[j] = t;
      }
      var posters = list.concat(list, list);
      var wall = document.createElement('div');
      wall.className = 'ou-home-wall';
      wall.setAttribute('aria-hidden', 'true');
      var grid = document.createElement('div');
      grid.className = 'ou-home-wall-grid';
      posters.forEach(function (src) {
        var img = document.createElement('img');
        img.src = src;
        img.alt = '';
        img.draggable = false;
        grid.appendChild(img);
      });
      wall.appendChild(grid);
      main.insertBefore(wall, main.firstChild);
    })
    .catch(function () { /* pas de mur : le fond uni reste */ });
})();
