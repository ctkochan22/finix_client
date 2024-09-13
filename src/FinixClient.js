const { Client, Environment } = require('@finix-payments/finix');

class FinixClient {
    static instance = null;

    static initialize(username, password, environment = Environment.Sandbox) {
        this.instance = new Client(username, password, environment);
    }

    static getClient() {
        if (!this.instance) {
            throw new Error('FinixClient has not been initialized');
        }
        return this.instance;
    }
}

module.exports = FinixClient;
