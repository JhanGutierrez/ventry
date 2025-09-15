import { Component, input } from '@angular/core';

@Component({
  selector: 'vt-spinner',
  imports: [],
  templateUrl: './vt-spinner.html',
  styleUrl: './vt-spinner.css'
})
export class VtSpinner {
  loaderText = input<string>();
}