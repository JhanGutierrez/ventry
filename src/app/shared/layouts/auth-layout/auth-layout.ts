import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ɵInternalFormsSharedModule } from "@angular/forms";

@Component({
  selector: 'auth-layout',
  imports: [RouterOutlet, ɵInternalFormsSharedModule],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css'
})
export class AuthLayout {
}
