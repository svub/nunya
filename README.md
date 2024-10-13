### Notes on state and functions in the secret contract

#### State:

There are only two main state elements in the secret contract.

They use three types for their keys and values: authOut, ref and u__.
(we may change the name of authOut as it is confusing)

##### `balances`
 A mapping from each user's authOout to their balance (u___)

##### `paymentRefs`
 A mapping from every payment ref that every user has created, to the authOut of the user that created it.

###### the `ref` type
 This may be extended in future work. 

 The underlying type should be something we can compare easily in secret contracts. For simpilcity we should limit it to 32 bytes. I propose string (but if something else is easier, we could choose any 32 byte type and cast it in Solidity and the frontend).

###### the `authOut` type
 will be exentded in future work to include different types of auth.
 for now, an `authOut` will represent a password. The password does not even need to be encrypted since it will be encypted for transport from the frontend, and encrypted in storage in the secret contract transparently due to the TEE.
 However, for appearances sake, it would be nice to encrypt it ourselves in storage, 
 Therefore the type of `authOut` could be `string`, but may be better being `bytes32` - so that we can cast various different types of auth into it now and later.

###### the balances type
 is not even its own type, will just be an unsigned integer. `u32` is overkill, but it is also standard for balances so we may as well use it.


#### secondary state elements
  
##### contract's own (pub, priv) keypair
 The privkey allows us to sign receipts.

 The pubkey allows the sender of a payment to encrypt the payment reference

 Note that these are secp1k256 keys, *not* the type of keys which encrypt transport between the frontend and the secret contract.

 These type may already be determined by how secrt network contracts generate contract keypairs. I guhess they are going to be some kind of bytes32.

##### any elements inherent to secret contracts
 I don't know what these are but @ltfschoen mentioned, for example, storing the gateway contract's address.


#### types used for input output but not stored in state
 
##### `address`
 will be accepted  by withdrawTo function

##### `pubkey` / `Option(pubkey)`

secp1k256 - allows a sender of funds who wants a receipt to (optionally) receive that receipt encrypted with their pubkey

##### messaging types used by secret contracts
 such as `handle`, which specifies which function is being called.
 I have not looked into these in detail



#### What about..

##### storing the withdrawal address.
We do not store  the withdrawal address.

##### usernames
We do not use usernames. We can, as future work, modularly update authOut so that it can also represent a (user, password), instead of just a password. But there is NO REASON to complexify things with this feature at this stage.

##### aprovals, permissions, roles
There are no approvals, permissions or roles.
The only fucntion that requires any authentication is `withdrawTo`, and the authentication is solely on the basis of the `authOut` provided when calling that function. If the user provides the correct `authOut` to map to a `balance`, then they have full control of the whole of the balance.



 
