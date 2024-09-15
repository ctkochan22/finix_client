// You will need to import FinixClient
const { Environment, Models, Client } = require('@finix-payments/finix');
const { FinixClient, OnboardingMerchant, Merchant } = require('../index');
const keys = require('../config/keys.dev');
const testData = require('./testData');

// Instantiate the FinixClient with your own user/password/environment
// You will only need to do this once
FinixClient.initialize(keys.FINIX_USER, keys.FINIX_PASS, Environment.Sandbox);

// You can instantiate OnboardingMerchant with data pulled from your db
const onboardingMerchant = new OnboardingMerchant(testData.sellerData);
const merchant = new Merchant(testData.buyerData);

// Onboarding Example
async function testOnboarding() {
    try {
        response = await onboardingMerchant.fullyOnboardMerchant();
        return response;
    } catch (err) {
        // Catch and handle error
        console.log(err);
    }
}

// This example tests creating a buyer and charging the card
// Must include merchantId
async function testMerchant(merchantId) {
    merchant.setMerchant(merchantId);
    
    try {
        await merchant.fullyCreateCharge({
                amount: 2200,
                currency: "USD",
        })
    } catch (err) {
        // Catch and handle error
        console.log(err);
    }
}

async function testOnboardingAndCharge() {
    const response = await testOnboarding();
    console.log("Creating charge against merchant: ", response);

    // Verifying, even on sandbox, takes a moment
    console.log("Delaying charge 8 seconds to let merchant get verified");
    setTimeout(() => {
        testMerchant(response.merchantId);
    }, 8000);
}

testOnboarding();
// testOnboardingAndCharge();
// testMerchant('MUozGwaZzjydUUn64hY2fe3N');

