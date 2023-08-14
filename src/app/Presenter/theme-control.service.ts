import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeControlService {

  constructor() {
    let darkMode = localStorage.getItem("mode");
    if (darkMode === "false") {
      this.darkMode = false;
    } else {
      this.darkMode = true;
      document.body.classList.toggle("light-theme");
      document.body.classList.toggle("darkMode");
    }
    this._toggleThemeNotifier.next(this.darkMode);
  }

  private _toggleThemeNotifier = new BehaviorSubject(false);
  public toggleThemeNotifier$ = this._toggleThemeNotifier.asObservable();

  public darkMode = false;


  public toggleTheme() {
    document.body.classList.toggle("light-theme");
    document.body.classList.toggle("darkMode");
    this.darkMode = !this.darkMode;
    localStorage.setItem("mode", String(this.darkMode));
    this._toggleThemeNotifier.next(this.darkMode);
  }
}
