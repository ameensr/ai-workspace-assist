/**
 * Fuzzy Search Enhancement
 * VS Code-like search with keyboard shortcuts
 */

(function() {
    'use strict';

    // Module data source
    const SEARCH_MODULES = [
        { name: "Dashboard", path: "#home", keywords: "home main overview" },
        { name: "Requirement Intelligence", path: "#requirement-intelligence", keywords: "req intel analyze requirements" },
        { name: "Test Suite Architect", path: "#test-suite-architect", keywords: "test suite architect generate cases" },
        { name: "Test Case Builder", path: "#professional-case-architect", keywords: "test case builder professional notes" },
        { name: "RTM Generator", path: "#rtm-generator", keywords: "rtm traceability matrix coverage" },
        { name: "Bug Report Generator", path: "#bug-report-generator", keywords: "bug report issue defect" },
        { name: "Clarity AI - The Text Refinery", path: "#clarity-ai", keywords: "clarity text sentence correction grammar" },
        { name: "Meeting Notes Extractor", path: "#meeting-notes-extractor", keywords: "meeting notes extract action items" },
        { name: "Test Case Prioritizer", path: "coming_soon_new.html?feature=Test Case Prioritizer", keywords: "prioritize priority test cases" },
        { name: "Requirement Change Impact Analyzer", path: "coming_soon_new.html?feature=Requirement Change Impact Analyzer", keywords: "requirement change impact analyze" },
        { name: "Test Estimation Calculator", path: "coming_soon_new.html?feature=Test Estimation Calculator", keywords: "test estimation calculator effort" },
        { name: "QA Knowledge Base Builder", path: "coming_soon_new.html?feature=QA Knowledge Base Builder", keywords: "qa knowledge base builder wiki" },
        { name: "Test Case → Automation Converter", path: "coming_soon_new.html?feature=Test Case → Automation Converter", keywords: "automation converter test case script" }
    ];

    let selectedIndex = -1;
    let searchInput = null;
    let searchDropdown = null;
    let debounceTimer = null;

    // Fuzzy match with scoring
    function fuzzyMatch(query, text, keywords = '') {
        const q = query.toLowerCase().trim();
        const t = (text + ' ' + keywords).toLowerCase();
        
        if (!q) return { match: false, score: 0 };
        if (t.includes(q)) return { match: true, score: 100 };

        const chars = q.split('');
        let score = 0;
        let lastIndex = -1;

        for (const char of chars) {
            const idx = t.indexOf(char, lastIndex + 1);
            if (idx === -1) return { match: false, score: 0 };
            score += (idx === lastIndex + 1) ? 10 : 1;
            lastIndex = idx;
        }

        return { match: true, score };
    }

    // Search and rank results
    function searchModules(query) {
        if (!query.trim()) return [];

        const results = SEARCH_MODULES
            .map(module => ({
                ...module,
                ...fuzzyMatch(query, module.name, module.keywords)
            }))
            .filter(r => r.match)
            .sort((a, b) => b.score - a.score)
            .slice(0, 7);

        return results;
    }

    // Highlight matching text
    function highlightMatch(text, query) {
        if (!query.trim()) return text;
        const regex = new RegExp(`(${query.split('').join('.*?')})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 text-slate-900 px-0.5 rounded">$1</mark>');
    }

    // Render dropdown
    function renderDropdown(results) {
        if (!searchDropdown) return;

        if (results.length === 0) {
            searchDropdown.innerHTML = '<div class="px-4 py-3 text-sm text-slate-400">No results found</div>';
            searchDropdown.classList.remove('hidden');
            return;
        }

        searchDropdown.innerHTML = results.map((result, idx) => `
            <div class="search-result-item ${idx === selectedIndex ? 'selected' : ''}" data-index="${idx}" data-path="${result.path}">
                <span class="material-symbols-outlined text-blue-600">arrow_forward</span>
                <span class="result-name">${result.name}</span>
            </div>
        `).join('');

        searchDropdown.classList.remove('hidden');
    }

    // Navigate to module
    function navigateToResult(path) {
        if (path.startsWith('#')) {
            window.location.hash = path.slice(1);
        } else {
            window.location.href = path;
        }
        closeSearch();
    }

    // Close search
    function closeSearch() {
        if (searchInput) searchInput.value = '';
        if (searchDropdown) searchDropdown.classList.add('hidden');
        selectedIndex = -1;
    }

    // Handle keyboard navigation
    function handleKeyDown(e) {
        const results = searchDropdown?.querySelectorAll('.search-result-item') || [];
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
            renderDropdownSelection(results);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            renderDropdownSelection(results);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && results[selectedIndex]) {
                const path = results[selectedIndex].getAttribute('data-path');
                navigateToResult(path);
            }
        } else if (e.key === 'Escape') {
            closeSearch();
        }
    }

    // Update selection UI
    function renderDropdownSelection(results) {
        results.forEach((item, idx) => {
            item.classList.toggle('selected', idx === selectedIndex);
        });
        if (selectedIndex >= 0 && results[selectedIndex]) {
            results[selectedIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    // Handle input with debounce
    function handleInput(e) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = e.target.value;
            const results = searchModules(query);
            selectedIndex = -1;
            renderDropdown(results);
        }, 200);
    }

    // Initialize search
    function initFuzzySearch() {
        // Find existing search input (assuming there's a global search in header)
        searchInput = document.querySelector('.global-search input, input[type="search"], input[placeholder*="Search"]');
        
        if (!searchInput) {
            console.warn('Fuzzy Search: No search input found');
            return;
        }

        // Create dropdown
        searchDropdown = document.createElement('div');
        searchDropdown.id = 'fuzzy-search-dropdown';
        searchDropdown.className = 'hidden';
        searchInput.parentElement.style.position = 'relative';
        searchInput.parentElement.appendChild(searchDropdown);

        // Event listeners
        searchInput.addEventListener('input', handleInput);
        searchInput.addEventListener('keydown', handleKeyDown);
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim()) {
                const results = searchModules(searchInput.value);
                renderDropdown(results);
            }
        });

        // Click on result
        searchDropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.search-result-item');
            if (item) {
                const path = item.getAttribute('data-path');
                navigateToResult(path);
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                closeSearch();
            }
        });

        // Global "/" shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFuzzySearch);
    } else {
        initFuzzySearch();
    }
})();
