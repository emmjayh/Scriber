/**
 * AudioRecorder - Handles client-side audio recording
 * Uses Web Audio API for high-quality recording
 */

class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioStream = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.startTime = null;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.noiseGate = null;
        
        // Settings
        this.settings = {
            sampleRate: 16000,
            channels: 1,
            bitsPerSample: 16,
            noiseReduction: true,
            autoGain: true
        };
    }

    /**
     * Initialize the audio recorder
     */
    async initialize() {
        try {
            // Check for browser support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Audio recording is not supported in this browser');
            }

            // Request microphone permission
            const constraints = {
                audio: {
                    channelCount: this.settings.channels,
                    sampleRate: this.settings.sampleRate,
                    echoCancellation: true,
                    noiseSuppression: this.settings.noiseReduction,
                    autoGainControl: this.settings.autoGain
                }
            };

            this.audioStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Create audio context for advanced processing
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: this.settings.sampleRate
            });
            
            // Set up audio processing chain
            this.setupAudioProcessing();
            
            console.log('Audio recorder initialized successfully');
            return true;

        } catch (error) {
            console.error('Failed to initialize audio recorder:', error);
            throw error;
        }
    }

    /**
     * Set up audio processing chain
     */
    setupAudioProcessing() {
        if (!this.audioStream || !this.audioContext) return;

        // Create microphone source
        this.microphone = this.audioContext.createMediaStreamSource(this.audioStream);
        
        // Create analyser for volume monitoring
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        
        // Connect audio processing chain
        this.microphone.connect(this.analyser);
        
        // Create MediaRecorder
        this.mediaRecorder = new MediaRecorder(this.audioStream, {
            mimeType: this.getSupportedMimeType(),
            audioBitsPerSecond: this.settings.sampleRate * this.settings.bitsPerSample * this.settings.channels
        });

        // Set up event listeners
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            this.handleRecordingStop();
        };

        this.mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event.error);
            this.handleRecordingError(event.error);
        };
    }

    /**
     * Get supported MIME type for recording
     */
    getSupportedMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/ogg',
            'audio/wav',
            'audio/mp4'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return 'audio/webm'; // fallback
    }

    /**
     * Start recording
     */
    async startRecording() {
        try {
            if (!this.mediaRecorder) {
                await this.initialize();
            }

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.audioChunks = [];
            this.startTime = Date.now();
            this.isRecording = true;

            this.mediaRecorder.start(100); // Record in 100ms chunks
            
            console.log('Recording started');
            return true;

        } catch (error) {
            console.error('Failed to start recording:', error);
            this.isRecording = false;
            throw error;
        }
    }

    /**
     * Stop recording
     */
    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) {
            return Promise.resolve(null);
        }

        return new Promise((resolve, reject) => {
            this.stopResolve = resolve;
            this.stopReject = reject;
            
            this.isRecording = false;
            this.mediaRecorder.stop();
        });
    }

    /**
     * Handle recording stop
     */
    async handleRecordingStop() {
        try {
            if (this.audioChunks.length === 0) {
                throw new Error('No audio data recorded');
            }

            // Create blob from chunks
            const audioBlob = new Blob(this.audioChunks, { 
                type: this.mediaRecorder.mimeType 
            });

            // Convert to WAV format for better compatibility
            const audioBuffer = await this.convertToWav(audioBlob);
            
            const duration = Date.now() - this.startTime;
            
            const result = {
                audioBlob: audioBuffer,
                duration: duration,
                mimeType: 'audio/wav',
                sampleRate: this.settings.sampleRate,
                channels: this.settings.channels
            };

            console.log('Recording stopped, duration:', duration, 'ms');
            
            if (this.stopResolve) {
                this.stopResolve(result);
                this.stopResolve = null;
                this.stopReject = null;
            }

        } catch (error) {
            console.error('Error handling recording stop:', error);
            if (this.stopReject) {
                this.stopReject(error);
                this.stopResolve = null;
                this.stopReject = null;
            }
        }
    }

    /**
     * Handle recording error
     */
    handleRecordingError(error) {
        console.error('Recording error:', error);
        this.isRecording = false;
        
        if (this.stopReject) {
            this.stopReject(error);
            this.stopResolve = null;
            this.stopReject = null;
        }
    }

    /**
     * Convert audio blob to WAV format
     */
    async convertToWav(audioBlob) {
        try {
            // Convert blob to array buffer
            const arrayBuffer = await audioBlob.arrayBuffer();
            
            // Decode audio data
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Convert to WAV
            const wavBlob = this.audioBufferToWav(audioBuffer);
            
            return wavBlob;

        } catch (error) {
            console.error('Error converting to WAV:', error);
            // Return original blob if conversion fails
            return audioBlob;
        }
    }

    /**
     * Convert AudioBuffer to WAV blob
     */
    audioBufferToWav(buffer) {
        const length = buffer.length;
        const sampleRate = buffer.sampleRate;
        const numberOfChannels = buffer.numberOfChannels;
        
        // Create WAV header
        const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * numberOfChannels * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numberOfChannels * 2, true);
        view.setUint16(32, numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * numberOfChannels * 2, true);
        
        // Convert audio data
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    /**
     * Get current audio level (for visualization)
     */
    getAudioLevel() {
        if (!this.analyser) return 0;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        
        return sum / bufferLength / 255; // Normalize to 0-1
    }

    /**
     * Check if recording is in progress
     */
    getIsRecording() {
        return this.isRecording;
    }

    /**
     * Get recording duration
     */
    getRecordingDuration() {
        if (!this.isRecording || !this.startTime) return 0;
        return Date.now() - this.startTime;
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        // Reinitialize if settings changed
        if (this.audioStream) {
            this.cleanup();
            // Will reinitialize on next recording
        }
    }

    /**
     * Clean up resources
     */
    cleanup() {
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.mediaRecorder = null;
        this.analyser = null;
        this.microphone = null;
        this.isRecording = false;
    }

    /**
     * Check browser compatibility
     */
    static isSupported() {
        return !!(navigator.mediaDevices && 
                 navigator.mediaDevices.getUserMedia && 
                 window.MediaRecorder);
    }
}

// Export for use in other modules
window.AudioRecorder = AudioRecorder;