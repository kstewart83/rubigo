document.addEventListener('DOMContentLoaded', () => {
    // Utility to handle JSON form submission
    async function handleJsonSubmit(event, url, successCallback) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = {};

        // Convert FormData to JSON object, handling number parsing
        for (let [key, value] of formData.entries()) {
            if (event.target.elements[key].type === 'number') {
                data[key] = Number(value);
            } else {
                data[key] = value;
            }
        }

        // Special handling for Site Location tuple
        if (data.lat !== undefined && data.lon !== undefined) {
            data.location = [data.lon, data.lat];
            delete data.lat;
            delete data.lon;
        }

        // Special handling for site_id/rack_id if they are hidden inputs or derived
        // The form should contain them as flat fields if possible.
        // Our DTOs expect strings, so it's fine.

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                if (successCallback) successCallback();
                else window.location.reload();
            } else {
                const text = await response.text();
                // Simple alert for MVP error handling
                alert('Error: ' + text);
                console.error('Submit error:', text);
            }
        } catch (e) {
            console.error('Network error:', e);
            alert('Network error: ' + e);
        }
    }

    // Attach listeners
    // Event listeners removed to allow standard HTML Form submission (x-www-form-urlencoded)
    // which matches the Axum Form extractor on the backend.

    // const siteForm = document.getElementById('add-site-form');
    // if (siteForm) {
    //     siteForm.addEventListener('submit', (e) => handleJsonSub
    // Dynamic listener for Rack/Device forms since they might appear inside details
    document.body.addEventListener('submit', (e) => {
        if (e.target.id === 'add-rack-form') {
            handleJsonSubmit(e, '/actions/racks/create');
        } else if (e.target.id === 'add-device-form') {
            handleJsonSubmit(e, '/actions/devices/create');
        }
    });

    // City Search
    const searchInput = document.getElementById('city-search');
    const resultsContainer = document.getElementById('city-results');

    if (searchInput && resultsContainer) {
        let debounceTimer;
        // Helper to select a city
        function selectCity(city) {
            searchInput.value = city.name;
            const latInput = document.getElementById('lat');
            const lonInput = document.getElementById('lon');
            if (latInput && lonInput) {
                // City struct has location: (lng, lat) -> JSON: [lng, lat]
                // So index 0 is lng, index 1 is lat
                latInput.value = city.location[1];
                lonInput.value = city.location[0];

                // Visual feedback
                latInput.style.backgroundColor = 'var(--md-sys-color-primary-container)';
                lonInput.style.backgroundColor = 'var(--md-sys-color-primary-container)';
                setTimeout(() => {
                    latInput.style.backgroundColor = 'var(--bg-dark)';
                    lonInput.style.backgroundColor = 'var(--bg-dark)';
                }, 500);
            }
            resultsContainer.style.display = 'none';
        }

        // Debounced Search Logic
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim();

            if (query.length < 2) {
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
                return;
            }

            // Only show loading if manual input, not if programmatically triggered to select
            resultsContainer.innerHTML = '<div style="padding: 0.5rem; color: #888;">Searching...</div>';
            resultsContainer.style.display = 'block';

            debounceTimer = setTimeout(async () => {
                try {
                    const res = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
                    if (!res.ok) throw new Error('Failed to fetch cities');
                    const cities = await res.json();

                    resultsContainer.innerHTML = '';

                    if (cities.length === 0) {
                        resultsContainer.innerHTML = '<div style="padding: 0.5rem; color: #888;">No results found.</div>';
                        return;
                    }

                    cities.forEach(city => {
                        const div = document.createElement('div');
                        div.style.padding = '0.5rem';
                        div.style.cursor = 'pointer';
                        div.style.borderBottom = '1px solid #333';
                        div.className = 'city-result-item';
                        div.textContent = `${city.name}, ${city.country}`;
                        div.addEventListener('click', () => selectCity(city));
                        resultsContainer.appendChild(div);
                    });
                    resultsContainer.style.display = 'block';

                } catch (err) {
                    resultsContainer.innerHTML = '<div style="padding: 0.5rem; color: red;">Error searching cities.</div>';
                }
            }, 300);
        });

        // Load Button Logic & Enter Key
        async function loadTopResult() {
            const query = searchInput.value.trim();
            if (query.length === 0) return;

            try {
                const res = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
                if (!res.ok) {
                    return;
                }
                const cities = await res.json();

                if (cities.length > 0) {
                    // If exact match (case-insensitive), or just pick top
                    selectCity(cities[0]);
                } else {
                    alert("No city found matching '" + query + "'");
                }
            } catch (e) {
                console.error(e);
            }
        }

        const loadBtn = document.getElementById('load-city-btn');
        if (loadBtn) {
            loadBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent form submit if it impacts anything
                loadTopResult();
            });
        }

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission
                loadTopResult();
            }
        });

        // --- Tooltips for Map Markers ---
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.id = 'map-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.padding = '0.5rem';
        tooltip.style.background = 'rgba(0,0,0,0.8)';
        tooltip.style.color = '#fff';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '0.8rem';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.display = 'none';
        tooltip.style.zIndex = '1000';
        document.body.appendChild(tooltip);

        document.body.addEventListener('mouseover', (e) => {
            const marker = e.target.closest('.site-marker');
            if (marker) {
                const name = marker.getAttribute('data-name');
                const status = marker.getAttribute('data-status');
                tooltip.innerHTML = `<strong>${name}</strong><br/><span style="color:#aaa">${status}</span>`;
                tooltip.style.display = 'block';
            }
        });

        document.body.addEventListener('mousemove', (e) => {
            if (tooltip.style.display === 'block') {
                tooltip.style.left = (e.pageX + 10) + 'px';
                tooltip.style.top = (e.pageY + 10) + 'px';
            }
        });

        document.body.addEventListener('mouseout', (e) => {
            if (e.target.closest('.site-marker')) {
                tooltip.style.display = 'none';
            }
        });

        // Site Selection Logic (Sidebar)
        // handled by <a> tags now
    }

    // =========================================
    // Rendering Mode Detection & Earth Viewer
    // =========================================

    /**
     * Detect the best available rendering mode
     * Priority: WebGPU > WebGL2 > WebGL > CPU
     */
    async function detectRenderingMode() {
        // Check for WebGPU
        if (navigator.gpu) {
            try {
                const adapter = await navigator.gpu.requestAdapter();
                if (adapter) {
                    return 'webgpu';
                }
            } catch (e) {
                console.log('WebGPU adapter request failed:', e);
            }
        }

        // Check for WebGL2
        const canvas = document.createElement('canvas');
        const gl2 = canvas.getContext('webgl2');
        if (gl2) {
            return 'webgl';
        }

        // Check for WebGL1
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            return 'webgl';
        }

        // Fall back to CPU (SVG rendering)
        return 'cpu';
    }

    /**
     * Update the rendering mode indicator pill in the header
     */
    function updateRenderingModePill(mode) {
        const pill = document.getElementById('render-mode-pill');
        if (!pill) return;

        const labels = {
            'webgpu': 'WebGPU',
            'webgl': 'WebGL',
            'cpu': 'CPU'
        };

        const icons = {
            'webgpu': '🚀',
            'webgl': '🎮',
            'cpu': '📊'
        };

        pill.className = 'render-mode-pill ' + mode;
        pill.innerHTML = `<span class="render-mode-icon">${icons[mode]}</span><span>${labels[mode]}</span>`;
        pill.title = mode === 'cpu'
            ? 'Using CPU rendering (SVG). GPU acceleration not available.'
            : `Using ${labels[mode]} for 3D acceleration`;
    }

    /**
     * Initialize the Earth viewer (Bevy WASM) if GPU is available
     */
    async function initEarthViewer(mode) {
        const container = document.getElementById('earth-viewer-container');
        const svgFallback = document.getElementById('svg-globe-fallback');
        if (!container) return;

        if (mode === 'cpu') {
            // Show SVG fallback - it's already there, just make sure it's visible
            container.classList.add('cpu-mode');
            if (svgFallback) svgFallback.style.display = 'block';
            return;
        }

        try {
            // Hide SVG fallback
            if (svgFallback) svgFallback.style.display = 'none';

            // Add loading overlay
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'earth-viewer-loading';
            loadingDiv.innerHTML = '<div class="spinner"></div><span>Loading 3D Globe...</span>';
            container.appendChild(loadingDiv);

            // Dynamically import the Earth viewer module
            const earthViewer = await import('/assets/earth-viewer/earth-viewer.js');

            // Initialize the WASM module
            await earthViewer.default();

            // The Bevy app renders into the existing canvas with id="earth-canvas"
            // Wait a moment for it to initialize
            setTimeout(() => {
                const canvas = document.getElementById('earth-canvas');
                if (canvas) {
                    container.classList.add('active');
                    loadingDiv.remove();
                }
            }, 1000);

        } catch (e) {
            console.error('Failed to initialize Earth viewer:', e);
            // Fall back to SVG display
            container.classList.add('cpu-mode');
            if (svgFallback) svgFallback.style.display = 'block';

            // Remove loading overlay if present
            const loadingDiv = container.querySelector('.earth-viewer-loading');
            if (loadingDiv) {
                loadingDiv.innerHTML = '<span style="color: var(--text-muted);">3D viewer unavailable</span>';
                setTimeout(() => loadingDiv.remove(), 2000);
            }
        }
    }

    // Store the detected mode globally for other components to use
    window.renderingMode = 'detecting';

    // Initialize rendering mode detection
    detectRenderingMode().then(mode => {
        window.renderingMode = mode;
        console.log('Detected rendering mode:', mode);
        updateRenderingModePill(mode);

        // Initialize Earth viewer if we're on the geospatial tab
        if (document.getElementById('earth-viewer-container')) {
            initEarthViewer(mode);
        }
    });
});
