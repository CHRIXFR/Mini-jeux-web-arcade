// games/capitales-map.js
(function () {
    // Source map: flekschas/simple-world-map (CC BY-SA 3.0)
    const MAP_ASSET_PATH = 'games/data/world-map.min.svg';

    function create(container) {
        if (!container) return null;

        container.innerHTML = `
            <section class="cap-map-card" aria-label="Localisation sur la carte">
                <div class="cap-map-head">Localisation</div>
                <div class="cap-map-canvas">
                    <div class="cap-map-world-wrap">
                        <div class="cap-map-world-loading">Chargement de la carte...</div>
                    </div>
                </div>
                <div class="cap-map-caption">
                    <span class="cap-map-label"></span>
                    <span class="cap-map-fallback">Localisation indisponible pour cette question.</span>
                </div>
            </section>
        `;

        const root = container;
        const worldWrap = root.querySelector('.cap-map-world-wrap');
        const loading = root.querySelector('.cap-map-world-loading');
        const label = root.querySelector('.cap-map-label');
        const fallback = root.querySelector('.cap-map-fallback');

        let worldSvg = null;
        let activeIso = null;
        let isReady = false;
        let pendingShow = null;

        function setVisible(isVisible) {
            root.classList.toggle('is-visible', isVisible);
        }

        function clearActiveCountry() {
            if (!worldSvg || !activeIso) return;
            const activeNodes = worldSvg.querySelectorAll(`#${activeIso}`);
            activeNodes.forEach((node) => node.classList.remove('cap-map-country-active'));
            activeIso = null;
        }

        function highlightCountryByIso(iso) {
            if (!worldSvg || !iso) return false;
            const nodes = worldSvg.querySelectorAll(`#${iso}`);
            if (!nodes.length) return false;

            clearActiveCountry();
            nodes.forEach((node) => node.classList.add('cap-map-country-active'));
            activeIso = iso;
            return true;
        }

        function clear() {
            pendingShow = null;
            setVisible(false);
            clearActiveCountry();
            if (label) {
                label.textContent = '';
                label.style.display = 'none';
            }
            if (fallback) fallback.style.display = 'none';
        }

        function applyShow(placeLabel, iso) {
            setVisible(true);

            const isoLower = typeof iso === 'string' ? iso.toLowerCase() : '';
            highlightCountryByIso(isoLower);

            if (label && placeLabel) {
                label.textContent = placeLabel;
                label.style.display = 'inline';
                if (fallback) fallback.style.display = 'none';
                return;
            }

            if (label) label.style.display = 'none';
            if (fallback) fallback.style.display = 'inline';
        }

        function show(placeLabel, iso) {
            if (!isReady) {
                pendingShow = { placeLabel, iso };
                return;
            }
            applyShow(placeLabel, iso);
        }

        async function loadMap() {
            try {
                const response = await fetch(MAP_ASSET_PATH);
                if (!response.ok) throw new Error('Erreur chargement carte');
                const svgText = await response.text();
                worldWrap.innerHTML = svgText;
                worldSvg = worldWrap.querySelector('svg');
                if (!worldSvg) throw new Error('SVG invalide');

                worldSvg.classList.add('cap-map-world');
                const countries = worldSvg.querySelectorAll('path, g');
                countries.forEach((node) => {
                    if (node.id) node.classList.add('cap-map-country');
                });

                if (loading) loading.remove();
                isReady = true;

                if (pendingShow) {
                    const p = pendingShow;
                    pendingShow = null;
                    applyShow(p.placeLabel, p.iso);
                }
            } catch (_error) {
                isReady = true;
                if (loading) loading.textContent = 'Carte indisponible.';
            }
        }

        function destroy() {
            container.innerHTML = '';
        }

        clear();
        loadMap();
        return { create, show, clear, destroy };
    }

    window.CapitalesMap = { create };
})();
