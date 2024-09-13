const { Models } = require("@finix-payments/finix");
const FinixClient = require("./FinixClient")

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
        this.underwritingData =  this.#filterUnderwritingData(data);

        // Intantiate any entity data
        this.entityData = this.#filterEntityData(data);

        // Intantiate payment intrument data
        this.paymentInstrumentData = this.#filterPaymentInstrumentData(data);
    }

    static populateModel(model, data) {
        Object.keys(data).forEach(key => {
            model[key] = data[key];
        });

        return model;
    }

    getIdentityId() {
        return this.identityId;
    }
    
    // Create Identity object in Finix
    async createIdentity() {
        const createIdentityRequest = OnboardingMerchant.populateModel(
            new Models.CreateIdentityRequest(),
            {
                additionalUnderwritingData: this.#wrapUnderwritingData(),
                entity: this.#wrapEntityData(),
            }
        );

        // Make request to finix client
        try {
            // Create the identity
            const res = await this.finixClient.Identities.create(createIdentityRequest);
            this.identityId = res.id;
        } catch (error) {
            console.log(error.statusMessage);
        }
    }

    async createPaymentInstrument() {
        const createPaymentInstrumentRequest = this.#wrapPaymentInstrumentData();

        try {
            // Create the identity
            const bankRes = await this.finixClient.PaymentInstruments.create(createPaymentInstrumentRequest);
            this.paymentInstrumentId = bankRes.id
        } catch (error) {
            console.log(error.statusMessage);
        }
    }

    async createMerchant() {
        const createMerchantRequest = this.#wrapMerchantData();

        try {
            const merchantRes = await this.finixClient.Merchants.create(this.identityId, createMerchantRequest);
            this.merchantId = merchantRes.id;
        } catch (error) {
            console.log(error.statusMessage);
        }
    }

    // fullyOnboardMerchant - fully onboards a merchant
    // Creates identity, adds payment instrument, and verifies seller as a merchant
    async fullyOnboardMerchant() {
        await this.createIdentity();
        await this.createPaymentInstrument();
        await this.createMerchant();

        return {
            'identityId': this.identityId,
            'bankAccountId': this.paymentInstrumentId,
            'merchantId': this.merchantId,
        }
    }

    // Extract key value pairs specific to underwriting
    #filterUnderwritingData(obj) {
        const {
            merchantAgreementAccepted,
            merchantAgreementIpAddress,
            merchantAgreementTimestamp,
            merchantAgreementUserAgent,
        } = obj;

        return {
            merchantAgreementAccepted,
            merchantAgreementIpAddress,
            merchantAgreementTimestamp,
            merchantAgreementUserAgent,
        };
    }

    #wrapUnderwritingData() {
        return OnboardingMerchant.populateModel(
            new Models.CreateIdentityRequestAdditionalUnderwritingData(),
            this.underwritingData
        );
    }

    // Get only keys relevant to creating the entity
    // TODO: Create a map, key to expected type to also validate data inputs
    #filterEntityData(obj) {
        const {
            annualCardVolume,
            businessAddress,
            dob,
            incorporationDate,
            personalAddress,
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
            url
        } = obj;

        return {
            annualCardVolume,
            businessAddress,
            dob,
            incorporationDate,
            personalAddress,
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
            url
        };
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
        OnboardingMerchant.populateModel(businessAddress, this.entityData.businessAddress);

        const personalAddress = new Models.Address();
        OnboardingMerchant.populateModel(personalAddress, this.entityData.personalAddress);

        const dob = new Models.CreateIdentityRequestEntityDob();
        OnboardingMerchant.populateModel(dob, this.entityData.dob);

        const incorporationDate = new Models.IdentityEntityFormIncorporationDate();
        OnboardingMerchant.populateModel(incorporationDate, this.entityData.incorporationDate);

        return OnboardingMerchant.populateModel(new Models.CreateIdentityRequestEntity(), {
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
    

    #filterPaymentInstrumentData(obj) {
        const {
            accountNumber,
            accountType,
            bankCode,
            country,
            currency,
            identity,
            paymentInstrumentType,
        } = obj;

        return {
            accountNumber,
            accountType,
            bankCode,
            country,
            currency,
            identity,
            paymentInstrumentType,
        };
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

        return OnboardingMerchant.populateModel(
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
        return OnboardingMerchant.populateModel(
            new Models.CreateMerchantUnderwritingRequest(),
            {
                processor: this.processor,
            }
        );
    }
}

module.exports = OnboardingMerchant;
