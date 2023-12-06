import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { PresentationControllerService } from 'src/app/Presenter/presentation-controller.service';

@Component({
  selector: 'app-grid-view',
  templateUrl: './grid-view.component.html',
  styleUrls: ['./grid-view.component.scss'],
  animations: [
    trigger('flyIn', [
      state('hidden', style({
        opacity: 0,
        marginLeft: '-100%',
      })),
      state('visible', style({
        opacity: 1,
        marginLeft: '0%',
      })),
      transition('hidden => visible', [
        animate('0.3s ease-out')
      ]),
      transition('visible => hidden', [
        animate('0.3s ease-in')
      ]),
    ]),
  ],

})
export class GridViewComponent implements OnInit {
  areEditorsSwapped: boolean = false;
  tutorMode: boolean = false;
  graphicsFunctionality = false;

  constructor(
    private presentationController: PresentationControllerService,
  ) { }

  ngOnInit(): void {
    this.presentationController.switchEditors$.subscribe(
      content => {
        if (content.switchEditors === true) {
          this.areEditorsSwapped = true;
        }
        else {
          this.areEditorsSwapped = false;
        }
      }
    )


    this.presentationController.tutorMode$.subscribe(
      content => {
        this.tutorMode = content.tutorMode;
      }
    )


    this.presentationController.graphicsFunctionality$.subscribe(
      content => {
        this.graphicsFunctionality = content.graphicsFunctionality;
      }
    )
  }

}
