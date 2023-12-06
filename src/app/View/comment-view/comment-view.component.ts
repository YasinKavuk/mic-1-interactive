import { Component, OnInit } from '@angular/core';
import { PresentationControllerService } from 'src/app/Presenter/presentation-controller.service';

@Component({
  selector: 'app-comment-view',
  templateUrl: './comment-view.component.html',
  styleUrls: ['./comment-view.component.css']
})
export class CommentViewComponent implements OnInit {
  tutorMode: boolean = false;
  comment: string = "";

  constructor(
    private presentationController: PresentationControllerService,
  ) { }

  ngOnInit(): void {
    this.presentationController.tutorMode$.subscribe(
      content => {
        this.tutorMode = content.tutorMode;
      }
    )

    this.presentationController.showComment$.subscribe(
      content => {
        if(content.comment !== ""){
          this.comment = "" + content;
        }
      }
    )
  }

}
