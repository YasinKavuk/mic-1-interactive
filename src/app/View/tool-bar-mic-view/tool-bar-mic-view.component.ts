import { Component, OnInit } from '@angular/core';
import { DirectorService } from 'src/app/Presenter/director.service';
import { ControllerService } from 'src/app/Presenter/controller.service';

@Component({
  selector: 'app-tool-bar-mic-view',
  templateUrl: './tool-bar-mic-view.component.html',
  styleUrls: ['./tool-bar-mic-view.component.scss']
})
export class ToolBarMicViewComponent implements OnInit {

  animate = true;
  animationSpeed:number;

  disableRunButton = true;
  disableStepButton = true;

  constructor(
    private director: DirectorService,
    private controller: ControllerService,
  ) {}

  ngOnInit(): void {
    this.animate = this.director.animationEnabled;
    this.animationSpeed = this.director.animationSpeed;

    this.director.finishedRun$.subscribe( result => {
      result ? this.enableRunButtons() : this.disableRunButtons();
    })

    this.director.errorFlasher$.subscribe( error=> {
      error.error ? this.disableRunButtons() : "";
    })
  }

  step(){
    this.controller.step();
  }

  stepMacro(){
    this.controller.stepMacro();
  }

  reset(){
    this.controller.reset();
  }

  private enableRunButtons(){
    this.disableRunButton = false;
    this.disableStepButton = false;
  }

  private disableRunButtons(){
    this.disableRunButton = true;
    this.disableStepButton = true;
  }

  run(){
    this.controller.run();
    this.disableRunButtons();
  }


  changeAnimSpeed(event:any){
    this.animationSpeed = event.value;
    this.director.setAnimationSpeed(this.animationSpeed);
  }

  toggleAnimVisibility(){
    this.director.toggleAnimationEnabled(this.animate);
  }

}
