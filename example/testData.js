const sellerData = {
    // Underwriting data
    merchantAgreementAccepted: true,
    merchantAgreementIpAddress: "42.1.1.113",
    merchantAgreementTimestamp: "2023-04-28T16:42:55Z",
    merchantAgreementUserAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6)",

    // Entity data
    annualCardVolume: 120000,
    businessAddress: {
        city: "Ventura",
        country: "USA",
        region: "CA",
        line1: "696 Tierney Ave",
        postalCode: "93003"
    },
    businessName: "Grape Soda Co",
    businessPhone: "4156249126",
    businessTaxId: "123456789",
    businessType: "LIMITED_LIABILITY_COMPANY",
    defaultStatementDescriptor: "Grape Soda Apparel",
    dob: {
        year: 1989,
        day: 9,
        month: 9
    },
    doingBusinessAs: "Grape Soda Co",
    email: "chris.k.tseng@gmail.com",
    firstName: "kosuke",
    lastName: "yoshi",
    incorporationDate: {
        year: 2021,
        day: 13,
        month: 9
    },
    maxTransactionAmount: 120000,
    mcc: "5611",
    ownershipType: "PRIVATE",
    personalAddress: {
        city: "Ventura",
        country: "USA",
        region: "CA",
        line2: "",
        line1: "696 Tierney Ave",
        postalCode: "93003"
    },
    phone: "4156249126",
    principalPercentageOwnership: 100,
    taxId: "123456789",
    title: "CEO",
    url: "https://www.finix.com",

    // Payment Instrument data
    accountNumber: "0000000016",
    accountType: "Checking",
    bankCode: "122105278",
    country: "USA",
    currency: "USD",
    paymentInstrumentType: "BankAccount",
    name: "old yeller",

    // Additional fields not used in the provided methods but might be needed
    identityRoles: ["SELLER"],
    type: "BUSINESS",
    achMaxTransactionAmount: 100000,
    hasAcceptedCreditCardsPreviously: true
};

const buyerData = {
    email: "generic@gmail.com",
    firstName: "steven",
    lastName: "tom",
    personalAddress: {
        postalCode: "94127"
    },

    expirationMonth: 12,
    expirationYear: 2029,
    name: "steven tom",
    number: "5200828282828210",
    securityCode: "022",
    paymentInstrumentType: "PaymentCard",
    extra: "unused",

    // INSERT YOUR OWN MERCHANT ID FOR TESTS TO WORK
    merchantId: 'MUozGwaZzjydUUn64hY2fe3N',
}

module.exports = {sellerData, buyerData}
