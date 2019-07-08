import {GlViewer} from "./viewer/glViewer.js";
import {Utils} from "../utils.js";

/**
 * Class representing a main action.
 */
export class UniApp {
    /**
     *@constructor
     *
     */
    constructor() {



        this.materials = [];
        this.urlParams = {};
        let urlObj = location.href.split("?")[1];
        if (urlObj)urlObj = urlObj.split("&");
        if (urlObj) {
            for (let i = 0; i < urlObj.length; i++) {
                let _obj = urlObj[i].split("=");
                if (_obj.length > 1) {
                    this.urlParams[_obj[0]] = _obj[1];
                }
            }
        }
        this.glViewer = new GlViewer(this.options, {
            component: this,
            options: {}
        });

    }


}


UniApp.Utils = Utils;
