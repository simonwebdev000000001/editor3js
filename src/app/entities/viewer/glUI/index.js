import GUtils from "../../utils";
import Modals from "../../helpers/modals";

export default class GlUi {
    constructor(parent) {

        this.parent = parent;

        let self = this;

        (function init() {

            let fileContainer = self.container = document.createElement('div'),
                _self = parent,
                container = _self.container;

            fileContainer.className = "abs uni-glui";
            fileContainer.innerHTML = `
           
            <form action="" class="" style="background:white">
                <input type="file" name="myFile"  class="fullWidth"accept=".stl" multiple>
                 <fieldset id="group1">
                    <h3 class="field-desc">List of Parts</h3>
                    <div class="fields-list" id="part_list">
                        
                    </div> 
                </fieldset>  
                <fieldset id="group1">
                    <h3 class="field-desc">Main Settings</h3>
                    <div class="fields-list">
                        <div class="d-flex s-b">
                            <input type="checkbox" id="setting-1"  data-controls="settings-should_fill"/>
                            <label for="setting-1" style="width: 100%">Fill in chamber</label>
                        </div> 
                    </div> 
                </fieldset> 
                <fieldset id="group1">
                    <h3>Controls Settings</h3>
                    <div class="fields-list">
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
                    </div>
                </fieldset> 
                <fieldset id="group1">
                    <h3 class="field-desc">Controls Help</h3>
                    <ul class="fields-list">
                        <li>Double Click to reset camera view in the middle of chamber</li> 
                        <li>"Del" - delete selected parts</li> 
                        <li>Click on model to add to transform, second time clicking on same model will 
                        remove it from transform, click somewhere on scen will deselect all</li>
                        <li>Arrows Left and Right translate on X, Top and Down translate on Z, 
                        Holding Shift and Left or Right translate on Y </li>
                        <li>
                        "W" translate , "Q" toggle world/local space 
                        </li>
                    </ul> 
                </fieldset> 
                <fieldset id="group1">
                    <h3>Material</h3>
                     <div class="fields-list">
                        <input type="radio" name="material" value="1" ${_self.materialType == 1 ? 'checked="checked"' : ''} > Wireframe<br>
                        <input type="radio" name="material" value="2"> Basic<br>
                        <input type="radio" name="material" value="3" ${_self.materialType == 3 ? 'checked="checked"' : ''}> Phong
                     </div>
                 </fieldset>
                 <fieldset id="group2">
                    <h3>Export STL</h3>
                    <div class="fields-list">
                        <button>binary</button>
                        <button>ASCII</button>
                    </div>
                 </fieldset>
                 <fieldset id="group3">
                    <h3>Edit chamber</h3>
                    <div class="fields-list">
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
                        return Modals.ALERT().show({text: 'The total number of files exceeds the maximum for the build view'});
                    }
                    if (_self.TOTAL_FILE_LOADED + file.size >= GUtils.SETTINGS.MAX_TOTAL_FILE_SIZE) {
                        return Modals.ALERT().show({text: 'The total size of files exceeds the maximum for the build view'});
                    } else if (file.size >= GUtils.SETTINGS.MAX_SINGE_FILE_SIZE) {
                        haveBigFiles = true;
                        continue;
                    }
                    _self.loadStlFile(URL.createObjectURL(file), file.name);
                    _self.TOTAL_FILE_LOADED += file.size;
                }
                if (haveBigFiles) {
                    Modals.ALERT().show({text: 'Certain file(s) have not been rendered as they are too large'});
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
                        case 'settings-should_fill': {
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


            fileContainer.querySelector('#part_list').addEventListener('click', (e) => {
                let {dataset} = e.target;
                if (dataset.partDelete) {
                    parent._events.onDeletePart(self.getMeshByUUID(dataset.partDelete));

                } else if (dataset.partSelect) {
                    parent._events.onSelectPart(self.getMeshByUUID(dataset.partSelect));
                } else if (dataset.partCopy) {
                    new DuplicatePart(self.getMeshByUUID(dataset.partCopy))
                }
                return GUtils.onEventPrevent(e);
            })
            fileContainer.addEventListener('click', (e) => {
                if (e.target.tagName == 'H3' && e.target.parentNode.tagName == 'FIELDSET') {
                    let _q = fileContainer.querySelector('.fields-list.active');
                    if (_q) _q.className = _q.className.replace(' active', '');
                    e.target.parentNode.querySelector('.fields-list').className += ' active';
                }
            })
        })()
    }

    getMeshByUUID(meshUID) {
        let mesh;
        this.parent.scene.traverse((child) => {
            if (child.uuid == meshUID) {
                mesh = child;
                return false;
            }
        });
        return mesh;
    }

    onLoadPart(mesh) {
        let divContainer = `
        <div class="d-flex f-r s-b part-item-info">
                <label class="part-title" data-part-select="${mesh.uuid}">
                <input type="checkbox" data-part-select="${mesh.uuid}"> ${mesh.name}</label>
                <div class="actions">
                    <button data-part-delete="${mesh.uuid}">
                     <i class="fa fa-trash fa-lg" data-part-delete="${mesh.uuid}"></i>
                    </button>
                    <button data-part-copy="${mesh.uuid}">
                     <i class="fa fa-copy fa-lg" data-part-copy="${mesh.uuid}"></i>
                    </button>
                </div>
        </div>
        `;
        divContainer = GUtils.XMLtoHTNL(divContainer);
        this.container.querySelector('#part_list').appendChild(divContainer);
        mesh._onHtmlDeletePart = function () {
            divContainer.innerHTML = '';
            divContainer.parentNode.removeChild(divContainer);
        }
        mesh._onHtmlSelectPart = function () {
            let checkbox = divContainer.querySelector('input[data-part-select]');
            if (this.isSelected) {
                checkbox.setAttribute('checked', true);
            } else {
                checkbox.removeAttribute('checked')
            }

        }

    }
}

class DuplicatePart {
    constructor(mesh) {
        let modal = new (Modals.MODAL())(),
            spacingDefault = 2 * Math.round(mesh._helper.geometry.boundingSphere.radius),
            _box = mesh._helper.geometry.boundingBox,
            {height, width, depth} = mesh._boxSize();
        modal.content.innerHTML = `
          <h3>Duplicate</h3>
          <form action="" class="duplicate-part">
            <fieldset id="group1">
                <h3>Quantity </h3>
                <div class="fields-list">
                    <div class="d-flex s-b ">
                        <input type="number"  data-quantity="x" disabled value="1"/>
                    </div> 
                </div>
            </fieldset>  
            <fieldset id="group1">
                <h3>Inittial position(default position of copy target)</h3>
                <div class="fields-list">
                    <div class="d-flex s-b ">
                        <span>x</span>
                        <input type="number" min="0" step="1" data-position="x" value="${mesh.position.x}"/>
                    </div>
                    <div class="d-flex s-b ">
                        <span>y</span>
                        <input type="number" min="0" step="1" data-position="y" value="${mesh.position.x}"/>
                    </div>
                    <div class="d-flex s-b ">
                        <span>z</span>
                        <input type="number" min="0" step="1" data-position="z" value="${mesh.position.x}"/>
                    </div>
                </div>
            </fieldset> 
            <fieldset id="group1">
                <h3>Count of Copies</h3>
                <div class="fields-list">
                    <div class="d-flex s-b ">
                        <span>x</span> 
                        <div class="warning"></div>
                        <input type="number" min="1" step="1" data-copy="x" value="1"/>
                    </div>
                    <div class="d-flex s-b ">
                        <span>y</span>
                        <div class="warning"></div>
                        <input type="number" min="1" step="1" data-copy="y" value="1"/>
                    </div>
                    <div class="d-flex s-b ">
                        <span>z</span>
                        <div class="warning"></div>
                        <input type="number" min="1" step="1" data-copy="z" value="1"/>
                    </div>
                </div>
            </fieldset>
            <fieldset id="group1">
                <h3>Minimum distance from</h3>
                <div class="fields-list">
                    <div class="d-flex s-b ">
                        <span>x</span>
                        <input type="number" min="0" step="0.1" data-distance="x" value="0"/>
                    </div>
                    <div class="d-flex s-b ">
                        <span>y</span>
                        <input type="number" min="0" step="0.1" data-distance="y" value="0"/>
                    </div>
                    <div class="d-flex s-b ">
                        <span>z</span>
                        <input type="number" min="0" step="0.1" data-distance="z" value="0"/>
                    </div>
                </div>
            </fieldset> 
            <fieldset id="group1">
                <h3>Spacing between parts(default diameter  of bounding sphere)</h3>
                <div class="fields-list">
                    <div class="d-flex s-b ">
                        <span>x</span>
                        <input type="number" min="0" step="0.1" data-spacing="x" value="${width}"/>
                    </div>
                    <div class="d-flex s-b ">
                        <span>y</span>
                        <input type="number" min="0" step="0.1" data-spacing="y" value="${depth}"/>
                    </div>
                    <div class="d-flex s-b ">
                        <span>z</span>
                        <input type="number" min="0" step="0.1" data-spacing="z" value="${height}"/>
                    </div>
                </div>
            </fieldset>
        </form>
        `;
        [].forEach.call(modal.content.querySelectorAll('input'), (nodeItem) => {
            nodeItem.addEventListener('input', (e) => {
                let dimensionCopy = e.target.dataset.copy,
                    _val = parseFloat(e.target.value),
                    dimens, distance = 0;
                switch (dimensionCopy) {
                    case 'x': {
                        dimens = 'WIDTH';
                        distance = width;
                        break;
                    }
                    case 'y': {
                        dimens = 'DEPTH';
                        distance = depth;
                        break;
                    }
                    case 'z': {
                        dimens = 'HEIGHT';
                        distance = height;
                        break;
                    }
                }
                if (dimensionCopy) {
                    let quantity = 1;
                    [].forEach.call(document.body.querySelectorAll('input[data-copy]'), (el) => {
                        quantity *= parseInt(el.value);
                    });
                    modal.content.querySelector('input[data-quantity]').value = quantity;

                    if ((modal.content.querySelector('input[data-spacing="' + dimensionCopy + '"]').value) * _val + distance * (_val-1) < GUtils.CHAMPER[dimens] || _val === 1) {
                        let _w = e.target.parentNode.querySelector('.warnings');
                        if (_w) {
                            _w.parentNode.removeChild(_w);
                        }
                    } else {
                        if (!e.target.parentNode.querySelector('.warnings')) {
                            let _d = document.createElement('div');
                            _d.className = 'warnings';
                            _d.innerText = 'This number and arrangement of parts will not fit in the build chamber';
                            e.target.parentNode.querySelector('.warning').appendChild(_d);
                        }

                    }
                }
            })
        })
        modal.onOk = function () {
            let settings = {};
            [].forEach.call(modal.content.querySelectorAll('input'), (nodeItem) => {
                let field = Object.keys(nodeItem.dataset)[0],
                    dimension = nodeItem.dataset[field];
                if (!settings[field]) {
                    settings[field] = {}
                }
                settings[field][dimension] = parseFloat(nodeItem.value);

            })

            this.onClose();
            mesh._onDublicate(settings);
        }
    }

}