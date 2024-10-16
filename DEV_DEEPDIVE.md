# Dev Deepdive

### The contracts

#### `NunyaBusiness.sol`
 Our entry point to Nunya

 Most functions are function pairs - to deal with the async of dealing with secret network through gateways.
 Usually in secret path interactions, function composition through EVM contract functions is considered transit, and so all input is encrypted from the frontend, 
 all the way through any EVM contracts, the relayers and the EVM and secret network gateway contracts to the secret contract.

 Not all of our functions are encypted in transit, since we require the ability for the EVM contract to introspect on the input to the pay fundtion to prevent fraud.
 (see 'pay' below)
 

 ##### `constructor`
 Some of our users will want to encrypt their payment inputs, and the pay functionality is not encrypted end-to-end. therefore, on deployment, 
 the conctructor of the Nunya contract retrieves a (pub, priv) key pair generated inside the secret contract, for that whole contract. 
 This allows users to encrypt payment info.


 ##### newSecretUser function pair
  
`newSecretUser` instantiates a user.
The auth is very simple, as it already protected by secret path's end-to-end encryption. Even a simple unhashed password is secure, though will be vulnerable
to collisions - hence, future work is to include auth by (user, password) and other fun ways to auth - the security of the e2e encyrption allows more flexibility
in ways of authorising, so anything, such as a fingerprint, which is not publicly accessible, could be used.


`newSecretUserCallback` is called by the secret contract through the gateways and simply emits an event the the requestId relating to the call to `newSecretUser` was successful.


 ##### createPaymentReference function pair
  
`createPaymentReference` is to link a payment reference selected by the user to their user. It is stored in a simple lookup structure in the secret contract so that 
it is not visible to the outside world. Future work is to allow an authed user to view their paymentReferences.
Our frontend generates a QR code with this payment reference to abstract away al that crypto complexity for your clients. this can include an amount (eg for an invoice)
or not - in which case the client specifies the amount at the time of paying.

`createPaymentReferenceCallback` is called by the secret contract through the gateways and simply emits an event the the `createPaymentReference` resulted in the 
paymentReference being created. In the event of collisions, the contract can randonly generate a different reference and if the user does not like the random one,
they can resubmit with a new attempt.


 ##### `pay`  function pair
  
`pay` was the trickiest function to implement. It is of course to allow a user (eg your client) to pay against a payment reference that you have provided them,
maybe through the QR code the frontend geenrated for you!
It was tricky as we realised late in the day that secret path as currently implemented performs no verification on the suthenticity of transactions, except for
requiring the frontend user to encrypt them. However, the frontend user may be malicious, and claim to have paid a different amount than they really did. This can only be verified in the EVM, so we needed to keep the inputs to `pay` unencrypted (except for the optional encryption of everything except the [ayment amount). Currently we do this by simply bypassing the `encryptPayload` logic on the frontend and secret contract side. More elegeant solution to follow ;)
The even tricker part of the `pay` flow is that we needed to ensure that inputs come from the Nunya contract and not some malicious contract that falsely pretends to verify the payment. We achieve this by slightly modifying the Gateway.sol contract (which we then need to redploy ourselves) and hijacking the `myAddress` /`user_address` field of `PreExecutionInfo` , so that it contains `msg.sender` which shoukd always be the Nunya contract, instead of the actual user.

`payCallback` is called by the secret contract through the gateways  and


 ##### payWithReceipt function pair
  
`payWithReceipt` is just like pay, but the secret contract passes back a payment receipt, which is singed by the contract.
Along with the contract's pubkey, payer and pyee can verify that a give payment was made to the payment reference. Timestamp can be verified through EVM event logs. 


 ##### withdrawTo function pair
  
`withdrawTo`

`withdrawToCallback` is called by the secret contract through the gateways  and



 




authOut`, and in the Solidity contract it is named `secret`. They all refer to a fixed length hash of something, that the user receiving payments uses to authenticate.

#### `balances`
 A mapping from each user's `secret` to their balance (`u___`)

#### `paymentRefs`
