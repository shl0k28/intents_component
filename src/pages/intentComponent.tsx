import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { getSmartAccount } from './getSmartAccount';
import { stackupPaymaster } from './stackupPaymaster';

const IntentComponent: React.FC = () => {
  const [intentMsg, setIntentMsg] = useState<string>('');
  const [txObject, setTxObject] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [account, setAccount] = useState<string | null>(null);
  const [txnHash, setTxnHash] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccount = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const account = await signer.getAddress();
        setAccount(account);
      }
    };

    fetchAccount();
  }, []);

  
  const fetchIntent = async () => {

    setIsLoading(true);

    const simpleAcc = await getSmartAccount();
    const scwAddress = simpleAcc.getSender();
    setAccount(scwAddress);

    // initialize provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // get chainId
    const network = await provider.getNetwork();
    const chainId = network.chainId;

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        recipient: scwAddress,
        command: intentMsg,
        chainId: chainId,
      }),
    };

    const response = await fetch(
      `https://intents-api.onrender.com/intents`,
      options,
    );

    const data = await response.json();
    console.log(data.info.txObject);
    setTxObject(data.info.txObject);
    setIsLoading(false);
  };

  const sendTransaction = async () => {
    if (!txObject) {
      console.log("Tx Object is null. Please fetch the intent first.");
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    try {
      const txResponse = await signer.sendTransaction(txObject);
      console.log("Transaction sent: ", txResponse);
    } catch (err) {
      console.error("Error sending transaction: ", err);
    }
  };

  const sendTransactionWithPaymaster = async (to:any,value:any) => {
    if (!txObject) {
      console.log("Tx Object is null. Please fetch the intent first.");
      return;
    }

    try {
      const txHash = await stackupPaymaster(to, value, '0x');
      console.log("Transaction hash: ", txHash);
      setTxnHash(txHash);

    } catch (err) {
      console.error("Error sending transaction: ", err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (window.ethereum) {
      fetchIntent();
    } else {
      console.log("Please install MetaMask!");
    }
  }

  return (
    <div >
      {account && <div style={{ position: 'absolute', top: 0, right: 0 }}>Connected Account: {account}</div>}
      
      <h1 className='text-xl mb-[30px]'>Enter Intent and Submit:</h1>
      <form onSubmit={handleSubmit}>
        <input
          className='text-black w-[400px] h-[30px] mb-[30px] rounded-md '
          type="text"
          value={intentMsg}
          onChange={(e) => setIntentMsg(e.target.value)}
          placeholder="Enter your intent here"
        />
        <br/>
        <button type="submit" className='bg-white p-1 rounded-md text-black mb-4'>Submit</button>
      </form>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        txObject && (
          <div>
            <h1 className='text-xl mb-[10px]'>Intent Txn Object is : </h1>
            <p>
              to: {txObject?.to} <br />
              value: {txObject?.value} <br />
              data: {txObject?.data}
            </p>
            <button onClick={() => sendTransactionWithPaymaster(txObject.to, txObject.value)} className='bg-white p-2 rounded-md text-black mt-4'>Send Transaction</button>
            <br/>
            {txnHash && <p>Transaction Hash: {txnHash}</p>}
          </div>
        )
      )}
    </div>
  );
}

export default IntentComponent;
