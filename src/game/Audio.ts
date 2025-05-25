/// <reference lib="dom" />

declare var Audio: {
  prototype: HTMLAudioElement;
  new(src?: string): HTMLAudioElement;
};
declare var console: Console;

export class AudioManager {
  private sounds: { [key: string]: HTMLAudioElement } = {};

  constructor() {
    // Hier können wir Sounds vorladen
    this.loadSounds();
  }

  private loadSounds(): void {
    // Countdown-Sounds laden
    this.loadSound('beep-prepare', 'sounds/beep-prepare.mp3');
    this.loadSound('beep-go', 'sounds/beep-go.mp3');
  }

  private loadSound(name: string, path: string): void {
    const sound = new Audio(path);
    this.sounds[name] = sound;
  }

  public playSound(name: string): void {
    if (this.sounds[name]) {
      this.sounds[name].currentTime = 0;
      this.sounds[name].play().catch((error) => {
        console.error(`Error playing sound ${name}:`, error);
      });
    } else {
      console.warn(`Sound ${name} not found`);
    }
  }

  public stopSound(name: string): void {
    if (this.sounds[name]) {
      this.sounds[name].pause();
      this.sounds[name].currentTime = 0;
    }
  }
}