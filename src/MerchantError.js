class MerchantError extends Error {
    constructor(name, message, data) {
        super(message);
        this.name = name;
        this.data = data;
    }

    serializeData() {
        // TODO: update to handle various types of data
        return JSON.stringify(this.data);
    }

    getError() {
        return `[${this.name}] ${this.message} - ${this.serializeData()}`;
    }
}

module.exports = MerchantError;
