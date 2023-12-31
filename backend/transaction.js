const CryptoUtils = require("./utils/cryptoUtils");
const Config = require("./utils/config");

function Transaction(
	from,
	to,
	value,
	fee,
	dateCreated,
	// timestamp,
	data,
	senderPubKey,
	transactionDataHash,
	senderSignature,
	minedInBlockIndex,
	transferSuccessful
) {
	this.from = from; // 40 hex digits
	this.to = to; // 40 hex digits
	this.value = value; // non-negative integer
	this.fee = fee; // non-negative integer
	this.dateCreated = dateCreated; // ISO8601_string
	// this.timestamp = timestamp; // Unix timestamp
	this.data = data; // optional string
	this.senderPubKey = senderPubKey; // 65 hex digits
	this.transactionDataHash = transactionDataHash; // 64 hex digits

	if (this.transactionDataHash === undefined) this.calculateDataHash();

	this.senderSignature = senderSignature; // hex_number[2][64]
	this.minedInBlockIndex = minedInBlockIndex; // integer / null (if not mined)
	this.transferSuccessful = transferSuccessful; // boolean
}

// Calculate Transaction Data Hash
Transaction.prototype.calculateDataHash = function () {
	let tranData = {
		from: this.from,
		to: this.to,
		value: this.value,
		fee: this.fee,
		dateCreated: this.dateCreated,
		// timestamp: this.dateCreated.getTime(),
		data: this.data,
		senderPubKey: this.senderPubKey,
	};
	let tranDataJSON = JSON.stringify(tranData);
	this.transactionDataHash = CryptoUtils.sha256(tranDataJSON);
};

// Sign Transaction
Transaction.prototype.signTransaction = function (privateKey) {
	this.senderSignature = CryptoUtils.signData(
		this.transactionDataHash,
		privateKey
	);
};

// Verify Signature
Transaction.prototype.verifySignature = function () {
	return CryptoUtils.verifySignature(
		this.transactionDataHash,
		this.senderPubKey,
		this.senderSignature
	);
};

// Initial Seed Faucet Transaction
Transaction.initialFaucetTransaction = function () {
	return new Transaction(
		Config.nullAddress, // from Address
		Config.faucetAddress, // to Address
		1000000000000, // Faucet value
		5, // mining reward
		Config.genesisDate, // date created
		Config.genesisData, // data
		Config.nullPubKey, // senderPubKey
		undefined, // transactionDataHash
		Config.nullSignature, // senderSignature
		0, // minedInBlockIndex
		true // transferSuccessful
	);
};

module.exports = Transaction;
// export default Transaction;
