# FINIX SDK
Simple SDK to use Finix's Node Library

## Getting Started
I have not published this into NPM, but figuratively, if I did, a user could `npm install finix_client`

Otherwise, you can import these files and copy them into your src repo within your project.

Finally, if you want to just play around:
1. Clone this repository
2. `npm install`
3. Create a duplicate of `keys.template.js` and name it `keys.dev.js`
4. Get an api username and password from Finix. Add them to `keys.dev.js`
5. Run `node ./example/example.js` to run the current code
6. Expand and play aroudn with the code!

## Notes
The `OnboardingMerchant` is an class that helps developers create an identity (seller), add a payment instrument, and verify/create a merchant.


The `Merchant` class requires an verified merchant. When you instatiate the class with the merchant id, you can add basic buyer information and credit card numbers, and create a charge.

Other notes:
- This class will validate that all the correct data are present in each step
- Filter data that the class in instatiated with, filtering out unwanted data
- Throw custom errors so you can handle various error cases

### If I had more time...
- Add more tests, this currently only tests the Merchant class
- Privatize instance variables and add setter methods - currently we have filtering methods, but they are no use if the instance variables are exposed. I would privatize them and only expose them via setter methods (`SetEntityData`). That way the setter method can use the filter methods I've written and really protect the instance variable data.

