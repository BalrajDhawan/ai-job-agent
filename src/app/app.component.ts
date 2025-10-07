import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobInputComponent } from './components/job-input/job-input.component';
import { SummaryViewComponent } from './components/summary-view/summary-view.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, JobInputComponent, SummaryViewComponent, LoadingSpinnerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'AI Job Application Assistant';
  isLoading = signal(false);
  summary = signal<string | null>(null);
  suggestions = signal<string[] | null>(null);

  onPending(pending: boolean) { this.isLoading.set(pending); }
  onResult(payload: { summary: string; suggestions: string[] }) {
    this.summary.set(payload.summary);
    this.suggestions.set(payload.suggestions);
  }
}
