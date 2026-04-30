/**
 * RTM Generator Module
 * Handles requirement traceability matrix generation
 */

let rtmData = {
    requirements: [],
    testCases: [],
    matrix: [],
    metrics: { coverage: 0, orphans: 0, uncovered: 0 }
};

// Parse requirements from text
function parseRequirements(text) {
    return text.split('\n')
        .map((line, idx) => line.trim())
        .filter(Boolean)
        .map((req, idx) => ({
            id: `REQ-${String(idx + 1).padStart(3, '0')}`,
            description: req,
            covered: false,
            mappedTestCases: []
        }));
}

// Parse test cases from text
function parseTestCases(text) {
    return text.split('\n')
        .map((line, idx) => line.trim())
        .filter(Boolean)
        .map((tc, idx) => ({
            id: `TC-${String(idx + 1).padStart(3, '0')}`,
            description: tc,
            mappedRequirements: []
        }));
}

// Parse test cases from Excel file
async function parseTestCasesFromExcel(file) {
    if (!window.XLSX) {
        throw new Error('Excel library not loaded');
    }
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Get first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (!jsonData || jsonData.length === 0) {
                    reject(new Error('Excel file is empty'));
                    return;
                }
                
                // Find header row and relevant columns
                const headerRow = jsonData[0];
                const testCases = [];
                
                // Common column names to look for
                const idColumns = ['test case id', 'tc id', 'id', 'test id', 'case id'];
                const descColumns = ['test case', 'description', 'test case description', 'test', 'case', 'test case name', 'name'];
                const stepsColumns = ['steps', 'test steps', 'procedure', 'actions'];
                const expectedColumns = ['expected result', 'expected', 'result', 'expected outcome'];
                
                // Find column indexes
                let idColIndex = -1;
                let descColIndex = -1;
                let stepsColIndex = -1;
                let expectedColIndex = -1;
                
                headerRow.forEach((header, index) => {
                    const headerLower = String(header || '').toLowerCase().trim();
                    if (idColumns.includes(headerLower)) idColIndex = index;
                    if (descColumns.includes(headerLower)) descColIndex = index;
                    if (stepsColumns.includes(headerLower)) stepsColIndex = index;
                    if (expectedColumns.includes(headerLower)) expectedColIndex = index;
                });
                
                // If no description column found, use first non-ID column
                if (descColIndex === -1) {
                    descColIndex = idColIndex === 0 ? 1 : 0;
                }
                
                // Parse data rows (skip header)
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0) continue;
                    
                    // Get test case ID
                    let tcId = idColIndex >= 0 ? String(row[idColIndex] || '').trim() : '';
                    if (!tcId) {
                        tcId = `TC-${String(i).padStart(3, '0')}`;
                    }
                    
                    // Get description
                    let description = descColIndex >= 0 ? String(row[descColIndex] || '').trim() : '';
                    
                    // If description is empty, try to build from other columns
                    if (!description) {
                        const parts = [];
                        if (stepsColIndex >= 0 && row[stepsColIndex]) {
                            parts.push(String(row[stepsColIndex]).trim());
                        }
                        if (expectedColIndex >= 0 && row[expectedColIndex]) {
                            parts.push(String(row[expectedColIndex]).trim());
                        }
                        description = parts.join(' - ') || 'Unnamed test case';
                    }
                    
                    if (description) {
                        testCases.push({
                            id: tcId,
                            description: description,
                            mappedRequirements: []
                        });
                    }
                }
                
                if (testCases.length === 0) {
                    reject(new Error('No test cases found in Excel file'));
                    return;
                }
                
                resolve(testCases);
            } catch (error) {
                reject(new Error(`Failed to parse Excel file: ${error.message}`));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read Excel file'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

// Handle test case file upload (PDF, DOCX, TXT, Excel)
async function handleRTMTestCaseUpload(event) {
    const input = event?.target;
    const file = input?.files?.[0];
    const target = document.getElementById('rtm-tc-input');
    
    if (!file || !target) return;
    
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xls') || fileName.endsWith('.xlsx');
    
    try {
        showToast(`Extracting test cases from ${file.name}...`, 2000);
        
        let testCases = [];
        
        if (isExcel) {
            // Parse Excel file
            testCases = await parseTestCasesFromExcel(file);
            
            // Convert to text format (one per line)
            const textContent = testCases.map(tc => tc.description).join('\n');
            target.value = textContent;
            
            showToast(`Imported ${testCases.length} test cases from Excel!`);
        } else {
            // Use existing file parsing for PDF/DOCX/TXT
            const extractedText = await extractTextFromRequirementFile(file);
            if (!extractedText) {
                throw new Error('No readable text found in the uploaded document');
            }
            target.value = extractedText;
            showToast('Test cases extracted successfully!');
        }
        
        target.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (error) {
        console.error('Test case upload failed:', error);
        showToast(`Upload failed: ${error.message}`);
    } finally {
        input.value = '';
    }
}

// Import test cases from Test Case Builder
async function importFromTestCaseBuilder() {
    const saved = localStorage.getItem('qaly_saved_testcases');
    if (!saved) {
        showToast('No test cases found in Test Case Builder');
        return [];
    }
    
    try {
        const cases = JSON.parse(saved);
        return cases.map((tc, idx) => ({
            id: tc.id || `TC-${String(idx + 1).padStart(3, '0')}`,
            description: tc.testCase || tc['Test Case'] || 'Unnamed test case',
            mappedRequirements: []
        }));
    } catch (error) {
        console.error('Failed to import test cases:', error);
        showToast('Failed to import test cases');
        return [];
    }
}

// Generate RTM using AI
async function generateRTM(e) {
    const reqInput = document.getElementById('rtm-req-input').value.trim();
    const tcInput = document.getElementById('rtm-tc-input').value.trim();
    
    if (!reqInput) {
        showToast('Please enter requirements');
        return;
    }
    
    if (!tcInput) {
        showToast('Please enter test cases');
        return;
    }
    
    const btn = e?.currentTarget || document.getElementById('rtm-generate-btn');
    setLoading(btn, true);
    
    try {
        rtmData.requirements = parseRequirements(reqInput);
        rtmData.testCases = parseTestCases(tcInput);
        
        const prompt = `Map the following requirements to test cases and generate a traceability matrix.

Requirements:
${rtmData.requirements.map(r => `${r.id}: ${r.description}`).join('\n')}

Test Cases:
${rtmData.testCases.map(tc => `${tc.id}: ${tc.description}`).join('\n')}

Return JSON with this structure:
{
  "mappings": [
    {"requirementId": "REQ-001", "testCaseIds": ["TC-001", "TC-002"]},
    ...
  ]
}`;

        const payload = await resolvePromptPayload('rtmGenerator', prompt, '', {
            templateVars: { requirements: reqInput, testCases: tcInput }
        });
        
        const response = await generateAI(payload.prompt, payload.systemPrompt, 'rtmGenerator');
        const data = safeParseJSON(response);
        
        if (!data?.mappings) throw new Error('Invalid AI response');
        
        // Apply mappings
        data.mappings.forEach(mapping => {
            const req = rtmData.requirements.find(r => r.id === mapping.requirementId);
            if (req) {
                req.mappedTestCases = mapping.testCaseIds || [];
                req.covered = req.mappedTestCases.length > 0;
                
                mapping.testCaseIds?.forEach(tcId => {
                    const tc = rtmData.testCases.find(t => t.id === tcId);
                    if (tc && !tc.mappedRequirements.includes(req.id)) {
                        tc.mappedRequirements.push(req.id);
                    }
                });
            }
        });
        
        calculateMetrics();
        renderRTM();
        document.getElementById('rtm-output').classList.remove('hidden');
        showToast('RTM generated successfully!');
    } catch (err) {
        console.error(err);
        showToast('Error: ' + err.message);
    } finally {
        setLoading(btn, false);
    }
}

// Calculate coverage metrics
function calculateMetrics() {
    const covered = rtmData.requirements.filter(r => r.covered).length;
    const uncovered = rtmData.requirements.length - covered;
    const orphans = rtmData.testCases.filter(tc => tc.mappedRequirements.length === 0).length;
    const coverage = rtmData.requirements.length > 0 
        ? Math.round((covered / rtmData.requirements.length) * 100) 
        : 0;
    
    rtmData.metrics = { coverage, orphans, uncovered, covered };
}

// Render RTM table
function renderRTM() {
    const thead = document.getElementById('rtm-thead');
    const tbody = document.getElementById('rtm-tbody');
    
    // Header
    thead.innerHTML = `
        <tr class="bg-slate-50">
            <th class="px-4 py-3 text-left text-xs font-black uppercase text-slate-600">Requirement ID</th>
            <th class="px-4 py-3 text-left text-xs font-black uppercase text-slate-600">Description</th>
            ${rtmData.testCases.map(tc => 
                `<th class="px-3 py-3 text-center text-xs font-black uppercase text-slate-600 rotate-text">${tc.id}</th>`
            ).join('')}
            <th class="px-4 py-3 text-center text-xs font-black uppercase text-slate-600">Status</th>
        </tr>
    `;
    
    // Body
    tbody.innerHTML = rtmData.requirements.map(req => `
        <tr class="border-b border-slate-100 hover:bg-slate-50 ${!req.covered ? 'bg-red-50' : ''}">
            <td class="px-4 py-3 font-mono text-xs font-bold text-slate-700">${req.id}</td>
            <td class="px-4 py-3 text-sm text-slate-700">${req.description}</td>
            ${rtmData.testCases.map(tc => {
                const isMapped = req.mappedTestCases.includes(tc.id);
                return `<td class="px-3 py-3 text-center">${isMapped ? '<span class="text-green-600 font-bold">✓</span>' : ''}</td>`;
            }).join('')}
            <td class="px-4 py-3 text-center">
                <span class="px-2 py-1 rounded text-xs font-bold ${req.covered ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                    ${req.covered ? 'Covered' : 'Uncovered'}
                </span>
            </td>
        </tr>
    `).join('');
    
    renderMetrics();
    renderInsights();
}

// Render metrics
function renderMetrics() {
    document.getElementById('rtm-coverage').textContent = `${rtmData.metrics.coverage}%`;
    document.getElementById('rtm-covered').textContent = rtmData.metrics.covered || 0;
    document.getElementById('rtm-uncovered').textContent = rtmData.metrics.uncovered || 0;
    document.getElementById('rtm-orphans').textContent = rtmData.metrics.orphans || 0;
}

// Render insights
function renderInsights() {
    const uncovered = rtmData.requirements.filter(r => !r.covered);
    const orphans = rtmData.testCases.filter(tc => tc.mappedRequirements.length === 0);
    
    const uncoveredHtml = uncovered.length > 0 
        ? uncovered.map(r => `<li class="text-sm text-slate-700">${r.id}: ${r.description}</li>`).join('')
        : '<li class="text-sm text-slate-500 italic">All requirements are covered</li>';
    
    const orphansHtml = orphans.length > 0
        ? orphans.map(tc => `<li class="text-sm text-slate-700">${tc.id}: ${tc.description}</li>`).join('')
        : '<li class="text-sm text-slate-500 italic">No orphan test cases</li>';
    
    document.getElementById('rtm-uncovered-list').innerHTML = uncoveredHtml;
    document.getElementById('rtm-orphans-list').innerHTML = orphansHtml;
}

// Export to Excel
function rtmDownloadExcel() {
    if (!window.XLSX) {
        showToast('Excel library not loaded');
        return;
    }
    
    const data = rtmData.requirements.map(req => {
        const row = {
            'Requirement ID': req.id,
            'Description': req.description,
            'Status': req.covered ? 'Covered' : 'Uncovered'
        };
        
        rtmData.testCases.forEach(tc => {
            row[tc.id] = req.mappedTestCases.includes(tc.id) ? '✓' : '';
        });
        
        return row;
    });
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RTM');
    
    // Add summary sheet
    const summary = [
        { Metric: 'Total Requirements', Value: rtmData.requirements.length },
        { Metric: 'Covered Requirements', Value: rtmData.metrics.covered },
        { Metric: 'Uncovered Requirements', Value: rtmData.metrics.uncovered },
        { Metric: 'Coverage %', Value: `${rtmData.metrics.coverage}%` },
        { Metric: 'Total Test Cases', Value: rtmData.testCases.length },
        { Metric: 'Orphan Test Cases', Value: rtmData.metrics.orphans }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    
    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `RTM-${timestamp}.xlsx`);
    showToast('Excel downloaded successfully!');
}

// Import from Test Case Builder
async function rtmImportTestCases() {
    const cases = await importFromTestCaseBuilder();
    if (cases.length === 0) return;
    
    const textarea = document.getElementById('rtm-tc-input');
    textarea.value = cases.map(tc => tc.description).join('\n');
    showToast(`Imported ${cases.length} test cases`);
}

// Clear RTM
function rtmClear() {
    if (!confirm('Clear all RTM data?')) return;
    
    document.getElementById('rtm-req-input').value = '';
    document.getElementById('rtm-tc-input').value = '';
    document.getElementById('rtm-output').classList.add('hidden');
    rtmData = { requirements: [], testCases: [], matrix: [], metrics: { coverage: 0, orphans: 0, uncovered: 0 } };
    showToast('RTM cleared');
}

// Export functions
window.generateRTM = generateRTM;
window.rtmDownloadExcel = rtmDownloadExcel;
window.rtmImportTestCases = rtmImportTestCases;
window.rtmClear = rtmClear;
window.handleRTMTestCaseUpload = handleRTMTestCaseUpload;
