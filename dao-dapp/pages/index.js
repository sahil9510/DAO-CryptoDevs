import Head from "next/head";
import Image from "next/image";
import styles from "@/styles/Home.module.css";
import { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { providers, Contract, utils } from "ethers";
import {
  CRYPTODEVS_DAO_ABI,
  CRYPTODEVS_DAO_CONTRACT_ADDRESS,
  CRYPTODEVS_NFT_ABI,
  CRYPTODEVS_NFT_CONTRACT_ADDRESS,
} from "../constants";

export default function Home() {
  // create Proposal
  // voteOnProposal
  // executeProposal

  const web3ModalRef = useRef();
  const [selectedTab, setSelectedTab] = useState(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [numProposals, setNumProposals] = useState("0");
  const [proposals, setProposals] = useState([]);
  const [treasuryBalance, setTreasuryBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [nftBalance, setNftBalance] = useState("0");
  const [fakeNftTokenId, setFakeNftTokenId] = useState("");

  const getDAOOwner = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDaoContractInstance(signer);

      const _owner = await daoContract.owner();
      const address = await signer.getAddress();

      if (_owner == address) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getProviderOrSigner = async (signer = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change to Goerli network!");
      throw new Error("Change to Goerli network!");
    }

    if (signer === true) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const getNumProposalsInDAO = async () => {
    try {
      const provider = await getProviderOrSigner();
      const daoContract = getDaoContractInstance(provider);

      const daoNumProposals = await daoContract.numProposals();
      setNumProposals(daoNumProposals.toString());
    } catch (err) {
      console.error(err);
    }
  };

  const getAllProposals = async () => {
    try {
      const _proposals = [];
      for (let i = 0; i < numProposals; i++) {
        const fetchedProposal = await fetchProposalById(i);
        _proposals.push(fetchedProposal);
      }
      setProposals(_proposals);
      return _proposals;
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProposalById = async (id) => {
    try {
      const provider = await getProviderOrSigner();
      const daoContract = getDaoContractInstance(provider);
      const proposal = await daoContract.proposals(id);
      const parsedProposal = {
        proposalId: id,
        nftTokenId: proposal.nftTokenId.toString(),
        deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
        yayVotes: proposal.yayVotes.toString(),
        nayVotes: proposal.nayVotes.toString(),
        executed: proposal.executed,
      };
      return parsedProposal;
    } catch (err) {
      console.error(err);
    }
  };

  const getDAOTreasuryBalance = async () => {
    try {
      const provider = await getProviderOrSigner();
      const balance = await provider.getBalance(
        CRYPTODEVS_DAO_CONTRACT_ADDRESS
      );
      setTreasuryBalance(balance.toString());
    } catch (error) {
      console.error(error);
    }
  };

  const getUserNFTBalance = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = getCryptodevsNFTContractInstance(signer);

      const balance = await nftContract.balanceOf(signer.getAddress());
      setNftBalance(parseInt(balance).toString());
    } catch (error) {
      console.error(error);
    }
  };

  const withdrawDAOEther = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDaoContractInstance(signer);

      const txn = await daoContract.withdrawEther();
      setIsLoading(true);
      await txn.wait();
      setIsLoading(false);
      getDAOTreasuryBalance();
    } catch (err) {
      console.error(err);
    }
  };

  const getDaoContractInstance = (providerOrSigner) => {
    return new Contract(
      CRYPTODEVS_DAO_CONTRACT_ADDRESS,
      CRYPTODEVS_DAO_ABI,
      providerOrSigner
    );
  };

  const getCryptodevsNFTContractInstance = (providerOrSigner) => {
    return new Contract(
      CRYPTODEVS_NFT_CONTRACT_ADDRESS,
      CRYPTODEVS_NFT_ABI,
      providerOrSigner
    );
  };

  const createProposal = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDaoContractInstance(signer);
      const txn = await daoContract.createProposal(fakeNftTokenId);
      setIsLoading(true);
      await txn.wait();
      await getNumProposalsInDAO();
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      window.alert(error.message);
    }
  };

  const voteOnProposal = async (proposalId, _vote) => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDaoContractInstance(signer);
      let vote = _vote === "YAY" ? 0 : 1;
      const txn = await daoContract.voteOnProposal(proposalId, vote);
      setIsLoading(true);
      await txn.wait();
      await getAllProposals();
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      window.alert(error.message);
    }
  };

  const executeProposal = async (proposalId) => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDaoContractInstance(signer);
      const txn = await daoContract.executeProposal(proposalId);
      setIsLoading(true);
      await txn.wait();
      await getDAOTreasuryBalance();
      await getAllProposals();
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      window.alert(error.message);
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        disableInjectedProvider: false,
        providerOptions: {},
      });
    }
    connectWallet().then(() => {
      getDAOTreasuryBalance();
      getUserNFTBalance();
      getNumProposalsInDAO();
      getDAOOwner();
    });
  }, [walletConnected]);

  useEffect(() => {
    if (selectedTab == 2) {
      getAllProposals();
    }
  }, [selectedTab]);

  const renderTabs = () => {
    if (selectedTab === 1) {
      return renderCreateProposalTab();
    } else if (selectedTab === 2) {
      return renderViewProposalsTab();
    } else {
      return null;
    }
  };
  const renderCreateProposalTab = () => {
    if (isLoading) {
      return (
        <div className={styles.description}>
          Loading.. Waiting for transaction..
        </div>
      );
    } else if (nftBalance == 0) {
      return (
        <div className={styles.description}>
          You do not own any CryptoDevs NFTs. <br />
          <b>You cannot create or vote on proposals</b>
        </div>
      );
    } else {
      return (
        <div className={styles.container}>
          <label>Fake NFT Token ID to Purchase: </label>
          <input
            placeholder="0"
            type="number"
            onChange={(e) => setFakeNftTokenId(e.target.value)}
            className={styles.input}
          />
          <button
            className={styles.button2}
            onClick={() => {
              createProposal();
            }}
          >
            Create
          </button>
        </div>
      );
    }
  };

  const renderViewProposalsTab = () => {
    if (isLoading) {
      return (
        <div className={styles.description}>
          Loading.. Waiting for transaction...
        </div>
      );
    } else if (numProposals == 0) {
      return (
        <div className={styles.description}>No proposals have been created</div>
      );
    } else {
      return (
        <div>
          {proposals.map((p, index) => {
            return <div key={index} className={styles.proposalCard}>
              <p>Proposal ID: {p.proposalId}</p>
              <p>Fake NFT to Purchase: {p.nftTokenId}</p>
              <p>Deadline: {p.deadline.toLocaleString()}</p>
              <p>Yay Votes: {p.yayVotes}</p>
              <p>Nay Votes: {p.nayVotes}</p>
              <p>Executed: {p.executed.toString()}</p>
              {p.deadline.getTime() > Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button
                    className={styles.button2}
                    onClick={() => {
                      voteOnProposal(p.proposalId, "YAY");
                    }}
                  >
                    Vote YAY
                  </button>
                  <button
                    className={styles.button2}
                    onClick={() => {
                      voteOnProposal(p.proposalId, "NAY");
                    }}
                  >
                    Vote NAY
                  </button>
                </div>
              ) : p.deadline.getTime() < Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button
                    className={styles.button2}
                    onClick={() => {
                      executeProposal(p.proposalId);
                    }}
                  >
                    Execute Proposal{" "}
                    {p.yayVotes > p.nayVotes ? "(YAY)" : "(NAY)"}
                  </button>
                </div>
              ) : (
                <div className={styles.description}>Proposal Executed </div>
              )}
            </div>;
          })}
        </div>
      );
    }
  };

  return (
    <div className={styles.body}>
      <Head>
        <title>CryptoDevs DAO</title>
        <meta name="description" content="CryptoDevs DAO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>Welcome to the DAO!</div>
          <div className={styles.description}>
            Your CryptoDevs NFT Balance: {nftBalance}
            <br />
            Treasury Balance : {utils.formatEther(treasuryBalance)} ETH
            <br />
            Total Number of Proposals : {numProposals}
          </div>
          <div className={styles.flex}>
            <button
              className={styles.button}
              onClick={() => {
                setSelectedTab(1);
              }}
            >
              Create Proposal
            </button>
            <button
              className={styles.button}
              onClick={() => {
                setSelectedTab(2);
              }}
            >
              View Proposal Proposal
            </button>
          </div>
          {renderTabs()}
          {isOwner && (
            <div>
              <br/>
              {isLoading ? (
                <button className={styles.button}>Loading...</button>
              ) : (
                <button className={styles.button} onClick={withdrawDAOEther}>
                  Withdraw DAO ETH
                </button>
              )}
            </div>
          )}
        </div>
        <div>
          <img className={styles.image} src="cryptodevs/0.svg" />
        </div>
      </div>
      <footer className={styles.footer}>Made with &#10084; by Sahil</footer>
    </div>
  );
}
