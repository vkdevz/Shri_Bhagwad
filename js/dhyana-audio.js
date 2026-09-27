// Dhyana Audio Engine: 432 Hz Sacred Tanpura Drone & Pranayama Guide
class DhyanaAudioEngine {
    constructor() {
        this.audioCtx = null;
        this.isPlaying = false;
        this.oscillators = [];
        this.masterGain = null;
        this.baseFreq = 108.0; // 432 Hz / 4 = 108 Hz (Sacred Sa)
    }

    initAudio() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
            this.masterGain.connect(this.audioCtx.destination);
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    toggleDrone() {
        this.initAudio();
        if (this.isPlaying) {
            this.stopDrone();
            return false;
        } else {
            this.startDrone();
            return true;
        }
    }

    startDrone() {
        if (this.isPlaying) return;
        this.initAudio();

        // Harmonics of Indian Classical Tanpura (Sa - Pa - Sa' - Sa'')
        // 108Hz (Sa), 162Hz (Pa = 3/2), 216Hz (High Sa), 432Hz (Pranic Sa)
        const harmonics = [
            { freq: this.baseFreq, type: 'sawtooth', gain: 0.12 },
            { freq: this.baseFreq * 1.5, type: 'sine', gain: 0.15 },
            { freq: this.baseFreq * 2.0, type: 'triangle', gain: 0.10 },
            { freq: this.baseFreq * 4.0, type: 'sine', gain: 0.08 }
        ];

        // Low-pass filter for warm, soothing temple ambiance
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, this.audioCtx.currentTime);
        filter.connect(this.masterGain);

        this.oscillators = harmonics.map(h => {
            const osc = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();

            osc.type = h.type;
            osc.frequency.setValueAtTime(h.freq, this.audioCtx.currentTime);

            // Gentle LFO tremolo (breathing effect)
            const lfo = this.audioCtx.createOscillator();
            const lfoGain = this.audioCtx.createGain();
            lfo.frequency.setValueAtTime(0.15, this.audioCtx.currentTime); // 0.15 Hz slow wave
            lfoGain.gain.setValueAtTime(0.03, this.audioCtx.currentTime);
            lfo.connect(lfoGain.gain);
            lfo.start();

            gainNode.gain.setValueAtTime(h.gain, this.audioCtx.currentTime);
            osc.connect(gainNode);
            gainNode.connect(filter);
            osc.start();

            return { osc, lfo };
        });

        this.isPlaying = true;
    }

    stopDrone() {
        if (!this.isPlaying) return;
        this.oscillators.forEach(o => {
            try {
                o.osc.stop();
                o.lfo.stop();
                o.osc.disconnect();
                o.lfo.disconnect();
            } catch (e) {}
        });
        this.oscillators = [];
        this.isPlaying = false;
    }

    playTempleChime() {
        this.initAudio();
        const chimeFreq = 540; // G5
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(chimeFreq, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(chimeFreq * 1.5, this.audioCtx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 3.0);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 3.0);
    }
}

window.dhyanaAudio = new DhyanaAudioEngine();
