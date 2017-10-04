'use strict';

const BigNumber = require('bignumber.js');

const tokenQtyLimits = {
    total:  (new BigNumber(650)).mul(1e6).mul(1e18),
    preIco: (new BigNumber(130)).mul(1e6).mul(1e18)
};

const durationLimits = {
    // in seconds
    preIco:  30 * (24 * 3600),
    mainIco: 82 * (24 * 3600)
};

const icoPhases = {
    preStart: 0,
    preIcoA: 1, preIcoB: 2, mainIco: 3,
    afterIco: 4
};


const tokenRates = {
    preIcoA: {sender: 1150, owner: 304, bounty: 61, total: 1515},
    preIcoB: {sender: 1100, owner: 292, bounty: 58, total: 1450},
    mainIco: {sender: 1000, owner: 263, bounty: 52, total: 1315}
};

const awards = {
    preOpening: (new BigNumber(0.1)).mul(1e18),
    opening:    (new BigNumber(0.2)).mul(1e18),
    closing:    (new BigNumber(0.5)).mul(1e18)
};

export default {
    awards,
    durationLimits,
    icoPhases,
    tokenQtyLimits,
    tokenRates
};
