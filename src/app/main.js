import {UniApp} from "./entities/UniApp.js";

HTMLElement.prototype._delete=function(){
    this.innerHTML="";
    this.parentNode.removeChild(this);
}
/**
 * export main functionality in global namespace
 */
window.UniApp  = UniApp;