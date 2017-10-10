###Setup

#####pre-requisits:
$ `sudo npm i -g truffle` <br />
$ `sudo npm i -g ethereumjs-testrpc` <br />
$ `sudo npm i -g solium` <br/>
$ `sudo npm i -g truffle-soljs-updater`<br>
$ `npm install` <br />


#####lint:
$ `solium --dir contracts`

#####flatten:
$ `npm run-script build-contracts`
 

#####compile:
`truffle compile`

#####Deploy:
$ `truffle migrate --network development`

#####test:
$ `.scripts/run_testrpc.sh`<br/>
$ `truffle test`<br/>
_Bash scripts from ./scripts may be helpful._<br/>
_More info: <a href="../test/README.md">../test/README.md</a>_<br/>

<pre>
Consider truffle.js' defaults:
  build_directory: "build",
  contracts_directory: "contracts",
  contracts_build_directory: "contracts",
  migrations_directory: "migrations",
  test_directory: () => path.join(self.working_directory, "test"),
  test_file_extension_regexp: /.*\.(js|es|es6|jsx|sol)$/
</pre>
