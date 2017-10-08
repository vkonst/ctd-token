# ./test
The **default** folder for the `truffle` framework to put test scripts into.


_Please note:_<br/>
- by default, `truffle` runs `.js`, `.es`, `.es6`, `.jsx`, and .`sol` files.
All other files are ignored.
- `truffle` uses the `Mocha` testing framework and `Chai` for assertions
- `contract()` is used instead of `describe()`
- set env variable `DUMP=1` to some debug logging

_To run the tests:_<br/>
$ `truffle test`

or

$ `export DUMP=1; ./scripts/js-test "Ownable Once Withdrawable StandardToken ChangeLogic preStart preIcoLimit preIcoA preIcoB mainIco afterIco Campaign" | tee test/log/all.YYYYMMDD-hhmm.log`

<pre>
test/log/afterIco.log:  18 passing (44s)`
test/log/Campaign.log:  28 passing (4s)`
test/log/ChangeLogic.log:  18 passing (31s)`
test/log/mainIco.log:  22 passing (38s)`
test/log/Once.log:  40 passing (1m)`
test/log/Ownable.log:  7 passing (6s)
test/log/preIcoA.log:  22 passing (35s)
test/log/preIcoB.log:  22 passing (38s)
test/log/preIcoLimit.log:  12 passing (3s)
test/log/preStart.log:  3 passing (3s)
test/log/StandardToken.log:  29 passing (28s)
test/log/Withdrawable.log:  14 passing (12s)
</pre>
