const sha256 = require('sha256');
const currentNodeURL = process.argv[3];
const { v4: uuid } = require('uuid');

class Blockchain {
    constructor() {
        this.chain = [];

        this.pendingTransactions = [];

        this.currentNodeURL = currentNodeURL;
        this.networkNodes = [];
        this.createNewBlock(100, '0', '0');
    }
    createNewBlock(nonce, previousHash, hash) {
        const newBlock = {
            index: this.chain.length + 1,
            timestamp: Date.now(),
            transactions: this.pendingTransactions,
            nonce: nonce,
            hash: hash,
            previousHash: previousHash,
        };

        this.pendingTransactions = [];
        this.chain.push(newBlock);
        return newBlock;
    }
    getLastBlock = () => {
        return this.chain[this.chain.length - 1];
    };
    createNewTransaction = (amount, sender, recipient) => {
        const newTransaction = {
            amount: amount,
            sender: sender,
            recipient: recipient,
            transactionId: uuid().split('-').join(''),
        };
        return newTransaction;
    };
    addTransactionToPendingTransactions = (transactionObj) => {
        this.pendingTransactions.push(transactionObj);
        return this.getLastBlock()['index'] + 1;
    };
    hashBlock = (previousHash, nonce, currentBlockData) => {
        const dataAsString =
            previousHash + nonce.toString() + JSON.stringify(currentBlockData);
        const data = sha256(dataAsString);
        return data;
    };
    proofOfWork = (previousHash, currentBlockData) => {
        let nonce = 0;
        let hash = this.hashBlock(previousHash, nonce, currentBlockData);
        while (hash.substr(0, 4) != '0000') {
            nonce++;
            hash = this.hashBlock(previousHash, nonce, currentBlockData);
        }
        return nonce;
    };

    chainIsValid = (blockchain) => {
        let validChain = true;

        for (var i = 1; i < blockchain.length; i++) {
            const currentBlock = blockchain[i];
            const prevBlock = blockchain[i - 1];
            const blockHash = this.hashBlock(
                prevBlock['hash'],
                currentBlock['nonce'],
                {
                    transactions: currentBlock['transactions'],
                    index: currentBlock['index'],
                }
            );
            if (blockHash.substring(0, 4) !== '0000') {
                validChain = false;
            }
            if (currentBlock['previousHash'] !== prevBlock['hash']) {
                validChain = false;
            }
        }

        const genesisBlock = blockchain[0];
        const correctNonce = genesisBlock['nonce'] === 100;
        const correctPreviousBlockHash = genesisBlock['previousHash'] === '0';
        const correctHash = genesisBlock['hash'] === '0';
        const correctTransactions = genesisBlock['transactions'].length === 0;
        if (
            !correctNonce ||
            !correctPreviousBlockHash ||
            !correctHash ||
            !correctTransactions
        )
            validChain = false;

        return validChain;
    };

    getBlock = (blockHash) => {
        let correctBlock = null;
        this.chain.forEach((block) => {
            if (block.hash === blockHash) {
                correctBlock = block;
            }
        });
        return correctBlock;
    };

    getTransaction = (transactionId) => {
        let correctTransaction = null;
        let correctBlock = null;
        this.chain.forEach((block) => {
            block.transactions.forEach((transaction) => {
                if (transaction.transactionId === transactionId) {
                    correctTransaction = transaction;
                    correctBlock = block;
                }
            });
        });
        return {
            transaction: correctTransaction,
            block: correctBlock,
        };
    };

    getAddressData = (address) => {
        const addressTransactions = [];
        let balance = 0;
        this.chain.forEach((block) => {
            block.transactions.forEach((transaction) => {
                if (transaction.sender === address) {
                    addressTransactions.push(transaction);
                    balance -= transaction.amount;
                } else if (transaction.recipient === address) {
                    addressTransactions.push(transaction);
                    balance += transaction.amount;
                }
            });
        });
        return {
            addressTransactions: addressTransactions,
            addressBalance: balance,
        };
    };
}

module.exports = Blockchain;
