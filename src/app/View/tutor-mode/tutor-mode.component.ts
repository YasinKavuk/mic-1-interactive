import { Component, OnInit } from '@angular/core';
import { ControllerService } from 'src/app/Presenter/controller.service';
import { PresentationControllerService } from 'src/app/Presenter/presentation-controller.service';

@Component({
  selector: 'app-tutor-mode',
  templateUrl: './tutor-mode.component.html',
  styleUrls: ['./tutor-mode.component.scss']
})
export class TutorModeComponent implements OnInit {
  files:File[] = [];
  hideDropzone = false;

  constructor(
    private presentationController: PresentationControllerService,
    private controller: ControllerService,
  ) {}

  ngOnInit(): void {
    this.presentationController.loadFilesToTutMode$.subscribe(
      content => {
        this.files.push(...content.files)
      }
    )
  }

  
  onSelect(event: any){
    this.files.push(...event.addedFiles)
    console.log(this.files)
    console.log("onSelect")
  }

  onRemove(event: any){
    this.files.splice(this.files.indexOf(event),1)
    console.log("onRemove")
  }

  onAddFiles(){
    console.log("onAddFiles")
    this.hideDropzone = true;
    //this.controller.importFiles(this.files);
    //this.dialogRef.close();
  }

  importToBothEditors(fileIndex: number){
    this.controller.importFile(this.files[fileIndex])
  }

  importToMicroEditor(fileIndex: number){
    this.controller.importFile(this.files[fileIndex], "micro")
  }

  importToMacroEditor(fileIndex: number){
    this.controller.importFile(this.files[fileIndex], "macro")
  }

}
