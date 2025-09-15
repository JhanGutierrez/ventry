import { Component, input, output } from '@angular/core';

@Component({
  selector: 'vt-button',
  imports: [],
  templateUrl: './vt-button.html',
  styleUrl: './vt-button.css'
})
export class VtButton {
  disabled = input<boolean>(false);
  buttonType = input<'button' | 'reset' | 'submit'>('submit');
  onClick = output<void>();
}