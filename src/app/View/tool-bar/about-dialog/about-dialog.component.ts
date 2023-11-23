import { Component, OnInit } from '@angular/core';
import { PresentationControllerService } from 'src/app/Presenter/presentation-controller.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-about-dialog',
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.scss']
})
export class AboutDialogComponent implements OnInit {

  public currentApplicationVersion = environment.appVersion;

  constructor(
    private presentationController: PresentationControllerService
  ) { }

  ngOnInit(): void {
  }

  toggleGraphicsFunctionality() {
    this.presentationController.setGraphicsFunctionality(!this.presentationController.getGraphicsFunctionalityEnabled());
  }

}
