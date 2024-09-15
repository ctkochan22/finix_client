const Merchant = require('../src/Merchant');
const FinixClient = require('../src/FinixClient');
const testData = require('../example/testData');

// BEFORE RUNNING TESTS, please add merchant id into the testData.js file

jest.mock('../src/FinixClient');

const buyerData = testData.buyerData

describe('Merchant', () => {
    let newMerchant;
    let mockFinixClient;

    beforeEach(() => {
        jest.clearAllMocks();
        newMerchant = new Merchant(buyerData);
        newMerchant.setMerchant(buyerData.merchantId);

        // Create a mock Finix client with all necessary methods
        mockFinixClient = {
            Identities: {
                create: jest.fn().mockResolvedValue({ id: 'test_identity_id' })
            },
            PaymentInstruments: {
                create: jest.fn().mockResolvedValue({ id: 'test_payment_instrument_id' })
            },
            Transfers: {
                create: jest.fn().mockResolvedValue({ id: 'test_transfer_id' })
            }
            // Add other necessary methods here
        };

        // Mock the getClient method to return our mockFinixClient
        FinixClient.getClient.mockReturnValue(mockFinixClient);

        // Set the mock into the merchant
        newMerchant.finixClient = FinixClient.getClient();
    });

    test('constructor initializes correctly', () => {
        expect(newMerchant.entityData).toEqual(expect.objectContaining({
            email: buyerData.email,
            firstName: buyerData.firstName,
            lastName: buyerData.lastName,
            personalAddress: buyerData.personalAddress,
        }));
        
        expect(newMerchant.paymentInstrumentData).toEqual(expect.objectContaining({
            expirationMonth: buyerData.expirationMonth,
            expirationYear: buyerData.expirationYear,
            name: buyerData.name,
            number: buyerData.number,
            securityCode: buyerData.securityCode,
            paymentInstrumentType: buyerData.paymentInstrumentType,
        }));
    });

    test('createIdentity success', async () => {
        await newMerchant.createBuyerIdentity();

        expect(mockFinixClient.Identities.create).toHaveBeenCalled();
        expect(newMerchant.identityId).toBe('test_identity_id');
    });

    test('createIdentity error', async () => {
        mockFinixClient.Identities.create.mockRejectedValue({
            body: "API ERROR"
        })
        
        await expect(newMerchant.createBuyerIdentity()).rejects.toThrow('unable to create buyer identity');
    });

    test('createPaymentInstrument success', async () => {
        newMerchant.identityId = 'test_identity_id';
        await newMerchant.createPaymentInstrument();
        expect(mockFinixClient.PaymentInstruments.create).toHaveBeenCalled();
        expect(newMerchant.paymentId).toBe('test_payment_instrument_id');
    });

    test('createPaymentInstrument error', async () => {
        mockFinixClient.PaymentInstruments.create.mockRejectedValue({
            body: "API ERROR"
        })
        
        await expect(newMerchant.createPaymentInstrument()).rejects.toThrow('unable to create payment instrument');
    });

    test('createTransfer success', async () => {
        newMerchant.identityId = 'test_identity_id';
        newMerchant.paymentInstrumentId = 'test_payment_instrument_id';
        newMerchant.merchantId = buyerData.merchantId;
        await newMerchant.createCharge({
            amount: 2200,
            currency: "USD",
        });
        expect(mockFinixClient.Transfers.create).toHaveBeenCalled();
    });

    test('createTransfer error', async () => {
        mockFinixClient.Transfers.create.mockRejectedValue({
            body: "API ERROR"
        });
        newMerchant.identityId = 'test_identity_id';
        newMerchant.paymentInstrumentId = 'test_payment_instrument_id';
        newMerchant.merchantId = buyerData.merchantId;
        
        await expect(newMerchant.createCharge({
            amount: 2200,
            currency: "USD",
        })).rejects.toThrow('unable to create payment charge');
    });
})
