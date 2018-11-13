import GUtils from "../../utils";
import Modals from "../../helpers/modals";

export default class GlUi {
    constructor(parent) {

        this.parent = parent;

        let self = this;

        (function init() {

            let fileContainer = document.createElement('div'),
                _self = parent,
                container = _self.container;

            fileContainer.className = "abs uni-glui";
            fileContainer.innerHTML = `
           
            <form action="" class="" style="background:white">
                <input type="file" name="myFile" accept=".stl" multiple>
                 <fieldset id="group1">
                    <h3>Main Settings</h3>
                    <div class="d-flex s-b ">
                        <input type="checkbox" id="setting-1"  data-controls="settings-should_fill"/>
                        <label for="setting-1">Fill in chamber</label>
                    </div> 
                </fieldset> 
                <fieldset id="group1">
                    <h3>Controls Settings</h3>
                    <div class="d-flex s-b ">
                        <span>Step increments(mm),only for Keyboard</span>
                        <input type="number" min="0" step="0.5" data-controls="increments-keyboard_translate" value="${GUtils.CONTROLS.INCREMENTS.KEYBOARD_TRANSLATE}"/>
                    </div>
                    <div class="d-flex s-b ">
                        <span>Increments Translate(mm)</span>
                        <input type="number" min="0" step="0.5" data-controls="increments-translate" value="${GUtils.CONTROLS.INCREMENTS.TRANSLATE}"/>
                    </div>
                    <div class="d-flex s-b ">
                        <span>Increments Rotating(deg)</span>
                        <input type="number" min="0" step="0.5" data-controls="increments-rotate" value="${GUtils.CONTROLS.INCREMENTS.ROTATE}"/>
                    </div>
                </fieldset> 
                <fieldset id="group1">
                    <h3>Controls Help</h3>
                    <ul>
                        <li>Double Click to reset camera view in the middle of chamber</li> 
                        <li>"Del" - delete selected parts</li> 
                        <li>Click on model to add to transform, second time clicking on same model will 
                        remove it from transform, click somewhere on scen will deselect all</li>
                        <li>Arrows Left and Right translate on X, Top and Down translate on Z, 
                        Holding Shift and Left or Right translate on Y </li>
                        <li>
                           
                        "W" translate | "E" rotate | "R" scale | "+" increase size | "-" decrease size
                        "Q" toggle world/local space | Hold "Ctrl" down to snap to grid
                        "X" toggle X | "Y" toggle Y | "Z" toggle Z | "Spacebar" toggle enabled
                        </li>
                    </ul> 
                </fieldset> 
                <fieldset id="group1">
                    <p>Material</p>
                    <input type="radio" name="material" value="1" ${_self.materialType == 1 ? 'checked="checked"' : ''} > Wireframe<br>
                    <input type="radio" name="material" value="2"> Basic<br>
                    <input type="radio" name="material" value="3" ${_self.materialType == 3 ? 'checked="checked"' : ''}> Phong
                 </fieldset>
                 <fieldset id="group2">
                    <p>Export STL</p>
                    <button>binary</button>
                    <button>ASCII</button>
                 </fieldset>
                 <fieldset id="group3">
                    <p>Edit chamber</p>
                    <div class="d-flex s-b ">
                        <span>X(width)</span>
                        <input type="number" min="1" data-chamber="WIDTH" value="${GUtils.CHAMPER.WIDTH}"/>
                    </div>
                    <div class="d-flex s-b ">
                        <span>Y(depth)</span>
                        <input type="number" min="1"data-chamber="HEIGHT" value="${GUtils.CHAMPER.HEIGHT}"/>
                    </div>
                    <div class="d-flex s-b ">
                        <span>Z(height)</span>
                        <input type="number" min="1"data-chamber="DEPTH" value="${GUtils.CHAMPER.DEPTH}"/>
                    </div>
                 </fieldset>
                
            </form>
            `;
            container.appendChild(fileContainer);
            let file = fileContainer.querySelector('input[type="file"]'),
                radioButtons = fileContainer.querySelectorAll('input[type="radio"]'),
                checkboxButtons = fileContainer.querySelectorAll('input[type="checkbox"]'),
                exportBtns = fileContainer.querySelectorAll('button');
            file.addEventListener('change', function (e) {
                let fileList = e.target.files,
                    haveBigFiles = false;
                for (let i = 0; i < fileList.length; i++) {
                    let file = fileList[i];
                    if (_self.TOTAL_ITEMS_FILE_LOADED++ > GUtils.SETTINGS.MAX_FILE_ITEMS_COUNT) {
                        return Modals.ALERT().show({ text: 'The total number of files exceeds the maximum for the build view' });
                    }
                    if (_self.TOTAL_FILE_LOADED + file.size >= GUtils.SETTINGS.MAX_TOTAL_FILE_SIZE) {
                        return Modals.ALERT().show({ text: 'The total size of files exceeds the maximum for the build view' });
                    } else if (file.size >= GUtils.SETTINGS.MAX_SINGE_FILE_SIZE) {
                        haveBigFiles = true;
                        continue;
                    } 
                    _self.loadStlFile(URL.createObjectURL(file),file.name);
                    _self.TOTAL_FILE_LOADED += file.size;
                }
                if (haveBigFiles) {
                    Modals.ALERT().show({ text: 'Certain file(s) have not been rendered as they are too large' });
                }

                return;

                /*fileReader = new FileReader();;
               // _self.loadStlFile(_f);
    
               
                fileReader.onload = function (evt) {
                 //_self.loadStlFile(URL.createObjectURL(new Blob([evt.target.result],{type:_f.type})));
                 //_self.loadStlFile(URL.createObjectURL(new Blob([new Uint8Array(data)],{type:_f.type})));
                 };
               // Load blob as Data URL
                fileReader.readAsArrayBuffer(_f); */

                /*var chunkSize = 1024 * 1024 * 30; //10MB Chunk size
                var fileSize = file.size;
                var currentChunk = 1;
                var totalChunks = Math.ceil((fileSize / chunkSize), chunkSize);
     
    
                (function loadChunkFile(delta=0) {  
                    chunkSize +=delta;
                    offset-=delta;
                    var offset = (currentChunk - 1) * chunkSize;
                    var currentFilePart = file.slice(offset, (offset + chunkSize)); 
                   
                    _self.loadStlFile(URL.createObjectURL(currentFilePart)).then(() => {
                        if (currentChunk <=  totalChunks) {
                            setTimeout(() => {
                                currentChunk++;
                                loadChunkFile();
                            }, 1000)
                        }
    
                    }).catch(()=>{
                        currentChunk++;
                        loadChunkFile();
                       
                    });
                })()*/
            });
            for (let i = 0; i < radioButtons.length; i++) {
                radioButtons[i].addEventListener('click', function (e) {
                    _self.materialType = e.target.value;
                    _self.updateMaterials();
                })
            }
            for (let i = 0; i < exportBtns.length; i++) {
                exportBtns[i].addEventListener('click', function (e) {
                    e.preventDefault();
                    parent.exportToStl(e);
                })
            }
            for (let i = 0; i < checkboxButtons.length; i++) {
                checkboxButtons[i].addEventListener('change', function (e) {
                    e.preventDefault();
                    switch (e.target.dataset.controls) {
                        case 'settings-should_fill':{
                            GUtils.SETTINGS.SHOULD_FILL = e.target.checked;
                            break;
                        }
                    }
                })
            }

            //chanber settings
            let inputs = fileContainer.querySelectorAll('input[type="number"]');
            for (let i = 0; i < inputs.length; i++) {
                let _input = inputs[i];
                _input.addEventListener('change', function (e) {
                    let dataSet = e.target.dataset,
                        key = Object.keys(dataSet)[0],
                        val = e.target.value;

                    switch (key) {
                        case 'chamber': {
                            GUtils.CHAMPER[dataSet[key]] = val;
                            parent.applyBoxChamber();
                            break;
                        }
                        case 'controls': {
                            let main = parent;
                            switch (dataSet[key]) {
                                case 'increments-translate': {
                                    if (val == 0) {
                                        main.transformControls.setTranslationSnap(null);
                                    } else {
                                        main.transformControls.setTranslationSnap(val);
                                    }
                                    break;
                                }
                                case 'increments-rotate': {
                                    if (val == 0) {
                                        main.transformControls.setRotationSnap(null);
                                    } else {
                                        main.transformControls.setRotationSnap(THREE.Math.degToRad(val));
                                    }

                                    break;
                                }
                                case 'increments-keyboard_translate': {
                                    GUtils.CONTROLS.INCREMENTS.KEYBOARD_TRANSLATE = parseFloat(val);
                                }
                            }

                            break;
                        }
                    }
                })
            }

        })()
    }

}