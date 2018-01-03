import {Utils} from '../../utils.js';

export class GLMain {
    constructor() {
        this.Utils = Utils;
        this.id = Date.now();
        this.callback_storage = [];
    }

    clone() {
        let noClone = ['id'],
            acceptType = ['boolean', 'string', 'number'];

        function cloneObject(obj) {
            var temp = obj instanceof Array ? [] : new obj.constructor();
            for (var i in obj) {
                if (noClone.indexOf(i) > -1 )
                    continue;
                else if (typeof(obj[i]) == "object" && obj[i] != null)
                    temp[i] = cloneObject(obj[i]);
                else if (obj.hasOwnProperty(i) && acceptType.indexOf(typeof obj[i]) > -1)
                    temp[i] = obj[i];
            }
            return temp;
        }

        return cloneObject(this);

    }
}