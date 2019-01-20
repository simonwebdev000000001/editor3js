export default class GUtils {

    static SETTINGS = {
        SHOULD_FILL: false,
        ROUND: 2,
        CONTAINER_APP_ID: 'WEBGLVIEW',
        MAX_TOTAL_FILE_SIZE: 1024 * 1000 * 1000 * 10,//1024 -1 kb, 1024*1000 1bm,
        MAX_SINGE_FILE_SIZE: 1024 * 1000 * 1000 * 2,
        MAX_FILE_ITEMS_COUNT: 1000,
        SELECTED_COLOR: new THREE.Color(135 / 255, 210 / 255, 221 / 255)
    }
    static CLASSES = {
        HIDDEN: 'hidden'
    }
    static CATEGORIES = {
        NONE: -1,
        BOX_EDGE: 13,
        TEMP_TRANSFORM_CONTAINER: 11,
        STL_LOADED_PART: 12
    }
    static TOOLS = {
        NONE: -1,
        LENGTH_BTW_TWO_POINTS: 1,
        ANGLE_BTW_THREE_POINTS: 2,
    }
    static CONTROLS = {
        INCREMENTS: {
            TRANSLATE: 0.1,
            ROTATE: (0.5),
            SCALE: (0),
            KEYBOARD_TRANSLATE: 10
        }
    }
    static COLORS = {
        EDGE: '#6d7c8b',
        EDGE_1: '#f7f7f8',

        BLUE: '#659BE0',
        RED: '#F45959',
        GREEN: '#52BE7F',
        YELLOW: '#beb835',
        GRAY: '#6D7C8B',
        GRAY_CELL: '#DEDEE4',
        BACKGROUND: '#ECECF0',
        SELECTED: '#87d2dd'


    }
    static CHAMPER = {
        DEFAULT: 100,//x
        WIDTH: 100,//x
        HEIGHT: 100,//y
        DEPTH: 100//z
    }

    static DIMENSION = {
        CURRENT: {
            value: 1,
            text: 'mm'
        },
        MM: {
            value: 1,
            text: 'mm'
        }
    }

    static onEventPrevent(event, shouldStopPropogation, shouldPrevent=false) {
        if (!shouldPrevent) event.preventDefault();
        if (shouldStopPropogation) {
            event.stopPropagation();
            // event.stopImmediatePropagation();
        }
        return false;
    }

    static XMLtoHTNL(stringXML) {
        let tempDiv = document.createElement('div');
        tempDiv.innerHTML = stringXML;
        return tempDiv.children[0];
    }

    static getPointInBetweenByPerc(pointA, pointB, percentage = 0.5) {

        var dir = pointB.clone().sub(pointA);
        var len = dir.length();
        dir = dir.normalize().multiplyScalar(len * percentage);
        return pointA.clone().add(dir);

    }

    static label(el) {
        var amap = new THREE.Texture(
            GUtils.createCanvas(
                {
                    text: el.text || `${el.size} ${GUtils.DIMENSION.CURRENT.text}`
                }
            )
        );
        amap.needsUpdate = true;

        var mat = new THREE.SpriteMaterial({
            map: amap,
            transparent: true,
            // useScreenCoordinates: false,
            // color: 0x000000
        });
        var sp = new THREE.Sprite(mat);
        // sp.position.copy(_points[0].clone().addScaledVector(direction, el.size / 2));
        sp.scale.set(-10, 5, -10); // CHANGED
        return sp;
    }


    static randomColor() {
        return '#' + (function co(lor) {
            return (lor +=
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f'][Math.floor(Math.random() * 16)])
            && (lor.length == 6) ? lor : co(lor);
        })('');
    }

    static createCanvas({text}) {
        let canvas = document.createElement('canvas'),
            fontSize = 126,
            padding = 10,
            sizeWidth = text.length * (fontSize / 2) + 8 * padding,
            sieHeight = fontSize + 4 * padding;
        canvas.width = sizeWidth;
        canvas.height = sieHeight;
        var context = canvas.getContext('2d');
        context.fillStyle = GUtils.COLORS.GRAY;

        context.textBaseline = "middle";
        context.textAlign = "center";
        context.font = fontSize + 'px Arial';
        context.fillText(text, sizeWidth / 2, sieHeight / 2 + padding);


        // console.log(sizeWidth, sieHeight);
        // document.body.appendChild(canvas);
        // canvas.style.position = 'absolute';
        // canvas.style.zIndex = '10';
        return canvas;
    }

    static dataURItoBlob(dataURI) {
        // convert base64 to raw binary data held in a string
        // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
        var byteString = atob(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

        // write the bytes of the string to an ArrayBuffer
        var ab = new ArrayBuffer(byteString.length);

        // create a view into the buffer
        var ia = new Uint8Array(ab);

        // set the bytes of the buffer to the correct values
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        // write the ArrayBuffer to a blob, and you're done
        var blob = new Blob([ab], {type: mimeString});
        return blob;

    }

    static deviceCheck() {
        var check = false;
        (function (a) {
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
        })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
    }
}