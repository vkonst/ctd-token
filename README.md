# UmU tokens

ERC20 tokens extended with the following features:
- Number of tokens to issue is limited (hard-coded) but not pre-fixed
- ICO "phases" (time periods) are fixed at deployment):
  - _Phase 0_: `contracts deployed but sale is not yet allowed/started`
  - _Phase 1_: `tokens sold at premium price (hard-coded)`
  - _Phase 2_: `tokens sold at regular price (hard-coded)`
  - _Tokens Frozen_: `all tokens issued but transfers are not yet allowed`
  - _Token released_: `tokens may be transferred`
- Anyone may trigger phase change (at specified time)
- Phase 1 or 2 may be closed if tokens are sold out
- There are no ways to issue new tokens after Phase 2 finishes or all takens get sold 
- Events (logs) generated for/on:
  - `Phase start/end`
  - `New tokens issued (generated)`
  - `ETH tranferred to the owner account`
  - etc ...
- increaseApproval() / decreaseApproval() methods added 
- etc...

### tests
$ `truffle test`
#### pre-requisits:
$ `sudo npm i -g truffle` <br />
$ `sudo npm i -g ethereumjs-testrpc` <br />
$ `npm install` <br />

