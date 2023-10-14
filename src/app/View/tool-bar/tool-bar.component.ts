import { Component, HostBinding, OnInit, ViewChild } from '@angular/core';
import { ControllerService } from 'src/app/Presenter/controller.service';
import { MatDialog } from '@angular/material/dialog';
import { GettingStartedDialogComponent } from './getting-started-dialog/getting-started-dialog.component';
import { AboutDialogComponent } from './about-dialog/about-dialog.component';
import { ImportDialogComponent } from './import-dialog/import-dialog.component';
import { ExportDialogComponent } from './export-dialog/export-dialog.component';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ThemeControlService } from 'src/app/Presenter/theme-control.service';
import { PresentationControllerService } from 'src/app/Presenter/presentation-controller.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-tool-bar',
  templateUrl: './tool-bar.component.html',
  styleUrls: ['./tool-bar.component.scss']
})
export class ToolBarComponent implements OnInit {
  file: String;

  @ViewChild('fileMac') importMac: any;
  @ViewChild('fileMic') importMic: any;
  @HostBinding('class') className = '';

  public currentApplicationVersion = environment.appVersion;

  lightMode: boolean;


  constructor(
    private controllerService: ControllerService,
    private dialog: MatDialog,
    private themeControl: ThemeControlService,
    private presentationController: PresentationControllerService,
  ) { }

  ngOnInit(): void { 
    this.lightMode = this.themeControl.darkMode;
  }

  ngDoCheck() {
  }

  openGettingStartedDialog() {
    const dialogRef = this.dialog.open(GettingStartedDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: $(result)`);
    });
  }

  openAboutDialog() {
    const dialogRef = this.dialog.open(AboutDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: $(result)`);
    });
  }

  openImportDialog(){
    const dialogRef = this.dialog.open(ImportDialogComponent);

    dialogRef.afterClosed().subscribe(result =>{
      console.log(`Dialog result: $(result)`)
    })
  }

  openExportDialog(){
    const dialogRef = this.dialog.open(ExportDialogComponent);

    dialogRef.afterClosed().subscribe(result =>{
      console.log(`Dialog result: $(result)`)
    })
  }

  public switchEditors(event: MatSlideToggleChange){
    this.controllerService.reset()
    this.presentationController.switchEditors();
  }

  public toggleTheme(event: MatSlideToggleChange) {
    this.themeControl.toggleTheme();
  }

  public togglePresentationMode(event: MatSlideToggleChange) {
    this.presentationController.toggleMode();
  }

  public toggleTutorMode(event: MatSlideToggleChange){
    this.presentationController.setTutorMode(event.checked);
  }

}
