// You will need to import FinixClient
const { Environment, Models, Client } = require('@finix-payments/finix');
const { FinixClient, OnboardingMerchant } = require('../index');
const keys = require('../config/keys.dev');
const testData = require('./testData');

// Instantiate the FinixClient with your own user/password/environment
// You will only need to do this once
FinixClient.initialize(keys.FINIX_USER, keys.FINIX_PASS, Environment.Sandbox);

// You can instantiate OnboardingMerchant with data pulled from your db
const onboardingMerchant = new OnboardingMerchant(testData);

async function test() {
    try {
        response = await onboardingMerchant.fullyOnboardMerchant();
        console.log(response);
    } catch (err) {
        console.log(err);
    }
}

test();
