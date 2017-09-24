# UmU tokens

ERC20 tokens extended with the following features:<br/>
- Number of tokens to issue is limited (hard-coded) but not pre-fixed<br/>
- ICO "phases" (time periods) are fixed at deployment):<br/>
  - _Phase 0_: `contracts deployed but sale is not yet allowed/started`<br/>
  - _Phase 1_: `tokens sold at premium price (hard-coded)`<br/>
  - _Phase 2_: `tokens sold at regular price (hard-coded)`<br/>
  - _Tokens Frozen_: `all tokens issued but transfers are not yet allowed`<br/>
  - _Token released_: `tokens may be transferred`<br/>
- Anyone may trigger phase change (at specified time)<br/>
- Phase 1 or 2 may be closed if tokens are sold out<br/>
- There are no ways to issue new tokens after Phase 2 finishes or all takens get sold<br/> 
- Events (logs) generated for/on:<br/>
  - `Phase start/end`<br/>
  - `New tokens issued (generated)`<br/>
  - `ETH tranferred to the owner account`<br/>
  - etc ...<br/>
- increaseApproval() / decreaseApproval() methods added<br/> 
- etc...<br/>

### tests
$ `truffle test`
#### pre-requisits:
$ `sudo npm i -g truffle` <br />
$ `sudo npm i -g ethereumjs-testrpc` <br />
$ `npm install` <br />

