# Token specifications and features
- ERC20 compatible
- decimals: 0
- name: Cash Account Key
- Symbol: CAK

# Crowdsale specifications and features
- 2 Stage Crowdsale with the following features:
- mintPresaleTokens() function for onlyOwner to call to mint tokens for the presale (presale not handled in this contract)
- regular crowdsale for the CAK token with a token cap of 30,000,000 (including presale tokens)
- whitelist for KYC/AML for during the crowdsale
- manager mapping for manage the whitelist
