import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from './loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    @if (loading.isLoading()) {
      <div class="global-loader" role="status" aria-live="polite" aria-label="Loading">
        <div class="loader-spinner"></div>
      </div>
    }
    <router-outlet />
  `
})
export class AppComponent {
  constructor(readonly loading: LoadingService) {}
}
