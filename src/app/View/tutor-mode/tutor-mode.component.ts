import { Component, OnInit } from '@angular/core';
import { ControllerService } from 'src/app/Presenter/controller.service';
import { PresentationControllerService } from 'src/app/Presenter/presentation-controller.service';

@Component({
  selector: 'app-tutor-mode',
  templateUrl: './tutor-mode.component.html',
  styleUrls: ['./tutor-mode.component.scss']
})
export class TutorModeComponent implements OnInit {
  files: File[] = [];
  hideDropzone = false;

  constructor(
    private presentationController: PresentationControllerService,
    private controller: ControllerService,
  ) { }

  ngOnInit(): void {
    this.presentationController.loadFilesToTutMode$.subscribe(
      content => {
        if (content.files[0] !== undefined) {
          this.files.push(...content.files)
        }
      }
    )

    this.presentationController.removeFileFromList$.subscribe(
      content => {
        if (content.fileIndex !== undefined) {
          this.files.splice(content.fileIndex, 1)
        }
      }
    )
  }


  onSelect(event: any) {
    if (event.rejectedFiles.length > 0) {
      console.warn("rejected File: '" + event.rejectedFiles[0].name + "'\ntype '" + event.rejectedFiles[0].type + "' is not supported")
    }

    let files = event.addedFiles.filter((file: File) => file.type === "application/json")
    let zipFiles = event.addedFiles.filter((file: File) => file.type !== "application/json")

    // extract files from zip 
    if (zipFiles.length > 0) {
      const jsZip = require("jszip");

      jsZip.loadAsync(zipFiles[0]).then(
        (zip: any) => Object.keys(zip.files).forEach(
          (filename) => zip.files[filename].async("string").then(
            (fileData: string) => this.files.push(new File([fileData], filename, { type: "application/json" }))
          )
        )
      )
    }


    this.files.push(...files)

    console.log(this.files)
  }

  onRemove(event: any) {
    this.files.splice(this.files.indexOf(event), 1)
    console.log("onRemove")
  }

  onAddFiles() {
    console.log("onAddFiles")
    this.hideDropzone = true;
    //this.controller.importFiles(this.files);
    //this.dialogRef.close();
  }

  importToBothEditors(fileIndex: number) {
    this.controller.importFile(this.files[fileIndex])
  }

  importToMicroEditor(fileIndex: number) {
    this.controller.importFile(this.files[fileIndex], "micro")
  }

  importToMacroEditor(fileIndex: number) {
    this.controller.importFile(this.files[fileIndex], "macro")
  }

  removeFile(fileIndex: number) {
    this.presentationController.removeFile(fileIndex)
  }

}
