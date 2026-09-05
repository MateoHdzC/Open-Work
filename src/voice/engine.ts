export interface VoiceConfig {
  enabled: boolean;
  autoSpeak: boolean;
  voiceName?: string;
  interruptionEnabled: boolean;
}

export class VoiceEngine {
  private config: VoiceConfig;
  private isListening = false;
  private isSpeaking = false;

  constructor(config?: Partial<VoiceConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      autoSpeak: config?.autoSpeak ?? true,
      voiceName: config?.voiceName,
      interruptionEnabled: config?.interruptionEnabled ?? true,
    };
  }

  public getConfig(): VoiceConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public startListening(): void {
    this.isListening = true;
  }

  public stopListening(): void {
    this.isListening = false;
  }

  public interrupt(): void {
    if (this.isSpeaking) {
      this.isSpeaking = false;
    }
  }

  public getStatus(): { isListening: boolean; isSpeaking: boolean; enabled: boolean } {
    return {
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      enabled: this.config.enabled,
    };
  }
}