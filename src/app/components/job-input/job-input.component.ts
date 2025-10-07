import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../services/ai.service';

type ApiKeyStatus = 'valid' | 'invalid' | 'pending' | '';

@Component({
  selector: 'app-job-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './job-input.component.html',
  styleUrls: ['./job-input.component.css']
})
export class JobInputComponent {
  @Output() pending = new EventEmitter<boolean>();
  @Output() result = new EventEmitter<{ summary: string; suggestions: string[] }>();

  jdText = signal<string>('');
  apiKey = '';
  apiKeyStatus: ApiKeyStatus = '';

  constructor(private readonly ai: AiService) {
    this.loadApiKey();
  }

  private loadApiKey(): void {
    const storedKey = localStorage.getItem('geminiApiKey');
    if (storedKey) {
      this.apiKey = storedKey;
    }
  }

  saveApiKey(): void {
    if (this.isValidApiKey(this.apiKey)) {
      localStorage.setItem('geminiApiKey', this.apiKey);
    }
  }

  isValidApiKey(key: string): boolean {
    return typeof key === 'string' && key.startsWith('AIza');
  }

  async verifyApiKey(): Promise<void> {
    if (!this.isValidApiKey(this.apiKey)) {
      this.apiKeyStatus = 'invalid';
      return;
    }
    this.apiKeyStatus = 'pending';
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
      const body = {
        contents: [
          {
            parts: [ { text: 'Hello' } ]
          }
        ]
      };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        this.apiKeyStatus = (data?.candidates?.length > 0) ? 'valid' : 'invalid';
      } else {
        this.apiKeyStatus = 'invalid';
      }
    } catch (error) {
      this.apiKeyStatus = 'invalid';
    }
  }

  analyze(): void {
    const text = this.jdText().trim();
    if (!text || !this.isValidApiKey(this.apiKey)) return;
    this.pending.emit(true);
    this.ai.analyzeJD(text, this.apiKey).subscribe({
      next: (res) => {
        this.result.emit(res);
        this.pending.emit(false);
      },
      error: () => {
        this.pending.emit(false);
      }
    });
  }

  updateJD(value: string): void {
    this.jdText.set(value);
  }
}
