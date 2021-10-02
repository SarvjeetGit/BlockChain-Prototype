const express = require('express');
const Blockchain = require('./blockchain');
const { v4: uuid } = require('uuid');
const axios = require('axios');
var app = express();
app.use(express.json());
const port = process.argv[2];

const nodeAddress = uuid().split('-').join('');
const bitcoin = new Blockchain();

app.get('/blockchain', (req, res) => {
    res.send(bitcoin);
});

app.post('/transaction', (req, res) => {
    const newTransaction = req.body.newTransaction;
    const blockIndex =
        bitcoin.addTransactionToPendingTransactions(newTransaction);
    res.json({ note: `Transaction will be added in block ${blockIndex}` });
});

app.post('/transaction/broadcast', (req, res) => {
    const { amount, sender, recipient } = req.body;
    const newTransaction = bitcoin.createNewTransaction(
        amount,
        sender,
        recipient
    );
    const blockIndex =
        bitcoin.addTransactionToPendingTransactions(newTransaction);

    const reqPromises = [];
    bitcoin.networkNodes.forEach((networkNodeURL) => {
        reqPromises.push(
            axios.post(networkNodeURL + '/transaction', {
                newTransaction: newTransaction,
            })
        );
    });
    axios.all(reqPromises).then((data) => {
        res.json({
            note: `Transaction created and broadcasted successfully. It will be added in block ${blockIndex}`,
        });
    });
});

app.get('/mine', (req, res) => {
    const lastBlock = bitcoin.getLastBlock();
    const previousHash = lastBlock['hash'];
    const currentBlockData = {
        transactions: bitcoin.pendingTransactions,
        index: lastBlock['index'] + 1,
    };

    const nonce = bitcoin.proofOfWork(previousHash, currentBlockData);
    // console.log(nonce);
    const blockHash = bitcoin.hashBlock(previousHash, nonce, currentBlockData);
    const newBlock = bitcoin.createNewBlock(nonce, previousHash, blockHash);

    const reqPromises = [];

    bitcoin.networkNodes.forEach((networkNodeURL) => {
        reqPromises.push(
            axios.post(networkNodeURL + '/receive-new-block', {
                newBlock: newBlock,
            })
        );
    });

    axios
        .all(reqPromises)
        .then((data) => {
            axios.post(bitcoin.currentNodeURL + '/transaction/broadcast', {
                amount: 12.5,
                sender: '00',
                recipient: nodeAddress,
            });
        })
        .then((data) => {
            res.json({
                note: 'New block mined and broadcasted successfully',
                block: newBlock,
            });
        });
});

app.post('/receive-new-block', (req, res) => {
    const newBlock = req.body.newBlock;
    const lastBlock = bitcoin.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousHash;
    const correctIndex = lastBlock['index'] + 1 == newBlock['index'];
    if (correctHash && correctIndex) {
        bitcoin.chain.push(newBlock);
        bitcoin.pendingTransactions = [];
        res.json({
            note: 'New block received and accepted.',
            newBlock: newBlock,
        });
    } else {
        res.json({
            note: 'New block rejected.',
            newBlock: newBlock,
        });
    }
});

app.post('/register-and-broadcast-node', (req, res) => {
    const newNodeURL = req.body.newNodeUrl;
    if (bitcoin.networkNodes.indexOf(newNodeURL == -1)) {
        bitcoin.networkNodes.push(newNodeURL);
    }
    const regNodesPromises = [];
    bitcoin.networkNodes.forEach((networkNodeURL) => {
        regNodesPromises.push(
            axios.post(networkNodeURL + '/register-node', {
                newNodeURL: newNodeURL,
            })
        );
    });
    axios
        .all(regNodesPromises)
        .then((data) => {
            axios.post(newNodeURL + '/register-nodes-bulk', {
                allNetworkNodes: [
                    ...bitcoin.networkNodes,
                    bitcoin.currentNodeURL,
                ],
            });
        })
        .then((data) => {
            res.json({ note: 'New node registered with network successfully' });
        });
});

app.post('/register-node', (req, res) => {
    const newNodeURL = req.body.newNodeURL;
    const notPresent = bitcoin.networkNodes.indexOf(newNodeURL) == -1;
    const notCurrentNode = bitcoin.currentNodeURL !== newNodeURL;
    if (notPresent && notCurrentNode) {
        bitcoin.networkNodes.push(newNodeURL);
        res.json({ note: 'New node registered successfully' });
    } else {
        res.json({ note: 'not registered' });
    }
});

app.post('/register-nodes-bulk', (req, res) => {
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach((networkNodeURL) => {
        const notPresent = bitcoin.networkNodes.indexOf(networkNodeURL) == -1;
        const notCurrentNode = bitcoin.currentNodeURL !== networkNodeURL;
        if (notPresent && notCurrentNode) {
            bitcoin.networkNodes.push(networkNodeURL);
        }
    });
    res.json({ note: 'Bulk registration Successful' });
});

app.get('/consensus', (req, res) => {
    const reqPromises = [];
    bitcoin.networkNodes.forEach((networkNodeURL) => {
        reqPromises.push(axios.get(networkNodeURL + '/blockchain'));
    });
    axios.all(reqPromises).then((blockchains) => {
        const currentChainLength = bitcoin.chain.length;
        let maxChainLength = currentChainLength;
        let newLongestChain = null;
        let newPendingTransactions = null;

        blockchains.forEach((blockchain) => {
            if (blockchain.data.chain.length > maxChainLength) {
                maxChainLength = blockchain.data.chain.length;
                newLongestChain = blockchain.data.chain;
                newPendingTransactions = blockchain.data.pendingTransactions;
            }
        });

        if (
            !newLongestChain ||
            (newLongestChain && !bitcoin.chainIsValid(newLongestChain))
        ) {
            res.json({
                note: 'Current chain has not been replaced.',
                chain: bitcoin.chain,
            });
        } else {
            bitcoin.chain = newLongestChain;
            bitcoin.pendingTransactions = newPendingTransactions;
            res.json({
                note: 'This chain has been replaced.',
                chain: bitcoin.chain,
            });
        }
    });
});

app.get('/block/:blockHash', (req, res) => {
    const blockHash = req.params.blockHash;
    const correctBlock = bitcoin.getBlock(blockHash);
    res.json({
        block: correctBlock,
    });
});

app.get('/transaction/:transactionId', (req, res) => {
    const transactionId = req.params.transactionId;
    const transactionData = bitcoin.getTransaction(transactionId);
    res.json({
        transaction: transactionData.transaction,
        block: transactionData.block,
    });
});

app.get('/address/:address', (req, res) => {
    const address = req.params.address;
    const addressData = bitcoin.getAddressData(address);
    res.json({
        addressData: addressData,
    });
});

app.get('/block-explorer', (req, res) => {
    res.sendFile('./block-explorer/index.html', { root: __dirname });
});

app.listen(port, () => {
    console.log(`running on http://localhost:${port}`);
});
