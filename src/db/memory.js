export default class Memory {
    constructor() {
        this.db = {};
    }

    set(vin, data) {
        if (this.db[vin] == undefined) return "Not found"; // Error, vin not found
        // this.db[vin].push(data);
        this.db[vin] = data;
    }

    get(vin) {
        return this.db[vin];
    }

    create(vin, data = {}) {
        if (this.db[vin] != undefined) return "VIN Exists";
        this.db[vin] = data;
    }

    delete(vin) {
        delete this.db[vin];
    }

    list() {
        return Object.keys(this.db);
    }
}