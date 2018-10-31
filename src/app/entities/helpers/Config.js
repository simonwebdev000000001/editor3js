export class Config {
    static randomInteger(min = 0, max = Date.now()) {
        return Math.round(min + Math.random() * (max - min))
    }

    static randomstr() {
        return Math.random().toString(36).replace(/[^a-z]+/g, '');
    }

    static onEventPrevent(event, shouldStopPropogation) {
        event.preventDefault();
        if (shouldStopPropogation) event.stopPropagation();
        return false;
    }

    static removeChildNodes(parent) {
        [].forEach.call(parent.children, function (child) {
            Config.removeChildNodes(child);

            // remove if it matches selector
            if (child.matches(':empty')) {
                parent.removeChild(child);
            }
        });
    }

    static getVolumeOfTriangle(p1, p2, p3) {
        var v321 = p3.x * p2.y * p1.z;
        var v231 = p2.x * p3.y * p1.z;
        var v312 = p3.x * p1.y * p2.z;
        var v132 = p1.x * p3.y * p2.z;
        var v213 = p2.x * p1.y * p3.z;
        var v123 = p1.x * p2.y * p3.z;
        return Math.abs((1 / 6) * (-v321 + v231 + v312 - v132 - v213 + v123));
    }

    static getSquareOfTriangle(p1, p2, p3) {

        let a = p1.distanceTo(p2),
            b = p2.distanceTo(p3),
            c = p3.distanceTo(p1),
            p = (a + b + c) / 2;
        return Math.sqrt(p * (p - a) * (p - b) * (p - c));
    }

    static isNumber(val) {
        return typeof val == 'number'
    }

    static isUndefined(val) {
        return typeof val == 'undefined'
    }
    static getImage(src, next) {
        let img = new Image();
        img.onload = function () {
            if (next) next(img);
        }
        img.src = src;
        img.crossOrigin = Config.ACCES_ORIGIN._ANONYM;
        //img.setAttribute('crossOrigin',Config.ACCES_ORIGIN.ANONYM);
        return img
    }
    static isDescendant(parent, child) {
        var node = child;
        while (node != null) {
            if (node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }

}
Config.DELIMETER = "/";
Config.LIGHT_TYPE = {
    AmbientLight: 1,
    HemisphereLight: 2,
    SpotLight: 3,
    DirectionalLight: 4,
    PointLight: 5
};
Config.EVENTS_NAME = {
    FULLSCREEN: {
        WEB_KIT: "webkitfullscreenchange",
        MOZ: "mozfullscreenchange",
        DEF: "fullscreenchange",
    },
    DRAG: {
        DROP: 'drop',
        OVER: 'dragover',
    },
    KEY: {
        DOWN: 'keydown',
        UP: 'keyup',
    },
    CNTXMENU: 'contextmenu',

    CHANGE: 'change',
    RESIZE: 'resize',
    DB_CLICK: 'dblclick',
    SELECT_START: 'selectstart',
    CLICK: 'click',
    TOUCH_START: 'touchstart',
    TOUCH_MOVE: 'touchmove',
    TOUCH_END: 'touchend',
    MOUSE_OUT: 'mouseout',
    MOUSE_DOWN: 'mousedown',
    MOUSE_MOVE: 'mousemove',
    MOUSE_UP: 'mouseup'
};
Config.ACCES_ORIGIN = {
    EMPTY: '',
    ANONYM: 'anonymous',
    _ANONYM: 'Anonymous',
    WITH_CRED: 'use-credentials'
};
Config.MAT_MAPS = ['map', "normalMap", "bumpMap", "metalnessMap", "roughnessMap", "displacementMap"];

Config.REALITY_DOMAIN = 'http://54.227.198.145';//http://54.164.221.209';
Config.REALITY_DOMAIN_REF = 'poly9/assets/';
Config.REALITY_DOMAIN_REF_UPLOADS = 'poly9/server/resources';
Config.REALITY_SERVER = Config.REALITY_DOMAIN + ':8080/';
Config.REMOTE_DATA = 'http://54.227.198.145/';//'http://192.168.2.109:3009/';
Config.REMOTE_DATA_CORS = Config.REMOTE_DATA + "public/remote_data?absUrl=";
Config.OBJ_STORAGE = 'models/my_models/';
Config.IMG_STORAGE = 'images/';
Config.TEXTURE_STORAGE = Config.IMG_STORAGE + 'Materials/';
Config.UI_STORAGE = Config.IMG_STORAGE + 'ui/';
Config.DEFAULT_IMAGE = Config.REMOTE_DATA + Config.UI_STORAGE + "DefaultImage.jpg";


Config.SHADERS = {
    HDR: {
        vert: 'varying vec2 vUv;' +
            'void main()	{' +
            'vUv  = uv;' +
            'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );' +
            '}',
        frgmnt: 'uniform' +
            'sampler2D' +
            'tDiffuse;' +
            'uniform' +
            'float' +
            'exposure;' +
            'uniform' +
            'float' +
            'brightMax;' +
            '' +
            'varying' +
            'vec2' +
            'vUv;' +
            '' +
            'vec3' +
            'decode_pnghdr(' +
            'const in' +
            'vec4' +
            'color' +
            ')' +
            '{' +
            '' +
            'vec4' +
            'rgbcolor = vec4(0.0, 0.0, 0.0, 0.0);' +
            '' +
            'if (color.w > 0.0) {' +
            'float' +
            'f = pow(2.0, 127.0 * (color.w - 0.5));' +
            'rgbcolor.xyz = color.xyz * f;' +
            '}' +
            'return rgbcolor.xyz;' +
            '' +
            '}' +
            '' +
            'void main()' +
            '{' +
            '' +
            'vec4' +
            'color = texture2D(tDiffuse, vUv);' +
            'color.xyz = decode_pnghdr(color);' +
            '// apply gamma correction and exposure' +    //gl_FragColor = vec4( pow( exposure * color.xyz, vec3( 0.474 ) ), 1.0 );'+'+
            'Y = dot(vec4(0.30, 0.59, 0.11, 0.0), color);' +
            'float' +
            'YD = exposure * (exposure / brightMax + 1.0) / (exposure + 1.0);' +
            'color *= YD;' +
            '' +
            'gl_FragColor = vec4(color.xyz, 1.0);' +
            '' +
            '}'
    }
}
Config.MODELS = {
    URL: {
        DEV_APP: Config.REALITY_DOMAIN + ':3009/public/uploadImg',
        ROOMS: Config.OBJ_STORAGE + 'rooms/',
        CUPS: Config.OBJ_STORAGE + 'cups/',
        CUPS_DECOR: Config.OBJ_STORAGE + 'cups_decor/',
    },
    TYPES: { MESH: 'Mesh', MATERIAL: 'material', _MESH: 1 },
    CATEGORY: {
        INNER: 'inner-from',
        EDITABLE_MAT: '--bla-bla-1'
    }
};
Config.FACTOR = {
    MATERIALS: 'https://s3.ap-south-1.amazonaws.com/p9-platform/',
    MODELS: 'https://s3.ap-south-1.amazonaws.com/p9-platform/Models/',
};
Config.FILE = {
    DIR: {
        CURRENT: '.',
        PREVIOUS: '',
        DELIMETER: "/",
        PROJECT_ROOM_PREVIEW: 'images/rooms/',
        PROJECT_ROOM_MODELS: 'assets/models/rooms/',
        PROJECT_TEMPLATE: {
            NAME: 'assets/templates/',
            CSS: 'style.css',
            HTML: 'index.html',
            JS: 'index.js',
            TYPES: ['controls/', 'tooltip/', 'preloader/'],
            _TYPE: {
                PRELOADER: 2,
                TOOLTIP: 1,
                CONTROLS: 0,
            }

        },
        PREVIEW: {
            LOW: 'low/',
            WEBP: 'webp/',
        }
    }

};