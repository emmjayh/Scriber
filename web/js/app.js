/**
 * Main Application Controller
 * Coordinates all components and handles UI interactions
 */

class AudioNotesApp {
    constructor() {
        this.audioRecorder = null;
        this.noteExtractor = null;
        this.transcriptionHistory = [];
        
        // UI elements
        this.elements = {};
        
        // State
        this.isRecording = false;
        this.currentTranscription = '';
        this.currentNotes = null;
        this.recordingTimer = null;
        
        // Settings
        this.settings = {
            autoExtract: true,
            autoCopy: true,
            apiKey: '',
            whisperModel: 'base',
            noiseReduction: true,
            autoGain: true
        };
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            this.showLoadingScreen();
            this.updateLoadingProgress(10, 'Loading application...');
            
            // Initialize UI elements
            this.initializeElements();
            this.updateLoadingProgress(20, 'Setting up user interface...');
            
            // Check server status
            await this.checkServerStatus();
            this.updateLoadingProgress(40, 'Checking server status...');
            
            // Load settings
            this.loadSettings();
            this.updateLoadingProgress(60, 'Loading settings...');
            
            // Initialize components
            await this.initializeComponents();
            this.updateLoadingProgress(80, 'Initializing audio components...');
            
            // Set up event listeners
            this.setupEventListeners();
            this.updateLoadingProgress(90, 'Setting up controls...');
            
            // Load history
            this.loadHistory();
            this.updateLoadingProgress(100, 'Ready!');
            
            // Hide loading screen
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 500);
            
            console.log('Audio Notes Extractor initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize application: ' + error.message);
            this.hideLoadingScreen();
        }
    }

    /**
     * Initialize UI elements
     */
    initializeElements() {
        // Get all important DOM elements
        this.elements = {
            // Controls
            recordBtn: document.getElementById('recordBtn'),
            extractBtn: document.getElementById('extractBtn'),
            clearBtn: document.getElementById('clearBtn'),
            exportBtn: document.getElementById('exportBtn'),
            
            // Settings
            settingsBtn: document.getElementById('settingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            saveSettingsBtn: document.getElementById('saveSettingsBtn'),
            cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
            
            // Form elements
            contextSelect: document.getElementById('contextSelect'),
            autoExtract: document.getElementById('autoExtract'),
            autoCopy: document.getElementById('autoCopy'),
            apiKeyInput: document.getElementById('apiKeyInput'),
            whisperModel: document.getElementById('whisperModel'),
            noiseReduction: document.getElementById('noiseReduction'),
            autoGain: document.getElementById('autoGain'),
            
            // Display elements
            timer: document.getElementById('timer'),
            status: document.getElementById('status'),
            transcriptionText: document.getElementById('transcriptionText'),
            notesContent: document.getElementById('notesContent'),
            historyList: document.getElementById('historyList'),
            
            // Tabs
            tabBtns: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            
            // Action buttons
            copyTranscriptionBtn: document.getElementById('copyTranscriptionBtn'),
            saveTranscriptionBtn: document.getElementById('saveTranscriptionBtn'),
            copyNotesBtn: document.getElementById('copyNotesBtn'),
            saveNotesBtn: document.getElementById('saveNotesBtn'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            
            // Overlays
            progressOverlay: document.getElementById('progressOverlay'),
            progressTitle: document.getElementById('progressTitle'),
            progressMessage: document.getElementById('progressMessage'),
            progressFill: document.getElementById('progressFill'),
            loadingScreen: document.getElementById('loadingScreen'),
            loadingMessage: document.getElementById('loadingMessage'),
            loadingProgressFill: document.getElementById('loadingProgressFill'),
            
            // Server status
            serverStatus: document.getElementById('serverStatus'),
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText')
        };
    }

    /**
     * Initialize components
     */
    async initializeComponents() {
        // Initialize audio recorder
        this.audioRecorder = new AudioRecorder();
        
        // Initialize note extractor
        this.noteExtractor = new NoteExtractor();
        
        // Check browser support
        if (!AudioRecorder.isSupported()) {
            throw new Error('Audio recording is not supported in this browser');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Recording controls
        this.elements.recordBtn.addEventListener('click', () => this.toggleRecording());
        this.elements.extractBtn.addEventListener('click', () => this.extractNotes());
        this.elements.clearBtn.addEventListener('click', () => this.clearAll());
        this.elements.exportBtn.addEventListener('click', () => this.exportData());
        
        // Settings
        this.elements.settingsBtn.addEventListener('click', () => this.showSettings());
        this.elements.closeSettingsBtn.addEventListener('click', () => this.hideSettings());
        this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.elements.cancelSettingsBtn.addEventListener('click', () => this.hideSettings());
        
        // Tabs
        this.elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Action buttons
        this.elements.copyTranscriptionBtn.addEventListener('click', () => this.copyTranscription());
        this.elements.saveTranscriptionBtn.addEventListener('click', () => this.saveTranscription());
        this.elements.copyNotesBtn.addEventListener('click', () => this.copyNotes());
        this.elements.saveNotesBtn.addEventListener('click', () => this.saveNotes());
        this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        
        // Settings changes
        this.elements.autoExtract.addEventListener('change', (e) => {
            this.settings.autoExtract = e.target.checked;
        });
        this.elements.autoCopy.addEventListener('change', (e) => {
            this.settings.autoCopy = e.target.checked;
        });
        
        // Modal close on background click
        this.elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.hideSettings();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(e) {
        // Space to toggle recording (when not typing)
        if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            this.toggleRecording();
        }
        
        // Escape to stop recording or close modals
        if (e.code === 'Escape') {
            if (this.isRecording) {
                this.stopRecording();
            } else if (!this.elements.settingsModal.classList.contains('hidden')) {
                this.hideSettings();
            }
        }
        
        // Ctrl+E to extract notes
        if (e.ctrlKey && e.code === 'KeyE') {
            e.preventDefault();
            this.extractNotes();
        }
        
        // Ctrl+S to save
        if (e.ctrlKey && e.code === 'KeyS') {
            e.preventDefault();
            const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
            if (activeTab === 'transcription') {
                this.saveTranscription();
            } else {
                this.saveNotes();
            }
        }
    }

    /**
     * Toggle recording
     */
    async toggleRecording() {
        if (this.isRecording) {
            await this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    /**
     * Start recording
     */
    async startRecording() {
        try {
            this.updateStatus('Initializing recording...');
            
            // Initialize recorder if needed
            if (!this.audioRecorder.audioStream) {
                await this.audioRecorder.initialize();
            }
            
            // Start recording
            await this.audioRecorder.startRecording();
            
            // Update UI
            this.isRecording = true;
            this.elements.recordBtn.innerHTML = '<i class="fas fa-stop"></i> <span>Stop Recording</span>';
            this.elements.recordBtn.classList.add('btn-recording');
            this.updateStatus('Recording in progress...');
            
            // Start timer
            this.startTimer();
            
        } catch (error) {
            console.error('Failed to start recording:', error);
            this.showError('Failed to start recording: ' + error.message);
            this.resetRecordingUI();
        }
    }

    /**
     * Stop recording
     */
    async stopRecording() {
        try {
            this.updateStatus('Stopping recording...');
            
            // Stop recording
            const result = await this.audioRecorder.stopRecording();
            
            // Reset UI
            this.resetRecordingUI();
            
            if (result && result.audioBlob) {
                this.updateStatus('Processing audio...');
                await this.processRecording(result);
            } else {
                this.updateStatus('No audio recorded');
            }
            
        } catch (error) {
            console.error('Failed to stop recording:', error);
            this.showError('Failed to stop recording: ' + error.message);
            this.resetRecordingUI();
        }
    }

    /**
     * Process recorded audio
     */
    async processRecording(recordingData) {
        try {
            // Show progress overlay
            this.showProgress('Processing Audio', 'Transcribing your recording...');
            this.updateProgress(20);
            
            // For now, use browser speech recognition as a fallback
            // In a real implementation, this would use Whisper.cpp WebAssembly
            await this.transcribeAudio(recordingData);
            
        } catch (error) {
            console.error('Failed to process recording:', error);
            this.showError('Failed to process recording: ' + error.message);
            this.hideProgress();
        }
    }

    /**
     * Transcribe audio (placeholder implementation)
     */
    async transcribeAudio(recordingData) {
        try {
            this.updateProgress(40, 'Transcribing audio...');
            
            // Create a mock transcription for demonstration
            // In a real implementation, this would use Whisper.cpp WebAssembly
            const mockTranscription = await this.getMockTranscription();
            
            this.updateProgress(80, 'Processing transcription...');
            
            // Set transcription
            this.currentTranscription = mockTranscription;
            this.elements.transcriptionText.value = mockTranscription;
            
            // Auto-copy if enabled
            if (this.settings.autoCopy) {
                await this.copyToClipboard(mockTranscription);
                this.updateStatus('Transcription copied to clipboard');
            }
            
            // Add to history
            this.addToHistory(mockTranscription, null, this.elements.contextSelect.value);
            
            // Auto-extract notes if enabled
            if (this.settings.autoExtract) {
                this.updateProgress(90, 'Extracting notes...');
                await this.extractNotes();
            } else {
                this.elements.extractBtn.disabled = false;
                this.updateStatus('Transcription complete');
                this.hideProgress();
            }
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get mock transcription (for demonstration)
     * In a real implementation, this would be replaced with Whisper.cpp
     */
    async getMockTranscription() {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockTranscriptions = [
            "Good morning everyone, let's start today's meeting. We need to discuss the quarterly budget and assign tasks for the upcoming project. Sarah, can you handle the marketing campaign? John, you'll be responsible for the financial analysis. We should have everything completed by next Friday.",
            
            "Thank you for joining today's interview. Can you tell me about your experience with JavaScript and React? I've been working with React for about three years, building various web applications. My biggest project was an e-commerce platform that served over 10,000 daily users.",
            
            "Welcome to today's lecture on machine learning. We'll cover supervised learning, unsupervised learning, and reinforcement learning. The key concept is that algorithms can learn patterns from data without being explicitly programmed for every scenario.",
            
            "I was thinking about our vacation plans. We should book the flights soon because prices are going up. What do you think about visiting Italy or Greece? We need to set a budget and make sure we can get time off work in July."
        ];
        
        return mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
    }

    /**
     * Extract notes from current transcription
     */
    async extractNotes() {
        if (!this.currentTranscription || !this.currentTranscription.trim()) {
            this.showError('No transcription available to extract notes from');
            return;
        }
        
        try {
            this.showProgress('Extracting Notes', 'Analyzing transcription for key insights...');
            this.updateProgress(30);
            
            const context = this.elements.contextSelect.value;
            
            // Extract notes
            const notes = await this.noteExtractor.extractNotes(this.currentTranscription, context);
            this.updateProgress(80);
            
            // Format notes
            const formattedNotes = this.noteExtractor.formatNotes(notes);
            this.updateProgress(95);
            
            // Display notes
            this.currentNotes = formattedNotes;
            this.displayNotes(formattedNotes);
            
            // Update history
            this.updateHistoryWithNotes(formattedNotes);
            
            // Switch to notes tab
            this.switchTab('notes');
            
            this.updateStatus('Notes extracted successfully');
            this.hideProgress();
            
        } catch (error) {
            console.error('Failed to extract notes:', error);
            this.showError('Failed to extract notes: ' + error.message);
            this.hideProgress();
        }
    }

    /**
     * Display notes in the UI
     */
    displayNotes(formattedNotes) {
        // Convert markdown to HTML for better display
        const htmlNotes = this.markdownToHtml(formattedNotes);
        this.elements.notesContent.innerHTML = htmlNotes;
        this.elements.notesContent.classList.add('content-update');
        
        setTimeout(() => {
            this.elements.notesContent.classList.remove('content-update');
        }, 500);
    }

    /**
     * Convert markdown to HTML (simple implementation)
     */
    markdownToHtml(markdown) {
        return markdown
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^\* (.*$)/gm, '<em>$1</em>')
            .replace(/^- \[ \] (.*$)/gm, '<ul><li>☐ $1</li></ul>')
            .replace(/^- (.*$)/gm, '<ul><li>$1</li></ul>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    /**
     * Switch tabs
     */
    switchTab(tabName) {
        // Update tab buttons
        this.elements.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab content
        this.elements.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Tab');
        });
    }

    /**
     * Start recording timer
     */
    startTimer() {
        const startTime = Date.now();
        
        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            this.elements.timer.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    /**
     * Stop recording timer
     */
    stopTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        this.elements.timer.textContent = '00:00';
    }

    /**
     * Reset recording UI
     */
    resetRecordingUI() {
        this.isRecording = false;
        this.elements.recordBtn.innerHTML = '<i class="fas fa-microphone"></i> <span>Start Recording</span>';
        this.elements.recordBtn.classList.remove('btn-recording');
        this.stopTimer();
    }

    /**
     * Copy to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            // Fallback method
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    }

    /**
     * Copy transcription
     */
    async copyTranscription() {
        const text = this.elements.transcriptionText.value;
        if (text) {
            await this.copyToClipboard(text);
            this.updateStatus('Transcription copied to clipboard');
        }
    }

    /**
     * Copy notes
     */
    async copyNotes() {
        if (this.currentNotes) {
            await this.copyToClipboard(this.currentNotes);
            this.updateStatus('Notes copied to clipboard');
        }
    }

    /**
     * Save transcription
     */
    saveTranscription() {
        const text = this.elements.transcriptionText.value;
        if (text) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `transcription_${timestamp}.txt`;
            this.downloadText(text, filename);
            this.updateStatus('Transcription saved');
        }
    }

    /**
     * Save notes
     */
    saveNotes() {
        if (this.currentNotes) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `notes_${timestamp}.md`;
            this.downloadText(this.currentNotes, filename);
            this.updateStatus('Notes saved');
        }
    }

    /**
     * Download text as file
     */
    downloadText(text, filename) {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Clear all content
     */
    clearAll() {
        this.currentTranscription = '';
        this.currentNotes = null;
        this.elements.transcriptionText.value = '';
        this.elements.notesContent.innerHTML = '<div class="notes-placeholder"><i class="fas fa-lightbulb"></i><p>Extracted notes will appear here after transcription</p></div>';
        this.elements.extractBtn.disabled = true;
        this.updateStatus('Ready to record');
    }

    /**
     * Export all data
     */
    exportData() {
        const data = {
            transcription: this.elements.transcriptionText.value,
            notes: this.currentNotes,
            history: this.transcriptionHistory,
            timestamp: new Date().toISOString()
        };
        
        const json = JSON.stringify(data, null, 2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `audio_notes_export_${timestamp}.json`;
        
        this.downloadText(json, filename);
        this.updateStatus('Data exported');
    }

    /**
     * Add to history
     */
    addToHistory(transcription, notes, context) {
        const item = {
            id: Date.now(),
            timestamp: new Date(),
            transcription: transcription,
            notes: notes,
            context: context
        };
        
        this.transcriptionHistory.unshift(item);
        
        // Keep only last 50 items
        if (this.transcriptionHistory.length > 50) {
            this.transcriptionHistory = this.transcriptionHistory.slice(0, 50);
        }
        
        this.updateHistoryDisplay();
        this.saveHistoryToStorage();
    }

    /**
     * Update history with notes
     */
    updateHistoryWithNotes(notes) {
        if (this.transcriptionHistory.length > 0) {
            this.transcriptionHistory[0].notes = notes;
            this.updateHistoryDisplay();
            this.saveHistoryToStorage();
        }
    }

    /**
     * Update history display
     */
    updateHistoryDisplay() {
        const historyList = this.elements.historyList;
        
        if (this.transcriptionHistory.length === 0) {
            historyList.innerHTML = '<div class="history-empty">No recent sessions</div>';
            return;
        }
        
        historyList.innerHTML = '';
        
        this.transcriptionHistory.slice(0, 10).forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.onclick = () => this.loadHistoryItem(item);
            
            const preview = item.transcription.substring(0, 60) + 
                (item.transcription.length > 60 ? '...' : '');
            
            div.innerHTML = `
                <div class="history-item-time">${item.timestamp.toLocaleString()} - ${item.context}</div>
                <div class="history-item-preview">${preview}</div>
            `;
            
            historyList.appendChild(div);
        });
    }

    /**
     * Load history item
     */
    loadHistoryItem(item) {
        this.currentTranscription = item.transcription;
        this.elements.transcriptionText.value = item.transcription;
        this.elements.contextSelect.value = item.context;
        
        if (item.notes) {
            this.currentNotes = item.notes;
            this.displayNotes(item.notes);
        } else {
            this.elements.notesContent.innerHTML = '<div class="notes-placeholder"><i class="fas fa-lightbulb"></i><p>No notes extracted for this session</p></div>';
        }
        
        this.elements.extractBtn.disabled = false;
        this.updateStatus('History item loaded');
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.transcriptionHistory = [];
        this.updateHistoryDisplay();
        this.saveHistoryToStorage();
        this.updateStatus('History cleared');
    }

    /**
     * Show settings modal
     */
    showSettings() {
        // Load current settings into form
        this.elements.autoExtract.checked = this.settings.autoExtract;
        this.elements.autoCopy.checked = this.settings.autoCopy;
        this.elements.apiKeyInput.value = this.settings.apiKey;
        this.elements.whisperModel.value = this.settings.whisperModel;
        this.elements.noiseReduction.checked = this.settings.noiseReduction;
        this.elements.autoGain.checked = this.settings.autoGain;
        
        this.elements.settingsModal.classList.remove('hidden');
    }

    /**
     * Hide settings modal
     */
    hideSettings() {
        this.elements.settingsModal.classList.add('hidden');
    }

    /**
     * Save settings
     */
    saveSettings() {
        // Get values from form
        this.settings.autoExtract = this.elements.autoExtract.checked;
        this.settings.autoCopy = this.elements.autoCopy.checked;
        this.settings.apiKey = this.elements.apiKeyInput.value;
        this.settings.whisperModel = this.elements.whisperModel.value;
        this.settings.noiseReduction = this.elements.noiseReduction.checked;
        this.settings.autoGain = this.elements.autoGain.checked;
        
        // Update note extractor
        this.noteExtractor.setApiKey(this.settings.apiKey);
        
        // Update audio recorder settings
        this.audioRecorder.updateSettings({
            noiseReduction: this.settings.noiseReduction,
            autoGain: this.settings.autoGain
        });
        
        // Save to localStorage
        this.saveSettingsToStorage();
        
        this.hideSettings();
        this.updateStatus('Settings saved');
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('audioNotesSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.settings = { ...this.settings, ...settings };
                
                // Apply settings to UI
                this.elements.autoExtract.checked = this.settings.autoExtract;
                this.elements.autoCopy.checked = this.settings.autoCopy;
                this.elements.contextSelect.value = this.settings.defaultContext || 'general';
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettingsToStorage() {
        try {
            localStorage.setItem('audioNotesSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    /**
     * Load history from localStorage
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem('audioNotesHistory');
            if (saved) {
                const history = JSON.parse(saved);
                this.transcriptionHistory = history.map(item => ({
                    ...item,
                    timestamp: new Date(item.timestamp)
                }));
                this.updateHistoryDisplay();
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    /**
     * Save history to localStorage
     */
    saveHistoryToStorage() {
        try {
            localStorage.setItem('audioNotesHistory', JSON.stringify(this.transcriptionHistory));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }

    /**
     * Update status message
     */
    updateStatus(message) {
        this.elements.status.textContent = message;
    }

    /**
     * Show progress overlay
     */
    showProgress(title, message) {
        this.elements.progressTitle.textContent = title;
        this.elements.progressMessage.textContent = message;
        this.elements.progressOverlay.classList.remove('hidden');
    }

    /**
     * Update progress
     */
    updateProgress(percentage, message = null) {
        this.elements.progressFill.style.width = percentage + '%';
        if (message) {
            this.elements.progressMessage.textContent = message;
        }
    }

    /**
     * Hide progress overlay
     */
    hideProgress() {
        this.elements.progressOverlay.classList.add('hidden');
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        this.elements.loadingScreen.classList.remove('hidden');
    }

    /**
     * Update loading progress
     */
    updateLoadingProgress(percentage, message) {
        this.elements.loadingProgressFill.style.width = percentage + '%';
        this.elements.loadingMessage.textContent = message;
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        this.elements.loadingScreen.classList.add('hidden');
    }

    /**
     * Check server status
     */
    async checkServerStatus() {
        try {
            this.elements.statusDot.className = 'status-indicator connecting';
            this.elements.statusText.textContent = 'Connecting...';
            
            const response = await fetch('/api/status');
            if (response.ok) {
                const data = await response.json();
                this.elements.statusDot.className = 'status-indicator';
                this.elements.statusText.textContent = 'Connected';
                console.log('Server status:', data);
            } else {
                throw new Error('Server not responding');
            }
        } catch (error) {
            this.elements.statusDot.className = 'status-indicator error';
            this.elements.statusText.textContent = 'Offline mode';
            console.warn('Server status check failed:', error);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        alert('Error: ' + message); // Simple error display for now
        console.error(message);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AudioNotesApp();
});