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

        Node.prototype._display = function (disp) {
            this.style.display = disp ? 'block' : 'none';
        };
        Image.prototype.load = function (url) {
            var thisImg = this;
            var xmlHTTP = new XMLHttpRequest();
            xmlHTTP.open('GET', url, true);
            xmlHTTP.responseType = 'arraybuffer';
            xmlHTTP.onload = function (e) {
                var blob = new Blob([this.response]);
                thisImg.src = window.URL.createObjectURL(blob);
            };
            xmlHTTP.onprogress = function (e) {
                thisImg.completedPercentage = parseInt((e.loaded / e.total) * 100);
                if (thisImg.onprogress)thisImg.onprogress(thisImg.completedPercentage);
            };
            xmlHTTP.onloadstart = function () {
                thisImg.completedPercentage = 0;
                if (thisImg.onStartLoad)thisImg.onStartLoad();
            };
            xmlHTTP.send();
        };
        window.addEventListener("error", function (e) {
            if (e && e.target && e.target.nodeName && e.target.nodeName.toLowerCase() == "img") {
                e.target.src = Utils.Config.DEFAULT_IMAGE;
            }
        }, true);
        THREE.ImageUtils.crossOrigin = '';
        Image.prototype.completedPercentage = 0;
        //Image.prototype.crossOrigin = 'anonymous';
        String.prototype.json = function () {
            if (this.length < 2)return this;
            return JSON.parse(this)
        };

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
