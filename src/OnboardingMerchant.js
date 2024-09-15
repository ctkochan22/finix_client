const { Models } = require("@finix-payments/finix");
const FinixClient = require("./FinixClient")

// OnboardingMerchant handles the creation and verification of a Seller/Merchant
// Methods help create and verify data used to complete Finix's process
class OnboardingMerchant {
    static DUMMY_PROCESSOR = 'DUMMY_V1';
    
    constructor(data = {}) {
        this.finixClient = FinixClient.getClient();

        // Config
        this.processor = data.processor || OnboardingMerchant.DUMMY_PROCESSOR;

        // Key step data
        this.identityId = data.identityId || '';
        this.paymentInstrumentId = data.paymentInstrumentId || '';
        this.merchantId = data.merchantId || '';

        // Instantiate any underwriting data
        this.underwritingData =  this.#filterData(data, OnboardingMerchant.UNDERWRITING_FIELDS);

        // Intantiate any entity data
        this.entityData = this.#filterData(data, OnboardingMerchant.ENTITY_FIELDS);

        // Intantiate payment intrument data
        this.paymentInstrumentData = this.#filterData(data, OnboardingMerchant.PAYMENT_INSTRUMENT_FIELDS);
    }

    getIdentityId() {
        return this.identityId;
    }
    
    // Create Identity object in Finix
    async createIdentity() {
        this.#validateData(this.underwritingData, OnboardingMerchant.UNDERWRITING_FIELDS);
        this.#validateData(this.entityData, OnboardingMerchant.ENTITY_FIELDS);
        
        const createIdentityRequest = this.#populateModel(
            new Models.CreateIdentityRequest(),
            {
                additionalUnderwritingData: this.#wrapUnderwritingData(),
                entity: this.#wrapEntityData(),
            }
        );

        try {
            // Create the identity on Finix and save id
            const res = await this.finixClient.Identities.create(createIdentityRequest);
            this.identityId = res.id;
            return this;
        } catch (err) {
            throw new MerchantError('CreateIdentityError', 'unable to create identity', err.body);
        }
    }

    async createPaymentInstrument() {
        this.#validateData(this.paymentInstrumentData, OnboardingMerchant.PAYMENT_INSTRUMENT_FIELDS);
        
        const createPaymentInstrumentRequest = this.#wrapPaymentInstrumentData();
        try {
            // Create the identity
            const bankRes = await this.finixClient.PaymentInstruments.create(createPaymentInstrumentRequest);
            this.paymentInstrumentId = bankRes.id;
            return this;
        } catch (err) {
            throw new MerchantError('CreatePaymentInstrumentError', 'unable to create payment instrument', err.body);
        }
    }

    async createMerchant() {        
        const createMerchantRequest = this.#wrapMerchantData();

        try {
            const merchantRes = await this.finixClient.Merchants.create(this.identityId, createMerchantRequest);
            this.merchantId = merchantRes.id;
            return this;
        } catch (err) {
            throw new MerchantError('CreateMerchantError', 'unable to verify merchant', err.body);
        }
    }

    // fullyOnboardMerchant - fully onboards a merchant
    // Creates identity, adds payment instrument, and verifies seller as a merchant
    async fullyOnboardMerchant() {
        try {
            if (this.identityId === '') {
                console.log('Attempting to create new identity');
                
                // If we are creating a new identity, clear out any old ids
                this.paymentInstrumentId = '';
                this.merchantId = '';
                
                await this.createIdentity();
                
            }

            if (this.paymentInstrumentId === '') {
                console.log('Attempting to create new payment instrument');
                await this.createPaymentInstrument();
            }

            if (this.merchantId === '') {
                console.log('Attempting to create new merchant');
                await this.createMerchant();
            }
    
            return {
                'identityId': this.identityId,
                'bankAccountId': this.paymentInstrumentId,
                'merchantId': this.merchantId,
            }
        } catch (err) {
            console.log('Onboarding Merchant Error: ', err.body);
            throw new Error(`Unable to fully onboard merchant`);
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

    #populateModel(model, data) {
        Object.keys(data).forEach(key => {
            model[key] = data[key];
        });

        return model;
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

    #wrapUnderwritingData() {
        return this.#populateModel(
            new Models.CreateIdentityRequestAdditionalUnderwritingData(),
            this.underwritingData
        );
    }

    #wrapEntityData() {
        const {
            annualCardVolume,
            businessName,
            businessPhone,
            businessTaxId,
            businessType,
            defaultStatementDescriptor,
            doingBusinessAs,
            email,
            firstName,
            lastName,
            maxTransactionAmount,
            ownershipType,
            phone,
            mcc,
            principalPercentageOwnership,
            taxId,
            title,
            url,
        } = this.entityData;
        
        const businessAddress = new Models.CreateIdentityRequestEntityBusinessAddress();
        this.#populateModel(businessAddress, this.entityData.businessAddress);

        const personalAddress = new Models.Address();
        this.#populateModel(personalAddress, this.entityData.personalAddress);

        const dob = new Models.CreateIdentityRequestEntityDob();
        this.#populateModel(dob, this.entityData.dob);

        const incorporationDate = new Models.IdentityEntityFormIncorporationDate();
        this.#populateModel(incorporationDate, this.entityData.incorporationDate);

        return this.#populateModel(new Models.CreateIdentityRequestEntity(), {
            businessAddress,
            dob,
            incorporationDate,
            personalAddress,
            annualCardVolume,
            businessName,
            businessPhone,
            businessTaxId,
            businessType,
            defaultStatementDescriptor,
            doingBusinessAs,
            email,
            firstName,
            lastName,
            maxTransactionAmount,
            ownershipType,
            phone,
            mcc,
            principalPercentageOwnership,
            taxId,
            title,
            url,
        });
    }

    #wrapPaymentInstrumentData() {
        const {
            accountNumber,
            accountType,
            bankCode,
            country,
            currency,
            name,
            paymentInstrumentType,
        } = this.paymentInstrumentData;

        return this.#populateModel(
            new Models.CreatePaymentInstrumentRequest(),
            {
                accountNumber,
                accountType: Models.CreatePaymentInstrumentRequest.AccountTypeEnum[accountType],
                bankCode,
                country,
                currency,
                identity: this.identityId || '',
                name,
                type: Models.CreatePaymentInstrumentRequest.TypeEnum[paymentInstrumentType],
            }
        );
    }

    #wrapMerchantData() {
        return this.#populateModel(
            new Models.CreateMerchantUnderwritingRequest(),
            {
                processor: this.processor,
            }
        );
    }

    static UNDERWRITING_FIELDS = {
        merchantAgreementAccepted: 'boolean',
        merchantAgreementIpAddress: 'string',
        merchantAgreementTimestamp: 'string',
        merchantAgreementUserAgent: 'string',
    }

    static ENTITY_FIELDS = {
        annualCardVolume: 'number',
        businessAddress: 'object',
        dob: 'object',
        incorporationDate: 'object',
        personalAddress: 'object',
        businessName: 'string',
        businessPhone: 'string',
        businessTaxId: 'string',
        businessType: 'string',
        defaultStatementDescriptor: 'string',
        doingBusinessAs: 'string',
        email: 'string',
        firstName: 'string',
        lastName: 'string',
        maxTransactionAmount: 'number',
        ownershipType: 'string',
        phone: 'string',
        mcc: 'string',
        principalPercentageOwnership: 'number',
        taxId: 'string',
        title: 'string',
        url: 'string',
    }

    static PAYMENT_INSTRUMENT_FIELDS = {
        accountNumber: 'string',
        accountType: 'string',
        bankCode: 'string',
        country: 'string',
        currency: 'string',
        name: 'string',
        paymentInstrumentType: 'string',
    }
}

module.exports = OnboardingMerchant;
