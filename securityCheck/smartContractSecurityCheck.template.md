### SmartContract security evaluation Report

Contract | MyBestToken|
--- | --- |
file(s) |`./contracts/MyBestToken.sol` | 
file `md5sum(s)` or `commitID(s)` |
code status | _Draft_ |
overal evaluation result* | |
report status | _Draft_ |

 #| Issue | Eval result* | Comments
---|--- | --- | ---
__| **1. General Philosophy** | |
1 | Keep code as simple as possible | |
1 | Fail as early and loudly as possible | |
1 | Order function code: conditions, actions, interactions | |
1 | Avoid external calls when possible | | 
1 | Handle errors in external calls | |
1 | No control flow assumptions after external calls | |
1 | Favor pull over push for external calls | |
1 | Favor pull over push payments | |
1 | Mark untrusted contracts | |
1 | Enforce invariants with assert() | |
1 | Use assert() and require() properly | |
1 | Forcibly sent ETH to an account | |
1 | Don't assume contracts are created with zero balance | |
1 | Remember that on-chain data is public | |
1 | Consider that participants may "drop offline" and not return | |
1 | Keep fallback functions simple | |
1 | Explicitly mark visibility in functions and state variables | |
1 | Lock pragmas to specific compiler version | |
1 | Differentiate functions and events | |
1 | Prefer newer Solidity constructs | |
1 | Изоляция внешних вызовов в отдельной транзакции | |
1 | Rounding with integer division | |
1 | Beware division by zero (Solidity < 0.4) | |
1 | Переполнение переменных | |
1 | Приоритет изменения состояния над внешним вызовом | |
1 | Перебор динамических массивов| |
1 | Привязка логики работы к метке времени| |
1 | Миграция данных контракта | |
1 | Метки остановки работы | |
1 | Метки задежки по времени | |
1 | Формальная верификация | |
__| **2. Engeneering technicks** | |
1 | Broken contract upgrade options | |
1 | Circuit Breakers | |
1 | Speed Bumps | |
1 | Rate Limiting | |
__| **3. Known attacks** | | 
1 | Call Depth Attack | n/a | `after EIP150`
1 | Race Conditions | |
1 | Reentrancy | |
1 | Cross-function Race Conditions | |
1 | Transaction-Ordering Dependence / Front Running | |
1 | Timestamp Dependence | |
1 | Integer Overflow and Underflow | |
1 | DoS with (Unexpected) revert | |
1 | DoS with Block Gas Limit | |
1 | DoS при исключении в стороннем коде | |
1 | DoS при выходе за лимит газа | |

`* Evaluation result options: good, warning, ALARM, n/a`

##### 4. Oyente Analysis results
`Paste Oyente report here`
 
##### 5. Other comments / special opinion / etc...
`Put relevant comments here`
