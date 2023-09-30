import { Component, OnInit } from '@angular/core';
import { PresentationControllerService } from 'src/app/Presenter/presentation-controller.service';

@Component({
  selector: 'app-grid-view',
  templateUrl: './grid-view.component.html',
  styleUrls: ['./grid-view.component.scss']
})
export class GridViewComponent implements OnInit {
  areEditorsSwapped: boolean = false;
  tutorMode: boolean = false;

  constructor(
    private presentationController: PresentationControllerService,
  ) { }

  ngOnInit(): void {
    this.presentationController.switchEditors$.subscribe(
      content => {
        if(content.switchEditors === true){
          this.areEditorsSwapped = true;
        }
        else{
          this.areEditorsSwapped = false;
        }
      }
    )

    
    this.presentationController.tutorMode$.subscribe(
      content => {
        this.tutorMode = content.tutorMode;
      }
    )

  }

}
