export type CharacterQuipEvent = 'perfect' | 'victory' | 'defeat';

interface CharacterAudioProfile {
  wave: OscillatorType;
  baseFreq: number;
  formantFreq: number;
  cadenceMs: number;
  signature: 'heroic' | 'flame' | 'spring' | 'tech' | 'anvil' | 'royal';
  quips: Record<CharacterQuipEvent, string[]>;
}

const CHARACTER_QUIP_LIBRARY: Record<string, CharacterAudioProfile> = {
  leo: {
    wave: 'triangle',
    baseFreq: 390,
    formantFreq: 1350,
    cadenceMs: 75,
    signature: 'heroic',
    quips: {
      perfect: ['Toma essa!', 'Na mosca!', 'Giro perfeito!'],
      victory: ['Pela cidade livre!', 'Ninguém segura o bairro!'],
      defeat: ['Ugh... vou voltar mais forte!', 'A garrafa escorregou...'],
    },
  },
  brasa: {
    wave: 'sawtooth',
    baseFreq: 310,
    formantFreq: 1650,
    cadenceMs: 80,
    signature: 'flame',
    quips: {
      perfect: ['Quente demais!', 'Ardeu aí?!', 'Pimenta pura!'],
      victory: ['Sinta o calor da feira!', 'Virou churrasco!'],
      defeat: ['Apagaram meu fogo...', 'Água, rápido!'],
    },
  },
  mola: {
    wave: 'sine',
    baseFreq: 480,
    formantFreq: 1850,
    cadenceMs: 62,
    signature: 'spring',
    quips: {
      perfect: ['Boing! Peguei!', 'Rápido demais!', 'Salto certeiro!'],
      victory: ['Quem manda nos telhados?!', 'Nem me viu passar!'],
      defeat: ['Perdi o embalo...', 'Minha mola travou!'],
    },
  },
  nina: {
    wave: 'square',
    baseFreq: 430,
    formantFreq: 2100,
    cadenceMs: 68,
    signature: 'tech',
    quips: {
      perfect: ['Ângulo calculado!', 'Precisão 100%!', 'Vetor perfeito!'],
      victory: ['A matemática nunca erra.', 'Experimento concluído!'],
      defeat: ['Erro de cálculo!', 'Recalibrando sensores...'],
    },
  },
  ferro: {
    wave: 'sawtooth',
    baseFreq: 175,
    formantFreq: 780,
    cadenceMs: 105,
    signature: 'anvil',
    quips: {
      perfect: ['Peso de ferro!', 'Pancada blindada!', 'Sente o aço!'],
      victory: ['Inabalável como os trilhos.', 'Muralha intacta!'],
      defeat: ['Rachou o casco...', 'Desarmei...'],
    },
  },
  karrolo: {
    wave: 'sawtooth',
    baseFreq: 145,
    formantFreq: 960,
    cadenceMs: 110,
    signature: 'royal',
    quips: {
      perfect: ['Ajoelhe-se!', 'Carrollo Real!', 'Obedeça ao Rei!'],
      victory: ['Esta cidade é minha!', 'Vida longa ao Rei Karrolo!'],
      defeat: ['Minha coroa... impossível!', 'Traição na arena!'],
    },
  },
  rich_boss: {
    wave: 'triangle',
    baseFreq: 250,
    formantFreq: 1200,
    cadenceMs: 85,
    signature: 'royal',
    quips: {
      perfect: ['Cascudo de ouro!', 'Pague a taxa do píer!', 'Elegância letal!'],
      victory: ['Tudo tem um preço no meu cais.', 'Comprei a vitória!'],
      defeat: ['Meu paletó de linho! Inadmissível!', 'Isso vai sair caro!'],
    },
  },
  boss_lady: {
    wave: 'square',
    baseFreq: 350,
    formantFreq: 1650,
    cadenceMs: 72,
    signature: 'flame',
    quips: {
      perfect: ['Acha que é forte?!', 'Coque de respeito!', 'Segura a feira!'],
      victory: ['Na minha praça ninguém se cria!', 'Pode recolher a banca!'],
      defeat: ['Tsc... você tem pulso firme mesmo.', 'Da próxima não alivio!'],
    },
  },
  clown: {
    wave: 'sawtooth',
    baseFreq: 520,
    formantFreq: 2200,
    cadenceMs: 58,
    signature: 'spring',
    quips: {
      perfect: ['Hahaha! Tock na cuca!', 'Surpresa no picadeiro!', 'Olha o guizo!'],
      victory: ['O show sempre termina comigo rindo!', 'Fim de espetáculo!'],
      defeat: ['Ei! Estragaram minha piada final!', 'Caí fora do trapézio!'],
    },
  },
  big_boss: {
    wave: 'sawtooth',
    baseFreq: 115,
    formantFreq: 680,
    cadenceMs: 120,
    signature: 'anvil',
    quips: {
      perfect: ['CASCUDO PESADO!', 'Tremeu o trilho?!', 'Mão de marreta!'],
      victory: ['Tamanho ajuda... e muito!', 'Fora da minha estação!'],
      defeat: ['Grr... como segurou esse coque?!', 'Recuo tático!'],
    },
  },
  knight: {
    wave: 'sawtooth',
    baseFreq: 135,
    formantFreq: 860,
    cadenceMs: 112,
    signature: 'royal',
    quips: {
      perfect: ['Curvem-se diante do Rei!', 'Manopla Real!', 'Sentença da Cidadela!'],
      victory: ['Nenhum plebeu derruba a armadura real!', 'Curvem-se!'],
      defeat: ['Meu elmo... rachado por um garrafão?!', 'O trono caiu...'],
    },
  },
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;
  public musicEnabled = true;
  private bgmTimer: number | null = null;
  private bgmStep = 0;

  private ensureCtx(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(m: boolean) {
    this.muted = m;
    if (m) {
      this.stopArenaMusic();
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopArenaMusic();
    }
  }

  public startArenaMusic() {
    if (this.muted || !this.musicEnabled || typeof window === 'undefined') return;
    if (this.bgmTimer !== null) return;
    const bassPattern = [130.81, 0, 164.81, 196.0, 146.83, 0, 174.61, 196.0];
    const leadPattern = [523.25, 0, 659.25, 0, 587.33, 659.25, 783.99, 0];

    this.bgmTimer = window.setInterval(() => {
      if (this.muted || !this.musicEnabled) return;
      if (!this.ctx || this.ctx.state !== 'running') return;
      const step = this.bgmStep % bassPattern.length;
      this.bgmStep += 1;

      const bassFreq = bassPattern[step];
      if (bassFreq > 0) {
        this.playTone(bassFreq, bassFreq * 0.98, 0.14, 'triangle', 0.042);
      }

      const leadFreq = leadPattern[step];
      if (leadFreq > 0 && this.bgmStep > 8) {
        this.playTone(leadFreq, leadFreq, 0.08, 'sine', 0.024);
      }

      if (step % 2 === 1) {
        this.playNoiseSizzle(0.035, 3200, 0.018);
      }
    }, 190);
  }

  public stopArenaMusic() {
    if (this.bgmTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  public playTone(
    freq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'triangle',
    gainVal = 0.16
  ) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  private playFilteredSyllable(
    freq: number,
    endFreq: number,
    formantFreq: number,
    duration: number,
    wave: OscillatorType,
    gainVal = 0.12
  ) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), now + duration);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(formantFreq, now);
    filter.Q.value = 3.2;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  private playNoiseSizzle(duration: number, centerFreq: number, gainVal: number) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = centerFreq;
    const gain = ctx.createGain();
    gain.gain.value = gainVal;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  /**
   * Plays a character-specific personality voice chatter + signature SFX motif
   * and returns the matching quip line for display.
   */
  public playCharacterQuip(charId: string, event: CharacterQuipEvent): string {
    const profile = CHARACTER_QUIP_LIBRARY[charId] || CHARACTER_QUIP_LIBRARY.leo;
    const pool = profile.quips[event];
    const quip = pool[Math.floor(Math.random() * pool.length)];

    const ctx = this.ensureCtx();
    if (!ctx) return quip;

    // 1. Cartoon formant-filtered voice syllables matched to emotion
    const syllableOffsets =
      event === 'victory'
        ? [1.0, 1.18, 1.32, 1.5]
        : event === 'perfect'
        ? [1.05, 1.35, 1.25]
        : [1.0, 0.86, 0.72];

    syllableOffsets.forEach((mult, idx) => {
      setTimeout(() => {
        const startF = profile.baseFreq * mult;
        const endF =
          event === 'defeat' ? startF * 0.78 : startF * (idx === syllableOffsets.length - 1 ? 1.18 : 1.05);
        this.playFilteredSyllable(
          startF,
          endF,
          profile.formantFreq,
          profile.cadenceMs / 1000 + 0.04,
          profile.wave,
          0.14
        );
      }, idx * profile.cadenceMs);
    });

    // 2. Signature personality SFX flourish
    const sigDelay = event === 'perfect' ? 20 : 120;
    setTimeout(() => {
      if (profile.signature === 'heroic') {
        if (event !== 'defeat') {
          this.playTone(660, 1180, 0.18, 'triangle', 0.13);
        } else {
          this.playTone(420, 210, 0.25, 'triangle', 0.11);
        }
      } else if (profile.signature === 'flame') {
        this.playNoiseSizzle(0.24, event === 'defeat' ? 600 : 1900, 0.18);
        if (event !== 'defeat') {
          this.playTone(260, 520, 0.18, 'sawtooth', 0.09);
        }
      } else if (profile.signature === 'spring') {
        // Elastic boing
        const start = event === 'defeat' ? 520 : 280;
        const end = event === 'defeat' ? 190 : 880;
        this.playTone(start, end, 0.22, 'sine', 0.16);
        setTimeout(() => this.playTone(end * 0.8, start * 1.3, 0.14, 'sine', 0.11), 90);
      } else if (profile.signature === 'tech') {
        const notes = event === 'defeat' ? [740, 520, 310] : [880, 1174, 1567];
        notes.forEach((f, i) => {
          setTimeout(() => this.playTone(f, f, 0.07, 'square', 0.08), i * 55);
        });
      } else if (profile.signature === 'anvil') {
        // Metallic clang
        this.playTone(130, 88, 0.28, 'triangle', 0.18);
        this.playTone(940, 890, 0.22, 'square', 0.07);
      } else if (profile.signature === 'royal') {
        // Royal brass fanfare or shattered crown
        const chord = event === 'defeat' ? [293.66, 207.65] : [261.63, 329.63, 392.0];
        chord.forEach((f) => {
          this.playTone(f, event === 'defeat' ? f * 0.72 : f * 1.02, 0.3, 'sawtooth', 0.08);
        });
      }
    }, sigDelay);

    return quip;
  }

  public playComboChime(combo: number) {
    if (combo < 2) return;
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];
    const idx = Math.min(scale.length - 1, combo - 2);
    const f = scale[idx];
    this.playTone(f, f * 1.25, 0.14, 'triangle', 0.13);
    if (combo >= 4) {
      setTimeout(() => this.playTone(f * 1.5, f * 1.55, 0.16, 'triangle', 0.1), 60);
    }
  }

  public playGrab() {
    this.playTone(320, 480, 0.08, 'triangle', 0.12);
  }

  public playSpinLaunch() {
    this.playTone(180, 620, 0.22, 'sawtooth', 0.11);
  }

  public playBottleBounce() {
    this.playTone(220, 110, 0.09, 'square', 0.12);
  }

  public playBottleUpright() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, f * 1.03, 0.16, 'triangle', 0.15), idx * 55);
    });
  }

  public playBottleFail() {
    this.playTone(210, 85, 0.28, 'sawtooth', 0.14);
  }

  public playCarrolloHit(intensity: 'normal' | 'perfect' | 'critical' | 'charged') {
    const ctx = this.ensureCtx();
    if (!ctx) return;

    // Punch noise burst + sub thump
    const subFreq = intensity === 'critical' ? 160 : intensity === 'perfect' ? 140 : 110;
    const dur = intensity === 'critical' ? 0.34 : 0.22;
    this.playTone(subFreq, 38, dur, 'square', intensity === 'critical' ? 0.26 : 0.18);

    // Crisp slap snap
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.025));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = intensity === 'critical' ? 1800 : 1200;
    const gain = ctx.createGain();
    gain.gain.value = intensity === 'critical' ? 0.32 : 0.22;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    if (intensity === 'perfect' || intensity === 'critical') {
      setTimeout(() => this.playTone(880, 1320, 0.15, 'triangle', 0.12), 40);
    }
  }

  public playBlock() {
    this.playTone(680, 420, 0.14, 'square', 0.16);
  }

  public playSkill() {
    this.playTone(392, 784, 0.24, 'triangle', 0.16);
  }

  public playVictory() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, f, 0.22, 'triangle', 0.16), idx * 100);
    });
  }

  public playDefeat() {
    [392, 349.23, 311.13, 261.63].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, f * 0.94, 0.24, 'sawtooth', 0.12), idx * 120);
    });
  }
}

export const soundEngine = new SoundEngine();
