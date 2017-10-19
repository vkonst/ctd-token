const BigNumber = web3.BigNumber;

const tokenQtyLimits = {
    total:  (new BigNumber("650e+24")),
    preIco: (new BigNumber("130e+24"))
};

const durationLimits = {
    // in seconds
    preIco:  745 * 3600,
    mainIco: (2423*60 + 59) * 60
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

const maxPreIcoAPhaseWei = tokenQtyLimits.preIco
    .div(tokenRates.preIcoA.total)
    .toNumber();

const maxPreIcoBPhaseWei = (tokenQtyLimits.total.sub(tokenQtyLimits.preIco))
    .div(tokenRates.preIcoB.total)
    .toNumber();

const maxIcoPhaseWei = (tokenQtyLimits.total.sub(tokenQtyLimits.preIco))
    .div(tokenRates.mainIco.total)
    .toNumber();

const params = {
    awards,
    durationLimits,
    icoPhases,
    maxIcoPhaseWei,
    maxPreIcoAPhaseWei,
    maxPreIcoBPhaseWei,
    tokenQtyLimits,
    tokenRates
};

export default params;
