import { getCUSD } from './getCUSD'
import { signMessage } from './signMessage'

// Send amount of CUSD from user to another user
export const sendCUSD = async function(web3, from, to, amount, eth_wallet) {
  if (
    !web3 ||
    !from ||
    !to ||
    !amount ||
    isNaN(amount) ||
    amount <= 0 ||
    !web3.utils.isAddress(from) ||
    !web3.utils.isAddress(to)
  ) {
    console.error("invalid parameters passed");
    return;
  }  

  try {
    let cusd = getCUSD(web3);

    let crafted_transaction = cusd.methods.transfer(to, amount);
    let nonce = await cusd.methods.replayNonce(from).call();
    let metatoken = cusd.options.address;
    let reward = Math.ceil(
      (await crafted_transaction.estimateGas({
        from,
      })) * 2.5
    );

    // Hash must be in this format: keccak256(abi.encodePacked(address(MetaToken),"metaTransfer", _to, _amount, _nonce, _reward));
    // @devs: cast all signed ints to unsigned ints via web3.utils.toTwosComplement()
    let metaTx = [
      metatoken,
      "metaTransfer",
      to,
      amount,
      web3.utils.toTwosComplement(nonce),
      web3.utils.toTwosComplement(reward)
    ];

    let hash = web3.utils.soliditySha3(...metaTx);
    let sig = await signMessage(web3, hash, from, eth_wallet);

    var post_data = {
      type: 'transfer',
      transferRecipient: to,
      amount,
      sig,
      signerNonce: nonce,
      reward,
    };

    return post_data

  } catch (err) {
    throw err;
  }
};