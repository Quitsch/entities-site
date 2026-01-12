(function() {
    'use strict';

    const objectUrl = `object.json`;
    const baseUrl = window.location.pathname.replace(/\/$/, '');

    // Locale-Konfiguration
    const DEFAULT_LOCALE = 'de-CH';
    const SUPPORTED_LOCALES = ['de-CH', 'fr-CH', 'it-CH', 'en', 'es', 'pt'];
    const LOCALE_TO_LAYERKEY = {
        'de-CH': 'de',
        'fr-CH': 'fr',
        'it-CH': 'it',
        'en': 'en',
        'es': 'es',
        'pt': 'pt'
    };

    function getLocaleFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang');
        if (lang && SUPPORTED_LOCALES.includes(lang)) {
            return lang;
        }
        return DEFAULT_LOCALE;
    }

    function getLayerKey(locale) {
        return LOCALE_TO_LAYERKEY[locale] || 'de';
    }

    function getFallbackLayerKeys(locale) {
        const layerKey = getLayerKey(locale);
        const fallbacks = [layerKey];
        
        // Füge 'de' hinzu, wenn nicht bereits enthalten
        if (layerKey !== 'de') {
            fallbacks.push('de');
        }
        
        // Füge 'en' hinzu, wenn nicht bereits enthalten und nicht de-CH
        if (layerKey !== 'en' && layerKey !== 'de') {
            fallbacks.push('en');
        }
        
        return fallbacks;
    }

    function getTextLayer(data, locale) {
        if (!data.text_layers) {
            return {};
        }
        
        const fallbackKeys = getFallbackLayerKeys(locale);
        
        // Versuche jeden Fallback-Key
        for (let i = 0; i < fallbackKeys.length; i++) {
            const layerKey = fallbackKeys[i];
            if (data.text_layers[layerKey]) {
                return data.text_layers[layerKey];
            }
        }
        
        return {};
    }

    function formatPrice(price, currency) {
        if (!price) return '-';
        const locale = getLocaleFromUrl();
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency || 'CHF'
        }).format(price);
    }

    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const locale = getLocaleFromUrl();
        return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }

    function getMediaByRole(media, role) {
        return media.filter(m => m.role === role);
    }

    function getHeroImage(media) {
        const hero = getMediaByRole(media, 'hero');
        if (hero.length > 0) return hero[0];
        if (media.length > 0) return media[0];
        return null;
    }

    function renderKeyFacts(data) {
        const locale = getLocaleFromUrl();
        const textLayer = getTextLayer(data, locale);
        const usage = data.usage || {};
        const pricing = usage.pricing || {};
        const structure = data.structure || {};
        const attrs = structure.attributes || {};
        const address = structure.address || {};

        document.getElementById('title').textContent = textLayer.title || 'Objekt';
        document.getElementById('short-description').textContent = textLayer.short_description || 'Immobilienobjekt';

        const transactionType = usage.transaction_type || '-';
        document.getElementById('transaction-type').textContent = transactionType === 'sale' ? 'Kauf' : transactionType === 'rent' ? 'Miete' : transactionType;

        document.getElementById('price').textContent = formatPrice(pricing.price, pricing.currency);

        const roomCount = attrs.room_count;
        document.getElementById('room-count').textContent = roomCount ? `${roomCount} Zimmer` : '-';

        const livingArea = attrs.living_area_sqm;
        document.getElementById('living-area').textContent = livingArea ? `${livingArea} m²` : '-';

        const yearBuilt = attrs.year_built;
        const yearRenovated = attrs.year_renovated;
        let yearText = '-';
        if (yearBuilt && yearRenovated) {
            yearText = `${yearBuilt} (renoviert ${yearRenovated})`;
        } else if (yearBuilt) {
            yearText = yearBuilt.toString();
        }
        document.getElementById('year-built').textContent = yearText;

        const addressParts = [];
        if (address.street) addressParts.push(address.street);
        if (address.postal_code) addressParts.push(address.postal_code);
        if (address.locality) addressParts.push(address.locality);
        if (address.region) addressParts.push(address.region);
        if (address.country) addressParts.push(address.country);
        document.getElementById('address').textContent = addressParts.length > 0 ? addressParts.join(', ') : '-';

        if (attrs.room_breakdown && attrs.room_breakdown.length > 0) {
            const list = document.getElementById('room-breakdown-list');
            list.innerHTML = '';
            attrs.room_breakdown.forEach(room => {
                const li = document.createElement('li');
                let text = `${room.type === 'living_room' ? 'Wohnzimmer' : room.type === 'bedroom' ? 'Schlafzimmer' : room.type === 'kitchen' ? 'Küche' : room.type} (${room.count})`;
                if (room.area_sqm) {
                    text += ` - ${room.area_sqm} m²`;
                }
                li.textContent = text;
                list.appendChild(li);
            });
            document.getElementById('room-breakdown-section').style.display = 'block';
        }

        if (attrs.features) {
            const featuresContent = document.getElementById('features-content');
            featuresContent.innerHTML = '';
            const features = attrs.features;

            if (features.amenities && features.amenities.length > 0) {
                const div = document.createElement('div');
                div.className = 'feature-category';
                div.innerHTML = '<h3>Amenities</h3><ul></ul>';
                const ul = div.querySelector('ul');
                features.amenities.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    ul.appendChild(li);
                });
                featuresContent.appendChild(div);
            }

            if (features.parking) {
                const div = document.createElement('div');
                div.className = 'feature-category';
                div.innerHTML = `<h3>Parkplatz</h3><p>${features.parking}</p>`;
                featuresContent.appendChild(div);
            }

            if (features.outdoor) {
                const div = document.createElement('div');
                div.className = 'feature-category';
                div.innerHTML = `<h3>Aussenbereich</h3><p>${features.outdoor}</p>`;
                featuresContent.appendChild(div);
            }

            if (features.storage) {
                const div = document.createElement('div');
                div.className = 'feature-category';
                div.innerHTML = `<h3>Lager</h3><p>${features.storage}</p>`;
                featuresContent.appendChild(div);
            }

            if (featuresContent.children.length > 0) {
                featuresContent.className = 'features-grid';
                document.getElementById('features-section').style.display = 'block';
            }
        }
    }

    function renderMedia(data) {
        const media = data.media || [];
        const mediaContent = document.getElementById('media-content');
        mediaContent.innerHTML = '';

        if (media.length === 0) {
            mediaContent.textContent = 'Keine Medien verfügbar.';
            return;
        }

        const hero = getHeroImage(media);
        const grid = document.createElement('div');
        grid.className = 'media-grid';

        if (hero) {
            const item = document.createElement('div');
            item.className = 'media-item hero';
            const img = document.createElement('img');
            img.src = hero.uri;
            img.alt = hero.text_refs && hero.text_refs[0] || 'Hauptbild';
            item.appendChild(img);
            grid.appendChild(item);
        }

        const links = document.createElement('div');
        links.className = 'media-links';

        const floorplans = getMediaByRole(media, 'floorplan');
        floorplans.forEach(fp => {
            const a = document.createElement('a');
            a.href = fp.uri;
            a.target = '_blank';
            a.textContent = 'Grundriss anzeigen';
            links.appendChild(a);
        });

        const documents = getMediaByRole(media, 'document');
        documents.forEach(doc => {
            const a = document.createElement('a');
            a.href = doc.uri;
            a.target = '_blank';
            a.textContent = 'Dokument öffnen';
            links.appendChild(a);
        });

        if (links.children.length > 0) {
            grid.appendChild(links);
        }

        mediaContent.appendChild(grid);
    }

    function renderProvenance(data) {
        const provenance = data.provenance || {};
        const list = document.getElementById('provenance-list');
        list.innerHTML = '';

        if (provenance.updated_at) {
            const dt = document.createElement('dt');
            dt.textContent = 'Aktualisiert';
            const dd = document.createElement('dd');
            dd.textContent = formatDate(provenance.updated_at);
            list.appendChild(dt);
            list.appendChild(dd);
        }

        if (provenance.data_confidence) {
            const dt = document.createElement('dt');
            dt.textContent = 'Datenqualität';
            const dd = document.createElement('dd');
            const confidenceMap = {
                'low': 'Niedrig',
                'medium': 'Mittel',
                'high': 'Hoch'
            };
            dd.textContent = confidenceMap[provenance.data_confidence] || provenance.data_confidence;
            list.appendChild(dt);
            list.appendChild(dd);
        }

        if (list.children.length > 0) {
            document.getElementById('provenance-section').style.display = 'block';
        }
    }

    function renderExtensions(data) {
        const extensions = data.extensions || {};
        if (!extensions || Object.keys(extensions).length === 0) {
            return;
        }

        const section = document.getElementById('extensions-section');
        const content = document.getElementById('extensions-content');
        
        // Generisches Rendering: Zeige Extensions als strukturierte Liste
        content.innerHTML = '';
        
        function renderObject(obj, parent, level = 0) {
            if (level > 3) return; // Begrenze Verschachtelungstiefe
            
            for (const [key, value] of Object.entries(obj)) {
                const div = document.createElement('div');
                div.style.marginLeft = level * 20 + 'px';
                div.style.marginTop = '0.5rem';
                
                if (value === null || value === undefined) {
                    continue;
                } else if (Array.isArray(value)) {
                    const label = document.createElement('strong');
                    label.textContent = key + ': ';
                    div.appendChild(label);
                    const ul = document.createElement('ul');
                    value.forEach(item => {
                        const li = document.createElement('li');
                        if (typeof item === 'object' && item !== null) {
                            li.appendChild(document.createTextNode(JSON.stringify(item, null, 2)));
                        } else {
                            li.textContent = String(item);
                        }
                        ul.appendChild(li);
                    });
                    div.appendChild(ul);
                } else if (typeof value === 'object') {
                    const label = document.createElement('strong');
                    label.textContent = key + ':';
                    div.appendChild(label);
                    renderObject(value, div, level + 1);
                } else {
                    const label = document.createElement('strong');
                    label.textContent = key + ': ';
                    div.appendChild(label);
                    div.appendChild(document.createTextNode(String(value)));
                }
                
                parent.appendChild(div);
            }
        }
        
        renderObject(extensions, content);
        section.style.display = 'block';
    }

    function updateMetaTags(data) {
        const locale = getLocaleFromUrl();
        const textLayer = getTextLayer(data, locale);
        const hero = getHeroImage(data.media || []);

        // Setze <html lang="..."> auf BCP47 locale
        document.documentElement.setAttribute('lang', locale);

        // Title und Description aus textLayer (sprachabhängig)
        document.title = textLayer.title || 'Objekt';
        
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = textLayer.short_description || 'Immobilienobjekt';
        }

        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            ogTitle.content = textLayer.title || 'Objekt';
        }

        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) {
            ogDesc.content = textLayer.short_description || 'Immobilienobjekt';
        }

        if (hero) {
            let ogImage = document.querySelector('meta[property="og:image"]');
            if (!ogImage) {
                ogImage = document.createElement('meta');
                ogImage.setAttribute('property', 'og:image');
                document.head.appendChild(ogImage);
            }
            ogImage.content = hero.uri;
        }
    }

    function updateJSONLD(data) {
        const locale = getLocaleFromUrl();
        const textLayer = getTextLayer(data, locale);
        const usage = data.usage || {};
        const pricing = usage.pricing || {};
        const structure = data.structure || {};
        const address = structure.address || {};
        const attrs = structure.attributes || {};
        const media = data.media || [];

        const propertyType = attrs.property_type || 'apartment';
        const schemaType = propertyType === 'apartment' ? 'Apartment' : 'Residence';

        const postalAddress = {
            '@type': 'PostalAddress',
            streetAddress: address.street || '',
            addressLocality: address.locality || '',
            postalCode: address.postal_code || '',
            addressRegion: address.region || '',
            addressCountry: address.country || ''
        };

        const offers = {
            '@type': 'Offer',
            price: pricing.price || '',
            priceCurrency: pricing.currency || 'CHF',
            availability: usage.availability && usage.availability.status === 'occupied' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
            url: baseUrl
        };

        const images = media
            .filter(m => m.role === 'hero' || m.role === 'exterior' || m.role === 'interior')
            .map(m => m.uri);

        const jsonld = {
            '@context': 'https://schema.org',
            '@type': schemaType,
            name: textLayer.title || 'Objekt',
            description: textLayer.short_description || '',
            inLanguage: locale,
            url: baseUrl,
            address: postalAddress,
            offers: offers,
            image: images.length > 0 ? images : undefined
        };

        const script = document.querySelector('script[type="application/ld+json"]');
        if (script) {
            script.textContent = JSON.stringify(jsonld, null, 2);
        }
    }

    function init() {
        fetch(objectUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Daten konnten nicht geladen werden');
                }
                return response.json();
            })
            .then(data => {
                renderKeyFacts(data);
                renderMedia(data);
                renderProvenance(data);
                renderExtensions(data);
                updateMetaTags(data);
                updateJSONLD(data);
            })
            .catch(error => {
                console.error('Fehler beim Laden der Daten:', error);
                document.getElementById('media-content').textContent = 'Fehler beim Laden der Daten.';
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
