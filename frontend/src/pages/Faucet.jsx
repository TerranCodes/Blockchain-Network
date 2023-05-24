import React, { useState, useEffect } from "react";
import Card from "react-bootstrap/Card";
import { Button, Form, InputGroup } from "react-bootstrap";
import axios from "axios";
import EC from "elliptic";
import CryptoJS from "crypto-js";
import secureLocalStorage from "react-secure-storage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

var elliptic = EC.ec;
var secp256k1 = new elliptic("secp256k1");

function Faucet() {
	const transactionTimeout = 90; // Timeout in seconds
	const [recipient, setRecipient] = useState("");
	const [value, setValue] = useState("");
	const [balance, setBalance] = useState("");
	const [canTransact, setCanTransact] = useState(true);
	const [timeoutSeconds, setTimeoutSeconds] = useState(transactionTimeout);
	// const [donationRecipient, setDonationRecipient] = useState("");
	// const [donationAmount, setDonationAmount] = useState(0);
	const [signedTx, setSignedTx] = useState("");
	const [isSigned, setIsSigned] = useState(false);

	// useEffect(() => {
	// 	let interval;
	// 	if (!canTransact) {
	// 		interval = setInterval(() => {
	// 			setTimeoutSeconds((prevSeconds) => prevSeconds - 1);
	// 		}, 1000);
	// 	}
	// 	return () => {
	// 		clearInterval(interval);
	// 	};
	// }, [canTransact]);
	/*const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "address") {
      setAddress(address);
      console.log("address: ", address);
    } else if (name === "amount") {
      setValue(value);
      console.log("value: ", value);
    }
  };
*/
	useEffect(() => {
		(async function loadData() {
			const balance = await axios.get(
				`http://localhost:5555/address/dcf964b76eaa2cf6fedae5e71b4fa8c79e7a936f/balance`
			);
			setBalance(balance.data);
		})();
	}, []);
	const handleTransaction = () => {
		// Deduct the specified amount from the faucet balance
		//  const updatedFaucetBalance = parseInt(faucetBalance) - parseInt(amount, 10);
		// Send the transaction to the recipient wallet
		sendTransaction(balance);
		// Reset the address and amount fields
		setAddress("");
		setAmount("");
		// Disable transactions for the timeout duration
		setCanTransact(false);
		setTimeoutSeconds(transactionTimeout);
	};
	//Enable transactions after the timeout duration
	// setTimeout(() => {
	// 	setCanTransact(true);
	// }, transactionTimeout * 1000);

	/*  const sendTransaction = () => {
    // Replace this with actual transaction logic
    const currentTransaction = {
      sender: "dcf964b76eaa2cf6fedae5e71b4fa8c79e7a936f",
      recipient: address,
      amount: amount,
    };
    console.log("Transaction sent to:", currentTransaction.data);
    // Update the faucet balance
    //   setBalance(balance);
  };
*/
	function signData(data, privKey) {
		const secp256k1 = new elliptic("secp256k1");
		let keyPair = secp256k1.keyFromPrivate(privKey);
		let signature = keyPair.sign(data);
		return [signature.r.toString(16), signature.s.toString(16)];
	}
	const signTransaction = () => {
		const validAddress = /^[0-9a-f]{40}$/.test(recipient);
		const validValue = /^\d*\.?\d*$/.test(value);
		if (!value || !recipient) {
			toast.error("Both Recipient and Value Required!", {
				position: "top-right",
				theme: "light",
			});
			return;
		}
		if (!validAddress) {
			toast.error("Invalid Recipient Address!", {
				position: "top-right",
				theme: "light",
			});
			return;
		}
		if (!validValue) {
			toast.error("Invalid Value!", {
				position: "top-right",
				theme: "light",
			});
			return;
		}
		if (
			value > balance.confirmedBalance ||
			balance.confirmedBalance - value < 0
		) {
			toast.error("Invalid Funds!", {
				position: "top-right",
				theme: "light",
			});
			return;
		}

		let faucetFrom = "dcf964b76eaa2cf6fedae5e71b4fa8c79e7a936f";
		let faucetPubKey =
			"8d6df948d3de9226a08556df1ddede4f045f2e4a962b8cb9d98f228748675a01";
		let faucetPrivKey =
			"3313b06752cd6276f9deb4fefef6f17e904b194808ea9dcf61f1125528b7f74a";
		let transaction = {
			from: faucetFrom,
			to: recipient,
			value: Number(value),
			fee: 1,
			// dateCreated: new Date().toISOString(),
			dateCreated: new Date(),
			data: "foo",
			senderPubKey: faucetPubKey,
		};
		if (!transaction.data) delete transaction.data;

		let transactionJSON = JSON.stringify(transaction);
		transaction.transactionDataHash =
			CryptoJS.SHA256(transactionJSON).toString();

		transaction.senderSignature = signData(
			transaction.transactionDataHash,
			faucetPrivKey
		);

		let signedTransaction = JSON.stringify(transaction);
		setSignedTx(signedTransaction);
		console.log(signedTransaction);
		setIsSigned(true);
		toast.success("Transaction signed", {
			position: "top-right",
			theme: "light",
		});
	};
	const sendTransaction = async () => {
		// () => signTransaction();
		try {
			const config = {
				headers: {
					"Content-Type": "application/json",
				},
			};
			let result = await axios.post(
				`http://localhost:5555/transaction`,
				signedTx,
				config
			);
			const error = result.data.error;
			if (error) {
				console.log("error" + error);
			} else {
				toast.success("Transaction sent", {
					position: "top-right",
					theme: "light",
				});
				setIsSigned(false);
				setRecipient("");
				setValue("");
				// setData("");
				console.log("success");
			}
		} catch (error) {
			console.log("error2" + error);
		}
	};

	/* Disable transactions for the timeout duration
  setCanTransact(false);
  setTimeoutSeconds(transactionTimeout);
  // Enable transactions after the timeout duration
  setTimeout(() => {
    setCanTransact(true);
  }, transactionTimeout * 1000);
  */
	return (
		<div>
			<br />
			<h1>IndiGOLD Faucet</h1>
			<div className="center-img">
				<img
					style={{ width: 225, height: 200 }}
					src="../src/assets/faucet-85.png"
					alt="Faucet Image"
				></img>
			</div>
			<br />
			<div className="bg-glass-1 center-text">
				<h3>Available Balance: {balance.confirmedBalance}</h3>
			</div>
			<br />
			<div className="container-fluid">
				<div className="card-md-1">
					<div className="card-body-md-1">
						<div>
							<p />
							<p className="ln-ht">
								&#8226;&nbsp;IndiGOLD Faucet is a Free Service for Crypto
								Tokens.
							</p>
							<p className="ln-ht">
								&#8226;&nbsp;A 90 second waiting period is required between
								withdrawals.
							</p>
							<br />
						</div>
						<InputGroup className="mb-3">
							<InputGroup.Text id="basic-addon1">
								Recipient Address
							</InputGroup.Text>
							<Form.Control
								type="recipient"
								id="recipient"
								name="recipient"
								value={recipient}
								onChange={(e) => {
									setRecipient(e.target.value);
									console.log(e.target.value);
								}}
								placeholder="Recipient"
							/>
						</InputGroup>
						<div>
							<Card.Text></Card.Text>
						</div>
						<InputGroup className="mb-3">
							<InputGroup.Text id="basic-addon1">Amount</InputGroup.Text>
							<Form.Control
								type="value"
								id="value"
								name="value"
								value={value}
								onChange={(e) => {
									setValue(e.target.value);
									console.log(e.target.value);
								}}
								placeholder="IndiGOLD Amount"
							/>
						</InputGroup>
						<br />
						<Button variant="primary" onClick={signTransaction}>
							Sign Transaction
						</Button>
						<Button
							type="button"
							onClick={sendTransaction}
							// disabled={!canTransact}
						>
							Get Coins
						</Button>
						{/* {!canTransact && (
							<p>Next transaction available in {timeoutSeconds} seconds.</p>
						)} */}
					</div>
				</div>
				<div className="card-md-1">
					<div className="card-body-md-1">
						<p>Please return any unused IndiGold you no longer need</p>
						<div>
							<Card.Text></Card.Text>
						</div>
						<InputGroup className="mb-3">
							<InputGroup.Text id="basic-addon1">Amount</InputGroup.Text>
							<Form.Control
								type="value"
								id="value"
								name="value"
								value={value}
								onChange={(e) => {
									setValue(e.target.value);
									console.log(e.target.value);
								}}
								placeholder="IndiGOLD Amount"
							/>
						</InputGroup>
						<br />
						<Button
							type="button"
							onClick={sendTransaction}
							// disabled={!canTransact}
							className="custom-btn"
						>
							Donate
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
export default Faucet;
