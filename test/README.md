# ./test
The **default** folder for the `truffle` framework to put test scripts into.


_Please note:_<br/>
- by default, `truffle` runs `.js`, `.es`, `.es6`, `.jsx`, and .`sol` files.
All other files are ignored.
- `truffle` uses the `Mocha` testing framework and `Chai` for assertions
- `contract()` is used instead of `describe()`
- set env variable `DUMP=1` to some debug logging
- add `--verbose-rpc` flag to `truflle test` to analyze rpc requests 

_To run the tests:_<br/>
$ `truffle test`

or

$ `export DUMP=1; ./scripts/js-test "Ownable Once Withdrawable Upgradable StandardToken Wei ChangeLogic preStart preIcoLimit preIcoA preIcoB mainIco afterIco Campaign" --verbose-rpc`

Unit test report: <a href="log/u-test_report.lst">log/u-test_report.lst</a>
