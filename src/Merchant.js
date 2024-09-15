
const keys = require('../config/keys.dev');
const { Environment, Models, Client } = require('@finix-payments/finix');
const FinixClient = require("./FinixClient");
const MerchantError = require('./MerchantError');

// Merchant handles actions that a Seller on our system can make
class Merchant {
    constructor(data = {}, test) {
        this.finixClient = FinixClient.getClient();
        
        this.merchantId = data.merchantId || '';
        this.identityId = data.identityId || '';
        this.paymentId = data.paymentId || '';

        this.entityData = this.#filterData(data, Merchant.BUYER_FIELDS) || {};
        this.paymentInstrumentData = this.#filterData(data, Merchant.PAYMENT_INSTRUMENT_FIELDS) || {};
    }

    static populateModel(model, data) {
        Object.keys(data).forEach(key => {
            model[key] = data[key];
        });

        return model;
    }

    setMerchant(merchantId) {
        this.merchantId = merchantId;
    }

    setBuyerIdentity(data) {
        const filtered = this.#filterData(data, Merchant.BUYER_FIELDS);

        this.entityData = {
            ...this.entityData,
            ...filtered,
        }
    }

    // Create buyer identity
    async createBuyerIdentity() {
        // Validate if we have all the data we need
        this.#validateData(this.entityData, Merchant.BUYER_FIELDS);
        
        const createIdentityRequest = Merchant.populateModel(
            new Models.CreateIdentityRequest(),
            {
                entity: this.#wrapEntityData(),
            }
        );

        try {
            // Create the identity
            const res = await this.finixClient.Identities.create(createIdentityRequest);
            console.log('creating identity', res);
            this.identityId = res.id;
            return this;
        } catch (err) {
            throw new MerchantError('CreateIdentityError', 'unable to create buyer identity', err.body);
        }
    }

    async createPaymentInstrument() {
        // Validate if we have all the data we need
        this.#validateData(this.paymentInstrumentData, Merchant.PAYMENT_INSTRUMENT_FIELDS);
        
        const createPaymentInstrumentRequest = this.#wrapPaymentInstrumentData(this.paymentInstrumentData);
        
        try {
            const res = await this.finixClient.PaymentInstruments.create(createPaymentInstrumentRequest);
            console.log('Created payment instrument: ', res.id);
            this.paymentId = res.id;
            return this;
        } catch (err) {
            throw new MerchantError('CreatePaymentInstrumentError', 'unable to create payment instrument', err.body);
        }
    }

    async createCharge(data) {
        this.#validateData({
            source: this.paymentId,
            merchant: this.merchantId,
            ...data
        }, Merchant.CHARGE_FIELDS)
        
        const chargeRequest = this.#wrapChargeData(data);
        try {
            // Create the identity
            await this.finixClient.Transfers.create(chargeRequest);
            return this;
        } catch (err) {
            throw new MerchantError('CreateChargeError', 'unable to create payment charge', err.body);
        }
    }

    async fullyCreateCharge(data) {
        try {
            // check if id exists
            await this.createBuyerIdentity();
            await this.createPaymentInstrument();
            await this.createCharge(data);
        } catch (err) {
            throw new MerchantError('FullyCreateCharge Error', 'unable to complete payment', err);
        }
    }

    #filterData(data, requiredFields) {
        let filteredData = {};
        let invalid = [];

        // Iterate through data and only lift required fields
        for (const key in data) {
            if (key in requiredFields) {
                filteredData[key] = data[key];
            } else {
                invalid.push(key);
            }
        }

        // Log what we filtered out
        if (invalid.length > 0) {
            console.log(`filtered out following params: ${invalid.join(', ')}`);
        }

        return filteredData;
    }

    #validateData(data, requiredFields) {
        let missing = [];
        let invalid = [];
        for (const key in requiredFields) {
            if (!(key in data)) {
                missing.push(key);
            }

            // TODO: not using invalid yet
            if (typeof data[key] !== requiredFields[key]) {
                console.log(`Unexpected type for ${key}, expected ${requiredFields[key]} got ${typeof data[key]}`);
                invalid.push(key);
            }
        }
        
        if (invalid.length > 0) {
            throw new MerchantError('BuyerIdentityError', 'Invalid parameters', invalid);
        }

        if (missing.length > 0) {
            throw new MerchantError('BuyerIdentityError', 'Missing parameters', missing);
        }
    }

    // Creates Request models required by the Client
    #wrapEntityData(obj) {
        const {
            firstName,
            lastName,
            email,
        } = this.entityData;
        
        const personalAddress = new Models.Address();
        Merchant.populateModel(personalAddress, this.entityData.personalAddress);

        return Merchant.populateModel(
            new Models.CreateIdentityRequest(),
            {
                firstName,
                lastName,
                email,
                personalAddress,
            },
        );
    }

    #wrapPaymentInstrumentData() {
        const {
            expirationMonth,
            expirationYear,
            name,
            number,
            securityCode,
            paymentInstrumentType,
        } = this.paymentInstrumentData;

        const address = new Models.CreatePaymentInstrumentRequestAddress();
        Merchant.populateModel(
            new Models.CreatePaymentInstrumentRequestAddress(),
            this.entityData.personalAddress
        );

        return Merchant.populateModel(
            new Models.CreatePaymentInstrumentRequest(),
            {
                expirationMonth,
                expirationYear,
                number,
                securityCode,
                address,
                identity: this.identityId || '',
                name,
                type: Models.CreatePaymentInstrumentRequest.TypeEnum[paymentInstrumentType],
            }
        );
    }

    #wrapChargeData(data) {
        const {
            amount,
            currency,
            merchant,
            // idempotencyId,
            source,
        } = data;

        return Merchant.populateModel(
            new Models.CreateTransferRequest(),
            {
                amount,
                currency,
                merchant: this.merchantId,
                source: this.paymentId,
            }
        )
    }

    static BUYER_FIELDS = {
        firstName: 'string',
        lastName: 'string',
        email: 'string',
        personalAddress: 'object',
    }

    static PAYMENT_INSTRUMENT_FIELDS = {
        personalAddress: 'object',
        expirationMonth: 'number',
        expirationYear: 'number',
        name: 'string',
        number: 'string',
        securityCode: 'string',
        paymentInstrumentType: 'string',
    }

    static CHARGE_FIELDS = {
        amount: 'number',
        currency: 'string',
        source: 'string',
        merchant: 'string',
    }
}

module.exports = Merchant;