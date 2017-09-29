# UmU tokens

**ERC20** tokens **extended** with the following features:<br/>
- Number of tokens to issue(sell) is limited (hard-coded) but not pre-fixed<br/>
- On top of tokens to buyers (investors) the "company" and "bounty" tokens issued <br />
 `Tokens issed at fixed rate to the contract owner and the bounty program addresses.` <br /> 
- ICO "phases" (opening/closing dates) are fixed at deployment:<br/>
  - _Pre-Funding_: `The contract deployed but sale is not yet allowed/started.`<br/>
  - _Pre-ICO Phase A_: `Tokens are selling at the premium price.` <br />
  `Limited by the number of tokens for sale and the (main) ICO start date.`<br/>
  - _Pre-ICO Phase B_: `Tokens are selling at the discounted price` <br />
  `Occures if pre-ICO tokens sold before the (main) ICO start date.`<br />
  `Limited by total number of tokens for sale during the campaign` <br />
  `as well as by the (main) ICO start date.` <br />
  - _(Main) ICO_: `Tokens are on sale at the regular price.`<br/>
  `May not occure if tokens sold out on Pre-ICO.` <br />
  - After ICO_: `Campaign ended. No new tokens may be issued.` <br />
- Company tokens may not be transferred before 'After ICO' phase. <br/>
- Anyone may trigger phase change (at specified time, considering limits)<br/>
- Award(s) is paid in ETH to inintiator(s) of the shift(s)<br/>
- Pre-ICO and ICO will close if tokens are sold out<br/>
- Transfers may be paused ONCE for two weeks (to prevent scum)
- Events (logs) generated for/on:<br/>
  - `New Phase started`<br/>
  - `New tokens issued (generated)`<br/>
  - `Allowance on transer of tokens issued`<br/>
  - `Tokens transferred`<br/>
- increaseApproval() / decreaseApproval() methods supported<br/> 
- _etc...<br/>_

### tests
$ `truffle test`

### lint
$ `solium --dir contracts`
 
#### pre-requisits:
$ `sudo npm i -g truffle` <br />
$ `sudo npm i -g ethereumjs-testrpc` <br />
$ `sudo npm i -g solium` <br/>
$ `npm install` <br />
