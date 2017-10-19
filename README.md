![Cointed](doc/cointed.jpg)

## Cointed Token (CTD) and Token Sale

**General Overview**

Token Name|Cointed Token (CTD)
---|---
Decimals|18
Smallest Unit (Atom)|1e-18 CTD
Token Amount|Up to 650,000,000 CTDs `(#1)`
Token Price|Fixed to 1000-1150 CTDs/ETH `(#3)`
Percentage for sale|100%
Minimum Token Purchase|1 Wei
Maximum Token Purchase|No Limit
Minimum Funding Goal|None
Refund|Yes (`#5)`
Owner Rewards|Yes `(#3)`
Extra Features|Pausable, Upgradable, Owner Limits . . . `(#6)`

**1. Token Amount**

The maximum token amount is 650 million CTDs.
Tokens are minted during the crowdsale and the total supply is fixed at the end of the crowdsale so that the maximum token amount might not be reached.
In case the maximum number should be reached, the crowdsale allows for up to 1,514 atoms to be created due to arithmetic imprecisions.

**2. ICO Phases**

The token sale goes through the following phases:

1. Before the ICO: Allows the owner to perform contract setup
2. Pre-ICO A: Phase with 15% bonus
3. Pre-ICO B: Optional phase with 10% bonus
4. ICO: Regular ICO Phase
5. After the ICO: All payments are refunded `(#5)`

![Figure 1](doc/stateTransition.jpg)


The phase transitions are displayed in Figure 1.
They can either happen due to elapsed time or as a certain number of tokens has been purchased.

**3. Phase change rewards**

There are special phase change rewards.

- The first token buyer during the Pre-ICO A phase receives 0.1 ETH
- If the Pre-ICO A phase sells out, the final token buyer receives 0.1 ETH
- If the ICO phase is entered, the first token buyer receives 0.2 ETH
- If the Pre-ICO B phase or the crowdsale is sold out, the last token buyer receives 0.5 ETH

These rewards have to be claimed in the same way as refunds `(#5)`.


**4. Token Prices:**

The token buyer receives the following amount of tokens in the phases per ETH:

Phase|Token Buyer|Owner|Bounty
---|---|---|---
Pre-ICO A|1150|304|61
Pre-ICO B|1100|292|58
ICO|1000|263|52

As the table shows, with each token purchase additional tokens are minted for the owner and the bounty account.


**5. Refund Options**

Refunds can occur in the following situations:
- A token purchase at the end of a phase might get partially refunded for those funds
which exceed the phase limit. ⇒ Partial Refund
- A token purchase after the ICO completion. ⇒ Full Refund

As the contract has no minimum funding goal, no token purchases can be refunded.

Refunds are not directly send back, but must be withdrawn using the `withdraw` function.

Token buyers are notified of a pending withdrawal with the `Withdrawal` event.

These refunds cannot be accessed by the owner for 30 days after the completion of the ICO.
Afterwards, the owner can withdraw unclaimed refunds using the `returnWei` function.

**6. Extra Features**

_Pausable_

The owner has the power to pause the token sale and/or circulation once for the duration of two weeks.
During this time no token transfers, token purchases or refunds can be made.

_Upgradable_

The owner can propose a token upgrade to a new token version. This can happen at any time.

Individual token owners can accept the upgrade by calling the upgrade function.

_Owner Limits_

The contract limits the owner’s power during the ICO.
During the ICO the contract owner cannot transfer any tokens.

_Safe Defaults_

Should the owner fail to perform a proper setup before the start of the token sale, then the contract will automatically assign its owner to critical functions.


### Check sums and contract address

**Source code files**<br>
$ `sha256sum contracts/*.sol`<br />
`0bdda1e95de6e0a591e94445f68b50a03bf929fd178ad9e28debe2b46119d15d  CtdToken.sol`<br />
`f3c312a90c3b4d2c4b19d50c171b54917f083f8d0ae446206dd64233600627dc  InterfaceUpgradeAgent.sol`<br />
`20458a1a20f5c9b6e03b1d217edae935beff9ae82555074a50abfe86c790b85b  PausableOnce.sol`<br />
`3e5bb94ddd5f24abbf854df1d4876561369ffef089042b7be0656464d278b5aa  UpgradableToken.sol`<br />
`3fa42f60fe031c0c7f7d7765d2a1774ff381fe52bff25ed8a96436284c5848a7  Withdrawable.sol`<br />

**Flatten contract**<br>
`$ sha256sum build/flatten/CtdToken.sol` <br/>
`522affa5988ad76a095be28042af344838f9ba616c270ae7c1f9767df1534618  build/flatten/CtdToken.sol`<br/>
`# Swarm Source: bzzr://94b10c2a6e6e4ebe96606e48a7611d3da6e223636638da8e85b7391ebe26f52e`<br/>

**Main Net***
<a href="https://etherscan.io/address/0x230c2a140e758087f7107dd31943c5c03b819e55">0x230c2a140e758087f7107dd31943c5c03b819e55</a>

**Ropsten:**<br/>
<a href="https://ropsten.etherscan.io/address/0x1a95c3863b28917b463fb2ebce49f8aba3b20f80">0x1a95c3863b28917b463fb2ebce49f8aba3b20f80</a>

### Bug Bounty Program (finished)

Please refer to <a href="https://www.reddit.com/r/ethdev/comments/75x5kb/bug_bountyico_cointed_token_audit_100k_reward/">
the terms and conditions
</a>
and <a>results</a> (to be updated).
<br/>

#### Setup & Test 
Please refer to <a href="../doc/README.md">doc/README.md</a>
