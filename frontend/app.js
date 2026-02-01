// ============================================
// CONFIGURAÇÃO
// ============================================

const API_URL = 'https://emailclassifier-ai-618m.onrender.com';

// Variáveis globais
let selectedFile = null;
let responseStartTime = 0;
let currentAnalysis = null;

// ============================================
// GERENCIAMENTO DE HISTÓRICO
// ============================================

function saveToHistory(email, categoria, analise, resposta) {
    const history = getHistory();
    const entry = {
        id: Date.now(),
        email: email,
        categoria: categoria,
        analise: analise,
        resposta: resposta,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleString('pt-BR')
    };

    history.unshift(entry);

    if (history.length > 50) {
        history.pop();
    }

    localStorage.setItem('emailClassifierHistory', JSON.stringify(history));
    updateHistoryDisplay();
}

function getHistory() {
    const historyStr = localStorage.getItem('emailClassifierHistory');
    return historyStr ? JSON.parse(historyStr) : [];
}

function clearHistory() {
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
        localStorage.removeItem('emailClassifierHistory');
        updateHistoryDisplay();
        showSuccessMessage('Histórico apagado com sucesso!');
    }
}

function updateHistoryDisplay() {
    const history = getHistory();
    const historyContainer = document.getElementById('historyList');

    if (history.length === 0) {
        historyContainer.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p>Nenhuma análise no histórico ainda</p>
            </div>
        `;
        return;
    }

    historyContainer.innerHTML = history.map(entry => `
        <div class="bg-gray-900/50 rounded-xl p-4 border border-orange-400 transition-all">
            <div class="flex items-start justify-between mb-3">
                <div class="flex items-center space-x-2">
                    <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        entry.categoria === 'Produtivo' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-600/20 text-gray-400'
                    }">
                        ${entry.categoria === 'Produtivo' ? '✅' : '📋'} ${entry.categoria}
                    </span>
                </div>
                <span class="text-xs text-gray-500">${entry.date}</span>
            </div>
            
            <div class="mb-3">
                <p class="text-sm text-gray-400 mb-1">📧 Email:</p>
                <p class="text-gray-300 text-sm italic">"${entry.email}"</p>
            </div>
            
            <div class="mb-3">
                <p class="text-sm text-gray-400 mb-1">🔍 Análise:</p>
                <p class="text-gray-300 text-sm">${entry.analise}</p>
            </div>
            
            <div>
                <p class="text-sm text-gray-400 mb-1">💬 Resposta Sugerida:</p>
                <p class="text-gray-300 text-sm">${entry.resposta}</p>
            </div>
        </div>
    `).join('');
}

function toggleHistory() {
    const historySection = document.getElementById('historySection');
    const isHidden = historySection.classList.contains('hidden');

    if (isHidden) {
        updateHistoryDisplay();
        historySection.classList.remove('hidden');
        document.getElementById('historyBtn').innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            <span>Fechar Histórico</span>
        `;
    } else {
        historySection.classList.add('hidden');
        document.getElementById('historyBtn').innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Ver Histórico</span>
        `;
    }
}

// ============================================
// SISTEMA DE FEEDBACK
// ============================================

function submitFeedback(isCorrect) {
    const feedbackSection = document.getElementById('feedbackSection');
    const feedbackButtons = document.getElementById('feedbackButtons');
    const feedbackThanks = document.getElementById('feedbackThanks');

    const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    feedbacks.push({
        timestamp: new Date().toISOString(),
        isCorrect: isCorrect,
        analysis: currentAnalysis
    });
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));

    feedbackButtons.classList.add('hidden');
    feedbackThanks.classList.remove('hidden');

    setTimeout(() => {
        feedbackSection.classList.add('hidden');
        feedbackButtons.classList.remove('hidden');
        feedbackThanks.classList.add('hidden');
    }, 3000);
}

// ============================================
// FUNÇÕES DE NAVEGAÇÃO E UI
// ============================================

function switchTab(tab) {
    const textTab = document.getElementById('tab-text');
    const fileTab = document.getElementById('tab-file');
    const textPanel = document.getElementById('panel-text');
    const filePanel = document.getElementById('panel-file');

    const activeClasses = 'flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 bg-orange-500 text-white';
    const inactiveClasses = 'flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 bg-gray-800 text-gray-300 hover:bg-gray-700';

    if (tab === 'text') {
        textTab.className = activeClasses;
        fileTab.className = inactiveClasses;
        textPanel.classList.remove('hidden');
        filePanel.classList.add('hidden');
    } else {
        fileTab.className = activeClasses;
        textTab.className = inactiveClasses;
        filePanel.classList.remove('hidden');
        textPanel.classList.add('hidden');
    }
}

function showLoading() {
    responseStartTime = performance.now();
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');
    hideError();
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('error').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');
    setTimeout(hideError, 5000);
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);

    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

function resetForm() {
    document.getElementById('emailText').value = '';
    document.getElementById('results').classList.add('hidden');
    document.getElementById('feedbackSection').classList.add('hidden');
    clearFile();
    hideError();
}

// ============================================
// FUNÇÕES DE CLASSIFICAÇÃO
// ============================================

async function classifyText() {
    const emailText = document.getElementById('emailText').value.trim();

    if (!emailText) {
        showError('Por favor, digite o conteúdo do email.');
        return;
    }

    if (emailText.length < 25) {
        showError('O email deve ter pelo menos 25 caracteres.');
        return;
    }

    showLoading();

    try {
        const response = await fetch(`${API_URL}/classify-text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: emailText,
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao processar requisição');
        }

        const result = await response.json();
        const responseTime = ((performance.now() - responseStartTime) / 1000).toFixed(1);

        displayResults(result, responseTime);
        saveToHistory(emailText, result.categoria, result.analise, result.resposta_sugerida);

    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

async function classifyFile() {
    if (!selectedFile) {
        showError('Por favor, selecione um arquivo.');
        return;
    }

    showLoading();

    try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fetch(`${API_URL}/classify-file`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao processar arquivo');
        }

        const result = await response.json();
        const responseTime = ((performance.now() - responseStartTime) / 1000).toFixed(1);

        displayResults(result, responseTime);

        // Extrai o conteúdo do arquivo para exibir no histórico
        let emailContent = `[Arquivo ${selectedFile.name}]`;

        try {
            if (selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf')) {
                // Extrai texto do PDF usando PDF.js
                emailContent = await extractTextFromPDF(selectedFile);
            } else if (selectedFile.type === 'text/plain' || selectedFile.name.toLowerCase().endsWith('.txt')) {
                // Lê arquivo de texto normalmente
                emailContent = await readFileContent(selectedFile);
            }
        } catch (error) {
            console.error('Erro ao ler conteúdo do arquivo:', error);
            // Mantém o nome do arquivo caso haja erro
        }

        saveToHistory(emailContent, result.categoria, result.analise, result.resposta_sugerida);

    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

function displayResults(result, responseTime) {
    hideLoading();
    hideError();

    currentAnalysis = result;

    const categoryBadge = document.getElementById('categoryBadge');
    if (result.categoria === 'Produtivo') {
        categoryBadge.className = 'inline-block px-8 py-4 rounded-2xl font-bold text-2xl display-text shadow-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white';
        categoryBadge.textContent = '✅ Produtivo';
    } else {
        categoryBadge.className = 'inline-block px-8 py-4 rounded-2xl font-bold text-2xl display-text shadow-xl bg-gradient-to-r from-gray-600 to-gray-700 text-white';
        categoryBadge.textContent = '📋 Improdutivo';
    }

    document.getElementById('confidence').innerHTML = `
        Confiança: ${result.confianca} | 
        <span class="text-orange-400">⏱ Análise concluída em ${responseTime}s</span>
    `;

    document.getElementById('analysisText').textContent = result.analise;
    document.getElementById('responseText').textContent = result.resposta_sugerida;

    document.getElementById('results').classList.remove('hidden');
    document.getElementById('feedbackSection').classList.remove('hidden');
}

// ============================================
// FUNÇÕES DE GERENCIAMENTO DE ARQUIVOS
// ============================================

function handleFileSelect(file) {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        showError('O arquivo não pode ser maior que 10MB.');
        return;
    }

    const validExtensions = ['.txt', '.pdf'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
        showError('Formato não suportado. Use arquivos .txt ou .pdf');
        return;
    }

    selectedFile = file;

    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('fileInfo').classList.remove('hidden');
}

function clearFile() {
    selectedFile = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').classList.add('hidden');
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function(event) {
            resolve(event.target.result);
        };

        reader.onerror = function() {
            reject(new Error('Erro ao ler o arquivo'));
        };

        // Lê como texto para .txt e PDFs (o backend processa PDFs)
        reader.readAsText(file);
    });
}

async function extractTextFromPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';

        // Itera por todas as páginas do PDF
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Extrai o texto de cada item da página
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');

            fullText += pageText + '\n';
        }

        return fullText.trim();
    } catch (error) {
        console.error('Erro ao extrair texto do PDF:', error);
        throw new Error('Não foi possível extrair o texto do PDF');
    }
}

// ============================================
// FUNÇÕES DE UTILIDADE
// ============================================

async function copyResponse(event) {
    const responseText = document.getElementById('responseText').textContent;

    try {
        await navigator.clipboard.writeText(responseText);

        const button = event.currentTarget;
        const originalHTML = button.innerHTML;
        button.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg><span>Copiado!</span>';
        button.className = 'mt-4 px-6 py-2 bg-green-600 text-white rounded-lg transition-all duration-300 flex items-center space-x-2';

        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.className = 'mt-4 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-all duration-300 flex items-center space-x-2';
        }, 2000);

    } catch (error) {
        const textArea = document.createElement('textarea');
        textArea.value = responseText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            showSuccessMessage('Resposta copiada!');
        } catch (err) {
            showError('Não foi possível copiar. Tente selecionar e copiar manualmente.');
        }

        document.body.removeChild(textArea);
    }
}

// ============================================
// DRAG AND DROP
// ============================================

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    const dropZone = document.getElementById('dropZone');
    dropZone.classList.add('drag-over');
}

function unhighlight(e) {
    const dropZone = document.getElementById('dropZone');
    dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

function initializeApp() {
    const dropZone = document.getElementById('dropZone');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    dropZone.addEventListener('drop', handleDrop, false);

    document.getElementById('fileInput').addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    console.log('Email Classifier AI inicializado com sucesso!');
    console.log('API URL:', API_URL);
    console.log('Histórico carregado:', getHistory().length, 'entradas');
}


document.addEventListener('DOMContentLoaded', initializeApp);

