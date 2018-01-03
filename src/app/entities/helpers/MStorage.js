export class MStorage {

    static getItem(key) {
        let _d =localStorage.getItem(MStorage.PREF + key);
        if(!_d)return;
        
        return JSON.parse(atob(_d)) || null;
    }

    static setItem(key, value) {
        
        localStorage.setItem(MStorage.PREF + key, btoa(JSON.stringify(value)));
    }

    static removeItem(key) {
        localStorage.removeItem(MStorage.PREF + key);
    }

    static size() {
        return localStorage.length;
    }

    static keyByIndex(i) {
        let key = localStorage.key(i);
        if (key.match(MStorage.PREF))
            return localStorage.key(i).split(MStorage.PREF)[1];
        else  return null;
    }

}
MStorage.PREF = 'edit3js:';
