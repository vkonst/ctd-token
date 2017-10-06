import latestTime from '../lib/zeppelin-solidity/test/helpers/latestTime';

export function toUmu(atoms) {
    let bigAtoms = (typeof atoms === 'number') ? (new BigNumber(atoms)) : atoms;
    return bigAtoms.div(1e18).toNumber();
}

export function toUmuMio(atoms) {
    return toUmu(atoms)/1000000;
}

export const DUMP = !!process.env.DUMP;

export function dumper(deployed, roles) {
    let contract, times = {};
    contract = deployed;

    let requests = [
        contract.preIcoOpeningTime.call(),
        contract.icoOpeningTime.call(),
        contract.closingTime.call()
    ];

    return Promise.all(requests)
        .then(([preOpeningTime, openingTime, closingTime]) => {
            times.preIcoOpeningTime = preOpeningTime.toNumber();
            times.icoOpeningTime = openingTime.toNumber();
            times.icoClosingTime = closingTime.toNumber();

            return asyncDump;
        });

    function asyncDump(msg = '', misc = {}) {

        let requests = [
            roles,
            times,
            latestTime(),
            contract.phase.call(),
            contract.totalSupply.call(),
            contract.totalProceeds.call(),
            roles.owner ? contract.getBalanceAt.call(roles.owner) : 0,
            roles.owner ? contract.getTokenBalanceOf.call(roles.owner) : 0,
            roles.owner ? contract.testPendingWithdrawalAmount.call({from: roles.owner}) : 0,
            roles.buyer ? contract.getTokenBalanceOf.call(roles.buyer) : 0,
            roles.buyer ? contract.getBalanceAt.call(roles.buyer) : 0,
            roles.buyer ? contract.testPendingWithdrawalAmount.call({from: roles.buyer}) : 0,
            roles.bounty ? contract.getBalanceAt.call(roles.bounty) : 0,
            roles.bounty ? contract.getTokenBalanceOf.call(roles.bounty) : 0,
            roles.bounty ? contract.testPendingWithdrawalAmount.call({from: roles.bounty}) : 0,
            roles.stranger ? contract.getBalanceAt.call(roles.stranger) : 0,
            roles.stranger ? contract.getTokenBalanceOf.call(roles.stranger) : 0,
            roles.stranger ? contract.testPendingWithdrawalAmount.call({from: roles.stranger}) : 0
        ];

        return Promise.all(requests)
            .then(responses => dump(responses, msg, misc));
    }

    function dump(responses, msg, misc = {}) {
        let owner, buyer, bounty, stranger;
        let preIcoOpeningTime, icoOpeningTime, icoClosingTime;
        let v = {};
        [
            {owner, buyer, bounty, stranger},
            {preIcoOpeningTime, icoOpeningTime, icoClosingTime},
            v.timeNow,
            v.phase,
            v.totalSupply,
            v.totalProceeds,
            v.balanceOwner,
            v.tokenBalanceOfOwner,
            v.withdrawalOwner,
            v.balanceBuyer,
            v.tokenBalanceOfBuyer,
            v.withdrawalBuyer,
            v.balanceBounty,
            v.tokenBalanceOfBounty,
            v.withdrawalBounty,
            v.balanceStranger,
            v.tokenBalanceStranger,
            v.withdrawalStranger
        ] = responses;

        let ownerBalanceChange = v.balanceOwner;
        if (misc.beforeOwnerEthBalance) {
            ownerBalanceChange = ownerBalanceChange.sub(misc.beforeOwnerEthBalance);
        }

        if (msg) console.warn(msg);

        console.warn('time: ' +
            (v.timeNow >= icoClosingTime    ? ('icoClosed + ' + (v.timeNow - icoClosingTime))    :
            (v.timeNow >= icoOpeningTime    ? ('icoOpened + ' + (v.timeNow - icoOpeningTime))    :
            (v.timeNow >= preIcoOpeningTime ? ('preOpened + ' + (v.timeNow - preIcoOpeningTime)) :
            (v.timeNow -  preIcoOpeningTime))))
        );
        console.warn(`phase: ${v.phase}`);
        console.warn(`totalSupply    [Atoms]: ${v.totalSupply}`);
        console.warn(`totalProceeds    [Wei]: ${v.totalProceeds}`);
        if (buyer) {
            console.warn(`ethBuyer         [Wei]: ${v.balanceBuyer}`);
            console.warn(`tokensBuyer    [Atoms]: ${v.tokenBalanceOfBuyer}`);
            console.warn(`wdrawalBuyer     [Wei]: ${v.withdrawalBuyer}`);
        }
        if (owner) {
            console.warn(`ethOwner         [Wei]: ${ownerBalanceChange}`);
            console.warn(`tokensOwner    [Atoms]: ${v.tokenBalanceOfOwner}`);
            console.warn(`wdrawalOwner     [Wei]: ${v.withdrawalOwner}`);
        }
        if (bounty) {
            console.warn(`ethBounty        [Wei]: ${v.balanceBounty}`);
            console.warn(`tokensBounty   [Atoms]: ${v.tokenBalanceOfBounty}`);
            console.warn(`wdrawalBounty    [Wei]: ${v.withdrawalBounty}`);
        }

        if (stranger) {
            console.warn(`ethStranger      [Wei]: ${v.balanceStranger}`);
            console.warn(`tokensStranger [Atoms]: ${v.tokenBalanceStranger}`);
            console.warn(`wdrawalStranger  [Wei]: ${v.withdrawalStranger}`);
        }
    }
}
